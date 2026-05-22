"""
test_scenarios.py — GuardianAI · Hackathon Demo Test Runner
============================================================
Sends three representative transactions to the /predict endpoint and
prints a colour-coded, formatted report to the terminal.

Usage (server must already be running):
    uvicorn fraud_api:app --reload --port 8000   # terminal 1
    python test_scenarios.py                     # terminal 2
"""

import sys
import textwrap

import requests

BASE_URL = "http://127.0.0.1:8000"
PREDICT  = f"{BASE_URL}/predict"

# ── ANSI colour helpers ───────────────────────────────────────────────────────
RED    = "\033[91m"
YELLOW = "\033[93m"
GREEN  = "\033[92m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RESET  = "\033[0m"

ACTION_COLOUR = {
    "BLOCK":         RED,
    "MFA_CHALLENGE": YELLOW,
    "ALLOW":         GREEN,
}

ACTION_ICON = {
    "BLOCK":         "BLOCKED",
    "MFA_CHALLENGE": "MFA CHALLENGE",
    "ALLOW":         "ALLOWED",
}

# ── Demo scenarios ────────────────────────────────────────────────────────────
SCENARIOS = [
    {
        "id":          1,
        "title":       "Smishing / Phishing Attack",
        "description": "A phishing URL was detected in the session.  "
                       "The Rule-Based Engine should immediately BLOCK — no ML needed.",
        "expected":    "BLOCK",
        "payload": {
            "transaction_amount":    250.00,
            "hour_of_day":           14,
            "is_new_device":         0,
            "is_new_ip":             0,
            "is_foreign_country":    0,
            "distance_from_usual_km": 5.0,
            "is_phishing_detected":  1,   # <── triggers Rule 1
        },
    },
    {
        "id":          2,
        "title":       "Credential Theft / Account Takeover",
        "description": "Unknown device + unknown IP + location 5 000 km away, "
                       "but a normal-sized amount.  The ML layer should flag the "
                       "behavioural anomaly and respond with MFA_CHALLENGE.",
        "expected":    "MFA_CHALLENGE",
        "payload": {
            "transaction_amount":    150.00,   # normal amount — rule won't fire
            "hour_of_day":           10,
            "is_new_device":         1,        # <── unknown device
            "is_new_ip":             1,        # <── unknown IP
            "is_foreign_country":    0,
            "distance_from_usual_km": 5000.0,  # <── far from home
            "is_phishing_detected":  0,
        },
    },
    {
        "id":          3,
        "title":       "Normal Transaction",
        "description": "Routine daytime payment from a known device with no "
                       "suspicious signals.  Engine should ALLOW immediately.",
        "expected":    "ALLOW",
        "payload": {
            "transaction_amount":    85.50,
            "hour_of_day":           14,
            "is_new_device":         0,
            "is_new_ip":             0,
            "is_foreign_country":    0,
            "distance_from_usual_km": 3.2,
            "is_phishing_detected":  0,
        },
    },
    {
        "id":          4,
        "title":       "Smishing Attack Simulation (Albanian)",
        "description": (
            "Raw SMS payload containing Albanian urgency keywords.  "
            "is_phishing_detected is 0 — the Dual-Layer Heuristic Engine "
            "alone must detect the smishing threat and return BLOCK."
        ),
        "expected":    "BLOCK",
        "payload": {
            "transaction_amount":     150.00,
            "hour_of_day":            11,
            "is_new_device":          0,
            "is_new_ip":              0,
            "is_foreign_country":     0,
            "distance_from_usual_km": 2.0,
            "is_phishing_detected":   0,   # <── flag OFF — heuristic must fire
            "sms_payload": (
                "Ju lutem verifikoni llogarinë tuaj në Fibank urgjentisht "
                "në këtë link: http://fibank-verify.ru/login"
            ),
        },
    },
    {
        "id":          5,
        "title":       "Phishing URL Heuristic (no flag)",
        "description": (
            "A banking-lookalike URL is passed via detected_url.  "
            "is_phishing_detected is 0 — only the URL heuristic should "
            "catch it and immediately return BLOCK."
        ),
        "expected":    "BLOCK",
        "payload": {
            "transaction_amount":     500.00,
            "hour_of_day":            9,
            "is_new_device":          0,
            "is_new_ip":              0,
            "is_foreign_country":     0,
            "distance_from_usual_km": 1.0,
            "is_phishing_detected":   0,   # <── flag OFF — URL heuristic must fire
            "detected_url": "https://secure-fibank.phish.ru/account/update",
        },
    },
]

# ── Formatting helpers ────────────────────────────────────────────────────────
DIVIDER     = "=" * 70
SUB_DIVIDER = "-" * 70

def banner():
    print(f"\n{BOLD}{CYAN}{DIVIDER}{RESET}")
    print(f"{BOLD}{CYAN}  GuardianAI · Hackathon Demo — Fraud Detection Scenarios{RESET}")
    print(f"{BOLD}{CYAN}  Target: {PREDICT}{RESET}")
    print(f"{BOLD}{CYAN}{DIVIDER}{RESET}\n")


def print_scenario_header(s: dict):
    colour = ACTION_COLOUR.get(s["expected"], CYAN)
    print(f"{BOLD}Scenario {s['id']}: {s['title']}{RESET}")
    print(f"{DIM}{textwrap.fill(s['description'], width=68)}{RESET}")
    print(f"Expected outcome  : {colour}{BOLD}{s['expected']}{RESET}")
    print(SUB_DIVIDER)


def print_payload(payload: dict):
    print(f"{DIM}Request payload:{RESET}")
    for k, v in payload.items():
        is_default = v in (0, 0.0) or v is None
        flag = f"  {CYAN}{'*' if not is_default else ' '}{RESET}"
        if isinstance(v, str) and len(v) > 55:
            display_v = f'"{v[:55]}..."'
        else:
            display_v = f'"{v}"' if isinstance(v, str) else v
        print(f"{flag}  {k:<28} = {display_v}")
    print()


def print_result(response_json: dict, expected: str, latency_ms: float):
    action  = response_json["action"]
    colour  = ACTION_COLOUR.get(action, CYAN)
    icon    = ACTION_ICON.get(action, action)
    passed  = action == expected
    verdict = f"{GREEN}PASS{RESET}" if passed else f"{RED}FAIL (got {action}, expected {expected}){RESET}"

    print(f"Decision          : {colour}{BOLD}[ {icon} ]{RESET}")
    print(f"Anomaly score     : {response_json['score']:+.6f}")
    print(f"Server latency    : {latency_ms:.1f} ms")
    print(f"Test verdict      : {verdict}")
    print()
    print(f"{DIM}Reason:{RESET}")
    wrapped = textwrap.fill(response_json["reason"], width=66, initial_indent="  ", subsequent_indent="  ")
    print(wrapped)


def run_scenario(s: dict) -> bool:
    """POST the payload, pretty-print the result.  Returns True if test passed."""
    print_scenario_header(s)
    print_payload(s["payload"])

    try:
        resp = requests.post(PREDICT, json=s["payload"], timeout=10)
        resp.raise_for_status()
    except requests.exceptions.ConnectionError:
        print(f"{RED}ERROR: Could not connect to {PREDICT}.{RESET}")
        print("Make sure the server is running:  uvicorn api:app --reload --port 8000")
        sys.exit(1)
    except requests.exceptions.HTTPError as exc:
        print(f"{RED}HTTP {exc.response.status_code}: {exc.response.text}{RESET}")
        return False

    data = resp.json()
    print_result(data, s["expected"], data.get("latency_ms", 0.0))
    return data["action"] == s["expected"]


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    banner()

    # Quick health-check before running scenarios
    try:
        health = requests.get(f"{BASE_URL}/health", timeout=5)
        health.raise_for_status()
        print(f"{GREEN}Health check OK — model loaded.{RESET}\n")
    except Exception:
        print(f"{RED}Health check failed — is the server up?{RESET}")
        print("Run:  uvicorn fraud_api:app --reload --port 8000\n")
        sys.exit(1)

    results = []
    for scenario in SCENARIOS:
        print(f"\n{DIVIDER}")
        passed = run_scenario(scenario)
        results.append(passed)
        print(DIVIDER)

    # ── Summary table ─────────────────────────────────────────────────────────
    total  = len(results)
    passed = sum(results)
    failed = total - passed

    print(f"\n{BOLD}{'=' * 70}{RESET}")
    print(f"{BOLD}  SUMMARY{RESET}")
    print(f"{'=' * 70}")
    for i, (s, ok) in enumerate(zip(SCENARIOS, results), 1):
        status = f"{GREEN}PASS{RESET}" if ok else f"{RED}FAIL{RESET}"
        colour = ACTION_COLOUR.get(s["expected"], CYAN)
        print(f"  Scenario {i} ({s['title']:<35}) {colour}{s['expected']:<14}{RESET} {status}")

    print(f"{'-' * 70}")
    overall = f"{GREEN}ALL TESTS PASSED{RESET}" if failed == 0 else f"{RED}{failed} TEST(S) FAILED{RESET}"
    print(f"  Result: {overall}  ({passed}/{total} scenarios correct)")
    print(f"{'=' * 70}\n")

    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
