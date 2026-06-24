"""Local LLM client (Ollama) — free, on-device. Used by the triage engine.
Degrades gracefully: if Ollama isn't running, callers fall back to heuristics.
"""
from __future__ import annotations

import json

import httpx

from ...config import OLLAMA_MODEL, OLLAMA_URL


def available() -> bool:
    try:
        httpx.get(f"{OLLAMA_URL}/api/tags", timeout=2.0)
        return True
    except Exception:
        return False


def ask_json(system: str, user: str, timeout: float = 60.0) -> dict | None:
    """Ask the local model for a JSON object. Returns None on any failure."""
    try:
        resp = httpx.post(
            f"{OLLAMA_URL}/api/chat",
            timeout=timeout,
            json={
                "model": OLLAMA_MODEL,
                "stream": False,
                "format": "json",          # Ollama constrains output to valid JSON
                "options": {"temperature": 0},
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            },
        )
        resp.raise_for_status()
        return json.loads(resp.json()["message"]["content"])
    except Exception:
        return None
