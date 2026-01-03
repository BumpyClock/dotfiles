#!/bin/bash
# Claude Code - Z.AI wrapper
# Launches Claude with Z.AI API settings

printf '\033]0;%s\007' 'Claude Code - Zai'
export ANTHROPIC_AUTH_TOKEN="6263383b95054e69b6dc3542f62f9fb1.oBmzf2yqXBGYPrjU"
export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
export API_TIMEOUT_MS="3000000"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="glm-4.7"
export ANTHROPIC_DEFAULT_SONNET_MODEL="glm-4.7"
export ANTHROPIC_DEFAULT_OPUS_MODEL="glm-4.7"
export ENABLE_LSP_TOOL=1

claude --dangerously-skip-permissions "$@"
