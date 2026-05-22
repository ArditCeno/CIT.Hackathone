import database


class BehaviourProfileManager:
    def __init__(self):
        self._cache = {}

    def load_all(self):
        profiles = database.get_all_profiles()
        for p in profiles:
            self._cache[p["client_id"]] = p["profile_data"]

    def get_profile(self, client_id):
        if client_id in self._cache:
            return self._cache[client_id]
        row = database.get_profile(client_id)
        if row:
            self._cache[client_id] = row["profile_data"]
            return row["profile_data"]
        return None

    def update_profile(self, client_id, new_data):
        existing = self.get_profile(client_id) or {}
        existing.update(new_data)
        self._cache[client_id] = existing
        database.upsert_profile(client_id, existing)

    def get_all_profiles(self):
        return list(self._cache.values())

    def get_profile_summary(self, client_id):
        profile = self.get_profile(client_id)
        if not profile:
            return {"client_id": client_id, "status": "unknown"}
        return {
            "client_id": client_id,
            "total_logins": profile.get("login_count", 0),
            "total_transactions": profile.get("transaction_count", 0),
            "total_amount": profile.get("total_amount", 0),
            "avg_transaction": profile.get("avg_transaction_amount", 0),
            "known_devices": profile.get("known_devices", []),
            "known_ips": profile.get("known_ips", []),
            "risk_level": profile.get("risk_level", "low"),
        }


profile_manager = BehaviourProfileManager()
