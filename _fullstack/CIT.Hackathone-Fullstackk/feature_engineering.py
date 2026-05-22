import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from datetime import datetime


def load_data(csv_path="data/synthetic_events.csv"):
    df = pd.read_csv(csv_path, parse_dates=["timestamp"])
    return df


def clean_data(df):
    df = df.copy()
    df = df.drop_duplicates(subset=["event_id"])
    df = df.dropna(subset=["user_id", "timestamp", "event_type"])
    df["amount"] = df["amount"].fillna(0.0)
    df["city"] = df["city"].fillna("Unknown")
    df["device"] = df["device"].fillna("Unknown")
    df["ip_address"] = df["ip_address"].fillna("0.0.0.0")
    return df


def extract_features(df):
    df = df.copy()

    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["is_weekend"] = df["day_of_week"].apply(lambda x: 1 if x >= 5 else 0)
    df["is_night"] = df["hour"].apply(lambda x: 1 if x < 6 or x >= 23 else 0)

    df["is_large_amount"] = (df["amount"] > 2000).astype(int)

    df["amount_ratio"] = 0.0
    for uid in df["user_id"].unique():
        mask = df["user_id"] == uid
        user_avg = df.loc[mask, "amount"].mean()
        if user_avg > 0:
            df.loc[mask, "amount_ratio"] = df.loc[mask, "amount"] / user_avg
        else:
            df.loc[mask, "amount_ratio"] = 0.0

    df = df.sort_values(["user_id", "timestamp"])
    df["is_unusual_city"] = 0
    df["is_unusual_device"] = 0
    df["time_since_last_event"] = 0.0

    for uid in df["user_id"].unique():
        mask = df["user_id"] == uid
        user_df = df.loc[mask]

        typical_city = user_df["city"].mode().iloc[0] if not user_df["city"].mode().empty else None
        typical_device = user_df["device"].mode().iloc[0] if not user_df["device"].mode().empty else None

        if typical_city:
            df.loc[mask, "is_unusual_city"] = (user_df["city"] != typical_city).astype(int)
        if typical_device:
            df.loc[mask, "is_unusual_device"] = (user_df["device"] != typical_device).astype(int)

        time_diffs = user_df["timestamp"].diff().dt.total_seconds().fillna(0)
        df.loc[mask, "time_since_last_event"] = time_diffs

    df["rapid_succession"] = (df["time_since_last_event"] < 300).astype(int)

    return df


def encode_categorical(df, encoders=None):
    df = df.copy()
    cat_cols = ["event_type", "city", "device", "user_id"]

    if encoders is None:
        encoders = {}
        for col in cat_cols:
            if col in df.columns:
                le = LabelEncoder()
                df[col + "_encoded"] = le.fit_transform(df[col].astype(str))
                encoders[col] = le
        return df, encoders
    else:
        for col in cat_cols:
            if col in df.columns and col in encoders:
                le = encoders[col]
                unseen = set(df[col].astype(str)) - set(le.classes_)
                if unseen:
                    le.classes_ = list(le.classes_) + list(unseen)
                df[col + "_encoded"] = le.transform(df[col].astype(str))
        return df, encoders


def prepare_train_test(df, target_col="is_fraud", test_size=0.3, random_state=42):
    feature_cols = [
        "amount", "hour", "day_of_week", "is_weekend", "is_night",
        "is_large_amount", "amount_ratio", "is_unusual_city",
        "is_unusual_device", "time_since_last_event", "rapid_succession",
        "event_type_encoded", "city_encoded", "device_encoded"
    ]

    available = [c for c in feature_cols if c in df.columns]
    missing = [c for c in feature_cols if c not in df.columns]
    if missing:
        print(f"Warning: missing features: {missing}")

    X = df[available].copy()
    y = df[target_col].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    scaler = StandardScaler()
    num_cols = ["amount", "amount_ratio", "time_since_last_event"]
    num_cols = [c for c in num_cols if c in X_train.columns]

    X_train[num_cols] = scaler.fit_transform(X_train[num_cols])
    X_test[num_cols] = scaler.transform(X_test[num_cols])

    return X_train, X_test, y_train, y_test, scaler


def full_pipeline(csv_path="data/synthetic_events.csv"):
    print("=== Feature Engineering Pipeline ===")
    df = load_data(csv_path)
    print(f"Loaded: {len(df)} events")

    df = clean_data(df)
    print(f"After cleaning: {len(df)} events")

    df = extract_features(df)
    print(f"After feature extraction: {len(df.columns)} columns")

    df, encoders = encode_categorical(df)

    X_train, X_test, y_train, y_test, scaler = prepare_train_test(df)

    print(f"\nTrain size: {len(X_train)} | Test size: {len(X_test)}")
    print(f"Train fraud rate: {y_train.mean() * 100:.2f}%")
    print(f"Test fraud rate: {y_test.mean() * 100:.2f}%")
    print(f"Features used: {list(X_train.columns)}")

    return df, X_train, X_test, y_train, y_test, encoders, scaler


if __name__ == "__main__":
    df, X_train, X_test, y_train, y_test, encoders, scaler = full_pipeline()
    print("\n=== Sample Features ===")
    print(X_train.head())
