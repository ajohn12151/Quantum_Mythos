"""Plan entitlements — the gating scaffold.

GATING IS OFF until after hackathon judging (judges use the live site and must
have full access). Flip GATING_ENABLED = True afterward and call allows(...) at
the feature entry points (scan modes, CBOM, remediation) to enforce tiers.

Monetization model: black-box = free acquisition wedge; white-box + binary +
CBOM + continuous + remediation = paid moat; SSO/on-prem = enterprise.
"""
from __future__ import annotations

GATING_ENABLED = False  # <- flip to True after judging to enforce plan tiers

PLAN_FEATURES: dict[str, set[str]] = {
    "free": {"black_box"},
    "pro": {"black_box", "white_box", "cbom", "continuous"},
    "enterprise": {"black_box", "white_box", "binary", "cbom",
                   "continuous", "remediation", "sso", "on_prem"},
}


def allows(plan: str | None, feature: str) -> bool:
    """Whether `plan` may use `feature`. Always True while gating is disabled
    (judging period), so nothing is locked until we explicitly turn it on."""
    if not GATING_ENABLED:
        return True
    return feature in PLAN_FEATURES.get(plan or "free", PLAN_FEATURES["free"])
