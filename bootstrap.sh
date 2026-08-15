#!/bin/bash
# ABOUTME: One-shot first-run bootstrap for Unix/macOS: install OS deps, then run the Bun linker.
# ABOUTME: Any extra arguments are passed through to the Bun linker (e.g. --skip-submodules).

set -euo pipefail

# Resolve the repo root from this script's location, not the caller's cwd.
DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[bootstrap] Installing OS-level dependencies..."
"$DOTFILES_DIR/shell/zsh/install-deps.sh"

# Refresh PATH so a Bun install performed by install-deps.sh in a separate
# process is visible here.
export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
case ":$PATH:" in
*":$BUN_INSTALL/bin:"*) ;;
*) export PATH="$BUN_INSTALL/bin:$PATH" ;;
esac

if ! command -v bun >/dev/null 2>&1; then
	echo "[bootstrap] ERROR: bun is still not available on PATH after dependency install." >&2
	echo "[bootstrap] Install it manually (curl -fsSL https://bun.sh/install | bash) and re-run bootstrap.sh." >&2
	exit 1
fi

echo "[bootstrap] Linking dotfiles..."
bun "$DOTFILES_DIR/scripts/link-dotfiles/link-dotfiles.ts" --dotfiles-dir "$DOTFILES_DIR" "$@"

echo "[bootstrap] Done."
echo "[bootstrap] AI agent configs now live in a separate repo. To install them:"
echo "[bootstrap]   git clone https://github.com/BumpyClock/agent-templates.git ~/Projects/agent-templates"
echo "[bootstrap]   cd ~/Projects/agent-templates && ./bootstrap.sh"
