# Claude Code - CLIProxyAPI wrapper (Muse-primary mix)

$Host.UI.RawUI.WindowTitle = "Claude Code - Muse"
$env:ANTHROPIC_BASE_URL = "http://127.0.0.1:8317"
$env:ANTHROPIC_AUTH_TOKEN = "sk-dummy"
$env:ANTHROPIC_DEFAULT_FABLE_MODEL = "muse-wonder-full-1.0"
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "muse-wonder-full-1.0"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "muse-wonder-1.0"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "muse-wonder-1.0"
$env:CLAUDE_CODE_ALWAYS_ENABLE_EFFORT = "1"
$env:CLAUDE_CODE_MAX_CONTEXT_TOKENS = "400000"
$env:CLAUDE_CODE_AUTO_COMPACT_WINDOW = "350000"
$env:CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY = "3"
# $env:ENABLE_TOOL_SEARCH = "false"

claude --dangerously-skip-permissions --model opus @args
