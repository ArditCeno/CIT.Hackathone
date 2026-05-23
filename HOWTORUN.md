# GuardianAI — How to Run (Local Demo)

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| PostgreSQL | 14+ |

---

## 1. PostgreSQL Setup

```sql
-- Run as postgres superuser:
CREATE USER guardian WITH PASSWORD 'guardian';
CREATE DATABASE guardianai OWNER guardian;
GRANT ALL PRIVILEGES ON DATABASE guardianai TO guardian;
```

---

## 2. Python Backend

```bash
# From repo root:
pip install -r requirements.txt

# Terminal A — ML scoring engine (port 8000)
python fraud_api.py

# Terminal B — Structured API with auth (port 8001)
python main.py
```

`main.py` automatically creates all tables and seeds demo data on first run.

---

## 3. React Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Vite proxies `/api` → `localhost:8001` and `/predict` → `localhost:8000`.

---

## Demo Accounts

| Role  | Username | Password  | Notes |
|-------|----------|-----------|-------|
| User  | arjola   | user123   | Balance €4,287.50, pre-seeded transactions & fraud alerts |
| Admin | admin    | admin123  | Access to `/api/dashboard/*` endpoints |

---

## Environment Variables (`.env`)

```
DATABASE_URL=postgresql://guardian:guardian@localhost:5432/guardianai
JWT_SECRET=guardian-hackathon-secret-2026
```

---

## API Summary

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | None |
| POST | `/api/auth/login` | None |
| GET  | `/api/auth/me` | Bearer |
| GET  | `/api/me/transactions` | Bearer |
| GET  | `/api/me/alerts` | Bearer |
| PATCH | `/api/me/alerts/{id}/read` | Bearer |
| GET  | `/api/me/stats` | Bearer |
| GET  | `/api/dashboard/stats` | Admin |
| GET  | `/api/dashboard/events` | Admin |
| POST | `/api/events/login` | Optional |
| POST | `/api/events/transaction` | Optional |
| POST | `/predict` | None (port 8000) |
