class ResponseEngine:
    def __init__(self, low_threshold=0.3, high_threshold=0.7):
        self.low_threshold = low_threshold
        self.high_threshold = high_threshold

    def decide(self, risk_score):
        if risk_score >= self.high_threshold:
            return "block"
        elif risk_score >= self.low_threshold:
            return "mfa"
        else:
            return "allow"

    def get_decision_details(self, risk_score, client_id=None):
        decision = self.decide(risk_score)
        details = {
            "client_id": client_id,
            "risk_score": round(risk_score, 4),
            "decision": decision,
            "thresholds": {
                "low": self.low_threshold,
                "high": self.high_threshold,
            },
        }

        if decision == "block":
            details["message"] = "Transaction blocked due to high risk."
            details["action_required"] = "Contact support."
        elif decision == "mfa":
            details["message"] = "Additional verification required."
            details["action_required"] = "Complete multi-factor authentication."
        else:
            details["message"] = "Transaction approved."
            details["action_required"] = None

        return details


response_engine = ResponseEngine()
