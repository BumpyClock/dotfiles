#!/bin/sh
set -eu

exec /usr/bin/env python3 \
  "$HOME/Projects/dotfiles/agent-hooks/block_destructive_commands.py" \
  --format claude
