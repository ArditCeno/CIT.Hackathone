import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from jose import jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, User, bcrypt_hash, verify_password
from api.dependencies import get_current_user
from api.limiter import limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])

JWT_SECRET = os.getenv("JWT_SECRET", "guardian-hackathon-secret-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 hours


def _make_token(user_id: int) -> str:
    exp = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": exp}, JWT_SECRET, algorithm=ALGORITHM)


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


# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    pin: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str
    pin: str


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
@limiter.limit("5/minute")
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    if not body.pin.isdigit() or len(body.pin) != 4:
        raise HTTPException(status_code=400, detail="PIN duhet te jete 4 shifra numerike")
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=body.username,
        email=body.email,
        password_hash=bcrypt_hash(body.password),
        pin_hash=bcrypt_hash(body.pin),
        full_name=body.full_name or body.username,
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = _make_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user": _safe_user(user)}


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Kredencialet jane te gabuara!")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    if not user.pin_hash or not verify_password(body.pin, user.pin_hash):
        raise HTTPException(status_code=401, detail="PIN i gabuar!")
    token = _make_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user": _safe_user(user)}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return _safe_user(current_user)
