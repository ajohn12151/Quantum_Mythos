# Quantum Mythos backend — container image for Render (or any Docker host).
# The black-box scanners (TLS/CT) are pure Python; we only need a couple of
# system tools for the other paths.
FROM python:3.12-slim

# System tools the scanners shell out to:
#   openssh-client -> ssh-keyscan (black-box SSH host-key probe)
#   git            -> white-box repo clone (discover / remediate / reverify)
#   ca-certificates-> outbound TLS to CT logs / Groq / GitHub
# (semgrep-core ships inside the `semgrep` pip package; the binary/Docker-image
#  scan needs the docker CLI and is intentionally not enabled on this host.)
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssh-client git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render injects $PORT; default to 8000 for local `docker run`.
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
