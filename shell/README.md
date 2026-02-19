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
./zsh/install-deps.sh
./zsh/sync-config.sh
./zsh/sync-config.sh --with-deps
./zsh/sync-config.sh --remove
```

### Cross-Platform Linking

Use the Bun orchestrator from repo root:

```bash
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup both
```

```powershell
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup both
```

## Notes

- Zsh config is injected into `~/.zshrc` between markers.
- `install-deps.sh` falls back to minimal links if Bun is unavailable.
- Linking source of truth is `scripts/link-dotfiles/` and `scripts/ai-agent-links.json`.
