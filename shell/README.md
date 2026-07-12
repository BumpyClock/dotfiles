# Shell Configurations

Shell configurations and shell-specific setup scripts.

## Directory Structure

### `zsh/`

- `.zshrc`
- `shared.zsh`
- `anthropic.zsh`
- `install-deps.sh`
- `sync-config.sh`

### `powershell/`

- `shared.ps1`

## Usage

### Zsh Setup

```bash
# Dependencies only; linker handles ~/.zshrc.
./zsh/install-deps.sh

# Full setup from repo root.
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup both
```

On Unix/macOS, the linker owns only a marked block inside `~/.zshrc`. That block sources `shell/zsh/shared.zsh` and then `~/.zshrc.local`. Existing unmanaged `~/.zshrc` content is backed up, then preserved after the managed block so installer snippets such as pnpm are not clobbered on rerun.

`sync-config.sh` remains available for standalone block injection, but the linker-managed block is the recommended setup path.

### Cross-Platform Linking

Use the Bun orchestrator from repo root:

```bash
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup both
```

```powershell
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup both
```

## Notes

- The linker updates only the `# >>> dotfiles zsh start` / `# <<< dotfiles zsh end` block. Content outside that block is user/tool-owned and preserved.
- Use `~/.zshrc.local` for machine-specific PATH tweaks, aliases, and env vars; it is sourced after the shared baseline and is not overwritten.
- Managed env from `secrets/api-keys/env.json` is loaded via `~/.config/dotfiles/env.sh` in zsh and `~/.config/dotfiles/env.ps1` in PowerShell.
- `shell/zsh/shared.zsh` sets cross-platform defaults defensively, including `PNPM_HOME` (`~/Library/pnpm` on macOS, `~/.local/share/pnpm` elsewhere) only when not already set.
- `install-deps.sh` falls back to minimal links if Bun is unavailable.
- Linking source of truth is `scripts/link-dotfiles/` and `scripts/ai-agent-links.json`.
