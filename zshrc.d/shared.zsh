# ABOUTME: Shared zsh configuration appended into ~/.zshrc via sync-zshrc.sh.
# ABOUTME: Contains cross-platform plugins, paths, aliases, and helper functions.
# =============================================================================
# OPTIMIZED ZSH CONFIGURATION - Fast & Lean
# =============================================================================

# Oh My Zsh Setup (minimal)
export ZSH="$HOME/.oh-my-zsh"

# Load only essential, fast plugins
# Removed: zsh-autocomplete (slow), zsh-syntax-highlighting (duplicate)
plugins=(
    zsh-autosuggestions
    fast-syntax-highlighting
)

source $ZSH/oh-my-zsh.sh

# =============================================================================
# PATH CONFIGURATION (optimized - no subshells)
# =============================================================================

# Static PATH additions (no dynamic evaluations)
eval "$(fnm env --use-on-cd --shell zsh)"

export PATH="$HOME/.local/bin:$PATH"
export PATH="$HOME/.local/share/fnm:$PATH"
export PATH="/usr/local/go/bin:$PATH"
export PATH="$HOME/go/bin:$PATH"  # Static instead of $(go env GOPATH)
export PATH="$HOME/.cargo/bin:$PATH"
export PATH="$HOME/.bun/bin:$PATH"
export PATH="$HOME/.lmstudio/bin:$PATH"
export PATH="$HOME/.opencode/bin:$PATH"

# =============================================================================
# LAZY LOADING FOR HEAVY TOOLS
# =============================================================================

# Ensure Node (fnm) is initialized early so tools like pnpm work at login
if [ -x "$HOME/.local/share/fnm/fnm" ]; then
  eval "$("$HOME/.local/share/fnm/fnm" env --use-on-cd)"
fi

# Lazy load conda (only when needed)
conda() {
    unfunction conda
    if [ -f "$HOME/miniconda3/etc/profile.d/conda.sh" ]; then
        . "$HOME/miniconda3/etc/profile.d/conda.sh"
    else
        export PATH="$HOME/miniconda3/bin:$PATH"
    fi
    conda "$@"
}

# =============================================================================
# ALIASES (Performance optimized)
# =============================================================================

# Fast eza aliases (without heavy icons initially)
alias ls='eza --group-directories-first'
alias ll='eza -l --all --group-directories-first'
alias la='eza -la --group-directories-first'
alias lt='eza --tree --git-ignore'

# Git shortcuts (basic, fast)
# alias gs='git status'
# alias gp='git push'
# alias gpl='git pull'
# alias gb='git branch'
# alias gco='git checkout'

# # Simple function aliases
# ga() { if [ $# -eq 0 ]; then git add .; else git add "$@"; fi }
# gc() { git commit -m "$1" }
# gcom() { git add . && git commit -m "$1" }
# lazyg() { git add . && git commit -m "$1" && git push }

# Claude
alias claude-yolo='claude --dangerously-skip-permissions'
claude-monitor() { command claude-monitor --plan max20 "$@" }
alias cmon='claude-monitor'

# Z.AI Claude function
claude-zai() {
    printf '\033]0;%s\007' 'Claude Code - Zai'
    export ANTHROPIC_AUTH_TOKEN="6263383b95054e69b6dc3542f62f9fb1.oBmzf2yqXBGYPrjU"
    export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
    export API_TIMEOUT_MS="3000000"
    export ANTHROPIC_DEFAULT_HAIKU_MODEL="glm-4.7"
    export ANTHROPIC_DEFAULT_SONNET_MODEL="glm-4.7"
    export ANTHROPIC_DEFAULT_OPUS_MODEL="glm-4.7"
    claude "$@"
}

alias cz='claude-zai'

ccy() {
    printf '\033]0;%s\007' 'Claude Code'
    unset ANTHROPIC_AUTH_TOKEN
    unset ANTHROPIC_BASE_URL
    unset API_TIMEOUT_MS
    unset ANTHROPIC_DEFAULT_HAIKU_MODEL
    unset ANTHROPIC_DEFAULT_SONNET_MODEL
    unset ANTHROPIC_DEFAULT_OPUS_MODEL
    claude --dangerously-skip-permissions "$@"
}

# =============================================================================
# DEVELOPMENT SHORTCUTS (essentials only)
# =============================================================================



eval "$(starship init zsh)"
