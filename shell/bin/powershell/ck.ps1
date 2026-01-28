# ABOUTME: Claude Code - Kimi wrapper template
# ABOUTME: This file is a template - link-dotfiles.ps1 generates the actual script with API key

$Host.UI.RawUI.WindowTitle = "Claude Code - Kimi"
$env:ANTHROPIC_AUTH_TOKEN = "__KIMI_AUTH_TOKEN__"
$env:ANTHROPIC_BASE_URL = "__KIMI_BASE_URL__"
$env:API_TIMEOUT_MS = "3000000"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "__KIMI_MODEL__"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "__KIMI_MODEL__"
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "__KIMI_MODEL__"
$env:ENABLE_LSP_TOOL = "1"

claude --dangerously-skip-permissions @args
