#!/bin/bash
# ABOUTME: Appends dotfiles zsh snippets into ~/.zshrc without replacing the file.
# ABOUTME: Keeps configs idempotent and can optionally trigger dependency installs.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

usage() {
    cat <<'EOF'
Usage: sync-zshrc.sh [options]

Options:
  --with-deps        Run install-zsh-deps.sh after updating ~/.zshrc
  --remove           Remove the injected dotfiles zsh block from ~/.zshrc
  -h, --help         Show this help message and exit

The script safely injects shared and platform-specific zsh snippets into
~/.zshrc between clearly marked boundaries, creating a timestamped backup on
first run. Re-run at any time to refresh the block.
EOF
}

MARK_START="# >>> dotfiles zsh start"
MARK_END="# <<< dotfiles zsh end"
MODE="apply"
WITH_DEPS=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --with-deps)
            WITH_DEPS=1
            ;;
        --remove)
            MODE="remove"
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
    shift
done

if [[ $WITH_DEPS -eq 1 && $MODE == "remove" ]]; then
    print_error "--with-deps cannot be combined with --remove"
    exit 1
fi

DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SNIPPET_DIR="$DOTFILES_DIR/zshrc.d"
ZSHRC_FILE="$HOME/.zshrc"
INSTALL_SCRIPT="$DOTFILES_DIR/install-zsh-deps.sh"

if [[ $MODE == "apply" && ! -f "$SNIPPET_DIR/shared.zsh" ]]; then
    print_error "Missing required snippet: $SNIPPET_DIR/shared.zsh"
    exit 1
fi

SNIPPET_PATHS=("$SNIPPET_DIR/shared.zsh")

uname_s="$(uname -s)"
case "$uname_s" in
    Darwin)
        [[ -f "$SNIPPET_DIR/macos.zsh" ]] && SNIPPET_PATHS+=("$SNIPPET_DIR/macos.zsh")
        ;;
    Linux)
        [[ -f "$SNIPPET_DIR/linux.zsh" ]] && SNIPPET_PATHS+=("$SNIPPET_DIR/linux.zsh")
        ;;
    *)
        [[ -f "$SNIPPET_DIR/$(echo "$uname_s" | tr '[:upper:]' '[:lower:]').zsh" ]] && \
            SNIPPET_PATHS+=("$SNIPPET_DIR/$(echo "$uname_s" | tr '[:upper:]' '[:lower:]').zsh")
        ;;
esac

if [[ $MODE == "apply" ]]; then
    # Break out any lingering symlink so we can manage the real file.
    if [[ -L "$ZSHRC_FILE" ]]; then
        local_target="$(readlink "$ZSHRC_FILE")"
        print_warning "Removing ~/.zshrc symlink ($local_target) so we can manage the file directly"
        rm "$ZSHRC_FILE"
    fi

    if [[ -f "$ZSHRC_FILE" ]]; then
        if ! grep -q "$MARK_START" "$ZSHRC_FILE"; then
            backup_path="$ZSHRC_FILE.backup.$(date +%Y%m%d_%H%M%S)"
            cp "$ZSHRC_FILE" "$backup_path"
            print_status "Created backup: $backup_path"
        fi
    else
        touch "$ZSHRC_FILE"
    fi
fi

python3 - "$ZSHRC_FILE" "$MARK_START" "$MARK_END" "$MODE" "${SNIPPET_PATHS[@]}" <<'PY'
import pathlib
import re
import sys

zshrc_path = pathlib.Path(sys.argv[1])
mark_start = sys.argv[2]
mark_end = sys.argv[3]
mode = sys.argv[4]
snippet_paths = [pathlib.Path(p) for p in sys.argv[5:]]

pattern = re.compile(rf"{re.escape(mark_start)}.*?{re.escape(mark_end)}\n?", re.DOTALL)

if mode == "apply":
    snippets = []
    for path in snippet_paths:
        if path.is_file():
            snippets.append(path.read_text().strip())

    if not snippets:
        print("No snippet content available to apply", file=sys.stderr)
        sys.exit(1)

    block = mark_start + "\n" + "\n\n".join(snippets) + "\n" + mark_end + "\n"

    content = zshrc_path.read_text() if zshrc_path.exists() else ""

    if pattern.search(content):
        new_content = pattern.sub(block, content, count=1)
    else:
        new_content = content
        if new_content and not new_content.endswith("\n"):
            new_content += "\n"
        if new_content and not new_content.endswith("\n\n"):
            new_content += "\n"
        new_content += block

    if new_content and not new_content.endswith("\n"):
        new_content += "\n"

    zshrc_path.write_text(new_content)

elif mode == "remove":
    if not zshrc_path.exists():
        sys.exit(0)

    content = zshrc_path.read_text()
    new_content, count = pattern.subn("", content)

    if count == 0:
        sys.exit(2)

    new_content = new_content.rstrip()
    if new_content:
        new_content += "\n"

    zshrc_path.write_text(new_content)

else:
    print(f"Unsupported mode: {mode}", file=sys.stderr)
    sys.exit(1)
PY
python_status=$?

if [[ $MODE == "remove" ]]; then
    if [[ $python_status -eq 2 ]]; then
        print_warning "No managed zsh block found to remove"
        exit 0
    elif [[ $python_status -ne 0 ]]; then
        print_error "Failed to remove dotfiles zsh block"
        exit $python_status
    fi
    print_status "Removed dotfiles zsh block from ~/.zshrc"
    exit 0
fi

if [[ $python_status -ne 0 ]]; then
    print_error "Failed to update ~/.zshrc"
    exit $python_status
fi

print_status "Injected dotfiles zsh block into ~/.zshrc"

if [[ $WITH_DEPS -eq 1 ]]; then
    if [[ ! -x "$INSTALL_SCRIPT" ]]; then
        print_error "install-zsh-deps.sh is missing or not executable"
        exit 1
    fi
    print_status "Running install-zsh-deps.sh"
    "$INSTALL_SCRIPT"
fi

print_status "Done"
