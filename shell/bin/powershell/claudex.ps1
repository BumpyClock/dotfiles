# Claude Code - local inference gateway wrapper

$Host.UI.RawUI.WindowTitle = "Claude Code - Gateway"
$env:ANTHROPIC_BASE_URL = "http://127.0.0.1:8317"
$env:ANTHROPIC_AUTH_TOKEN = "sk-dummy"
$env:ANTHROPIC_DEFAULT_FABLE_MODEL = "gpt-5.6-sol"
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "gpt-5.6-terra"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "gpt-5.6-luna"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "gpt-5.6-luna"
$env:ANTHROPIC_CUSTOM_MODEL_OPTION = "glm-5.2"
$env:ANTHROPIC_CUSTOM_MODEL_OPTION_NAME = "GLM-5.2 (Z.ai)"
$env:ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION = "GLM Coding Plan through CLIProxyAPI"
$env:CLAUDE_CODE_ALWAYS_ENABLE_EFFORT = "1"
$env:CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY = "3"
$env:ENABLE_TOOL_SEARCH = "false"

claude --model opus @args
