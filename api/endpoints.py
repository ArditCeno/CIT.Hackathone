from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from sqlalchemy import func as sqlfunc
from sqlalchemy.orm import Session

import database
from database import get_db, User, Event, Transaction, FraudAlert, Profile
from models.behaviour_profile import profile_manager
from models.response_engine import response_engine
from models.fraud_engine import predict
from api.dependencies import get_current_user, require_admin

router = APIRouter()

_optional_bearer = HTTPBearer(auto_error=False)


def _safe_user(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "iban": user.iban,
        "balance": float(user.balance) if user.balance is not None else 0.0,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


# ── Public event schemas ──────────────────────────────────────────────────────

class LoginEvent(BaseModel):
    client_id: str
    ip_address: str
    device_id: str
    timestamp: Optional[str] = None


class TransactionEvent(BaseModel):
    client_id: str
    amount: float
    ip_address: str
    device_id: Optional[str] = None
    timestamp: Optional[str] = None


# ── GuardianAI scanner endpoints (no auth required) ──────────────────────────

@router.post("/api/events/login")
def process_login(
    event: LoginEvent,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
    db: Session = Depends(get_db),
):
    ts = event.timestamp or datetime.now().isoformat()

    user_id = None
    if credentials:
        try:
            import os
            from jose import jwt as _jwt
            payload = _jwt.decode(
                credentials.credentials,
                os.getenv("JWT_SECRET", "guardian-hackathon-secret-2026"),
                algorithms=["HS256"],
            )
            user_id = int(payload.get("sub"))
        except Exception:
            pass

    profile = profile_manager.get_profile(event.client_id) or {}
    fraud_input = {
        "event_type": "login",
        "client_id": event.client_id,
        "ip_address": event.ip_address,
        "device_id": event.device_id,
        "timestamp": ts,
        "profile": profile,
    }
    risk_score = predict(fraud_input)
    decision = response_engine.decide(risk_score)

    event_id = database.insert_event(
        event_type="login",
        client_id=event.client_id,
        amount=None,
        ip_address=event.ip_address,
        device_id=event.device_id,
        timestamp=ts,
        risk_score=risk_score,
        decision=decision,
        user_id=user_id,
    )

    if decision == "BLOCK" and user_id:
        alert = FraudAlert(
            user_id=user_id,
            event_id=event_id,
            alert_type="suspicious_login",
            severity="high",
            message=f"Hyrje e dyshimtë e bllokuar nga IP {event.ip_address} me pajisje {event.device_id}.",
        )
        db.add(alert)
        db.commit()

    profile_manager.update_profile(event.client_id, {
        "last_login_ip": event.ip_address,
        "last_login_device": event.device_id,
        "last_login": ts,
        "login_count": profile.get("login_count", 0) + 1,
        "known_ips": list(set(profile.get("known_ips", []) + [event.ip_address])),
        "known_devices": list(set(profile.get("known_devices", []) + [event.device_id])),
    })

    return {
        "event_id": event_id,
        "decision": decision,
        "risk_score": round(risk_score, 4),
        "message": f"Login {decision}.",
    }


@router.post("/api/events/transaction")
def process_transaction(
    event: TransactionEvent,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
    db: Session = Depends(get_db),
):
    ts = event.timestamp or datetime.now().isoformat()

    user_id = None
    if credentials:
        try:
            import os
            from jose import jwt as _jwt
            payload = _jwt.decode(
                credentials.credentials,
                os.getenv("JWT_SECRET", "guardian-hackathon-secret-2026"),
                algorithms=["HS256"],
            )
            user_id = int(payload.get("sub"))
        except Exception:
            pass

    profile = profile_manager.get_profile(event.client_id) or {}
    fraud_input = {
        "event_type": "transaction",
        "client_id": event.client_id,
        "amount": event.amount,
        "ip_address": event.ip_address,
        "device_id": event.device_id,
        "timestamp": ts,
        "profile": profile,
    }
    risk_score = predict(fraud_input)
    decision_details = response_engine.get_decision_details(risk_score, event.client_id)
    decision = decision_details["decision"]

    event_id = database.insert_event(
        event_type="transaction",
        client_id=event.client_id,
        amount=event.amount,
        ip_address=event.ip_address,
        device_id=event.device_id,
        timestamp=ts,
        risk_score=risk_score,
        decision=decision,
        user_id=user_id,
    )

    if decision == "BLOCK" and user_id:
        alert = FraudAlert(
            user_id=user_id,
            event_id=event_id,
            alert_type="suspicious_transfer",
            severity="critical" if risk_score > 0.85 else "high",
            message=f"Transaksion prej {event.amount} EUR u bllokua. Risk score: {round(risk_score, 2)}.",
        )
        db.add(alert)
        db.commit()

    txn_count = profile.get("transaction_count", 0)
    total_amount = profile.get("total_amount", 0)
    new_total = total_amount + event.amount
    profile_manager.update_profile(event.client_id, {
        "last_transaction_amount": event.amount,
        "last_transaction_ip": event.ip_address,
        "last_transaction": ts,
        "transaction_count": txn_count + 1,
        "total_amount": new_total,
        "avg_transaction_amount": round(new_total / (txn_count + 1), 2),
        "known_ips": list(set(profile.get("known_ips", []) + [event.ip_address])),
        "risk_level": "high" if risk_score > 0.7 else "medium" if risk_score > 0.3 else "low",
    })

    return {"event_id": event_id, **decision_details}


# ── Admin-only dashboard endpoints ───────────────────────────────────────────

@router.get("/api/dashboard/events")
def get_events(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    rows = db.query(Event, User).outerjoin(User, Event.user_id == User.id).order_by(Event.created_at.desc()).all()
    result = []
    for ev, usr in rows:
        result.append({
            "id": ev.id,
            "event_type": ev.event_type,
            "client_id": ev.client_id,
            "username": usr.username if usr else ev.client_id,
            "full_name": usr.full_name if usr else None,
            "amount": float(ev.amount) if ev.amount is not None else None,
            "ip_address": ev.ip_address,
            "device_id": ev.device_id,
            "timestamp": ev.timestamp.isoformat() if ev.timestamp else None,
            "risk_score": float(ev.risk_score) if ev.risk_score is not None else None,
            "decision": ev.decision,
            "created_at": ev.created_at.isoformat() if ev.created_at else None,
        })
    return result


@router.get("/api/dashboard/event/{event_id}")
def get_event(event_id: int, _: User = Depends(require_admin)):
    event = database.get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("/api/dashboard/profiles")
def get_profiles(_: User = Depends(require_admin)):
    return database.get_all_profiles()


@router.get("/api/dashboard/stats")
def get_stats(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    total_events = db.query(sqlfunc.count(Event.id)).scalar() or 0
    total_fraud  = db.query(sqlfunc.count(Transaction.id)).filter(Transaction.is_fraud == True).scalar() or 0
    total_tx     = db.query(sqlfunc.count(Transaction.id)).scalar() or 0
    total_users  = db.query(sqlfunc.count(User.id)).filter(User.role == "user").scalar() or 0
    fraud_rate   = round(total_fraud / total_tx * 100, 1) if total_tx > 0 else 0.0
    return {
        "total_events":  total_events,
        "total_fraud":   total_fraud,
        "fraud_rate":    fraud_rate,
        "total_users":   total_users,
    }


@router.get("/api/dashboard/my-stats")
def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_tx     = db.query(sqlfunc.count(Transaction.id)).filter(Transaction.user_id == current_user.id).scalar() or 0
    fraud_tx     = db.query(sqlfunc.count(Transaction.id)).filter(Transaction.user_id == current_user.id, Transaction.is_fraud == True).scalar() or 0
    unread       = db.query(sqlfunc.count(FraudAlert.id)).filter(FraudAlert.user_id == current_user.id, FraudAlert.is_read == False).scalar() or 0
    my_events    = db.query(sqlfunc.count(Event.id)).filter(Event.user_id == current_user.id).scalar() or 0
    fraud_rate   = round(fraud_tx / total_tx * 100, 1) if total_tx > 0 else 0.0
    return {
        "total_transactions": total_tx,
        "fraud_count":        fraud_tx,
        "fraud_rate":         fraud_rate,
        "unread_alerts":      unread,
        "total_events":       my_events,
        "balance":            float(current_user.balance) if current_user.balance is not None else 0.0,
        "full_name":          current_user.full_name,
        "iban":               current_user.iban,
    }


@router.get("/api/dashboard/users")
def get_all_users(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.id).all()
    result = []
    for u in users:
        event_count = db.query(sqlfunc.count(Event.id)).filter(Event.user_id == u.id).scalar() or 0
        fraud_count = db.query(sqlfunc.count(Transaction.id)).filter(
            Transaction.user_id == u.id, Transaction.is_fraud == True
        ).scalar() or 0
        total_tx = db.query(sqlfunc.count(Transaction.id)).filter(Transaction.user_id == u.id).scalar() or 0
        result.append({
            "id":          u.id,
            "username":    u.username,
            "email":       u.email,
            "full_name":   u.full_name,
            "role":        u.role,
            "balance":     float(u.balance) if u.balance else 0.0,
            "is_active":   u.is_active,
            "event_count": event_count,
            "fraud_count": fraud_count,
            "total_tx":    total_tx,
            "created_at":  u.created_at.isoformat() if u.created_at else None,
        })
    return result


@router.get("/api/dashboard/profile/{client_id}")
def get_client_profile(client_id: str, _: User = Depends(require_admin)):
    summary = profile_manager.get_profile_summary(client_id)
    db_profile = database.get_profile(client_id)
    if db_profile:
        summary["last_updated"] = db_profile["last_updated"]
    return summary


# ── User-scoped endpoints ─────────────────────────────────────────────────────

@router.get("/api/me/events")
def my_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Event)
        .filter(Event.user_id == current_user.id)
        .order_by(Event.created_at.desc())
        .limit(50)
        .all()
    )
    return [_event_to_dict(r) for r in rows]


@router.get("/api/me/transactions")
def my_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.created_at.desc())
        .all()
    )
    return [_txn_to_dict(r) for r in rows]


@router.get("/api/me/alerts")
def my_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(FraudAlert)
        .filter(FraudAlert.user_id == current_user.id)
        .order_by(FraudAlert.created_at.desc())
        .all()
    )
    return [_alert_to_dict(r) for r in rows]


@router.patch("/api/me/alerts/{alert_id}/read")
def mark_alert_read(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    alert = (
        db.query(FraudAlert)
        .filter(FraudAlert.id == alert_id, FraudAlert.user_id == current_user.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return {"ok": True}


@router.get("/api/me/stats")
def my_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_txns     = db.query(sqlfunc.count(Transaction.id)).filter(Transaction.user_id == current_user.id).scalar() or 0
    fraud_txns     = db.query(sqlfunc.count(Transaction.id)).filter(Transaction.user_id == current_user.id, Transaction.is_fraud == True).scalar() or 0
    unread_alerts  = db.query(sqlfunc.count(FraudAlert.id)).filter(FraudAlert.user_id == current_user.id, FraudAlert.is_read == False).scalar() or 0
    blocked_events = db.query(sqlfunc.count(Event.id)).filter(Event.user_id == current_user.id, Event.decision == "BLOCK").scalar() or 0
    return {
        "total_transactions": total_txns,
        "fraud_transactions": fraud_txns,
        "unread_alerts":      unread_alerts,
        "blocked_events":     blocked_events,
        "balance":            float(current_user.balance) if current_user.balance is not None else 0.0,
    }


# ── Admin: all users ──────────────────────────────────────────────────────────

@router.get("/api/admin/users")
def list_users(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return [_safe_user(u) for u in db.query(User).order_by(User.created_at.desc()).all()]


# ── Serialisation helpers ─────────────────────────────────────────────────────

def _event_to_dict(e: Event) -> dict:
    return {
        "id": e.id,
        "event_type": e.event_type,
        "client_id": e.client_id,
        "amount": float(e.amount) if e.amount is not None else None,
        "ip_address": e.ip_address,
        "device_id": e.device_id,
        "timestamp": e.timestamp.isoformat() if e.timestamp else None,
        "risk_score": float(e.risk_score) if e.risk_score is not None else None,
        "decision": e.decision,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }


def _txn_to_dict(t: Transaction) -> dict:
    return {
        "id": t.id,
        "tx_type": t.tx_type,
        "recipient": t.recipient,
        "amount": float(t.amount) if t.amount is not None else None,
        "city": t.city,
        "device": t.device,
        "is_fraud": t.is_fraud,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }


def _alert_to_dict(a: FraudAlert) -> dict:
    return {
        "id": a.id,
        "alert_type": a.alert_type,
        "severity": a.severity,
        "message": a.message,
        "is_read": a.is_read,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }
