import pandas as pd
import numpy as np
from synthetic_data import TYPICAL_CITY, TYPICAL_DEVICE, AVG_AMOUNT, USER_IDS


def build_client_profiles(events_df=None):
    if events_df is not None:
        profiles = []
        for uid in events_df["user_id"].unique():
            user_events = events_df[events_df["user_id"] == uid]
            profile = {
                "user_id": uid,
                "typical_city": user_events["city"].mode().iloc[0] if not user_events["city"].mode().empty else "Unknown",
                "typical_device": user_events["device"].mode().iloc[0] if not user_events["device"].mode().empty else "Unknown",
                "avg_amount": round(user_events["amount"].mean(), 2),
                "transaction_count": int(len(user_events)),
                "fraud_count": int(user_events["is_fraud"].sum()),
                "risk_score": round(float(user_events["is_fraud"].sum() / max(len(user_events), 1) * 100), 2),
                "cities_visited": user_events["city"].nunique(),
                "devices_used": user_events["device"].nunique()
            }
            profiles.append(profile)
        return pd.DataFrame(profiles)

    profiles = []
    for uid in USER_IDS:
        profile = {
            "user_id": uid,
            "typical_city": TYPICAL_CITY.get(uid, "Tiranë"),
            "typical_device": TYPICAL_DEVICE.get(uid, "Desktop_Windows"),
            "avg_amount": AVG_AMOUNT.get(uid, 100.0),
            "transaction_count": 0,
            "fraud_count": 0,
            "risk_score": 0.0,
            "cities_visited": 1,
            "devices_used": 1
        }
        profiles.append(profile)
    return pd.DataFrame(profiles)


def save_profiles(profiles_df, output_dir="data"):
    import os
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, "client_profiles.csv")
    profiles_df.to_csv(path, index=False)
    return path


if __name__ == "__main__":
    df = pd.read_csv("data/synthetic_events.csv", parse_dates=["timestamp"])
    profiles = build_client_profiles(df)
    path = save_profiles(profiles)
    print(f"=== Client Profiles ===")
    print(profiles.to_string(index=False))
    print(f"\nSaved to: {path}")
