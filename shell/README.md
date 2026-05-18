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

- `Microsoft.PowerShell_profile.ps1`

## Usage

### Zsh Setup

```bash
# Dependencies only; linker handles ~/.zshrc.
./zsh/install-deps.sh

# Full setup from repo root.
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup both
```

On Unix/macOS, the linker writes a small managed `~/.zshrc` that sources `shell/zsh/shared.zsh` and then `~/.zshrc.local`. Existing unmanaged `~/.zshrc` content is moved to a timestamped backup before the managed entrypoint is installed.

`sync-config.sh` remains available for standalone block injection, but the linker-managed entrypoint is the recommended setup path.

### Cross-Platform Linking

Use the Bun orchestrator from repo root:

```bash
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup both
```

```powershell
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup both
```

## Notes

- `~/.zshrc` is managed by the linker on Unix/macOS. Use `~/.zshrc.local` for custom snippets; it is sourced after the shared config and is not overwritten.
- Managed env from `secrets/api-keys/env.json` is loaded via `~/.config/dotfiles/env.sh` in zsh and `~/.config/dotfiles/env.ps1` in PowerShell.
- `install-deps.sh` falls back to minimal links if Bun is unavailable.
- Linking source of truth is `scripts/link-dotfiles/` and `scripts/ai-agent-links.json`.
