#!/bin/bash
# Claude Code - local inference gateway wrapper

printf '\033]0;%s\007' 'Claude Code - Gateway'
export ANTHROPIC_BASE_URL="http://127.0.0.1:8317"
export ANTHROPIC_AUTH_TOKEN="sk-dummy"
export ANTHROPIC_DEFAULT_FABLE_MODEL="gpt-5.6-sol"
export ANTHROPIC_DEFAULT_OPUS_MODEL="gpt-5.6-terra"
export ANTHROPIC_DEFAULT_SONNET_MODEL="gpt-5.6-luna"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="gpt-5.6-luna"
export ANTHROPIC_CUSTOM_MODEL_OPTION="glm-5.2"
export ANTHROPIC_CUSTOM_MODEL_OPTION_NAME="GLM-5.2 (Z.ai)"
export ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION="GLM Coding Plan through CLIProxyAPI"
export CLAUDE_CODE_ALWAYS_ENABLE_EFFORT=1
export CLAUDE_CODE_MAX_CONTEXT_TOKENS=340000
export CLAUDE_CODE_AUTO_COMPACT_WINDOW=300000
export CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY=3
# export ENABLE_TOOL_SEARCH=false

claude --dangerously-skip-permissions --model fable "$@"
