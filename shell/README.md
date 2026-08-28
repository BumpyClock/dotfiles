# Shell configurations

Shell configurations and shell-specific setup scripts.

## Directory structure

### `zsh/`

- `.zshrc`
- `shared.zsh`
- `anthropic.zsh`
- `install-deps.sh`

### `powershell/`

- `shared.ps1`

## Usage

### First-run bootstrap

Use the root bootstrap script on a new machine. It installs OS dependencies, then runs the linker once.

```bash
# Unix and macOS
./bootstrap.sh
```

```powershell
# Windows
.\bootstrap.ps1
```

### Zsh setup

```bash
# Installs only OS-level dependencies (packages, plugins, Bun). Does not touch ~/.zshrc.
./zsh/install-deps.sh

# Full setup from the repo root. Links dotfiles and writes the managed ~/.zshrc block.
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD"
```

On Unix and macOS, the linker owns only a managed block inside `~/.zshrc`. That block sources `shell/zsh/shared.zsh`, then `~/.zshrc.local`. The linker backs up existing unmanaged `~/.zshrc` content once, then keeps it after the managed block, so installer snippets such as pnpm survive a rerun.

To remove only the managed block and keep everything else untouched, run:

```bash
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --remove-shell-profile
```

### Cross-platform linking

Run the linker from the repo root:

```bash
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD"
```

```powershell
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD"
```

### `bin/`

Wrapper scripts that the linker installs into `~/.local/bin`, with `zsh/` and `powershell/` variants of `cz`, `ck`, `ccy`, `claudex`, and `claude-grok`. The linker fills `cz` from `ZAI_API_KEY` and `ck` from `KIMI_API_KEY` in `secrets/api-keys/env.json`. It copies the other three unchanged and makes them executable.

### `Brewfile`

Homebrew dependencies for macOS setup.

## Notes

- The linker updates only the block between `# >>> dotfiles zsh start` and `# <<< dotfiles zsh end`. Content outside that block belongs to you or other tools, and the linker preserves it.
- Use `~/.zshrc.local` for machine-specific PATH tweaks, aliases, and env vars. The managed block sources it after the shared baseline, and the linker never overwrites it.
- zsh loads managed env from `secrets/api-keys/env.json` through `~/.config/dotfiles/env.sh`. PowerShell loads it through `~/.config/dotfiles/env.ps1`.
- `shell/zsh/shared.zsh` sets `PNPM_HOME` and other cross-platform defaults only when they are not already set. `PNPM_HOME` defaults to `~/Library/pnpm` on macOS and `~/.local/share/pnpm` elsewhere.
- `install-deps.sh` only provisions OS-level dependencies: packages, zsh plugins, and Bun. It never writes links or config. `bootstrap.sh` and `bootstrap.ps1` call the linker afterward.
- `scripts/link-dotfiles/` is the source of truth for linking.
