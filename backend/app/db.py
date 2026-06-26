"""Thin asyncpg pool + helpers. Raw SQL against sql/schema.sql (no ORM)."""
from __future__ import annotations

import pathlib

import asyncpg

from .config import DATABASE_URL

_pool: asyncpg.Pool | None = None
_SCHEMA = pathlib.Path(__file__).resolve().parent.parent / "sql" / "schema.sql"


async def init_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        # statement_cache_size=0 keeps us compatible with PgBouncer-style poolers
        # (e.g. Supabase's transaction pooler), which don't support the prepared
        # statements asyncpg caches by default. Harmless on a direct connection.
        _pool = await asyncpg.create_pool(
            DATABASE_URL, min_size=1, max_size=10, statement_cache_size=0
        )
        await apply_schema()
    return _pool


def pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("DB pool not initialized; call init_pool() on startup")
    return _pool


async def apply_schema() -> None:
    """Idempotent — schema.sql uses CREATE TABLE IF NOT EXISTS."""
    sql = _SCHEMA.read_text()
    async with _pool.acquire() as con:
        await con.execute(sql)


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
