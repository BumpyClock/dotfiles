# ABOUTME: Shared zsh baseline sourced by the managed dotfiles block in ~/.zshrc.
# ABOUTME: Contains cross-platform plugins, paths, aliases, and helper functions.
# =============================================================================
# OPTIMIZED ZSH CONFIGURATION - Fast & Lean
# =============================================================================

# Resolve repo root from this sourced file instead of assuming ~/Projects/dotfiles.
DOTFILES_ZSH_DIR="$(cd "$(dirname "$0")" && pwd -P)"
DOTFILES_ROOT="$(cd "$DOTFILES_ZSH_DIR/../.." && pwd -P)"

# Oh My Zsh Setup (minimal)
export ZSH="$HOME/.oh-my-zsh"

# Completion paths must be set before Oh My Zsh runs compinit.
if [ -d "$HOME/.docker/completions" ]; then
  fpath=("$HOME/.docker/completions" $fpath)
fi

# Load only essential, fast plugins
# Removed: zsh-autocomplete (slow), zsh-syntax-highlighting (duplicate)
# shellcheck disable=SC2034
plugins=(
    git
    zsh-autosuggestions
    fast-syntax-highlighting
)

if [ -f "$ZSH/oh-my-zsh.sh" ]; then
  source "$ZSH/oh-my-zsh.sh"
fi

# =============================================================================
# PATH CONFIGURATION (optimized - no subshells)
# =============================================================================

path_prepend() {
  [ -n "$1" ] || return
  case ":$PATH:" in
    *":$1:"*) ;;
    *) export PATH="$1:$PATH" ;;
  esac
}

# Static PATH additions before dynamic tool initialization.
path_prepend "$HOME/.local/bin"
path_prepend "$HOME/.local/share/fnm"
path_prepend "/opt/homebrew/bin"
path_prepend "/usr/local/go/bin"
path_prepend "$HOME/go/bin"  # Static instead of $(go env GOPATH)
path_prepend "$HOME/.cargo/bin"
path_prepend "$HOME/.bun/bin"
path_prepend "$HOME/.lmstudio/bin"
path_prepend "$HOME/.opencode/bin"

if [ -z "${PNPM_HOME:-}" ]; then
  case "$(uname -s)" in
    Darwin) export PNPM_HOME="$HOME/Library/pnpm" ;;
    *) export PNPM_HOME="$HOME/.local/share/pnpm" ;;
  esac
fi
path_prepend "$PNPM_HOME"

if command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env --use-on-cd --shell zsh)"
fi

DOTFILES_ENV_SCRIPT="$HOME/.config/dotfiles/env.sh"
if [ -f "$DOTFILES_ENV_SCRIPT" ]; then
  source "$DOTFILES_ENV_SCRIPT"
fi

# Z.AI API key from glm secrets
GLM_PS1_FILE="$DOTFILES_ROOT/secrets/claude-code/glm/glm.ps1"
if [ -f "$GLM_PS1_FILE" ]; then
  extracted_zai_api_key=$(awk -F '"' '/ANTHROPIC_AUTH_TOKEN/ { print $2; exit }' "$GLM_PS1_FILE")
  if [ -n "$extracted_zai_api_key" ]; then
    export ZAI_API_KEY="$extracted_zai_api_key"
  fi
  unset extracted_zai_api_key
fi
unset GLM_PS1_FILE DOTFILES_ENV_SCRIPT
# =============================================================================
# LAZY LOADING FOR HEAVY TOOLS
# =============================================================================

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
if command -v eza >/dev/null 2>&1; then
  alias ls='eza --group-directories-first'
  alias ll='eza -l --all --group-directories-first'
  alias la='eza -la --group-directories-first'
  alias lt='eza --tree --git-ignore'
fi

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
claude-monitor() {
  command claude-monitor --plan max20 "$@"
}
alias cmon='claude-monitor'

# Note: cz and ccy are generated/synced into ~/.local/bin by:
# bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup both

# =============================================================================
# DEVELOPMENT SHORTCUTS (essentials only)
# =============================================================================

if command -v starship >/dev/null 2>&1; then
  eval "$(starship init zsh)"
fi

# =============================================================================
# FZF (fuzzy finder) SETUP
# =============================================================================

# Set up fzf key bindings and fuzzy completion when ZLE is active.
if [[ -o zle ]] && command -v fzf >/dev/null 2>&1; then
  source <(fzf --zsh) 2>/dev/null
fi

unset -f path_prepend
unset DOTFILES_ZSH_DIR DOTFILES_ROOT
