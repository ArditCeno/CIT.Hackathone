import random


def predict(event):
    profile = event.get("profile", {})
    amount = event.get("amount", 0)
    ip_address = event.get("ip_address", "")
    device_id = event.get("device_id", "")
    known_ips = profile.get("known_ips", [])
    known_devices = profile.get("known_devices", [])
    avg_transaction = profile.get("avg_transaction_amount", 0)

    score = 0.0

    if ip_address and known_ips and ip_address not in known_ips:
        score += 0.2

    if device_id and known_devices and device_id not in known_devices:
        score += 0.2

    if amount and avg_transaction and amount > avg_transaction * 3:
        score += 0.3

    if amount and amount > 10000:
        score += 0.2

    score += random.uniform(-0.1, 0.1)
    score = max(0.0, min(1.0, score))

    return score
