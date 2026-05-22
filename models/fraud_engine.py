import os
from datetime import datetime

from scoring_engine import ScoringEngine

_engine = ScoringEngine(os.getenv("GUARDIAN_MODEL_PATH", "model.joblib"))

# Map IsolationForest decision to a numeric risk score the ResponseEngine understands.
# ALLOW → 0.1  (< 0.3 low threshold → allow)
# MFA_CHALLENGE → 0.5  (between 0.3 and 0.7 → mfa)
# BLOCK → 0.9  (> 0.7 high threshold → block)
_ACTION_TO_SCORE = {"ALLOW": 0.1, "MFA_CHALLENGE": 0.5, "BLOCK": 0.9}


def predict(event: dict) -> float:
    """
    Score an incoming login or transaction event using the trained IsolationForest.

    Parameters
    ----------
    event : dict
        Keys: event_type, client_id, ip_address, device_id, amount (optional),
              timestamp (optional), profile (dict from BehaviourProfileManager).

    Returns
    -------
    float in [0.0, 1.0] — higher means more suspicious.
    """
    profile = event.get("profile") or {}
    amount = float(event.get("amount") or 0.0)
    ip_address = event.get("ip_address") or ""
    device_id = event.get("device_id") or ""
    known_ips = profile.get("known_ips", [])
    known_devices = profile.get("known_devices", [])

    ts = event.get("timestamp")
    try:
        hour = datetime.fromisoformat(ts).hour if ts else datetime.now().hour
    except (ValueError, TypeError):
        hour = datetime.now().hour

    tx = {
        "transaction_amount": amount,
        "hour_of_day": hour,
        "is_new_device": int(bool(device_id and known_devices and device_id not in known_devices)),
        "is_new_ip": int(bool(ip_address and known_ips and ip_address not in known_ips)),
        "is_foreign_country": 0,
        "distance_from_usual_km": 0.0,
        "is_phishing_detected": 0,
    }

    result = _engine.evaluate_transaction(tx)
    return _ACTION_TO_SCORE.get(result["action"], 0.1)
