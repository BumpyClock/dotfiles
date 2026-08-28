# ABOUTME: Claude Code - Kimi wrapper template
# ABOUTME: link-dotfiles.ts fills __KIMI_API_KEY__ from secrets/api-keys/env.json

$Host.UI.RawUI.WindowTitle = "Claude Code - Kimi"
$env:ANTHROPIC_AUTH_TOKEN = "__KIMI_API_KEY__"
$env:ANTHROPIC_BASE_URL = "https://api.kimi.com/coding/"
$env:API_TIMEOUT_MS = "3000000"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "kimi-for-coding"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "kimi-for-coding"
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "kimi-for-coding"
$env:ENABLE_LSP_TOOL = "1"

claude --dangerously-skip-permissions @args
