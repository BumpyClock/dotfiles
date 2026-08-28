#!/bin/bash
# ABOUTME: Claude Code - Kimi wrapper template
# ABOUTME: link-dotfiles.ts fills __KIMI_API_KEY__ from secrets/api-keys/env.json

printf '\033]0;%s\007' 'Claude Code - Kimi'
export ANTHROPIC_AUTH_TOKEN="__KIMI_API_KEY__"
export ANTHROPIC_BASE_URL="https://api.kimi.com/coding/"
export API_TIMEOUT_MS="3000000"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="kimi-for-coding"
export ANTHROPIC_DEFAULT_SONNET_MODEL="kimi-for-coding"
export ANTHROPIC_DEFAULT_OPUS_MODEL="kimi-for-coding"
export ENABLE_LSP_TOOL=1

claude --dangerously-skip-permissions "$@"
