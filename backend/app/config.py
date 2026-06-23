import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/quantum_mythos"
)
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",")]
