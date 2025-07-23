#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == darwin* ]]; then
        echo "macos"
    elif [ -f /etc/arch-release ]; then
        echo "arch"
    elif [ -f /etc/lsb-release ] || [ -f /etc/debian_version ]; then
        echo "ubuntu"
    else
        echo "unknown"
    fi
}

OS=$(detect_os)
print_status "Detected OS: $OS"

# Install package manager dependencies
install_base_packages() {
    case $OS in
        macos)
            # Install Homebrew if not installed
            if ! command -v brew &> /dev/null; then
                print_status "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            print_status "Updating Homebrew..."
            brew update
            ;;
        arch)
            print_status "Updating pacman..."
            sudo pacman -Syu --noconfirm
            ;;
        ubuntu)
            print_status "Updating apt..."
            sudo apt update
            ;;
    esac
}

# Install zsh
install_zsh() {
    if command -v zsh &> /dev/null; then
        print_status "zsh is already installed"
    else
        print_status "Installing zsh..."
        case $OS in
            macos)
                brew install zsh
                ;;
            arch)
                sudo pacman -S --noconfirm zsh
                ;;
            ubuntu)
                sudo apt install -y zsh
                ;;
        esac
    fi
}

# Install oh-my-zsh
install_oh_my_zsh() {
    if [ -d "$HOME/.oh-my-zsh" ]; then
        print_status "oh-my-zsh is already installed"
    else
        print_status "Installing oh-my-zsh..."
        sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
    fi
}

# Install zsh plugins
install_zsh_plugins() {
    ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"
    # zsh-autosuggestions
    if [ -d "$ZSH_CUSTOM/plugins/zsh-autosuggestions" ]; then
        print_status "zsh-autosuggestions is already installed"
    else
        print_status "Installing zsh-autosuggestions..."
        git clone https://github.com/zsh-users/zsh-autosuggestions "$ZSH_CUSTOM/plugins/zsh-autosuggestions"
    fi
    # zsh-syntax-highlighting
    if [ -d "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting" ]; then
        print_status "zsh-syntax-highlighting is already installed"
    else
        print_status "Installing zsh-syntax-highlighting..."
        git clone https://github.com/zsh-users/zsh-syntax-highlighting.git "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting"
    fi
    # fast-syntax-highlighting
    if [ -d "$ZSH_CUSTOM/plugins/fast-syntax-highlighting" ]; then
        print_status "fast-syntax-highlighting is already installed"
    else
        print_status "Installing fast-syntax-highlighting..."
        git clone https://github.com/zdharma-continuum/fast-syntax-highlighting.git "$ZSH_CUSTOM/plugins/fast-syntax-highlighting"
    fi
    # zsh-autocomplete
    if [ -d "$ZSH_CUSTOM/plugins/zsh-autocomplete" ]; then
        print_status "zsh-autocomplete is already installed"
    else
        print_status "Installing zsh-autocomplete..."
        git clone https://github.com/marlonrichert/zsh-autocomplete.git "$ZSH_CUSTOM/plugins/zsh-autocomplete"
    fi
}

# Install eza (modern ls replacement)
install_eza() {
    if command -v eza &> /dev/null; then
        print_status "eza is already installed"
    else
        print_status "Installing eza..."
        case $OS in
            macos)
                brew install eza
                ;;
            arch)
                sudo pacman -S --noconfirm eza
                ;;
            ubuntu)
                # For Ubuntu, we need to use cargo or download from releases
                if command -v cargo &> /dev/null; then
                    cargo install eza
                else
                    print_status "Installing eza via apt..."
                    sudo apt install -y gpg
                    sudo mkdir -p /etc/apt/keyrings
                    wget -qO- https://raw.githubusercontent.com/eza-community/eza/main/deb.asc | sudo gpg --dearmor -o /etc/apt/keyrings/gierens.gpg
                    echo "deb [signed-by=/etc/apt/keyrings/gierens.gpg] http://deb.gierens.de stable main" | sudo tee /etc/apt/sources.list.d/gierens.list
                    sudo apt update
                    sudo apt install -y eza
                fi
                ;;
        esac
    fi
}

# Install Starship prompt (ensures zsh is installed first)
install_starship() {
    if command -v starship &> /dev/null; then
        print_status "Starship is already installed"
    else
        # Ensure zsh is installed before installing Starship
        if ! command -v zsh &> /dev/null; then
            print_status "zsh is not installed. Installing zsh first..."
            install_zsh
        fi
        print_status "Installing Starship..."
        curl -sS https://starship.rs/install.sh | sh -s -- -y
    fi
}

# Install fnm (Fast Node Manager)
install_fnm() {
    if command -v fnm &> /dev/null; then
        print_status "fnm is already installed"
    else
        print_status "Installing fnm..."
        curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell
    fi
}

# Install pnpm
install_pnpm() {
    if command -v pnpm &> /dev/null; then
        print_status "pnpm is already installed"
    else
        print_status "Installing pnpm..."
        curl -fsSL https://get.pnpm.io/install.sh | sh -
    fi
}

# Install additional useful tools
install_additional_tools() {
    print_status "Installing additional tools..."
    case $OS in
        macos)
            brew install git curl wget ripgrep fd bat fzf
            ;;
        arch)
            sudo pacman -S --noconfirm git curl wget ripgrep fd bat fzf
            ;;
        ubuntu)
            sudo apt install -y git curl wget ripgrep fd-find bat fzf
            # Create symlink for fd on Ubuntu
            if [ -f /usr/bin/fdfind ] && [ ! -f /usr/bin/fd ]; then
                sudo ln -s /usr/bin/fdfind /usr/bin/fd
            fi
            # Create symlink for bat on Ubuntu
            if [ -f /usr/bin/batcat ] && [ ! -f /usr/bin/bat ]; then
                sudo ln -s /usr/bin/batcat /usr/bin/bat
            fi
            ;;
    esac
}

# Create symlinks for dotfiles
create_symlinks() {
    print_status "Creating symlinks for dotfiles..."
    # Detect dotfiles directory (where this script is located)
    DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    print_status "Detected dotfiles directory: $DOTFILES_DIR"
    # Create ~/.claude directory if it doesn't exist
    mkdir -p "$HOME/.claude"
    # Symlink .zshrc
    if [ -f "$HOME/.zshrc" ] && [ ! -L "$HOME/.zshrc" ]; then
        print_warning "Backing up existing .zshrc to .zshrc.backup"
        mv "$HOME/.zshrc" "$HOME/.zshrc.backup"
    fi
    ln -sf "$DOTFILES_DIR/.zshrc" "$HOME/.zshrc"
    # Symlink Claude files if they exist
    if [ -d "$DOTFILES_DIR/.claude" ]; then
        [ -d "$DOTFILES_DIR/.claude/commands" ] && ln -sf "$DOTFILES_DIR/.claude/commands" "$HOME/.claude/commands"
        [ -f "$DOTFILES_DIR/.claude/CLAUDE.md" ] && ln -sf "$DOTFILES_DIR/.claude/CLAUDE.md" "$HOME/.claude/CLAUDE.md"
        [ -d "$DOTFILES_DIR/.claude/agents" ] && ln -sf "$DOTFILES_DIR/.claude/agents" "$HOME/.claude/agents"
        [ -d "$DOTFILES_DIR/.claude/docs" ] && ln -sf "$DOTFILES_DIR/.claude/docs" "$HOME/.claude/docs"
    else
        print_warning "No .claude directory found in dotfiles"
    fi
    print_status "Symlinks created successfully"
}

# Main installation
main() {
    print_status "Starting zsh environment setup..."
    # Check if running as root
    if [ $EUID -eq 0 ]; then
       print_error "This script should not be run as root"
       exit 1
    fi
    # Check OS support
    if [ "$OS" = "unknown" ]; then
        print_error "Unsupported operating system"
        exit 1
    fi
    # Run installations
    install_base_packages
    install_zsh
    install_oh_my_zsh
    install_zsh_plugins
    install_eza
    install_starship
    install_fnm
    install_pnpm
    install_additional_tools
    create_symlinks
    print_status "Installation complete!"
    print_status "Please restart your terminal or run 'source ~/.zshrc' to apply changes"
    # Set zsh as default shell if it isn't already
    if [ "${SHELL#*zsh}" = "$SHELL" ]; then
        print_status "Setting zsh as default shell..."
        chsh -s $(which zsh)
        print_status "Please log out and log back in for the shell change to take effect"
    fi
}

# Run main function
main