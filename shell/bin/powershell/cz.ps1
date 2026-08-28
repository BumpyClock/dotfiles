# ABOUTME: Claude Code - Z.AI wrapper template
# ABOUTME: link-dotfiles.ts fills __ZAI_API_KEY__ from secrets/api-keys/env.json

$Host.UI.RawUI.WindowTitle = "Claude Code - Zai"
$env:ANTHROPIC_AUTH_TOKEN = "__ZAI_API_KEY__"
$env:ANTHROPIC_BASE_URL = "https://api.z.ai/api/anthropic"
$env:API_TIMEOUT_MS = "3000000"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "glm-5.3-flash"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "glm-5.3-flash"
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "glm-5.3"
$env:ENABLE_LSP_TOOL = "1"

claude --dangerously-skip-permissions @args
