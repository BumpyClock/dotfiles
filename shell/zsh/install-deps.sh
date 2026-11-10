#!/bin/bash
# ABOUTME: Installs OS-level dependencies for the zsh environment (packages, plugins, Bun).
# ABOUTME: Does not create symlinks or write config; bootstrap.sh owns invoking the Bun linker.

set -euo pipefail

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
		if ! command -v brew &>/dev/null; then
			print_status "Installing Homebrew..."
			/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
			# Initialize brew in this process so subsequent `brew` calls work
			# without requiring a new shell.
			if [ -x /opt/homebrew/bin/brew ]; then
				eval "$(/opt/homebrew/bin/brew shellenv)"
			elif [ -x /usr/local/bin/brew ]; then
				eval "$(/usr/local/bin/brew shellenv)"
			fi
		fi
		;;
	arch)
		# Never run -Sy alone: partial upgrades break Arch. Databases must be
		# current before any install; user is responsible for running -Syu first.
		print_status "Arch: skipping pacman -Sy (partial-upgrade risk). Run 'sudo pacman -Syu' before this script if databases are stale."
		;;
	esac
}

# Refresh apt metadata only when a missing package needs installing.
APT_UPDATED=false
install_apt_packages() {
	if [ "$APT_UPDATED" = false ]; then
		sudo apt update || return $?
		APT_UPDATED=true
	fi
	sudo apt install -y "$@"
}

# Install zsh
install_zsh() {
	if command -v zsh &>/dev/null; then
		print_status "zsh is already installed"
	else
		print_status "Installing zsh..."
		case $OS in
		macos)
			brew install zsh
			;;
		arch)
			sudo pacman -S --needed --noconfirm zsh
			;;
		ubuntu)
			install_apt_packages zsh
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

# Install zsh plugins actually loaded by shell/zsh/shared.zsh
install_zsh_plugins() {
	ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"
	# zsh-autosuggestions
	if [ -d "$ZSH_CUSTOM/plugins/zsh-autosuggestions" ]; then
		print_status "zsh-autosuggestions is already installed"
	else
		print_status "Installing zsh-autosuggestions..."
		git clone https://github.com/zsh-users/zsh-autosuggestions "$ZSH_CUSTOM/plugins/zsh-autosuggestions"
	fi
	# fast-syntax-highlighting
	if [ -d "$ZSH_CUSTOM/plugins/fast-syntax-highlighting" ]; then
		print_status "fast-syntax-highlighting is already installed"
	else
		print_status "Installing fast-syntax-highlighting..."
		git clone https://github.com/zdharma-continuum/fast-syntax-highlighting.git "$ZSH_CUSTOM/plugins/fast-syntax-highlighting"
	fi
}

# Install eza (modern ls replacement)
install_eza() {
	if command -v eza &>/dev/null; then
		print_status "eza is already installed"
	else
		print_status "Installing eza..."
		case $OS in
		macos)
			brew install eza
			;;
		arch)
			sudo pacman -S --needed --noconfirm eza
			;;
		ubuntu)
			# For Ubuntu, we need to use cargo or download from releases
			if command -v cargo &>/dev/null; then
				cargo install eza
			else
				print_status "Installing eza via apt..."
				if ! command -v gpg &>/dev/null; then
					install_apt_packages gpg || return $?
				fi
				sudo mkdir -p /etc/apt/keyrings
				wget -qO- https://raw.githubusercontent.com/eza-community/eza/main/deb.asc | sudo gpg --dearmor -o /etc/apt/keyrings/gierens.gpg
				echo "deb [signed-by=/etc/apt/keyrings/gierens.gpg] http://deb.gierens.de stable main" | sudo tee /etc/apt/sources.list.d/gierens.list
				sudo apt update
				install_apt_packages eza
			fi
			;;
		esac
	fi
}

# Install Starship prompt (ensures zsh is installed first)
install_starship() {
	if command -v starship &>/dev/null; then
		print_status "Starship is already installed"
	else
		# Ensure zsh is installed before installing Starship
		if ! command -v zsh &>/dev/null; then
			print_status "zsh is not installed. Installing zsh first..."
			install_zsh
		fi
		print_status "Installing Starship..."
		curl -sS https://starship.rs/install.sh | sh -s -- -y
	fi
}

# Install fnm (Fast Node Manager)
install_fnm() {
	local fnm_dir
	if [ -d "$HOME/.fnm" ]; then
		fnm_dir="$HOME/.fnm"
	elif [ -n "${XDG_DATA_HOME:-}" ]; then
		fnm_dir="$XDG_DATA_HOME/fnm"
	elif [ "$OS" = macos ]; then
		fnm_dir="$HOME/Library/Application Support/fnm"
	else
		fnm_dir="$HOME/.local/share/fnm"
	fi
	export PATH="$fnm_dir:$PATH"
	if command -v fnm &>/dev/null; then
		print_status "fnm is already installed"
	else
		print_status "Installing fnm..."
		curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell
	fi
}

# Install pnpm
install_pnpm() {
	# Discover an existing user install even in a fresh, unconfigured shell.
	if [ -z "${PNPM_HOME:-}" ]; then
		case $OS in
		macos) export PNPM_HOME="$HOME/Library/pnpm" ;;
		*) export PNPM_HOME="$HOME/.local/share/pnpm" ;;
		esac
	fi
	export PATH="$PNPM_HOME:$PATH"
	if command -v pnpm &>/dev/null; then
		print_status "pnpm is already installed"
	else
		print_status "Installing pnpm..."
		curl -fsSL https://get.pnpm.io/install.sh | sh -
	fi
}

# Install Bun (required by bootstrap.sh to run the dotfiles linker)
install_bun() {
	export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
	case ":$PATH:" in
	*":$BUN_INSTALL/bin:"*) ;;
	*) export PATH="$BUN_INSTALL/bin:$PATH" ;;
	esac
	if command -v bun &>/dev/null; then
		print_status "bun is already installed"
	else
		print_status "Installing bun..."
		curl -fsSL https://bun.sh/install | bash
	fi
	if ! command -v bun &>/dev/null; then
		print_error "Bun is not available on PATH after install. Check $BUN_INSTALL/bin and re-run."
		exit 1
	fi
}

# Install mcporter (MCP server manager) as a pnpm global
install_mcporter() {
	if command -v mcporter &>/dev/null; then
		print_status "mcporter is already installed"
		return 0
	fi
	if ! command -v pnpm &>/dev/null; then
		print_error "pnpm is required to install mcporter"
		return 1
	fi
	print_status "Installing mcporter..."
	pnpm install --global mcporter
}

# Install ast-grep (code structural search)
install_ast_grep() {
	if command -v ast-grep &>/dev/null; then
		print_status "ast-grep is already installed"
	else
		print_status "Installing ast-grep..."
		case $OS in
		macos)
			brew install ast-grep
			;;
		arch)
			sudo pacman -S --needed --noconfirm ast-grep
			;;
		ubuntu)
			# No native package - try pnpm, npm, then bun (installed earlier in this script)
			if command -v pnpm &>/dev/null; then
				pnpm install --global @ast-grep/cli
			elif command -v npm &>/dev/null; then
				npm install --global @ast-grep/cli
			elif command -v bun &>/dev/null; then
				bun add --global @ast-grep/cli
			else
				print_error "pnpm, npm, or bun required to install ast-grep on Ubuntu"
				return 1
			fi
			;;
		esac
	fi
}

# Install additional useful tools
install_additional_tools() {
	local tool package alias_command
	local missing=()
	for tool in git curl wget unzip rg fd bat fzf; do
		if command -v "$tool" &>/dev/null; then
			continue
		fi
		# Debian/Ubuntu expose fd and bat under different executable names.
		if [ "$OS" = ubuntu ]; then
			alias_command=""
			case $tool in
			fd) alias_command=fdfind ;;
			bat) alias_command=batcat ;;
			esac
			if [ -n "$alias_command" ] && command -v "$alias_command" &>/dev/null; then
				continue
			fi
		fi
		package="$tool"
		case $tool in
		rg) package=ripgrep ;;
		fd) if [ "$OS" = ubuntu ]; then package=fd-find; fi ;;
		esac
		missing+=("$package")
	done

	if [ "${#missing[@]}" -eq 0 ]; then
		print_status "Additional tools are already installed"
	else
		print_status "Installing missing tools: ${missing[*]}"
		case $OS in
		macos) brew install "${missing[@]}" ;;
		arch) sudo pacman -S --needed --noconfirm "${missing[@]}" ;;
		ubuntu) install_apt_packages "${missing[@]}" ;;
		esac
	fi

	# User-local aliases avoid requiring sudo for already-installed packages.
	if [ "$OS" = ubuntu ]; then
		for tool in fd bat; do
			case $tool in
			fd) alias_command=fdfind ;;
			bat) alias_command=batcat ;;
			esac
			if ! command -v "$tool" &>/dev/null && command -v "$alias_command" &>/dev/null; then
				mkdir -p "$HOME/.local/bin"
				ln -sf "$(command -v "$alias_command")" "$HOME/.local/bin/$tool"
			fi
		done
	fi
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
	export PATH="$HOME/.local/bin:$PATH"
	# Run installations.
	# base packages, zsh, and bun are required; the rest are convenience tools
	# whose failure must not abort the run (the linker still needs to execute).
	install_base_packages
	install_additional_tools  # ensures git/curl/wget/unzip present before remote installers/clones
	install_zsh
	# Optional tools: warn on failure, never abort. `|| true` shields each from
	# `set -e` so a single flaky remote installer can't skip the linker.
	install_oh_my_zsh || print_warning "oh-my-zsh install failed; continuing"
	install_zsh_plugins || print_warning "zsh plugins install failed; continuing"
	install_eza || print_warning "eza install failed; continuing"
	install_starship || print_warning "starship install failed; continuing"
	install_fnm || print_warning "fnm install failed; continuing"
	install_pnpm || print_warning "pnpm install failed; continuing"
	install_bun  # required: install_bun exits non-zero itself if bun is unavailable
	install_ast_grep || print_warning "ast-grep install failed; continuing"
	install_mcporter || print_warning "mcporter install failed; continuing"
	print_status "Dependency installation complete!"
	print_status "Run bootstrap.sh (or bun scripts/link-dotfiles/link-dotfiles.ts) to link dotfiles."
	# Set zsh as default shell if it isn't already. chsh prompts for a password
	# and fails under PAM in non-interactive/sudo-less environments; that must
	# never abort the run, so treat any failure as a warning.
	if [ "${SHELL#*zsh}" = "$SHELL" ]; then
		print_status "Setting zsh as default shell..."
		if chsh -s "$(command -v zsh)" 2>/dev/null; then
			print_status "Please log out and log back in for the shell change to take effect"
		else
			print_warning "Could not change default shell to zsh automatically."
			print_warning "Run 'chsh -s $(command -v zsh)' manually when convenient."
		fi
	fi
}

# Run main function
main
