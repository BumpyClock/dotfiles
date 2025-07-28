# If you come from bash you might have to change your $PATH.
# export PATH=$HOME/bin:$HOME/.local/bin:/usr/local/bin:$PATH

# Path to your Oh My Zsh installation.
export ZSH="$HOME/.oh-my-zsh"

# Set name of the theme to load --- if set to "random", it will
# load a random theme each time Oh My Zsh is loaded, in which case,
# to know which specific one was loaded, run: echo $RANDOM_THEME
# See https://github.com/ohmyzsh/ohmyzsh/wiki/Themes
# Theme disabled - using Starship prompt instead
# ZSH_THEME="powerlevel10k/powerlevel10k"

# Set list of themes to pick from when loading at random
# Setting this variable when ZSH_THEME=random will cause zsh to load
# a theme from this variable instead of looking in $ZSH/themes/
# If set to an empty array, this variable will have no effect.
# ZSH_THEME_RANDOM_CANDIDATES=( "robbyrussell" "agnoster" )

# Uncomment the following line to use case-sensitive completion.
# CASE_SENSITIVE="true"

# Uncomment the following line to use hyphen-insensitive completion.
# Case-sensitive completion must be off. _ and - will be interchangeable.
# HYPHEN_INSENSITIVE="true"

# Uncomment one of the following lines to change the auto-update behavior
# zstyle ':omz:update' mode disabled  # disable automatic updates
# zstyle ':omz:update' mode auto      # update automatically without asking
# zstyle ':omz:update' mode reminder  # just remind me to update when it's time

# Uncomment the following line to change how often to auto-update (in days).
# zstyle ':omz:update' frequency 13

# Uncomment the following line if pasting URLs and other text is messed up.
# DISABLE_MAGIC_FUNCTIONS="true"

# Uncomment the following line to disable colors in ls.
# DISABLE_LS_COLORS="true"

# Uncomment the following line to disable auto-setting terminal title.
# DISABLE_AUTO_TITLE="true"

# Uncomment the following line to enable command auto-correction.
# ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.
# You can also set it to another string to have that shown instead of the default red dots.
# e.g. COMPLETION_WAITING_DOTS="%F{yellow}waiting...%f"
# Caution: this setting can cause issues with multiline prompts in zsh < 5.7.1 (see #5765)
# COMPLETION_WAITING_DOTS="true"

# Uncomment the following line if you want to disable marking untracked files
# under VCS as dirty. This makes repository status check for large repositories
# much, much faster.
# DISABLE_UNTRACKED_FILES_DIRTY="true"

# Uncomment the following line if you want to change the command execution time
# stamp shown in the history command output.
# You can set one of the optional three formats:
# "mm/dd/yyyy"|"dd.mm.yyyy"|"yyyy-mm-dd"
# or set a custom format using the strftime function format specifications,
# see 'man strftime' for details.
# HIST_STAMPS="mm/dd/yyyy"

# Would you like to use another custom folder than $ZSH/custom?
# ZSH_CUSTOM=/path/to/new-custom-folder

# Which plugins would you like to load?
# Standard plugins can be found in $ZSH/plugins/
# Custom plugins may be added to $ZSH_CUSTOM/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(zsh-autosuggestions zsh-syntax-highlighting fast-syntax-highlighting zsh-autocomplete)

source $ZSH/oh-my-zsh.sh

# User configuration

# export MANPATH="/usr/local/man:$MANPATH"

# You may need to manually set your language environment
# export LANG=en_US.UTF-8

# Preferred editor for local and remote sessions
# if [[ -n $SSH_CONNECTION ]]; then
#   export EDITOR='vim'
# else
#   export EDITOR='nvim'
# fi

# Compilation flags
# export ARCHFLAGS="-arch $(uname -m)"

# Set personal aliases, overriding those provided by Oh My Zsh libs,
# plugins, and themes. Aliases can be placed here, though Oh My Zsh
# users are encouraged to define aliases within a top-level file in
# the $ZSH_CUSTOM folder, with .zsh extension. Examples:
# - $ZSH_CUSTOM/aliases.zsh
# - $ZSH_CUSTOM/macos.zsh
# For a full list of active aliases, run `alias`.
#
# Example aliases
# alias zshconfig="mate ~/.zshrc"
# alias ohmyzsh="mate ~/.oh-my-zsh"
# Load syntax highlighting and fast highlighting


# eza aliases
alias ls='eza --long --group-directories-first'
alias ll='eza -l --all --group-directories-first'
alias la='eza -la --group-directories-first'


# fnm
FNM_PATH="$HOME/.local/share/fnm"
if [ -d "$FNM_PATH" ]; then
  export PATH="$FNM_PATH:$PATH"
  eval "`fnm env`"
fi

# pnpm
export PNPM_HOME="$HOME/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end


# >>> conda initialize >>>
# !! Contents within this block are managed by 'conda init' !!
if [ -f "$HOME/miniconda3/bin/conda" ]; then
    __conda_setup="$('$HOME/miniconda3/bin/conda' 'shell.zsh' 'hook' 2> /dev/null)"
    if [ $? -eq 0 ]; then
        eval "$__conda_setup"
    else
        if [ -f "$HOME/miniconda3/etc/profile.d/conda.sh" ]; then
            . "$HOME/miniconda3/etc/profile.d/conda.sh"
        else
            export PATH="$HOME/miniconda3/bin:$PATH"
        fi
    fi
    unset __conda_setup
fi
# <<< conda initialize <<<

export PATH=$PATH:/usr/local/go/bin
export PATH=$PATH:$GOROOT/bin:$GOPATH/bin
export PATH=$PATH:$(go env GOPATH)/bin 

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Profile Management
edit-profile() { code ~/.zshrc }
reload-profile() { source ~/.zshrc }

# System utilities
get-pubip() { curl -s http://ifconfig.me/ip }
uptime() { uptime }

# File operations
mkcd() { mkdir -p "$1" && cd "$1" }

# =============================================================================
# PNPM & WEB DEVELOPMENT SHORTCUTS
# =============================================================================

# Package manager aliases
alias pn='pnpm'
alias pnx='pnpm dlx'

# Development workflow shortcuts (pnpm-focused)
dev() { pnpm dev }
build() { pnpm build }
preview() { pnpm preview }
test() { pnpm test }
lint() { pnpm lint }
format() { pnpm format }

# Package management shortcuts
pi() { pnpm install "$@" }
pid() { pnpm install --save-dev "$@" }
pu() { if [ $# -eq 0 ]; then pnpm update; else pnpm update "$@"; fi }
pr() { pnpm remove "$@" }

# Project shortcuts
clean-deps() { rm -rf node_modules && pnpm install }
fresh-start() { rm -rf node_modules pnpm-lock.yaml && pnpm install }

# =============================================================================
# GIT & GITHUB CLI SHORTCUTS
# =============================================================================

# GitHub CLI auto-install check (inform user if missing)
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI not found. Install with your package manager."
fi

# Basic Git shortcuts
alias gs='git status'
ga() { if [ $# -eq 0 ]; then git add .; else git add "$@"; fi }
gc() { git commit -m "$1" }
alias gp='git push'
alias gpl='git pull'
alias gb='git branch'
alias gco='git checkout'
gcom() { git add . && git commit -m "$1" }
lazyg() { git add . && git commit -m "$1" && git push }

# GitHub CLI shortcuts (if available)
if command -v gh &> /dev/null; then
    repo-view() { gh repo view --web }
    repo-clone() { gh repo clone "$1" }
    repo-create() { gh repo create "$1" --public }
    repo-fork() { gh repo fork --clone }
    
    # Issues
    issues() { gh issue list }
    issue-view() { gh issue view "$1" }
    issue-create() { gh issue create --title "$1" --body "$2" }
    issue-close() { gh issue close "$1" }
    
    # Pull Requests
    prs() { gh pr list }
    pr-view() { if [ $# -eq 0 ]; then gh pr view; else gh pr view "$1"; fi }
    pr-create() { gh pr create }
    pr-checkout() { gh pr checkout "$1" }
    pr-merge() { if [ $# -eq 0 ]; then gh pr merge; else gh pr merge "$1"; fi }
    pr-diff() { if [ $# -eq 0 ]; then gh pr diff; else gh pr diff "$1"; fi }
    
    # Releases
    releases() { gh release list }
    release-view() { gh release view "$1" }
    release-create() { gh release create "$1" }
    
    # Workflow shortcuts
    workflows() { gh workflow list }
    workflow-run() { gh workflow run "$1" }
    runs() { gh run list }
    run-view() { gh run view "$1" }
fi

# =============================================================================
# DEVELOPMENT TOOLS
# =============================================================================

# VS Code shortcuts
code-here() { code . }
code-diff() { code --diff "$1" "$2" }

# Docker shortcuts
docker-clean() { docker system prune -f }
docker-logs() { docker logs -f "$1" }

# Navigation shortcuts
docs() { cd ~/Documents }
desktop() { cd ~/Desktop }
downloads() { cd ~/Downloads }

# =============================================================================
# EXISTING ALIASES & ENHANCED
# =============================================================================

# Enhanced eza aliases (matching PowerShell)
alias ls='eza --long --group-directories-first --icons'
alias ll='eza -l --all --group-directories-first --icons'
alias la='eza -la --group-directories-first --icons'
alias lt='eza --tree --git-ignore --icons'

# Task Master aliases
alias tm='task-master'
alias taskmaster='task-master'

# Claude integration
alias claude-yolo='claude --dangerously-skip-permissions'
alias cy='claude-yolo'
claude-monitor() { command claude-monitor --plan max20 "$@" }
alias cmon='claude-monitor'
# Starship prompt
eval "$(starship init zsh)"


[ -f "$HOME/.cargo/env" ] && . "$HOME/.cargo/env"
# bun completions
[ -s "$HOME/.bun/_bun" ] && source "$HOME/.bun/_bun"

# bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Task Master aliases added on 7/3/2025
alias tm='task-master'
alias taskmaster='task-master'

# . "$HOME/.local/bin/env"
# source $HOME/.local/bin/env

# Added by LM Studio CLI (lms)
export PATH="$PATH:/Users/adityasharma/.lmstudio/bin"
# End of LM Studio CLI section

