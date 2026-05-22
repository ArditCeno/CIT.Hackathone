import pandas as pd
import json
import os


DATA_DIR = os.path.dirname(__file__)
EVENTS_PATH = os.path.join(DATA_DIR, "synthetic_events.csv")
PROFILES_PATH = os.path.join(DATA_DIR, "client_profiles.csv")


def load_data():
    events = pd.read_csv(EVENTS_PATH, parse_dates=["timestamp"])
    profiles = pd.read_csv(PROFILES_PATH)
    return events, profiles


def dashboard_summary(events=None, profiles=None):
    if events is None:
        events, _ = load_data()

    total_events = len(events)
    total_fraud = int(events["is_fraud"].sum())
    fraud_rate = round(total_fraud / total_events * 100, 2)
    unique_users = events["user_id"].nunique()
    total_amount = round(events["amount"].sum(), 2)
    unique_cities = events["city"].nunique()

    return {
        "total_events": total_events,
        "total_fraud": total_fraud,
        "fraud_rate": fraud_rate,
        "unique_users": unique_users,
        "total_amount": total_amount,
        "unique_cities": unique_cities
    }


def fraud_timeline(events=None):
    if events is None:
        events, _ = load_data()

    df = events.copy()
    df["date"] = df["timestamp"].dt.date
    daily = df.groupby("date").agg(
        total_events=("event_id", "count"),
        fraud_events=("is_fraud", "sum")
    ).reset_index()
    daily["date"] = daily["date"].astype(str)
    return daily.to_dict(orient="records")


def user_risk_ranking(events=None, profiles=None, top_n=10):
    if events is None:
        events, profiles = load_data()

    risk = events.groupby("user_id").agg(
        total_events=("event_id", "count"),
        fraud_count=("is_fraud", "sum"),
        total_amount=("amount", "sum")
    ).reset_index()
    risk["risk_score"] = round(risk["fraud_count"] / risk["total_events"] * 100, 2)
    risk = risk.sort_values("risk_score", ascending=False).head(top_n)
    return risk.to_dict(orient="records")


def event_type_distribution(events=None):
    if events is None:
        events, _ = load_data()
    dist = events["event_type"].value_counts().reset_index()
    dist.columns = ["event_type", "count"]
    return dist.to_dict(orient="records")


def city_heatmap(events=None):
    if events is None:
        events, _ = load_data()

    city_stats = events.groupby("city").agg(
        total_events=("event_id", "count"),
        fraud_events=("is_fraud", "sum")
    ).reset_index()
    city_stats["fraud_rate"] = round(
        city_stats["fraud_events"] / city_stats["total_events"] * 100, 2
    )
    return city_stats.to_dict(orient="records")


def klienti_a_details(events=None):
    if events is None:
        events, _ = load_data()

    ka = events[events["user_id"] == "Klienti_A"].sort_values("timestamp")
    return ka.to_dict(orient="records")


def full_dashboard_json():
    events, profiles = load_data()
    return {
        "summary": dashboard_summary(events, profiles),
        "fraud_timeline": fraud_timeline(events),
        "user_risk": user_risk_ranking(events, profiles),
        "event_distribution": event_type_distribution(events),
        "city_heatmap": city_heatmap(events),
        "klienti_a": klienti_a_details(events),
        "profiles": profiles.to_dict(orient="records")
    }


def export_dashboard_json(output_path=None):
    data = full_dashboard_json()
    if output_path is None:
        output_path = os.path.join(DATA_DIR, "dashboard_mock_data.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)
    return output_path


if __name__ == "__main__":
    path = export_dashboard_json()
    data = full_dashboard_json()
    print(f"=== Dashboard Mock Data ===")
    print(f"Exported to: {path}")
    print(f"\nSummary: {json.dumps(data['summary'], indent=2, ensure_ascii=False)}")
    print(f"\nFraud Timeline entries: {len(data['fraud_timeline'])} days")
    print(f"User Risk entries: {len(data['user_risk'])} users")
    print(f"Event Types: {len(data['event_distribution'])} types")
    print(f"Cities: {len(data['city_heatmap'])} cities")
    print(f"Klienti A events: {len(data['klienti_a'])}")
    print(f"Profiles: {len(data['profiles'])} users")
