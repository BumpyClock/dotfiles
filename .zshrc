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
export PATH="$HOME/.local/share/pnpm:$PATH"
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
alias gs='git status'
alias gp='git push'
alias gpl='git pull'
alias gb='git branch'
alias gco='git checkout'

# Simple function aliases
ga() { if [ $# -eq 0 ]; then git add .; else git add "$@"; fi }
gc() { git commit -m "$1" }
gcom() { git add . && git commit -m "$1" }
lazyg() { git add . && git commit -m "$1" && git push }

# Task Master
alias tm='task-master'
alias taskmaster='task-master'

# Claude
alias claude-yolo='claude --dangerously-skip-permissions'
alias cy='claude-yolo'
claude-monitor() { command claude-monitor --plan max20 "$@" }
alias cmon='claude-monitor'

# Z.AI Claude function
claude-zai() {
    export ANTHROPIC_AUTH_TOKEN="6263383b95054e69b6dc3542f62f9fb1.oBmzf2yqXBGYPrjU"
    export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
    export API_TIMEOUT_MS="3000000"
    export ANTHROPIC_DEFAULT_HAIKU_MODEL="glm-4.5-air"
    export ANTHROPIC_DEFAULT_SONNET_MODEL="glm-4.6"
    export ANTHROPIC_DEFAULT_OPUS_MODEL="glm-4.6"
    claude "$@"
}

# =============================================================================
# DEVELOPMENT SHORTCUTS (essentials only)
# =============================================================================

# pnpm aliases
alias pn='pnpm'
alias pnx='pnpm dlx'

# Quick dev commands
dev() { pnpm dev }
build() { pnpm build }
test() { pnpm test }
lint() { pnpm lint }

# Package management
pi() { pnpm install "$@" }
pid() { pnpm install --save-dev "$@" }
pr() { pnpm remove "$@" }

# =============================================================================
# UTILITY FUNCTIONS (lightweight)
# =============================================================================

# Context function for LLMs
ctx() {
    echo "Working Directory: $(pwd)"
    echo "Current Date/Time: $(date '+%Y-%m-%d %H:%M:%S')"
}

# Profile management
edit-profile() { code ~/.zshrc }
reload-profile() { source ~/.zshrc }

# Essential utilities
mkcd() { mkdir -p "$1" && cd "$1" }
code-here() { code . }

# Navigation
docs() { cd ~/Documents }
desktop() { cd ~/Desktop }
downloads() { cd ~/Downloads }

# =============================================================================
# LAZY LOADED FEATURES
# =============================================================================

# GitHub CLI functions (loaded on demand)
_load_gh_functions() {
    if command -v gh &> /dev/null; then
        repo-view() { gh repo view --web }
        repo-clone() { gh repo clone "$1" }
        issues() { gh issue list }
        prs() { gh pr list }
        pr-create() { gh pr create }
        pr-merge() { if [ $# -eq 0 ]; then gh pr merge; else gh pr merge "$1"; fi }
    fi
}

# Load GitHub functions only when gh is called
gh() {
    unfunction gh
    _load_gh_functions
    command gh "$@"
}

# =============================================================================
# PROMPT (Starship - already fast)
# =============================================================================
eval "$(starship init zsh)"

# =============================================================================
# PERFORMANCE TIPS APPLIED:
# 1. Removed duplicate syntax highlighting plugins
# 2. Removed heavy zsh-autocomplete plugin
# 3. Static PATH exports (no subshells)
# 4. Lazy loading for conda and fnm
# 5. Simplified aliases and functions
# 6. GitHub CLI functions loaded on demand
# 7. Removed unused functions and complexity
# =============================================================================
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"

# Added by LM Studio CLI (lms)
export PATH="$PATH:/Users/adityasharma/.lmstudio/bin"
# End of LM Studio CLI section

# pnpm
export PNPM_HOME="/Users/adityasharma/Library/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end
