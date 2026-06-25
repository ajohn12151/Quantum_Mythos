"""LLM client for the triage engine — provider-agnostic by config.

One internal interface (`available()` + `ask_json()`); the backend is chosen by
`LLM_PROVIDER` (see config.py), never hard-wired:
  - `ollama` : local dev / on-prem (free, on-device)
  - `groq`   : prod (hosted, OpenAI-compatible; pin a model, enable ZDR)

Degrades gracefully: if the provider isn't configured/reachable, callers fall back
to deterministic heuristics. To add another OpenAI-compatible provider later
(Fireworks, Together, a self-hosted vLLM, …) it's the same code path as `groq`
with a different base URL + key.
"""
from __future__ import annotations

import json

import httpx

from ...config import (
    GROQ_API_KEY,
    GROQ_BASE_URL,
    GROQ_MODEL,
    LLM_PROVIDER,
    OLLAMA_MODEL,
    OLLAMA_URL,
)


def available() -> bool:
    """Cheap reachability check, called per finding before the (costlier) LLM call."""
    if LLM_PROVIDER == "groq":
        return bool(GROQ_API_KEY)          # presence is enough; a bad key fails the call -> heuristic
    if LLM_PROVIDER == "ollama":
        try:
            httpx.get(f"{OLLAMA_URL}/api/tags", timeout=2.0)
            return True
        except Exception:
            return False
    return False


def ask_json(system: str, user: str, timeout: float = 60.0) -> dict | None:
    """Ask the configured model for a JSON object. Returns None on any failure."""
    if LLM_PROVIDER == "groq":
        return _ask_openai_compatible(system, user, timeout)
    if LLM_PROVIDER == "ollama":
        return _ask_ollama(system, user, timeout)
    return None


def _ask_openai_compatible(system: str, user: str, timeout: float) -> dict | None:
    """Groq (and any OpenAI-compatible inference API). JSON mode + temp 0 for
    deterministic, parseable verdicts."""
    try:
        resp = httpx.post(
            f"{GROQ_BASE_URL}/chat/completions",
            timeout=timeout,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json={
                "model": GROQ_MODEL,
                "temperature": 0,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            },
        )
        resp.raise_for_status()
        return json.loads(resp.json()["choices"][0]["message"]["content"])
    except Exception:
        return None


def _ask_ollama(system: str, user: str, timeout: float) -> dict | None:
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
