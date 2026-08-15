#!/bin/bash
# Claude Code - CLIProxyAPI wrapper (Grok-primary mix)

printf '\033]0;%s\007' 'Claude Code - Grok'
export ANTHROPIC_BASE_URL="http://127.0.0.1:8317"
export ANTHROPIC_AUTH_TOKEN="sk-dummy"
export ANTHROPIC_DEFAULT_FABLE_MODEL="gpt-5.6-sol"
export ANTHROPIC_DEFAULT_OPUS_MODEL="grok-4.5"
export ANTHROPIC_DEFAULT_SONNET_MODEL="glm-5.2"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="glm-5.2"
export ANTHROPIC_CUSTOM_MODEL_OPTION="gpt-5.6-terra"
export ANTHROPIC_CUSTOM_MODEL_OPTION_NAME="GPT-5.6 Terra"
export ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION="OpenAI Codex model through CLIProxyAPI"
export CLAUDE_CODE_ALWAYS_ENABLE_EFFORT=1
export CLAUDE_CODE_MAX_CONTEXT_TOKENS=340000
export CLAUDE_CODE_AUTO_COMPACT_WINDOW=300000
export CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY=3
# export ENABLE_TOOL_SEARCH=false

claude --dangerously-skip-permissions --model opus "$@"
