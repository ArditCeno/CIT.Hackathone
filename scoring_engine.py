"""
scoring_engine.py — GuardianAI · Hybrid Fraud Scoring Engine
=============================================================
Hackathon : Fibank Real-Time Fraud Detection (GuardianAI)
Author    : ML Engineering Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Decision architecture — two layers, fast-exit on first hit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌──────────────────────────────────────────────────────────┐
  │  LAYER 1 — Rule-Based Engine  (deterministic, O(1))      │
  │  Hard business constraints that need zero ML inference.  │
  │  If a rule fires → return immediately, skip the model.   │
  │                                                          │
  │  Rule 1 (Smishing / Phishing) :                          │
  │      is_phishing_detected == 1  →  BLOCK                 │
  └──────────────────────────┬───────────────────────────────┘
                             │  all rules passed
  ┌──────────────────────────▼───────────────────────────────┐
  │  LAYER 2 — Isolation Forest  (statistical, learned)      │
  │  Scores the feature vector from the trained pipeline.    │
  │                                                          │
  │  predict() == -1  (anomaly)   →  MFA_CHALLENGE           │
  │  predict() == +1  (normal)    →  ALLOW                   │
  └──────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GDPR / Right-to-Explanation (Article 22)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every response includes a `reason` string that names the exact rule
or feature pattern that drove the decision.  This can be surfaced to:
  • The customer ("why was my transaction blocked?")
  • Compliance officers in a Subject Access Request (SAR)
  • Regulators during an audit
"""

import logging
from typing import Any

import joblib
import numpy as np

# ── Logging ───────────────────────────────────────────────────────────────────
log = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# FEATURE ORDER
# This list is the single source of truth for how a dict is turned into a
# numpy vector.  It MUST match the order used in train.py's FEATURE_COLS.
# The artefact also stores this list; we use the artefact's copy at runtime
# so the engine always stays in sync with however the model was trained.
# ─────────────────────────────────────────────────────────────────────────────
# (fallback — used only if the artefact was saved without feature_cols)
_FALLBACK_FEATURE_COLS = [
    "transaction_amount",
    "hour_of_day",
    "is_new_device",
    "is_new_ip",
    "is_foreign_country",
    "distance_from_usual_km",
    "is_phishing_detected",
]


class ScoringEngine:
    """
    Loads the trained GuardianAI model and exposes a single public method:

        result = engine.evaluate_transaction(tx_data)

    Parameters
    ----------
    model_path : str
        Path to the .joblib artefact produced by train.py.
        Default: "model.joblib"
    """

    def __init__(self, model_path: str = "model.joblib"):
        log.info(f"[ScoringEngine] Loading model from: {model_path}")
        artefact = joblib.load(model_path)

        # Support both the dict-artefact format (train.py) and a bare Pipeline
        # (in case someone saved the model directly).
        if isinstance(artefact, dict):
            self._pipeline      = artefact["pipeline"]
            self._feature_cols  = artefact.get("feature_cols", _FALLBACK_FEATURE_COLS)
        else:
            self._pipeline     = artefact
            self._feature_cols = _FALLBACK_FEATURE_COLS

        log.info(f"[ScoringEngine] Ready.  Features: {self._feature_cols}")

    # ─────────────────────────────────────────────────────────────────────────
    # PUBLIC API
    # ─────────────────────────────────────────────────────────────────────────
    def evaluate_transaction(self, tx_data: dict[str, Any]) -> dict[str, Any]:
        """
        Evaluate a single transaction or session event.

        Processing order:
          1. Rule-Based Engine  →  fast exit if a hard rule fires
          2. ML Isolation Forest →  anomaly score + threshold decision

        Parameters
        ----------
        tx_data : dict
            Must contain all keys in FEATURE_COLS.  Extra keys are ignored.
            Missing keys default to 0 with a warning.

        Returns
        -------
        dict with keys:
            action  : "ALLOW" | "MFA_CHALLENGE" | "BLOCK"
            reason  : human-readable GDPR explanation string
            score   : float  anomaly score (0.0 when a hard rule fires)
        """
        # ── Layer 1: Rule-Based Engine ────────────────────────────────────────
        rule_result = self._apply_rules(tx_data)
        if rule_result is not None:
            log.info(f"[RuleEngine] {rule_result['action']} | {rule_result['reason']}")
            return rule_result

        # ── Layer 2: Isolation Forest ─────────────────────────────────────────
        score  = self._ml_score(tx_data)
        result = self._ml_decision(score, tx_data)
        log.info(f"[IsoForest]  {result['action']} | score={score:.4f} | {result['reason']}")
        return result

    # ─────────────────────────────────────────────────────────────────────────
    # PRIVATE — RULE-BASED ENGINE
    # ─────────────────────────────────────────────────────────────────────────
    def _apply_rules(self, tx: dict[str, Any]) -> dict[str, Any] | None:
        """
        Evaluate hard-coded business rules in priority order.

        Returns a result dict if a rule fires, or None if all rules pass.

        GDPR note: each rule returns a specific reason string so the customer
        knows exactly what triggered the decision — no black-box rejections.
        """

        # ── Rule 1: Smishing / Phishing link detected ─────────────────────────
        # If the session contained a URL matching the phishing blocklist, block
        # immediately.  This catches Smishing attacks before any money moves.
        if int(tx.get("is_phishing_detected", 0)) == 1:
            return {
                "action": "BLOCK",
                "reason": (
                    "Rule 1 — Phishing link detected in this session.  "
                    "The transaction has been blocked to protect you from "
                    "credential theft or social-engineering fraud (Smishing)."
                ),
                "score": 0.0,
            }

        # ── Additional rules can be inserted here without retraining the model ─
        # Example Rule 2 (placeholder — enable when threat-intel feed is live):
        #   if int(tx.get("is_new_device", 0)) == 1 and float(tx.get("transaction_amount", 0)) > 5000:
        #       return {"action": "MFA_CHALLENGE",
        #               "reason": "Rule 2 — High-value transaction from unrecognised device.",
        #               "score": 0.0}

        return None  # all rules passed → escalate to ML layer

    # ─────────────────────────────────────────────────────────────────────────
    # PRIVATE — ISOLATION FOREST INFERENCE
    # ─────────────────────────────────────────────────────────────────────────
    def _ml_score(self, tx: dict[str, Any]) -> float:
        """
        Build a feature vector from tx and run it through the trained Pipeline
        (StandardScaler → IsolationForest).

        Returns the raw decision_function score.
        Convention: more negative = more anomalous.
        """
        # Assemble the feature vector in the exact order the model was trained on.
        vector = []
        for col in self._feature_cols:
            val = tx.get(col)
            if val is None:
                log.warning(f"  Feature '{col}' missing — defaulting to 0.")
                val = 0
            vector.append(float(val))

        X = np.array(vector, dtype=np.float64).reshape(1, -1)

        # decision_function: negative = anomalous, positive = normal
        score = float(self._pipeline.decision_function(X)[0])
        return score

    # ─────────────────────────────────────────────────────────────────────────
    # PRIVATE — MAP SCORE TO ACTION
    # ─────────────────────────────────────────────────────────────────────────
    def _ml_decision(self, score: float, tx: dict[str, Any]) -> dict[str, Any]:
        """
        Map the Isolation Forest output to a business action.

        pipeline.predict() returns:
            -1  →  anomaly  →  MFA_CHALLENGE
            +1  →  normal   →  ALLOW

        We use predict() (not a raw threshold on the score) so the decision
        always respects the contamination parameter set at training time.
        This makes the system behaviour predictable and auditable.
        """
        # Build feature vector again for predict() (reuse _ml_score internals)
        vector = [float(tx.get(col, 0)) for col in self._feature_cols]
        X      = np.array(vector, dtype=np.float64).reshape(1, -1)
        label  = int(self._pipeline.predict(X)[0])   # -1 or +1

        if label == -1:
            # Anomaly detected — step up authentication before allowing the tx.
            reason = self._build_anomaly_reason(tx, score)
            return {
                "action": "MFA_CHALLENGE",
                "reason": reason,
                "score":  round(score, 6),
            }
        else:
            return {
                "action": "ALLOW",
                "reason": (
                    f"Transaction matches normal behavioural patterns "
                    f"(anomaly score: {score:.4f}).  No unusual signals detected."
                ),
                "score": round(score, 6),
            }

    # ─────────────────────────────────────────────────────────────────────────
    # PRIVATE — HUMAN-READABLE ANOMALY EXPLANATION
    # ─────────────────────────────────────────────────────────────────────────
    @staticmethod
    def _build_anomaly_reason(tx: dict[str, Any], score: float) -> str:
        """
        Construct a plain-English explanation of the anomaly by inspecting
        which features deviate from typical values.

        GDPR / Right-to-Explanation: this gives a specific, human-readable
        justification that can be included in a customer-facing notification
        or a Subject Access Request (SAR) response — no "black-box" refusals.
        """
        signals = []

        amount = float(tx.get("transaction_amount", 0))
        if amount > 500:
            signals.append(f"unusually high amount ({amount:.2f} BGN)")

        hour = int(tx.get("hour_of_day", 12))
        if hour < 5 or hour >= 23:
            signals.append(f"transaction at an unusual hour ({hour}:00)")

        if int(tx.get("is_new_device", 0)) == 1:
            signals.append("unrecognised device")

        if int(tx.get("is_new_ip", 0)) == 1:
            signals.append("unrecognised IP address")

        if int(tx.get("is_foreign_country", 0)) == 1:
            signals.append("transaction originated from a foreign country")

        dist = float(tx.get("distance_from_usual_km", 0))
        if dist > 100:
            signals.append(f"location {dist:.0f} km from usual area")

        summary = (
            f"Unusual behaviour detected (anomaly score: {score:.4f}).  "
            "Contributing signals: "
            + (", ".join(signals) if signals else "statistical pattern deviation")
            + ".  Step-up authentication required before proceeding."
        )
        return summary
