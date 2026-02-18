# ABOUTME: Claude Code - Z.AI wrapper template
# ABOUTME: This file is a template - link-dotfiles.ps1 generates the actual script with API key

$Host.UI.RawUI.WindowTitle = "Claude Code - Zai"
$env:ANTHROPIC_AUTH_TOKEN = "__ANTHROPIC_AUTH_TOKEN__"
$env:ANTHROPIC_BASE_URL = "https://api.z.ai/api/anthropic"
$env:API_TIMEOUT_MS = "3000000"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "glm-5"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "glm-5"
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "glm-5"
$env:ENABLE_LSP_TOOL = "1"

claude --dangerously-skip-permissions @args
