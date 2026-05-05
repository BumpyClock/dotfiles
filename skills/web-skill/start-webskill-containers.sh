#!/usr/bin/env bash
set -euo pipefail

DOCKER=/usr/local/bin/docker
APP_DIR=/Users/adityasharma/Projects/dotfiles/skills/web-skill

if ! "$DOCKER" info >/dev/null 2>&1; then
  /usr/bin/open -gj -a Docker >/dev/null 2>&1 || true
fi

for _ in {1..60}; do
  if "$DOCKER" info >/dev/null 2>&1; then
    cd "$APP_DIR"
    exec "$DOCKER" compose up -d
  fi
  sleep 5
done

echo "Docker daemon unavailable after 300 seconds" >&2
exit 1

