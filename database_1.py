import sqlite3
import pandas as pd
import os


DB_PATH = os.path.join(os.path.dirname(__file__), "..", "fraud_detection.db")


def get_connection(db_path=None):
    path = db_path or DB_PATH
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def load_events_to_db(df=None, db_path=None):
    if df is None:
        csv_path = os.path.join(os.path.dirname(__file__), "synthetic_events.csv")
        df = pd.read_csv(csv_path, parse_dates=["timestamp"])

    conn = get_connection(db_path)
    df.to_sql("events", conn, if_exists="replace", index=False)
    conn.commit()

    cursor = conn.execute("SELECT COUNT(*) as cnt FROM events")
    count = cursor.fetchone()["cnt"]
    conn.close()
    return count


def load_profiles_to_db(profiles_df=None, db_path=None):
    if profiles_df is None:
        csv_path = os.path.join(os.path.dirname(__file__), "client_profiles.csv")
        profiles_df = pd.read_csv(csv_path)

    conn = get_connection(db_path)
    profiles_df.to_sql("client_profiles", conn, if_exists="replace", index=False)
    conn.commit()
    conn.close()
    return len(profiles_df)


def query_events(sql, params=None, db_path=None):
    conn = get_connection(db_path)
    df = pd.read_sql_query(sql, conn, params=params)
    conn.close()
    return df


def get_fraud_summary(db_path=None):
    sql = """
        SELECT
            COUNT(*) as total_events,
            SUM(is_fraud) as total_fraud,
            ROUND(SUM(is_fraud) * 100.0 / COUNT(*), 2) as fraud_rate,
            COUNT(DISTINCT user_id) as unique_users
        FROM events
    """
    return query_events(sql, db_path=db_path)


def get_klienti_a_events(db_path=None):
    sql = "SELECT * FROM events WHERE user_id = 'Klienti_A' ORDER BY timestamp"
    return query_events(sql, db_path=db_path)


def get_user_activity(user_id, db_path=None):
    sql = "SELECT * FROM events WHERE user_id = ? ORDER BY timestamp"
    return query_events(sql, params=(user_id,), db_path=db_path)


def get_recent_fraud(n=20, db_path=None):
    sql = """
        SELECT * FROM events
        WHERE is_fraud = 1
        ORDER BY timestamp DESC
        LIMIT ?
    """
    return query_events(sql, params=(n,), db_path=db_path)


def api_test_events(endpoint="/api/events", db_path=None):
    import json
    conn = get_connection(db_path)
    cursor = conn.execute("SELECT * FROM events LIMIT 5")
    rows = [dict(row) for row in cursor.fetchall()]
    for row in rows:
        if isinstance(row.get("timestamp"), str):
            row["timestamp"] = str(row["timestamp"])
    conn.close()

    return {
        "endpoint": endpoint,
        "method": "GET",
        "status": 200,
        "count": len(rows),
        "data": rows,
        "message": f"Mock API response — {endpoint} returned {len(rows)} events"
    }


def api_test_profiles(endpoint="/api/profiles", db_path=None):
    import json
    conn = get_connection(db_path)
    cursor = conn.execute("SELECT * FROM client_profiles LIMIT 5")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return {
        "endpoint": endpoint,
        "method": "GET",
        "status": 200,
        "count": len(rows),
        "data": rows,
        "message": f"Mock API response — {endpoint} returned {len(rows)} profiles"
    }


if __name__ == "__main__":
    import json
    BASE = os.path.dirname(__file__)
    print("=== Loading data into database ===")
    events_df = pd.read_csv(os.path.join(BASE, "synthetic_events.csv"), parse_dates=["timestamp"])
    profiles_df = pd.read_csv(os.path.join(BASE, "client_profiles.csv"))

    ev_count = load_events_to_db(events_df)
    pr_count = load_profiles_to_db(profiles_df)
    print(f"Loaded {ev_count} events into database")
    print(f"Loaded {pr_count} profiles into database")

    print("\n=== Fraud Summary ===")
    print(get_fraud_summary())

    print("\n=== Klienti A Events ===")
    print(get_klienti_a_events())

    print("\n=== API Test: Events ===")
    print(json.dumps(api_test_events(), indent=2, ensure_ascii=False, default=str)[:500])
