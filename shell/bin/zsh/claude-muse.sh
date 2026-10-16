#!/bin/bash
# Claude Code - CLIProxyAPI wrapper (Muse-primary mix)

printf '\033]0;%s\007' 'Claude Code - Muse'
export ANTHROPIC_BASE_URL="http://127.0.0.1:8317"
export ANTHROPIC_AUTH_TOKEN="sk-dummy"
export ANTHROPIC_DEFAULT_FABLE_MODEL="muse-wonder-full-1.0"
export ANTHROPIC_DEFAULT_OPUS_MODEL="muse-wonder-full-1.0"
export ANTHROPIC_DEFAULT_SONNET_MODEL="muse-wonder-1.0"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="muse-wonder-1.0"
export CLAUDE_CODE_ALWAYS_ENABLE_EFFORT=1
export CLAUDE_CODE_MAX_CONTEXT_TOKENS=400000
export CLAUDE_CODE_AUTO_COMPACT_WINDOW=350000
export CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY=3
# export ENABLE_TOOL_SEARCH=false

claude --dangerously-skip-permissions --model opus "$@"
