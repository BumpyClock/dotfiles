#!/bin/bash
# ABOUTME: Claude Code - Z.AI wrapper template
# ABOUTME: link-dotfiles.ts fills __ZAI_API_KEY__ from secrets/api-keys/env.json

printf '\033]0;%s\007' 'Claude Code - Zai'
export ANTHROPIC_AUTH_TOKEN="__ZAI_API_KEY__"
export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
export API_TIMEOUT_MS="3000000"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="glm-5.3-flash"
export ANTHROPIC_DEFAULT_SONNET_MODEL="glm-5.3-flash"
export ANTHROPIC_DEFAULT_OPUS_MODEL="glm-5.3"
export ENABLE_LSP_TOOL=1

claude --dangerously-skip-permissions "$@"
