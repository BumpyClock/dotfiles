#!/bin/bash
# ABOUTME: Claude Code - Z.AI wrapper template
# ABOUTME: This file is a template - scripts/link-dotfiles/setup-dotfiles.ts generates the actual script with API key

printf '\033]0;%s\007' 'Claude Code - Zai'
export ANTHROPIC_AUTH_TOKEN="__ANTHROPIC_AUTH_TOKEN__"
export ANTHROPIC_BASE_URL="__ANTHROPIC_BASE_URL__"
export API_TIMEOUT_MS="__API_TIMEOUT_MS__"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="__ANTHROPIC_DEFAULT_HAIKU_MODEL__"
export ANTHROPIC_DEFAULT_SONNET_MODEL="__ANTHROPIC_DEFAULT_SONNET_MODEL__"
export ANTHROPIC_DEFAULT_OPUS_MODEL="__ANTHROPIC_DEFAULT_OPUS_MODEL__"
export ENABLE_LSP_TOOL=1

claude --dangerously-skip-permissions "$@"
