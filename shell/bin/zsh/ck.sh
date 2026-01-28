#!/bin/bash
# ABOUTME: Claude Code - Kimi wrapper template
# ABOUTME: This file is a template - link-dotfiles.sh generates the actual script with API key

printf '\033]0;%s\007' 'Claude Code - Kimi'
export ANTHROPIC_AUTH_TOKEN="__KIMI_AUTH_TOKEN__"
export ANTHROPIC_BASE_URL="__KIMI_BASE_URL__"
export API_TIMEOUT_MS="3000000"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="__KIMI_MODEL__"
export ANTHROPIC_DEFAULT_SONNET_MODEL="__KIMI_MODEL__"
export ANTHROPIC_DEFAULT_OPUS_MODEL="__KIMI_MODEL__"
export ENABLE_LSP_TOOL=1

claude --dangerously-skip-permissions "$@"
