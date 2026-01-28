#!/bin/bash
set -e

#######################################
# Cross-Platform GitHub Actions Runner Setup Script
# Supports: Linux (systemd) and macOS (launchd)
# Creates dedicated service user and installs runner as a service
#######################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

#######################################
# Detect Platform
#######################################
detect_platform() {
    print_header "Detecting Platform"

    OS="$(uname -s)"
    ARCH="$(uname -m)"

    case "$OS" in
        Linux*)
            PLATFORM="linux"
            case "$ARCH" in
                x86_64) RUNNER_ARCH="x64" ;;
                aarch64|arm64) RUNNER_ARCH="arm64" ;;
                *) print_error "Unsupported architecture: $ARCH"; exit 1 ;;
            esac
            HASH_CMD="sha256sum"
            ;;
        Darwin*)
            PLATFORM="osx"
            case "$ARCH" in
                x86_64) RUNNER_ARCH="x64" ;;
                arm64) RUNNER_ARCH="arm64" ;;
                *) print_error "Unsupported architecture: $ARCH"; exit 1 ;;
            esac
            HASH_CMD="shasum -a 256"
            ;;
        *)
            print_error "Unsupported OS: $OS"
            exit 1
            ;;
    esac

    print_success "Platform: $PLATFORM ($RUNNER_ARCH)"
}

#######################################
# Fetch Latest Runner Version
#######################################
fetch_latest_version() {
    print_header "Fetching Latest Runner Version"

    LATEST_VERSION=$(curl -s https://api.github.com/repos/actions/runner/releases/latest | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/')

    if [[ -z "$LATEST_VERSION" ]]; then
        print_error "Failed to fetch latest version from GitHub API"
        exit 1
    fi

    RUNNER_FILE="actions-runner-${PLATFORM}-${RUNNER_ARCH}-${LATEST_VERSION}.tar.gz"
    RUNNER_URL="https://github.com/actions/runner/releases/download/v${LATEST_VERSION}/${RUNNER_FILE}"

    print_success "Latest version: v${LATEST_VERSION}"
    echo "  Package: $RUNNER_FILE"
}

#######################################
# Prompt Functions
#######################################
prompt_required() {
    local prompt="$1"
    local var_name="$2"
    local value=""

    while [[ -z "$value" ]]; do
        read -p "$prompt: " value
        if [[ -z "$value" ]]; then
            print_warning "This field is required"
        fi
    done

    eval "$var_name='$value'"
}

prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    local value=""

    read -p "$prompt [$default]: " value
    value="${value:-$default}"

    eval "$var_name='$value'"
}

prompt_yes_no() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    local value=""

    if [[ "$default" == "y" ]]; then
        read -p "$prompt [Y/n]: " value
        value="${value:-y}"
    else
        read -p "$prompt [y/N]: " value
        value="${value:-n}"
    fi

    value=$(echo "$value" | tr '[:upper:]' '[:lower:]')
    eval "$var_name='$value'"
}

#######################################
# Gather User Input
#######################################
gather_input() {
    print_header "Configuration"
    echo "Please provide the following information:"
    echo ""

    # Basic prompts
    prompt_required "Repository URL (e.g., https://github.com/owner/repo)" REPO_URL
    prompt_required "Runner registration token" RUNNER_TOKEN
    prompt_with_default "Runner name" "$(hostname)-runner" RUNNER_NAME
    prompt_with_default "Service username" "github-actions-runner" SERVICE_USER

    # Docker access (Linux only)
    if [[ "$PLATFORM" == "linux" ]]; then
        prompt_yes_no "Add user to docker group?" "y" ADD_DOCKER
    else
        ADD_DOCKER="n"
    fi

    # Advanced options
    echo ""
    prompt_yes_no "Configure advanced options?" "n" ADVANCED_OPTIONS

    if [[ "$ADVANCED_OPTIONS" == "y" ]]; then
        echo ""
        echo "Advanced options:"
        prompt_with_default "Custom labels (comma-separated, or empty for default)" "" CUSTOM_LABELS
        prompt_with_default "Runner group" "Default" RUNNER_GROUP
        prompt_with_default "Work folder" "_work" WORK_FOLDER
        prompt_yes_no "Replace existing runner with same name?" "n" REPLACE_EXISTING
    else
        CUSTOM_LABELS=""
        RUNNER_GROUP="Default"
        WORK_FOLDER="_work"
        REPLACE_EXISTING="n"
    fi

    # Set home directory based on platform
    if [[ "$PLATFORM" == "linux" ]]; then
        USER_HOME="/home/$SERVICE_USER"
    else
        USER_HOME="/Users/$SERVICE_USER"
    fi
    RUNNER_DIR="$USER_HOME/actions-runner"
}

#######################################
# Confirm Settings
#######################################
confirm_settings() {
    print_header "Configuration Summary"
    echo "  Repository URL:  $REPO_URL"
    echo "  Runner name:     $RUNNER_NAME"
    echo "  Service user:    $SERVICE_USER"
    echo "  Runner directory: $RUNNER_DIR"
    echo "  Platform:        $PLATFORM ($RUNNER_ARCH)"
    echo "  Runner version:  v$LATEST_VERSION"

    if [[ "$PLATFORM" == "linux" && "$ADD_DOCKER" == "y" ]]; then
        echo "  Docker access:   Yes"
    fi

    if [[ -n "$CUSTOM_LABELS" ]]; then
        echo "  Custom labels:   $CUSTOM_LABELS"
    fi

    if [[ "$RUNNER_GROUP" != "Default" ]]; then
        echo "  Runner group:    $RUNNER_GROUP"
    fi

    echo ""
    prompt_yes_no "Proceed with installation?" "y" CONFIRM

    if [[ "$CONFIRM" != "y" ]]; then
        echo "Installation cancelled."
        exit 0
    fi
}

#######################################
# Create Linux User
#######################################
create_linux_user() {
    print_header "Creating Linux User: $SERVICE_USER"

    if id "$SERVICE_USER" &>/dev/null; then
        print_warning "User $SERVICE_USER already exists"
    else
        sudo useradd -m -s /bin/bash "$SERVICE_USER"
        print_success "User created"
    fi

    if [[ "$ADD_DOCKER" == "y" ]]; then
        if getent group docker > /dev/null 2>&1; then
            sudo usermod -aG docker "$SERVICE_USER"
            print_success "Added to docker group"
        else
            print_warning "Docker group does not exist, skipping"
        fi
    fi
}

#######################################
# Create macOS Hidden System User
#######################################
create_macos_user() {
    print_header "Creating macOS Hidden System User: $SERVICE_USER"

    if dscl . -read /Users/"$SERVICE_USER" &>/dev/null; then
        print_warning "User $SERVICE_USER already exists"
    else
        # Find next available UID below 500 (system user range)
        NEXT_UID=$(dscl . -list /Users UniqueID | awk '{print $2}' | sort -n | awk '$1 < 500 && $1 > 400 {max=$1} END {print (max ? max+1 : 401)}')

        echo "Creating hidden system user with UID $NEXT_UID..."

        sudo dscl . -create /Users/"$SERVICE_USER"
        sudo dscl . -create /Users/"$SERVICE_USER" UniqueID "$NEXT_UID"
        sudo dscl . -create /Users/"$SERVICE_USER" PrimaryGroupID 20  # staff group
        sudo dscl . -create /Users/"$SERVICE_USER" UserShell /usr/bin/false
        sudo dscl . -create /Users/"$SERVICE_USER" NFSHomeDirectory "$USER_HOME"
        sudo dscl . -create /Users/"$SERVICE_USER" RealName "GitHub Actions Runner"
        sudo dscl . -create /Users/"$SERVICE_USER" IsHidden 1

        print_success "Hidden system user created (UID: $NEXT_UID)"
    fi

    # Ensure home directory exists
    if [[ ! -d "$USER_HOME" ]]; then
        sudo mkdir -p "$USER_HOME"
        sudo chown -R "$SERVICE_USER":staff "$USER_HOME"
        print_success "Home directory created"
    fi
}

#######################################
# Create Service User (dispatcher)
#######################################
create_service_user() {
    if [[ "$PLATFORM" == "linux" ]]; then
        create_linux_user
    else
        create_macos_user
    fi
}

#######################################
# Setup Runner Directory
#######################################
setup_runner_directory() {
    print_header "Setting Up Runner Directory"

    sudo mkdir -p "$RUNNER_DIR"

    if [[ "$PLATFORM" == "linux" ]]; then
        sudo chown -R "$SERVICE_USER":"$SERVICE_USER" "$RUNNER_DIR"
    else
        sudo chown -R "$SERVICE_USER":staff "$RUNNER_DIR"
    fi

    print_success "Directory created: $RUNNER_DIR"
}

#######################################
# Download and Extract Runner
#######################################
download_runner() {
    print_header "Downloading Runner"

    echo "Downloading from: $RUNNER_URL"

    sudo -u "$SERVICE_USER" bash -c "cd '$RUNNER_DIR' && curl -sL -o '$RUNNER_FILE' '$RUNNER_URL'"
    print_success "Download complete"

    print_header "Extracting Runner"
    sudo -u "$SERVICE_USER" bash -c "cd '$RUNNER_DIR' && tar xzf './$RUNNER_FILE'"
    print_success "Extraction complete"

    # Clean up archive
    sudo -u "$SERVICE_USER" rm -f "$RUNNER_DIR/$RUNNER_FILE"
}

#######################################
# Configure Runner
#######################################
configure_runner() {
    print_header "Configuring Runner"

    # Build config command
    CONFIG_CMD="./config.sh --url '$REPO_URL' --token '$RUNNER_TOKEN' --name '$RUNNER_NAME' --work '$WORK_FOLDER' --unattended"

    if [[ -n "$CUSTOM_LABELS" ]]; then
        CONFIG_CMD="$CONFIG_CMD --labels '$CUSTOM_LABELS'"
    fi

    if [[ "$RUNNER_GROUP" != "Default" ]]; then
        CONFIG_CMD="$CONFIG_CMD --runnergroup '$RUNNER_GROUP'"
    fi

    if [[ "$REPLACE_EXISTING" == "y" ]]; then
        CONFIG_CMD="$CONFIG_CMD --replace"
    fi

    sudo -u "$SERVICE_USER" bash -c "cd '$RUNNER_DIR' && $CONFIG_CMD"
    print_success "Runner configured"
}

#######################################
# Install Service
#######################################
install_service() {
    print_header "Installing Service"

    sudo bash -c "cd '$RUNNER_DIR' && ./svc.sh install '$SERVICE_USER'"
    print_success "Service installed"
}

#######################################
# Start Service
#######################################
start_service() {
    print_header "Starting Service"

    sudo bash -c "cd '$RUNNER_DIR' && ./svc.sh start"
    print_success "Service started"
}

#######################################
# Verify Installation
#######################################
verify_installation() {
    print_header "Verifying Installation"

    sudo bash -c "cd '$RUNNER_DIR' && ./svc.sh status" || true
}

#######################################
# Print Summary
#######################################
print_summary() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}   Installation Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Runner '$RUNNER_NAME' is now running as a service."
    echo ""
    echo "Useful commands:"
    echo "  Status:  sudo $RUNNER_DIR/svc.sh status"
    echo "  Stop:    sudo $RUNNER_DIR/svc.sh stop"
    echo "  Start:   sudo $RUNNER_DIR/svc.sh start"
    echo "  Uninstall: sudo $RUNNER_DIR/svc.sh uninstall"
    echo ""
}

#######################################
# Main
#######################################
main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   GitHub Actions Self-Hosted Runner Setup Script   ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
    echo ""

    detect_platform
    fetch_latest_version
    gather_input
    confirm_settings
    create_service_user
    setup_runner_directory
    download_runner
    configure_runner
    install_service
    start_service
    verify_installation
    print_summary
}

main "$@"
