"""Supabase JWT verification + per-user org resolution (multi-tenancy).

The frontend authenticates with Supabase (email/password). Its access token is
an ES256 JWT signed by the project's signing key; we verify it against the
project's *public* JWKS — no Supabase secret lives in the backend. The verified
`sub` (Supabase user id) + email get-or-create an org + app_user, so every
request is scoped to the caller's own tenant. New orgs default to the free plan.

The "Explore the live demo" path sends no token; those requests fall back to a
shared demo org so the no-login walkthrough keeps working.

This is the single place org scoping is resolved — endpoints depend on
`get_current_org` rather than picking an org themselves.
"""
from __future__ import annotations

from uuid import UUID

import jwt
from fastapi import Header, HTTPException
from jwt import PyJWKClient

from . import db
from .config import SUPABASE_JWT_AUD, SUPABASE_URL

DEMO_ORG_NAME = "Demo Org"  # the shared no-login walkthrough tenant

_JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
_ISSUER = f"{SUPABASE_URL}/auth/v1"

# PyJWKClient caches signing keys in-process (and refetches on an unknown kid),
# so tokens verify locally without a network round-trip per request.
_jwk_client = PyJWKClient(_JWKS_URL)


def _verify_token(token: str) -> dict:
    """Verify a Supabase access token and return its claims, or raise 401."""
    try:
        signing_key = _jwk_client.get_signing_key_from_jwt(token).key
        return jwt.decode(
            token,
            signing_key,
            algorithms=["ES256", "RS256"],   # Supabase asymmetric signing keys
            audience=SUPABASE_JWT_AUD,
            issuer=_ISSUER,
            leeway=10,                       # small clock-skew tolerance
            options={"require": ["sub", "exp"]},
        )
    except HTTPException:
        raise
    except Exception as e:                   # invalid / expired / wrong issuer
        raise HTTPException(401, f"invalid auth token: {e}")


async def demo_org() -> UUID:
    """Get-or-create the shared demo org (resolved by name so it never collides
    with a real per-user tenant)."""
    con = db.pool()
    row = await con.fetchrow(
        "SELECT id FROM org WHERE name=$1 ORDER BY created_at LIMIT 1", DEMO_ORG_NAME
    )
    if row:
        return row["id"]
    return await con.fetchval(
        "INSERT INTO org(name, plan) VALUES($1,'free') RETURNING id", DEMO_ORG_NAME
    )


async def _org_for_user(sub: str, email: str | None) -> UUID:
    """Get-or-create the caller's org + app_user from their Supabase identity.
    One org per user; identity keyed on the stable Supabase uid (email can change)."""
    con = db.pool()
    row = await con.fetchrow("SELECT org_id FROM app_user WHERE supabase_uid=$1", sub)
    if row:
        return row["org_id"]

    email = email or f"{sub}@users.noreply"
    async with con.acquire() as c:
        async with c.transaction():
            # Serialize concurrent first-logins for the same user so we never
            # create a duplicate user or an orphaned org.
            await c.execute("SELECT pg_advisory_xact_lock(hashtext($1))", sub)
            row = await c.fetchrow("SELECT org_id FROM app_user WHERE supabase_uid=$1", sub)
            if row:
                return row["org_id"]
            org_id = await c.fetchval(
                "INSERT INTO org(name, plan) VALUES($1,'free') RETURNING id", email
            )
            await c.execute(
                "INSERT INTO app_user(org_id, email, supabase_uid) VALUES($1,$2,$3)",
                org_id, email, sub,
            )
            return org_id


async def get_current_org(authorization: str | None = Header(default=None)) -> UUID:
    """FastAPI dependency resolving the caller's org.

    - `Authorization: Bearer <supabase-jwt>` -> the verified user's org.
    - missing / non-Bearer header            -> the shared demo org.
    An Authorization header that *claims* Bearer auth but carries a bad token is
    rejected with 401 (we don't silently downgrade a failed login to the demo).
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        return await demo_org()
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        return await demo_org()
    claims = _verify_token(token)
    return await _org_for_user(claims["sub"], claims.get("email"))


async def require_user_org(authorization: str | None = Header(default=None)) -> UUID:
    """Like `get_current_org`, but REQUIRES a signed-in user — never falls back to
    the demo org. Use for destructive / account-scoped actions so an anonymous
    visitor on the no-login demo path can neither act as, nor mutate, the shared
    demo tenant. The returned org is always the caller's own."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "authentication required")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(401, "authentication required")
    claims = _verify_token(token)
    return await _org_for_user(claims["sub"], claims.get("email"))
