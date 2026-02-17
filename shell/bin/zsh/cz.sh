#!/bin/bash
# ABOUTME: Claude Code - Z.AI wrapper template
# ABOUTME: This file is a template - link-dotfiles.sh generates the actual script with API key

printf '\033]0;%s\007' 'Claude Code - Zai'
export ANTHROPIC_AUTH_TOKEN="__ANTHROPIC_AUTH_TOKEN__"
export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
export API_TIMEOUT_MS="3000000"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="glm-5"
export ANTHROPIC_DEFAULT_SONNET_MODEL="glm-5"
export ANTHROPIC_DEFAULT_OPUS_MODEL="glm-5"
export ENABLE_LSP_TOOL=1

claude --dangerously-skip-permissions "$@"
