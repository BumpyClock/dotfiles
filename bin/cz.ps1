# Claude Code - Z.AI wrapper
# Launches Claude with Z.AI API settings

$Host.UI.RawUI.WindowTitle = "Claude Code - Zai"
$env:ANTHROPIC_AUTH_TOKEN = "REDACTED_API_KEY"
$env:ANTHROPIC_BASE_URL = "https://api.z.ai/api/anthropic"
$env:API_TIMEOUT_MS = "3000000"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "glm-4.7"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "glm-4.7"
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "glm-4.7"
$env:ENABLE_LSP_TOOL = "1"

claude --dangerously-skip-permissions @args
