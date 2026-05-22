import numpy as np
import pandas as pd
from faker import Faker
from datetime import datetime, timedelta
import uuid
import os

fake = Faker()
Faker.seed(42)
np.random.seed(42)

ALBANIAN_CITIES = [
    "Tiranë", "Durrës", "Vlorë", "Shkodër", "Elbasan",
    "Fier", "Korçë", "Berat", "Lushnjë", "Pogradec",
    "Kavajë", "Gjirokastër", "Sarandë", "Kukës", "Lezhë"
]

EUROPEAN_CITIES = [
    "Rome", "Milan", "Vienna", "Athens", "Istanbul",
    "Munich", "Zurich", "Paris", "London", "Berlin"
]

DEVICES = ["Mobile_Android", "Mobile_iOS", "Desktop_Windows", "Desktop_Mac", "Tablet_iPad", "Tablet_Android"]

EVENT_TYPES = ["login", "logout", "transfer", "payment", "view_balance", "change_password", "failed_login"]

USER_IDS = [f"User_{i:03d}" for i in range(1, 21)] + ["Klienti_A"]

TYPICAL_CITY = {
    uid: np.random.choice(ALBANIAN_CITIES) for uid in USER_IDS if uid != "Klienti_A"
}
TYPICAL_CITY["Klienti_A"] = "Tiranë"

TYPICAL_DEVICE = {
    uid: np.random.choice(DEVICES) for uid in USER_IDS
}

AVG_AMOUNT = {
    uid: round(np.random.uniform(50, 500), 2) for uid in USER_IDS
}
AVG_AMOUNT["Klienti_A"] = 200.00

def random_event(user_id, scenario="normal", timestamp=None):
    if timestamp is None:
        base = datetime(2025, 1, 1)
        max_days = 365
        timestamp = base + timedelta(
            days=np.random.randint(0, max_days),
            hours=np.random.randint(0, 24),
            minutes=np.random.randint(0, 60),
            seconds=np.random.randint(0, 60)
        )

    event_type = np.random.choice(EVENT_TYPES, p=[0.15, 0.10, 0.10, 0.15, 0.25, 0.05, 0.20])

    is_fraud = 0
    city = TYPICAL_CITY[user_id]
    device = TYPICAL_DEVICE[user_id]
    amount = 0.0

    if scenario == "fraud":
        fraud_pattern = np.random.choice([
            "wrong_city", "large_transfer", "odd_hour", "rapid_actions", "device_swap"
        ])
        is_fraud = 1

        if fraud_pattern == "wrong_city":
            city = np.random.choice(EUROPEAN_CITIES)
            event_type = np.random.choice(["login", "transfer", "payment"])
            if event_type == "transfer":
                amount = round(np.random.uniform(1000, 8000), 2)
        elif fraud_pattern == "large_transfer":
            event_type = "transfer"
            amount = round(np.random.uniform(3000, 15000), 2)
        elif fraud_pattern == "odd_hour":
            timestamp = timestamp.replace(hour=np.random.randint(1, 5))
            event_type = np.random.choice(["login", "transfer"])
            if event_type == "transfer":
                amount = round(np.random.uniform(500, 5000), 2)
        elif fraud_pattern == "rapid_actions":
            event_type = np.random.choice(["failed_login", "failed_login", "transfer"])
            if event_type == "transfer":
                amount = round(np.random.uniform(1000, 5000), 2)
        elif fraud_pattern == "device_swap":
            device = np.random.choice([d for d in DEVICES if d != TYPICAL_DEVICE[user_id]])
            event_type = np.random.choice(["login", "transfer"])
            if event_type == "transfer":
                amount = round(np.random.uniform(500, 3000), 2)

    elif scenario == "normal":
        if event_type in ("transfer", "payment"):
            avg = AVG_AMOUNT[user_id]
            amount = round(abs(np.random.normal(avg, avg * 0.3)), 2)

    return {
        "event_id": str(uuid.uuid4())[:8],
        "user_id": user_id,
        "timestamp": timestamp,
        "event_type": event_type,
        "amount": amount,
        "city": city,
        "device": device,
        "ip_address": fake.ipv4(),
        "is_fraud": is_fraud,
        "scenario": "klienti_a" if user_id == "Klienti_A" and is_fraud else scenario
    }


def generate_klienti_a_events():
    base = datetime(2025, 6, 15, 10, 0, 0)

    event_1 = {
        "event_id": "KA_E001",
        "user_id": "Klienti_A",
        "timestamp": base,
        "event_type": "login",
        "amount": 0.0,
        "city": "Tiranë",
        "device": "Desktop_Windows",
        "ip_address": "192.168.1.100",
        "is_fraud": 0,
        "scenario": "klienti_a"
    }

    event_2 = {
        "event_id": "KA_E002",
        "user_id": "Klienti_A",
        "timestamp": base + timedelta(hours=3),
        "event_type": "login",
        "amount": 0.0,
        "city": "Rome",
        "device": "Desktop_Windows",
        "ip_address": "89.96.123.45",
        "is_fraud": 1,
        "scenario": "klienti_a"
    }

    event_3 = {
        "event_id": "KA_E003",
        "user_id": "Klienti_A",
        "timestamp": base + timedelta(hours=3, minutes=15),
        "event_type": "transfer",
        "amount": 5000.00,
        "city": "Rome",
        "device": "Desktop_Windows",
        "ip_address": "89.96.123.45",
        "is_fraud": 1,
        "scenario": "klienti_a"
    }

    return [event_1, event_2, event_3]


def generate_dataset(n_normal=800, n_fraud=100):
    events = []

    events.extend(generate_klienti_a_events())

    normal_users = [u for u in USER_IDS]
    for _ in range(n_normal):
        user = np.random.choice(normal_users)
        if user == "Klienti_A":
            user = np.random.choice([u for u in normal_users if u != "Klienti_A"])
        events.append(random_event(user, scenario="normal"))

    fraud_users = [u for u in USER_IDS if u != "Klienti_A"]
    for _ in range(n_fraud):
        user = np.random.choice(fraud_users)
        events.append(random_event(user, scenario="fraud"))

    df = pd.DataFrame(events)
    df = df.sort_values("timestamp").reset_index(drop=True)
    return df


def save_dataset(df, output_dir="data"):
    os.makedirs(output_dir, exist_ok=True)
    csv_path = os.path.join(output_dir, "synthetic_events.csv")
    parquet_path = os.path.join(output_dir, "synthetic_events.parquet")

    df.to_csv(csv_path, index=False)
    try:
        df.to_parquet(parquet_path, index=False)
    except Exception:
        pass

    return csv_path, parquet_path


if __name__ == "__main__":
    df = generate_dataset(n_normal=800, n_fraud=100)
    total = len(df)
    n_fraud = df["is_fraud"].sum()
    csv_path, parquet_path = save_dataset(df)

    print(f"=== Synthetic Dataset Generated ===")
    print(f"Total events: {total}")
    print(f"Normal: {total - n_fraud} | Fraud: {int(n_fraud)}")
    print(f"Fraud rate: {n_fraud / total * 100:.2f}%")
    print(f"CSV: {csv_path}")
    if parquet_path:
        print(f"Parquet: {parquet_path}")
    print(f"\nUsers: {df['user_id'].nunique()}")
    print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")

    klienti_a = df[df["scenario"] == "klienti_a"]
    print(f"\n=== Klienti A Events ({len(klienti_a)}) ===")
    for _, row in klienti_a.iterrows():
        print(f"  {row['event_id']} | {row['timestamp']} | {row['event_type']:15s} | "
              f"{row['city']:12s} | {row['amount']:>8.2f}€ | {'FRAUD' if row['is_fraud'] else 'OK'}")
