from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

import database
from models.behaviour_profile import profile_manager
from models.response_engine import response_engine
from models.fraud_engine import predict

router = APIRouter()


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


@router.post("/api/events/login")
def process_login(event: LoginEvent):
    ts = event.timestamp or datetime.now().isoformat()

    profile = profile_manager.get_profile(event.client_id) or {}
    fraud_input = {
        "event_type": "login",
        "client_id": event.client_id,
        "ip_address": event.ip_address,
        "device_id": event.device_id,
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
    )

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
def process_transaction(event: TransactionEvent):
    ts = event.timestamp or datetime.now().isoformat()

    profile = profile_manager.get_profile(event.client_id) or {}
    fraud_input = {
        "event_type": "transaction",
        "client_id": event.client_id,
        "amount": event.amount,
        "ip_address": event.ip_address,
        "device_id": event.device_id,
        "profile": profile,
    }
    risk_score = predict(fraud_input)
    decision_details = response_engine.get_decision_details(risk_score, event.client_id)

    event_id = database.insert_event(
        event_type="transaction",
        client_id=event.client_id,
        amount=event.amount,
        ip_address=event.ip_address,
        device_id=event.device_id,
        timestamp=ts,
        risk_score=risk_score,
        decision=decision_details["decision"],
    )

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


@router.get("/api/dashboard/events")
def get_events():
    return database.get_all_events()


@router.get("/api/dashboard/event/{event_id}")
def get_event(event_id: int):
    event = database.get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("/api/dashboard/profiles")
def get_profiles():
    return database.get_all_profiles()


@router.get("/api/dashboard/stats")
def get_stats():
    return database.get_stats()


@router.get("/api/dashboard/profile/{client_id}")
def get_client_profile(client_id: str):
    summary = profile_manager.get_profile_summary(client_id)
    db_profile = database.get_profile(client_id)
    if db_profile:
        summary["last_updated"] = db_profile["last_updated"]
    return summary
