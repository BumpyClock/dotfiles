#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_action() {
    echo -e "${BLUE}[ACTION]${NC} $1"
}

# Detect dotfiles directory (where this script is located)
DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to create a symlink with backup
create_symlink() {
    local source="$1"
    local target="$2"
    local target_dir="$(dirname "$target")"
    mkdir -p "$target_dir"
    
    # Check if source exists
    if [[ ! -e "$source" ]]; then
        print_warning "Source does not exist: $source"
        return 1
    fi
    
    # If target is already a symlink pointing to the correct source, skip
    if [[ -L "$target" ]]; then
        local current_target=$(readlink "$target")
        if [[ "$current_target" == "$source" ]]; then
            print_status "Already linked correctly: $source → $target"
            return 0
        else
            print_warning "Removing incorrect symlink: $target → $current_target"
            rm "$target"
        fi
    fi
    
    # If target exists and is not a symlink, back it up
    if [[ -e "$target" ]] && [[ ! -L "$target" ]]; then
        local backup="${target}.backup.$(date +%Y%m%d_%H%M%S)"
        print_warning "Backing up existing file: $target → $backup"
        mv "$target" "$backup"
    fi
    
    # Create the symlink
    ln -sf "$source" "$target"
    print_action "Linked: $source → $target"
}

# Function to link all dotfiles
link_dotfiles() {
    print_status "Dotfiles directory: $DOTFILES_DIR"
    
    # Define dotfiles to link
    # Format: "source:target"
    local dotfiles=(
        ".zshrc:$HOME/.zshrc"
        ".gitconfig:$HOME/.gitconfig"
        ".gitignore_global:$HOME/.gitignore_global"
        ".tmux.conf:$HOME/.tmux.conf"
        ".vimrc:$HOME/.vimrc"
    )
    
    # Link each dotfile
    for entry in "${dotfiles[@]}"; do
        IFS=':' read -r source target <<< "$entry"
        source="$DOTFILES_DIR/$source"
        
        if [[ -e "$source" ]]; then
            create_symlink "$source" "$target"
        fi
    done
}

# Function to link Claude configuration
link_claude_config() {
    print_status "Linking Claude configuration..."
    
    # Create ~/.claude and ~/.codex directories if they don't exist
    mkdir -p "$HOME/.claude"
    mkdir -p "$HOME/.codex"
    
    # Items that remain stored under .claude in the repo
    local claude_items=(
        "agents"
        "settings.json"
    )
    
    for item in "${claude_items[@]}"; do
        local source="$DOTFILES_DIR/.claude/$item"
        local target="$HOME/.claude/$item"
        
        if [[ -e "$source" ]]; then
            create_symlink "$source" "$target"
        fi
    done
    
    local ai_dir="$DOTFILES_DIR/.ai_agents"
    
    if [[ -d "$ai_dir/prompts" ]]; then
        create_symlink "$ai_dir/prompts" "$HOME/.claude/commands"
        create_symlink "$ai_dir/prompts" "$HOME/.codex/prompts"
    fi
    
    if [[ -f "$ai_dir/AGENTS.md" ]]; then
        create_symlink "$ai_dir/AGENTS.md" "$HOME/.claude/CLAUDE.md"
        create_symlink "$ai_dir/AGENTS.md" "$HOME/.codex/AGENTS.md"
    fi
    
    if [[ -d "$ai_dir/docs" ]]; then
        create_symlink "$ai_dir/docs" "$HOME/.claude/docs"
        create_symlink "$ai_dir/docs" "$HOME/.codex/docs"
    fi
}

# Function to link config directories
link_config_dirs() {
    print_status "Linking configuration directories..."
    
    # Create ~/.config directory if it doesn't exist
    mkdir -p "$HOME/.config"
    
    # Config directories to link
    # Format: "source:target"
    local config_dirs=(
        ".config/starship.toml:$HOME/.config/starship.toml"
        ".config/nvim:$HOME/.config/nvim"
        ".config/alacritty:$HOME/.config/alacritty"
        ".config/kitty:$HOME/.config/kitty"
        ".config/wezterm:$HOME/.config/wezterm"
    )
    
    for entry in "${config_dirs[@]}"; do
        IFS=':' read -r source target <<< "$entry"
        source="$DOTFILES_DIR/$source"
        
        if [[ -e "$source" ]]; then
            create_symlink "$source" "$target"
        fi
    done
}

# Function to show current symlinks
show_symlinks() {
    print_status "Current dotfile symlinks:"
    echo ""
    
    # Check common dotfiles
    local files=(
        "$HOME/.zshrc"
        "$HOME/.bashrc"
        "$HOME/.gitconfig"
        "$HOME/.tmux.conf"
        "$HOME/.vimrc"
    )
    
    for file in "${files[@]}"; do
        if [[ -L "$file" ]]; then
            local target=$(readlink "$file")
            echo -e "  ${BLUE}$(basename "$file")${NC} → $target"
        fi
    done
    
    # Check Claude config
    if [[ -d "$HOME/.claude" ]]; then
        echo -e "\n  ${GREEN}Claude configuration:${NC}"
        find "$HOME/.claude" -maxdepth 1 -type l -exec bash -c 'echo -e "  ${BLUE}$(basename "{}")${NC} → $(readlink "{}")"' \;
    fi
    
    # Check .config directory
    if [[ -d "$HOME/.config" ]]; then
        echo -e "\n  ${GREEN}Config directories:${NC}"
        local config_items=("starship.toml" "nvim" "alacritty" "kitty" "wezterm")
        for item in "${config_items[@]}"; do
            if [[ -L "$HOME/.config/$item" ]]; then
                echo -e "  ${BLUE}$item${NC} → $(readlink "$HOME/.config/$item")"
            fi
        done
    fi
}

# Main function
main() {
    case "${1:-}" in
        --show|-s)
            show_symlinks
            ;;
        --help|-h)
            echo "Usage: $0 [OPTION]"
            echo "Create symlinks for dotfiles from $DOTFILES_DIR to home directory"
            echo ""
            echo "Options:"
            echo "  --show, -s    Show current symlinks"
            echo "  --help, -h    Show this help message"
            echo ""
            echo "Without options, creates/updates all symlinks"
            ;;
        *)
            print_status "Creating dotfile symlinks..."
            link_dotfiles
            link_claude_config
            link_config_dirs
            echo ""
            print_status "✓ All symlinks created successfully!"
            echo ""
            print_status "Run '$0 --show' to see all active symlinks"
            ;;
    esac
}

# Run main function
main "$@"