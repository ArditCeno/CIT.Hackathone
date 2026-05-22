import sqlite3
import json
from datetime import datetime

DB_PATH = "fraud_detection.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            client_id TEXT NOT NULL,
            amount REAL,
            ip_address TEXT,
            device_id TEXT,
            timestamp TEXT,
            risk_score REAL,
            decision TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id TEXT UNIQUE NOT NULL,
            profile_data TEXT,
            last_updated TEXT DEFAULT (datetime('now'))
        )
    """)

    conn.commit()
    conn.close()


def insert_event(event_type, client_id, amount, ip_address, device_id, timestamp, risk_score, decision):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO events (event_type, client_id, amount, ip_address, device_id, timestamp, risk_score, decision)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (event_type, client_id, amount, ip_address, device_id, timestamp, risk_score, decision))
    conn.commit()
    event_id = cursor.lastrowid
    conn.close()
    return event_id


def get_all_events():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_event_by_id(event_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def upsert_profile(client_id, profile_data):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO profiles (client_id, profile_data, last_updated)
        VALUES (?, ?, ?)
        ON CONFLICT(client_id) DO UPDATE SET
            profile_data = excluded.profile_data,
            last_updated = excluded.last_updated
    """, (client_id, json.dumps(profile_data), now))
    conn.commit()
    conn.close()


def get_profile(client_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM profiles WHERE client_id = ?", (client_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        result = dict(row)
        result["profile_data"] = json.loads(result["profile_data"])
        return result
    return None


def get_all_profiles():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM profiles ORDER BY last_updated DESC")
    rows = cursor.fetchall()
    conn.close()
    result = []
    for row in rows:
        d = dict(row)
        d["profile_data"] = json.loads(d["profile_data"])
        result.append(d)
    return result


def get_stats():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total FROM events")
    total_events = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) as total FROM profiles")
    total_profiles = cursor.fetchone()["total"]

    cursor.execute("SELECT decision, COUNT(*) as count FROM events GROUP BY decision")
    decision_counts = {row["decision"]: row["count"] for row in cursor.fetchall()}

    cursor.execute("""
        SELECT event_type, COUNT(*) as count
        FROM events
        GROUP BY event_type
    """)
    event_type_counts = {row["event_type"]: row["count"] for row in cursor.fetchall()}

    cursor.execute("""
        SELECT AVG(risk_score) as avg_score
        FROM events
    """)
    avg_risk = cursor.fetchone()["avg_score"] or 0

    conn.close()

    return {
        "total_events": total_events,
        "total_profiles": total_profiles,
        "decisions": decision_counts,
        "event_types": event_type_counts,
        "average_risk_score": round(avg_risk, 4),
    }
