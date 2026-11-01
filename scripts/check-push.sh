#!/bin/sh
set -eu
command -v bun >/dev/null 2>&1 || { echo 'Prepare Bun 1.3.14 and frozen dependencies before pushing.' >&2; exit 1; }
exec bun scripts/check-push.cjs "$@"
