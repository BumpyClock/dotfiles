# Dotfiles

Personal dotfiles and system configuration for macOS/Linux/Windows.

**Note:** AI agent configurations (prompts, skills, agents) have been moved to the [agent-templates](https://github.com/BumpyClock/agent-templates) repository. Local untracked clones of agent marketplaces and vendored skills (`agents/`, `agents-reference/`, `skills/`) may sit in the working tree; they are gitignored and not part of this repo.

## Repository Layout

```text
dotfiles/
├── bootstrap.sh               # first-run bootstrap for Unix/macOS
├── bootstrap.ps1              # first-run bootstrap for Windows
├── sync.sh                    # sync helper: pull + update submodules (Unix)
├── sync.ps1                   # sync helper (Windows)
├── tools.md                   # reference for the installed CLI tools
├── shell/                     # shell configurations
│   ├── zsh/
│   ├── powershell/
│   ├── bin/                   # CLI wrappers installed into ~/.local/bin
│   └── Brewfile
├── scripts/
│   ├── link-dotfiles/         # Bun-based linker (see Linker CLI below)
│   └── ...                    # setup-github-runner.sh, sync-github-folder.{sh,ps1}
├── tools/                     # Bun-based TypeScript helpers
├── docs/
├── sysadmin/
├── terminal-profiles/
├── .github/
└── secrets/                   # private submodule
```

(Abbreviated — see `git ls-files` for the full tracked set.)

## Quick Start

```bash
git clone --recurse-submodules https://github.com/BumpyClock/dotfiles.git
cd dotfiles
```

### Unix/Linux/macOS

```bash
./bootstrap.sh
```

`bootstrap.sh` installs OS-level dependencies (`shell/zsh/install-deps.sh`), then runs the Bun linker exactly once. Extra arguments are passed through to the linker, e.g. `./bootstrap.sh --skip-submodules`.

On Unix/macOS, the linker manages `~/.zshrc`. It backs up an existing unmanaged file once, writes a small managed entrypoint that sources `shell/zsh/shared.zsh`, and creates `~/.zshrc.local` for machine-specific customizations.

### Windows (PowerShell)

```powershell
.\bootstrap.ps1
```

`bootstrap.ps1` calls `shell/powershell/setup.ps1` to provision tools, then runs the Bun linker exactly once. Supports `-Optional`, `-SkipModules`, `-DryRun`, and `-SkipSubmodules`.

Links are created with plain `ln -s` (via an `ln` on PATH, e.g. Git Bash/MSYS with
symlinks enabled). There is no junction or hardlink fallback — if symlink creation
fails on Windows, enable symlinks in Git for Windows (or Developer Mode) and re-run.

Once bootstrapped, re-run the linker directly (see below) to re-apply links or check status without re-provisioning dependencies.

## Linker CLI

Primary entrypoint is `scripts/link-dotfiles/link-dotfiles.ts`.

```bash
# Apply links / run dotfiles setup
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD"

# Status
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --show

# Remove only the managed shell profile block for this platform (zsh on Unix, PowerShell profile on Windows)
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --remove-shell-profile
```

During setup, installable CLI sources in `tools/` are also published into `~/.local/bin`.
TypeScript/Bun tools are compiled into native binaries on the current OS, while other shebang-based tool scripts are linked directly.
If `secrets/api-keys/env.json` exists, the linker also generates `~/.config/dotfiles/env.sh` and `~/.config/dotfiles/env.ps1` so shells can load managed API keys automatically.

## Platform Support

- **macOS**: Full support (Homebrew + zsh)
- **Linux**: Full support (distro-specific packages + zsh/bash)
- **Windows**: Full support (PowerShell)

## Integration with Agent Workspace

After installing system dotfiles, install AI agent configurations from the separate [agent-templates](https://github.com/BumpyClock/agent-templates) repository:

```bash
cd ~/Projects
git clone https://github.com/BumpyClock/agent-templates.git
cd agent-templates
./bootstrap.sh
```

This separation allows:
- System configs and AI configs to be versioned independently
- Easier syncing across machines without breaking AI tool configurations
- Smaller, more focused repositories

## Submodules

```bash
git submodule update --init --recursive
```

## References and Attribution

Attributions for skills that moved to [agent-templates](https://github.com/BumpyClock/agent-templates) (see `skills/` there):

- `skills/ux-designer` micro-polish guidance adapts principles from Jakub Krehel's ["Details that make interfaces feel better"](https://jakub.kr/writing/details-that-make-interfaces-feel-better).
- Related upstream skill: [`jakubkrehel/make-interfaces-feel-better`](https://github.com/jakubkrehel/make-interfaces-feel-better).
- `skills/ios-macos-development` includes adapted material from OpenAI's MIT-licensed `Build iOS Apps` plugin (`build-ios-apps`, v0.1.0), covering App Intents, SwiftUI UI patterns, SwiftUI performance audits, SwiftUI view refactors, Liquid Glass, and XcodeBuildMCP simulator debugging.
- Reference source for the iOS/macOS skill update: OpenAI curated `build-ios-apps` plugin metadata points to [`openai/plugins`](https://github.com/openai/plugins).
- Some SwiftUI subguides retain or adapt prior material from Dimillian's `Dimillian/Skills`; navigation examples also reference [`Dimillian/AppRouter`](https://github.com/Dimillian/AppRouter).
- `skills/ios-macos-development/swiftui-view-refactor/references/mv-patterns.md` is inspired by Thomas Ricouard's "SwiftUI in 2025: Forget MVVM".
- `skills/rust-skills` is a local untracked clone of Leonardo Montini's MIT-licensed [`leonardomso/rust-skills`](https://github.com/leonardomso/rust-skills) project, kept for reference; it is not committed to this repo. Its metadata cites the Rust API Guidelines, Rust Performance Book, and patterns from ripgrep, Tokio, Serde, and Polars.

## Notes

- `~/.zshrc` is managed by the linker on Unix/macOS. Use `~/.zshrc.local` for machine-specific shell snippets; existing unmanaged `~/.zshrc` content is preserved in a timestamped backup on first migration.
- The linker creates a `~/.dotfiles` symlink for portable config resolution.
- Environment variables (API keys, etc.) are managed in `~/.config/dotfiles/env.sh` generated from `secrets/api-keys/env.json`.
- `scripts/sync-github-folder.{sh,ps1}` remain available for project-level `.github` syncing.
- `trash <path> [<path> ...]` moves files and directories to the system trash on macOS, Windows, and Linux. Linux support is best-effort through the underlying XDG-compatible backend.
