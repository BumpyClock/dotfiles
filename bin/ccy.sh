#!/bin/bash
# Claude Code - standard wrapper
# Launches Claude with default settings (unset Z.AI variables)

printf '\033]0;%s\007' 'Claude Code'
unset ANTHROPIC_AUTH_TOKEN
unset ANTHROPIC_BASE_URL
unset API_TIMEOUT_MS
unset ANTHROPIC_DEFAULT_HAIKU_MODEL
unset ANTHROPIC_DEFAULT_SONNET_MODEL
unset ANTHROPIC_DEFAULT_OPUS_MODEL
export ENABLE_LSP_TOOL=1
claude --dangerously-skip-permissions "$@"
