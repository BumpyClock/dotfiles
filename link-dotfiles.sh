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

# Function to initialize git submodules
initialize_submodules() {
    print_status "Initializing git submodules..."
    
    pushd "$DOTFILES_DIR" > /dev/null
    git submodule update --init --recursive 2>/dev/null || print_warning "Failed to initialize git submodules"
    popd > /dev/null
    
    print_status "Git submodules initialized"
}

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

    if [[ -d "$ai_dir/skills" ]]; then
        create_symlink "$ai_dir/skills" "$HOME/.claude/skills"
        create_symlink "$ai_dir/skills" "$HOME/.codex/skills"
        mkdir -p "$HOME/.config/opencode"
        create_symlink "$ai_dir/skills" "$HOME/.config/opencode/skills"
    fi
}

# Function to link GitHub Copilot configuration
link_copilot_config() {
    print_status "Linking GitHub Copilot configuration..."

    # Create ~/.copilot directory if it doesn't exist
    mkdir -p "$HOME/.copilot"

    local ai_dir="$DOTFILES_DIR/.ai_agents"

    if [[ -d "$ai_dir/prompts" ]]; then
        create_symlink "$ai_dir/prompts" "$HOME/.copilot/prompts"
    fi

    if [[ -f "$ai_dir/AGENTS.md" ]]; then
        create_symlink "$ai_dir/AGENTS.md" "$HOME/.copilot/instructions.md"
    fi

    if [[ -d "$ai_dir/docs" ]]; then
        create_symlink "$ai_dir/docs" "$HOME/.copilot/docs"
    fi

    if [[ -d "$ai_dir/skills" ]]; then
        create_symlink "$ai_dir/skills" "$HOME/.copilot/skills"
    fi
}

# Function to link GitHub configuration
link_github_config() {
    print_status "Linking GitHub configuration..."

    # Create ~/.github directory if it doesn't exist
    mkdir -p "$HOME/.github"

    local github_dir="$DOTFILES_DIR/.github"

    if [[ -f "$github_dir/copilot-instructions.md" ]]; then
        create_symlink "$github_dir/copilot-instructions.md" "$HOME/.github/copilot-instructions.md"
    fi

    if [[ -d "$github_dir/prompts" ]]; then
        create_symlink "$github_dir/prompts" "$HOME/.github/prompts"
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

# Function to install bin scripts to ~/.local/bin (dynamically generated with API keys)
install_bin_scripts() {
    print_status "Installing bin scripts to ~/.local/bin..."

    # Create ~/.local/bin directory if it doesn't exist
    mkdir -p "$HOME/.local/bin"

    # Check for GLM secrets submodule
    local glm_secrets_file="$DOTFILES_DIR/secrets/claude-code/glm/glm.sh"
    local glm_api_key=""

    if [[ -f "$glm_secrets_file" ]]; then
        # Source secrets file to get API key
        print_status "Loading GLM API key from secrets submodule..."
        source "$glm_secrets_file"
        glm_api_key="$ANTHROPIC_AUTH_TOKEN"
    else
        print_warning "GLM secrets not found at: $glm_secrets_file"
        read -p "Do you want to install the cz script anyway? (y/n) " response
        
        if [[ "$response" == "y" || "$response" == "Y" ]]; then
            read -p "Enter your Z.ai GLM API key: " glm_api_key
            if [[ -z "$glm_api_key" ]]; then
                print_warning "No API key provided, skipping cz script generation"
                glm_api_key=""
            fi
        else
            print_status "Skipping cz script generation"
        fi
    fi

    # Generate cz script with GLM API key if available
    if [[ -n "$glm_api_key" ]]; then
        local cz_template="$DOTFILES_DIR/shell/bin/zsh/cz.sh"
        local cz_target="$HOME/.local/bin/cz"
        
        if [[ -f "$cz_template" ]]; then
            rm -f "$cz_target"
            sed "s/__ANTHROPIC_AUTH_TOKEN__/$glm_api_key/g" "$cz_template" > "$cz_target"
            chmod +x "$cz_target"
            print_action "Generated: $cz_target"
        fi
    fi

    # Check for Kimi secrets submodule
    local kimi_secrets_file="$DOTFILES_DIR/secrets/claude-code/kimi/kimi.sh"
    local kimi_api_key=""
    local kimi_base_url=""
    local kimi_model=""

    if [[ -f "$kimi_secrets_file" ]]; then
        # Source secrets file to get Kimi config
        print_status "Loading Kimi API key from secrets submodule..."
        source "$kimi_secrets_file"
        kimi_api_key="$ANTHROPIC_AUTH_TOKEN"
        kimi_base_url="$ANTHROPIC_BASE_URL"
        kimi_model="$ANTHROPIC_DEFAULT_SONNET_MODEL"
    else
        print_warning "Kimi secrets not found at: $kimi_secrets_file"
        print_status "Skipping ck script generation (configure kimi.sh first)"
    fi

    # Generate ck script with Kimi config if available and not placeholder
    if [[ -n "$kimi_api_key" && "$kimi_api_key" != "__KIMI_AUTH_TOKEN__" ]]; then
        local ck_template="$DOTFILES_DIR/shell/bin/zsh/ck.sh"
        local ck_target="$HOME/.local/bin/ck"
        
        if [[ -f "$ck_template" ]]; then
            rm -f "$ck_target"
            sed -e "s|__KIMI_AUTH_TOKEN__|$kimi_api_key|g" \
                -e "s|__KIMI_BASE_URL__|$kimi_base_url|g" \
                -e "s|__KIMI_MODEL__|$kimi_model|g" \
                "$ck_template" > "$ck_target"
            chmod +x "$ck_target"
            print_action "Generated: $ck_target"
        fi
    else
        print_warning "Kimi not configured (placeholders detected), skipping ck script generation"
    fi

    # Copy ccy script directly (no secrets needed)
    local ccy_source="$DOTFILES_DIR/shell/bin/zsh/ccy.sh"
    local ccy_target="$HOME/.local/bin/ccy"
    
    if [[ -f "$ccy_source" ]]; then
        rm -f "$ccy_target"
        cp "$ccy_source" "$ccy_target"
        chmod +x "$ccy_target"
        print_action "Copied: $ccy_target"
    fi
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

    # Check OpenCode config
    if [[ -L "$HOME/.config/opencode/skill" ]]; then
        echo -e "\n  ${GREEN}OpenCode configuration:${NC}"
        echo -e "  ${BLUE}skill${NC} → $(readlink "$HOME/.config/opencode/skill")"
    fi

    # Check Copilot config
    if [[ -d "$HOME/.copilot" ]]; then
        local copilot_links=$(find "$HOME/.copilot" -maxdepth 1 -type l 2>/dev/null)
        if [[ -n "$copilot_links" ]]; then
            echo -e "\n  ${GREEN}GitHub Copilot configuration:${NC}"
            find "$HOME/.copilot" -maxdepth 1 -type l -exec bash -c 'echo -e "  ${BLUE}$(basename "{}")${NC} → $(readlink "{}")"' \;
        fi
    fi

    # Check GitHub config
    if [[ -d "$HOME/.github" ]]; then
        local github_links=$(find "$HOME/.github" -maxdepth 1 -type l 2>/dev/null)
        if [[ -n "$github_links" ]]; then
            echo -e "\n  ${GREEN}GitHub configuration:${NC}"
            find "$HOME/.github" -maxdepth 1 -type l -exec bash -c 'echo -e "  ${BLUE}$(basename "{}")${NC} → $(readlink "{}")"' \;
        fi
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
            # Initialize submodules first
            initialize_submodules
            
            print_status "Creating dotfile symlinks..."
            link_dotfiles
            link_claude_config
            link_copilot_config
            link_github_config
            link_config_dirs
            install_bin_scripts
            echo ""
            print_status "✓ All symlinks created successfully!"
            echo ""
            print_status "Run '$0 --show' to see all active symlinks"
            ;;
    esac
}

# Run main function
main "$@"
