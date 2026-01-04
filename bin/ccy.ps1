# Claude Code - standard wrapper
# Launches Claude with default settings (unset Z.AI variables)

$Host.UI.RawUI.WindowTitle = "Claude Code"
Remove-Item Env:ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue
Remove-Item Env:ANTHROPIC_BASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:API_TIMEOUT_MS -ErrorAction SilentlyContinue
Remove-Item Env:ANTHROPIC_DEFAULT_HAIKU_MODEL -ErrorAction SilentlyContinue
Remove-Item Env:ANTHROPIC_DEFAULT_SONNET_MODEL -ErrorAction SilentlyContinue
Remove-Item Env:ANTHROPIC_DEFAULT_OPUS_MODEL -ErrorAction SilentlyContinue
$env:ENABLE_LSP_TOOL = "1"

claude --dangerously-skip-permissions @args
