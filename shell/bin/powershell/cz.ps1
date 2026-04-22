# ABOUTME: Claude Code - Z.AI wrapper template
# ABOUTME: This file is a template - scripts/link-dotfiles/setup-dotfiles.ts generates the actual script with API key

$Host.UI.RawUI.WindowTitle = "Claude Code - Zai"
$env:ANTHROPIC_AUTH_TOKEN = "__ANTHROPIC_AUTH_TOKEN__"
$env:ANTHROPIC_BASE_URL = "__ANTHROPIC_BASE_URL__"
$env:API_TIMEOUT_MS = "__API_TIMEOUT_MS__"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "__ANTHROPIC_DEFAULT_HAIKU_MODEL__"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "__ANTHROPIC_DEFAULT_SONNET_MODEL__"
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "__ANTHROPIC_DEFAULT_OPUS_MODEL__"
$env:ENABLE_LSP_TOOL = "1"

claude --dangerously-skip-permissions @args
