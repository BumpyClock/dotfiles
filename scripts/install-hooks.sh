#!/bin/sh
set -eu
cd "$(git rev-parse --show-toplevel)"
fail() { printf '%s\n' "install-hooks: $*" >&2; exit 1; }
status=0
current=$(git config --get core.hooksPath) || status=$?
[ "$status" -le 1 ] || fail 'Could not read Git hook configuration.'
if [ "$current" = .githooks ]; then
  printf '%s\n' 'Repository hooks already configured.'
  exit 0
fi
[ -z "$current" ] || fail "Existing core.hooksPath=$current. Preserve it and integrate manually."
hooks=$(git rev-parse --git-path hooks)
for hook in "$hooks"/*; do
  [ -f "$hook" ] || continue
  case "$hook" in *.sample) continue ;; esac
  [ ! -x "$hook" ] || fail "Existing active hook at $hook. Preserve it and integrate manually."
done
[ -x .githooks/pre-push ] || fail "Missing executable .githooks/pre-push."
git config --local core.hooksPath .githooks
printf '%s\n' 'Configured opt-in repository hooks. Run this installer separately in each clone.'
