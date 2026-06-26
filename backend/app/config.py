import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/quantum_mythos"
)
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",")]

# Supabase auth (multi-tenancy). The frontend signs in with Supabase; the backend
# only VERIFIES the user's access token against the project's *public* JWKS — no
# Supabase secret lives here. The token's `sub` resolves to a per-user org.
# Default = the live project the deployed frontend authenticates against (dqdmp…).
SUPABASE_URL = os.environ.get(
    "SUPABASE_URL", "https://dqdmpmymzwravdjwmtxi.supabase.co"
).rstrip("/")
SUPABASE_JWT_AUD = os.environ.get("SUPABASE_JWT_AUD", "authenticated")

# Triage LLM provider seam. One model, chosen by config — never hard-wired.
#   LLM_PROVIDER=ollama  -> local dev / on-prem (free, runs on the dev machine)
#   LLM_PROVIDER=groq    -> prod (hosted, OpenAI-compatible; enable ZDR on the account)
# The triage engine degrades to heuristics if no provider is reachable.
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "ollama").lower()

# Local LLM (Ollama) — dev / on-prem.
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5-coder:7b")

# Groq (hosted, prod). 70B was validated to keep all real findings (recall 100%)
# where the local 7B over-suppressed; pin a stable model so quality doesn't drift.
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_BASE_URL = os.environ.get("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
