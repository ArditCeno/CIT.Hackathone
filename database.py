import os
from datetime import datetime, timedelta
from decimal import Decimal
from urllib.parse import urlparse, unquote

from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Boolean,
    DateTime, Numeric, ForeignKey, JSON, func, text,
)
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker, declarative_base
from passlib.context import CryptContext

_RAW_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:Orest2006@localhost:5432/FiBank%20Database",
)

# Parse the raw URL and rebuild using URL.create() so spaces in the
# database name are passed as a plain string rather than URL-encoded bytes.
_p = urlparse(_RAW_URL)
engine = create_engine(
    URL.create(
        drivername=_p.scheme.replace("postgresql", "postgresql+psycopg2", 1),
        username=unquote(_p.username or ""),
        password=unquote(_p.password or ""),
        host=_p.hostname,
        port=_p.port or 5432,
        database=unquote(_p.path.lstrip("/")),
    ),
    pool_pre_ping=True,
    pool_size=3,
    max_overflow=5,
    pool_recycle=300,  # recycle connections every 5 min so idle-in-transaction don't linger
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def bcrypt_hash(password: str) -> str:
    return _pwd.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd.verify(plain, hashed)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── ORM Models ────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String(50), unique=True, nullable=False)
    email         = Column(String(255), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    pin_hash      = Column(Text, nullable=True)
    role          = Column(String(20), default="user")
    full_name     = Column(String(100))
    iban          = Column(String(40))
    balance       = Column(Numeric(12, 2), default=0.00)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)


class Event(Base):
    __tablename__ = "events"
    id         = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), nullable=False)
    client_id  = Column(String(100), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=True)
    amount     = Column(Numeric(12, 2), nullable=True)
    ip_address = Column(String(50))
    device_id  = Column(String(100))
    timestamp  = Column(DateTime)
    risk_score = Column(Numeric(6, 4))
    decision   = Column(String(30))
    created_at = Column(DateTime, default=datetime.utcnow)


class Profile(Base):
    __tablename__ = "profiles"
    id           = Column(Integer, primary_key=True, index=True)
    client_id    = Column(String(100), unique=True, nullable=False)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=True)
    profile_data = Column(JSON)
    last_updated = Column(DateTime, default=datetime.utcnow)


class FraudAlert(Base):
    __tablename__ = "fraud_alerts"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id   = Column(Integer, ForeignKey("events.id"), nullable=True)
    alert_type = Column(String(50))
    severity   = Column(String(20))
    message    = Column(Text)
    is_read    = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Transaction(Base):
    __tablename__ = "transactions"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id   = Column(Integer, ForeignKey("events.id"), nullable=True)
    tx_type    = Column(String(30))
    recipient  = Column(String(150))
    amount     = Column(Numeric(12, 2))
    city       = Column(String(80))
    device     = Column(String(100))
    is_fraud   = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Init + Seed ───────────────────────────────────────────────────────────────

_DEMO_PINS = {
    "admin":  "0000",
    "arjola": "1234",
    "besnik": "5678",
    "elona":  "2468",
    "erjon":  "1357",
}


def init_db():
    Base.metadata.create_all(bind=engine)

    # Add pin_hash column to existing databases that pre-date this column
    with engine.connect() as _conn:
        _conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash TEXT"))
        _conn.commit()

    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            # Backfill PINs for demo users that don't have one yet
            for uname, pin in _DEMO_PINS.items():
                u = db.query(User).filter(User.username == uname).first()
                if u and not u.pin_hash:
                    u.pin_hash = bcrypt_hash(pin)
            db.commit()
            return

        now = datetime.utcnow()

        admin_user = User(
            username="admin",
            email="admin@guardianai.al",
            password_hash=bcrypt_hash("admin123"),
            pin_hash=bcrypt_hash(_DEMO_PINS["admin"]),
            role="admin",
            full_name="Admin GuardianAI",
            balance=Decimal("0.00"),
        )
        demo_user = User(
            username="arjola",
            email="arjola@fibank.al",
            password_hash=bcrypt_hash("user123"),
            pin_hash=bcrypt_hash(_DEMO_PINS["arjola"]),
            role="user",
            full_name="Arjola Hoxha",
            iban="AL47 2121 1009 0000 0002 3569 8741",
            balance=Decimal("4287.50"),
        )
        # 3 more demo users
        besnik = User(
            username="besnik", email="besnik@fibank.al",
            password_hash=bcrypt_hash("user123"),
            pin_hash=bcrypt_hash(_DEMO_PINS["besnik"]),
            role="user",
            full_name="Besnik Kola",
            iban="AL47 2121 1009 0000 0003 1122 3344",
            balance=Decimal("12500.00"),
        )
        elona = User(
            username="elona", email="elona@fibank.al",
            password_hash=bcrypt_hash("user123"),
            pin_hash=bcrypt_hash(_DEMO_PINS["elona"]),
            role="user",
            full_name="Elona Dervishi",
            iban="AL47 2121 1009 0000 0004 5566 7788",
            balance=Decimal("3200.75"),
        )
        erjon = User(
            username="erjon", email="erjon@fibank.al",
            password_hash=bcrypt_hash("user123"),
            pin_hash=bcrypt_hash(_DEMO_PINS["erjon"]),
            role="user",
            full_name="Erjon Malaj",
            iban="AL47 2121 1009 0000 0005 9900 1122",
            balance=Decimal("890.20"),
        )
        db.add_all([admin_user, demo_user, besnik, elona, erjon])
        db.flush()

        # Arjola transactions
        txns = [
            Transaction(user_id=demo_user.id, tx_type="Deposit",  recipient="Paga Mujore",    amount=Decimal("2100.00"),  city="Tirane",  device="Desktop Mac",     is_fraud=False, created_at=now - timedelta(days=20)),
            Transaction(user_id=demo_user.id, tx_type="Payment",  recipient="OSHEE sh.a.",     amount=Decimal("-125.50"),  city="Tirane",  device="Mobile iOS",      is_fraud=False, created_at=now - timedelta(days=15)),
            Transaction(user_id=demo_user.id, tx_type="Payment",  recipient="UKT Ujsjelles",   amount=Decimal("-48.20"),   city="Tirane",  device="Mobile iOS",      is_fraud=False, created_at=now - timedelta(days=10)),
            Transaction(user_id=demo_user.id, tx_type="Transfer", recipient="Besnik Kola",      amount=Decimal("-350.00"),  city="Berat",   device="Desktop Mac",     is_fraud=False, created_at=now - timedelta(days=7)),
            Transaction(user_id=demo_user.id, tx_type="Transfer", recipient="Unknown (Berlin)", amount=Decimal("-1800.00"), city="Berlin",  device="Mobile Android",  is_fraud=True,  created_at=now - timedelta(days=3)),
            Transaction(user_id=demo_user.id, tx_type="Transfer", recipient="Unknown (Rome)",   amount=Decimal("-5000.00"), city="Rome",    device="Desktop Windows", is_fraud=True,  created_at=now - timedelta(days=1)),
        ]
        # Besnik transactions — high value, one fraud
        txns += [
            Transaction(user_id=besnik.id, tx_type="Deposit",  recipient="Paga Mujore",     amount=Decimal("3500.00"),  city="Tirane",  device="Desktop Mac",    is_fraud=False, created_at=now - timedelta(days=25)),
            Transaction(user_id=besnik.id, tx_type="Transfer", recipient="Elona Dervishi",  amount=Decimal("-500.00"),  city="Tirane",  device="Desktop Mac",    is_fraud=False, created_at=now - timedelta(days=18)),
            Transaction(user_id=besnik.id, tx_type="Payment",  recipient="Vodafone AL",     amount=Decimal("-29.99"),   city="Tirane",  device="Mobile iOS",     is_fraud=False, created_at=now - timedelta(days=10)),
            Transaction(user_id=besnik.id, tx_type="Transfer", recipient="Unknown (Athens)",amount=Decimal("-8500.00"), city="Athens",  device="Mobile Android", is_fraud=True,  created_at=now - timedelta(days=2)),
        ]
        # Elona transactions — clean customer, no fraud
        txns += [
            Transaction(user_id=elona.id, tx_type="Deposit", recipient="Paga Mujore", amount=Decimal("2200.00"), city="Tirane", device="Mobile iOS",  is_fraud=False, created_at=now - timedelta(days=22)),
            Transaction(user_id=elona.id, tx_type="Payment", recipient="OSHEE sh.a.", amount=Decimal("-98.40"),  city="Tirane", device="Mobile iOS",  is_fraud=False, created_at=now - timedelta(days=14)),
            Transaction(user_id=elona.id, tx_type="Payment", recipient="ALBtelecom",  amount=Decimal("-19.99"),  city="Tirane", device="Desktop Mac", is_fraud=False, created_at=now - timedelta(days=6)),
        ]
        # Erjon transactions — risky, multiple frauds
        txns += [
            Transaction(user_id=erjon.id, tx_type="Deposit",  recipient="Paga Mujore",        amount=Decimal("900.00"),  city="Tirane",   device="Mobile Android", is_fraud=False, created_at=now - timedelta(days=30)),
            Transaction(user_id=erjon.id, tx_type="Transfer", recipient="Unknown (Istanbul)",  amount=Decimal("-750.00"), city="Istanbul", device="Mobile Android", is_fraud=True,  created_at=now - timedelta(days=8)),
            Transaction(user_id=erjon.id, tx_type="Transfer", recipient="Unknown (Milan)",     amount=Decimal("-900.00"), city="Milan",    device="Mobile Android", is_fraud=True,  created_at=now - timedelta(days=4)),
        ]
        db.add_all(txns)

        alerts = [
            FraudAlert(user_id=demo_user.id, alert_type="suspicious_transfer", severity="high",     message="Transfer i pazakonte prej 1,800 EUR drejt Berlinit u bllokua.", is_read=False),
            FraudAlert(user_id=demo_user.id, alert_type="account_takeover",    severity="critical", message="Tentative hyrjeje nga IP e huaj (89.96.123.45) u zbulua dhe u bllokua.", is_read=False),
            FraudAlert(user_id=besnik.id,    alert_type="suspicious_transfer", severity="critical", message="Transfer i pazakonte prej 8,500 EUR drejt Athinase u bllokua automatikisht.", is_read=False),
            FraudAlert(user_id=erjon.id,     alert_type="account_takeover",    severity="high",     message="Tentative hyrjeje nga pajisje e panjohur u zbulua dhe u bllokua.", is_read=False),
            FraudAlert(user_id=erjon.id,     alert_type="suspicious_transfer", severity="critical", message="Transfer i dyshimte prej 900 EUR drejt Milanos u bllokua.", is_read=False),
        ]
        db.add_all(alerts)

        events = [
            Event(event_type="transaction", client_id="arjola", user_id=demo_user.id, amount=Decimal("1800.00"), ip_address="46.99.201.100", device_id="Mobile_Android",  timestamp=now - timedelta(days=3),  risk_score=Decimal("0.8800"), decision="BLOCK"),
            Event(event_type="login",       client_id="arjola", user_id=demo_user.id, amount=None,              ip_address="89.96.123.45",  device_id="Desktop_Windows", timestamp=now - timedelta(days=1),  risk_score=Decimal("0.9100"), decision="BLOCK"),
            Event(event_type="transaction", client_id="arjola", user_id=demo_user.id, amount=Decimal("85.50"),  ip_address="192.168.1.100", device_id="Mobile_iOS",      timestamp=now - timedelta(days=10), risk_score=Decimal("0.1200"), decision="ALLOW"),
            Event(event_type="transaction", client_id="besnik", user_id=besnik.id,    amount=Decimal("8500.00"),ip_address="89.44.201.77",  device_id="Mobile_Android",  timestamp=now - timedelta(days=2),  risk_score=Decimal("0.9300"), decision="BLOCK"),
            Event(event_type="transaction", client_id="erjon",  user_id=erjon.id,     amount=Decimal("750.00"), ip_address="185.220.101.5", device_id="Mobile_Android",  timestamp=now - timedelta(days=8),  risk_score=Decimal("0.8700"), decision="BLOCK"),
            Event(event_type="login",       client_id="erjon",  user_id=erjon.id,     amount=None,              ip_address="185.220.101.5", device_id="Unknown_Device",  timestamp=now - timedelta(days=9),  risk_score=Decimal("0.7900"), decision="MFA_CHALLENGE"),
            Event(event_type="transaction", client_id="elona",  user_id=elona.id,     amount=Decimal("98.40"),  ip_address="192.168.1.55",  device_id="Mobile_iOS",      timestamp=now - timedelta(days=14), risk_score=Decimal("0.0800"), decision="ALLOW"),
        ]
        db.add_all(events)

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# ── Serialisation helper ──────────────────────────────────────────────────────

def _to_dict(obj) -> dict:
    d = {}
    for col in obj.__table__.columns:
        val = getattr(obj, col.name)
        if isinstance(val, Decimal):
            val = float(val)
        elif isinstance(val, datetime):
            val = val.isoformat()
        d[col.name] = val
    return d


# ── Backward-compatible helpers (used by api/endpoints.py) ───────────────────

def insert_event(event_type, client_id, amount, ip_address, device_id,
                 timestamp, risk_score, decision, user_id=None):
    db = SessionLocal()
    try:
        ts = None
        if timestamp:
            try:
                ts = datetime.fromisoformat(str(timestamp))
            except (ValueError, TypeError):
                ts = datetime.utcnow()

        ev = Event(
            event_type=event_type,
            client_id=client_id,
            user_id=user_id,
            amount=Decimal(str(amount)) if amount is not None else None,
            ip_address=ip_address,
            device_id=device_id,
            timestamp=ts,
            risk_score=Decimal(str(round(float(risk_score), 4))) if risk_score is not None else None,
            decision=decision,
        )
        db.add(ev)
        db.commit()
        return ev.id
    finally:
        db.close()


def get_all_events():
    db = SessionLocal()
    try:
        return [_to_dict(r) for r in db.query(Event).order_by(Event.created_at.desc()).all()]
    finally:
        db.close()


def get_event_by_id(event_id):
    db = SessionLocal()
    try:
        row = db.query(Event).filter(Event.id == event_id).first()
        return _to_dict(row) if row else None
    finally:
        db.close()


def upsert_profile(client_id, profile_data):
    db = SessionLocal()
    try:
        existing = db.query(Profile).filter(Profile.client_id == client_id).first()
        if existing:
            existing.profile_data = profile_data
            existing.last_updated = datetime.utcnow()
        else:
            db.add(Profile(client_id=client_id, profile_data=profile_data))
        db.commit()
    finally:
        db.close()


def get_profile(client_id):
    db = SessionLocal()
    try:
        row = db.query(Profile).filter(Profile.client_id == client_id).first()
        if not row:
            return None
        return {
            "id": row.id,
            "client_id": row.client_id,
            "profile_data": row.profile_data or {},
            "last_updated": row.last_updated.isoformat() if row.last_updated else None,
        }
    finally:
        db.close()


def get_all_profiles():
    db = SessionLocal()
    try:
        rows = db.query(Profile).order_by(Profile.last_updated.desc()).all()
        return [
            {
                "id": r.id,
                "client_id": r.client_id,
                "profile_data": r.profile_data or {},
                "last_updated": r.last_updated.isoformat() if r.last_updated else None,
            }
            for r in rows
        ]
    finally:
        db.close()


def get_stats():
    db = SessionLocal()
    try:
        total_events   = db.query(func.count(Event.id)).scalar() or 0
        total_profiles = db.query(func.count(Profile.id)).scalar() or 0

        decision_counts   = {d: c for d, c in db.query(Event.decision, func.count(Event.id)).group_by(Event.decision).all()}
        event_type_counts = {t: c for t, c in db.query(Event.event_type, func.count(Event.id)).group_by(Event.event_type).all()}
        avg_score         = float(db.query(func.avg(Event.risk_score)).scalar() or 0)

        return {
            "total_events":        total_events,
            "total_profiles":      total_profiles,
            "decisions":           decision_counts,
            "event_types":         event_type_counts,
            "average_risk_score":  round(avg_score, 4),
        }
    finally:
        db.close()
