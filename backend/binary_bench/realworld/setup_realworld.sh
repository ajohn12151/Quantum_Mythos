#!/usr/bin/env bash
# Materialize the hand-labeled real-world binaries next to labels.json.
# These are host system binaries (platform-specific), so they are gitignored and
# regenerated here rather than committed. Universal/fat binaries are thinned to a
# single arm64 slice so LIEF parses one architecture.
set -u
cd "$(dirname "$0")"

thin() {  # src -> rw_<name> (thin to arm64 if fat, else copy)
  local src="$1" dst="rw_$(basename "$1")"
  if file "$src" | grep -q "universal binary"; then
    lipo "$src" -thin arm64 -output "$dst" 2>/dev/null || lipo "$src" -thin arm64e -output "$dst" 2>/dev/null || cp "$src" "$dst"
  else
    cp "$src" "$dst"
  fi
  echo "  $dst"
}

echo "materializing real-world binaries:"
thin /opt/homebrew/bin/openssl
thin /usr/bin/ssh
thin /usr/local/bin/docker
thin /bin/ls
thin /usr/bin/true
echo "done. now run:  python3 run_realworld.py"
