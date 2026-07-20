#!/bin/bash

set -euo pipefail

LABEL="com.bumpyclock.vibevoice"
PROJECT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PLIST_TEMPLATE="$PROJECT_DIR/$LABEL.plist.tmpl"
PLIST_PATH="$HOME/Library/LaunchAgents/$LABEL.plist"
STATE_DIR="$HOME/.local/share/vibevoice"
HF_HOME="$STATE_DIR/huggingface"
LOG_DIR="$HOME/Library/Logs/VibeVoice"
BASE_URL="http://127.0.0.1:7781"
TAILSCALE_URL="http://$(tailscale ip -4 2>/dev/null || printf '<tailscale-ip>'):7781"
STARTUP_TIMEOUT_SECONDS=${VIBEVOICE_STARTUP_TIMEOUT_SECONDS:-1800}

info() {
  printf '[vibevoice] %s\n' "$*"
}

fail() {
  printf '[vibevoice] error: %s\n' "$*" >&2
  exit 1
}

require_macos_arm64() {
  [[ $(uname -s) == "Darwin" ]] || fail "this installer requires macOS"
  [[ $(uname -m) == "arm64" ]] || fail "this installer requires Apple Silicon"
  command -v brew >/dev/null || fail "Homebrew is required"
  command -v tailscale >/dev/null || fail "Tailscale is required"
}

install_tools() {
  local formulae=()
  command -v uv >/dev/null || formulae+=(uv)
  command -v ffmpeg >/dev/null || formulae+=(ffmpeg)
  command -v git-lfs >/dev/null || formulae+=(git-lfs)

  if ((${#formulae[@]})); then
    info "installing Homebrew formulae: ${formulae[*]}"
    brew install "${formulae[@]}"
  fi

  git lfs install
}

render_plist() {
  mkdir -p "$HOME/Library/LaunchAgents" "$LOG_DIR" "$STATE_DIR"
  "$PROJECT_DIR/.venv/bin/python" - "$PLIST_TEMPLATE" "$PLIST_PATH" "$PROJECT_DIR" "$HOME" <<'PY'
from pathlib import Path
import sys

source, destination, project_dir, home = map(Path, sys.argv[1:])
rendered = source.read_text().replace("__PROJECT_DIR__", str(project_dir)).replace("__HOME__", str(home))
destination.write_text(rendered)
PY
  plutil -lint "$PLIST_PATH"
}

load_agent() {
  launchctl bootout "gui/$(id -u)" "$PLIST_PATH" >/dev/null 2>&1 || true
  launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"
  launchctl enable "gui/$(id -u)/$LABEL"
  launchctl kickstart -k "gui/$(id -u)/$LABEL"
}

models_ready() {
  "$PROJECT_DIR/.venv/bin/python" - "$BASE_URL/v1/models" <<'PY'
import json
import sys
from urllib.request import urlopen

expected = {
    "mlx-community/VibeVoice-Realtime-0.5B-fp16",
    "mlx-community/VibeVoice-ASR-bf16",
}
with urlopen(sys.argv[1], timeout=5) as response:
    payload = json.load(response)
loaded = {item["id"] for item in payload.get("data", [])}
raise SystemExit(0 if expected <= loaded else 1)
PY
}

wait_for_models() {
  local deadline=$((SECONDS + STARTUP_TIMEOUT_SECONDS))
  info "waiting for both models to load"
  until models_ready 2>/dev/null; do
    ((SECONDS < deadline)) || fail "models did not become ready; inspect $LOG_DIR/stderr.log"
    sleep 5
  done
}

configure_tailscale() {
  tailscale serve --http=7781 off >/dev/null 2>&1 || true
  tailscale serve --bg --yes --tcp=7781 tcp://127.0.0.1:7781
}

install_service() {
  require_macos_arm64
  install_tools

  info "installing Python 3.13 and syncing the locked environment"
  uv python install 3.13
  uv sync --project "$PROJECT_DIR" --locked --python 3.13

  mkdir -p "$HF_HOME/hub"
  info "downloading reviewed model revisions"
  HF_HOME="$HF_HOME" "$PROJECT_DIR/.venv/bin/python" \
    "$PROJECT_DIR/prefetch_models.py" --cache-dir "$HF_HOME/hub"

  render_plist
  load_agent
  wait_for_models
  configure_tailscale

  info "ready locally: $BASE_URL"
  info "ready on tailnet: $TAILSCALE_URL"
}

show_status() {
  printf '\nLaunchAgent\n'
  launchctl print "gui/$(id -u)/$LABEL" 2>/dev/null || true
  printf '\nLoaded models\n'
  if ! models_ready; then
    printf 'not ready; inspect %s/stderr.log\n' "$LOG_DIR"
  fi
  printf '\nTailscale Serve\n'
  tailscale serve status
}

restart_service() {
  launchctl kickstart -k "gui/$(id -u)/$LABEL"
  wait_for_models
}

case ${1:-install} in
  install)
    install_service
    ;;
  status)
    show_status
    ;;
  restart)
    restart_service
    ;;
  *)
    fail "usage: $0 [install|status|restart]"
    ;;
esac
