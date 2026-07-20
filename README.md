# Dotfiles

Personal dotfiles and system configuration for macOS/Linux/Windows.

**Note:** AI agent configurations (prompts, skills, agents) have been moved to the [agent-workspace](https://github.com/BumpyClock/agent-workspace) repository.

## Repository Layout

```text
dotfiles/
├── bootstrap.sh               # first-run bootstrap for Unix/macOS
├── bootstrap.ps1              # first-run bootstrap for Windows
├── shell/                     # shell configurations
│   ├── zsh/
│   └── powershell/
├── scripts/
│   ├── link-dotfiles/
│   │   ├── link-dotfiles.ts   # interactive orchestrator
│   │   ├── setup-dotfiles.ts
│   │   ├── setup-ai-agents.ts
│   │   └── package.json
│   └── ai-agent-links.json
├── tools/                     # Bun-based TypeScript helpers
├── docs/
├── sysadmin/
├── terminal-profiles/
├── .github/
└── secrets/                   # private submodule
```

## Quick Start

```bash
git clone --recurse-submodules https://github.com/BumpyClock/dotfiles.git
cd dotfiles
```

### Unix/Linux/macOS

```bash
./bootstrap.sh
```

`bootstrap.sh` installs OS-level dependencies (`shell/zsh/install-deps.sh`), then runs the Bun linker (`--setup both`) exactly once.

### Windows (PowerShell)

```powershell
.\bootstrap.ps1
```

`bootstrap.ps1` calls `shell/powershell/setup.ps1` to provision tools, then runs the Bun linker.

## Linker CLI

Primary entrypoint is `scripts/link-dotfiles/link-dotfiles.ts`.

```bash
# Interactive chooser: dotfiles, ai-agents, or both
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD"

# Non-interactive
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup dotfiles

# Status
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --show

# Remove only the managed shell profile block for this platform
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --remove-shell-profile
```

## Platform Support

- **macOS**: Full support (Homebrew + zsh)
- **Linux**: Full support (distro-specific packages + zsh/bash)
- **Windows**: Full support (PowerShell)

## Integration with Agent Workspace

After installing system dotfiles, install AI agent configurations from the separate [agent-workspace](https://github.com/BumpyClock/agent-workspace) repository:

```bash
cd ~/Projects
git clone https://github.com/BumpyClock/agent-workspace.git
cd agent-workspace
./bootstrap.sh
```

This separation allows:
- System configs and AI configs to be versioned independently
- Easier syncing across machines without breaking AI tool configurations
- Smaller, more focused repositories

## Notes

- `~/.zshrc` is managed by the linker on Unix/macOS. Use `~/.zshrc.local` for machine-specific shell snippets.
- The linker creates a `~/.dotfiles` symlink for portable config resolution
- Environment variables (API keys, etc.) are managed in `~/.config/dotfiles/env.sh` generated from `secrets/api-keys/env.json`


## Quick Start

```bash
git clone --recurse-submodules https://github.com/BumpyClock/dotfiles.git
cd dotfiles
```

### Unix/Linux/macOS

```bash
./bootstrap.sh
```

`bootstrap.sh` installs OS-level dependencies (`shell/zsh/install-deps.sh`), then runs the Bun linker (`--setup both`) exactly once. Extra arguments are passed through to the linker, e.g. `./bootstrap.sh --skip-submodules`.

On Unix/macOS, the linker manages `~/.zshrc`. It backs up an existing unmanaged file once, writes a small managed entrypoint that sources `shell/zsh/shared.zsh`, and creates `~/.zshrc.local` for machine-specific customizations.

### Windows (PowerShell)

```powershell
.\bootstrap.ps1
```

`bootstrap.ps1` calls `shell/powershell/setup.ps1` to provision tools, then runs the Bun linker (`--setup both`) exactly once. Supports `-Optional`, `-SkipModules`, `-DryRun`, and `-SkipSubmodules`.

On Windows, directory links are created as junctions (no elevation needed).  
If file symlinks are blocked, the linker falls back to hardlinks; only if both are blocked should you run elevated or enable Developer Mode.

Once bootstrapped, re-run the linker directly (see below) to re-apply links or check status without re-provisioning dependencies.

## Linker CLI

Primary entrypoint is `scripts/link-dotfiles/link-dotfiles.ts`.

```bash
# Interactive chooser: dotfiles, ai-agents, or both
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD"

# Non-interactive
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup dotfiles
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup ai-agents
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup both

# Status
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --show

# Link repo agents into a project's .claude/agents
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup dotfiles --project-agents /path/to/project

# Remove only the managed shell profile block for this platform (zsh on Unix, PowerShell profile on Windows)
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --remove-shell-profile
```

AI-agent destination mappings are defined in `scripts/ai-agent-links.json`.

During setup, installable CLI sources in `tools/` are also published into `~/.local/bin`.
TypeScript/Bun tools are compiled into native binaries on the current OS, while other shebang-based tool scripts are linked directly.
If `secrets/api-keys/env.json` exists, the linker also generates `~/.config/dotfiles/env.sh` and `~/.config/dotfiles/env.ps1` so shells can load managed API keys automatically.

On Unix/macOS, the linker also manages `~/.zshrc`. Existing unmanaged content is moved to a timestamped backup such as `~/.zshrc.backup.20260518_143000`; personal shell snippets belong in `~/.zshrc.local`, which the managed entrypoint sources after the shared config.

## Submodules

```bash
git submodule update --init --recursive
```

## References and Attribution

- `skills/ux-designer` micro-polish guidance adapts principles from Jakub Krehel's ["Details that make interfaces feel better"](https://jakub.kr/writing/details-that-make-interfaces-feel-better).
- Related upstream skill: [`jakubkrehel/make-interfaces-feel-better`](https://github.com/jakubkrehel/make-interfaces-feel-better).
- `skills/ios-macos-development` includes adapted material from OpenAI's MIT-licensed `Build iOS Apps` plugin (`build-ios-apps`, v0.1.0), covering App Intents, SwiftUI UI patterns, SwiftUI performance audits, SwiftUI view refactors, Liquid Glass, and XcodeBuildMCP simulator debugging.
- Reference source for the iOS/macOS skill update: OpenAI curated `build-ios-apps` plugin metadata points to [`openai/plugins`](https://github.com/openai/plugins).
- Some SwiftUI subguides retain or adapt prior material from Dimillian's `Dimillian/Skills`; navigation examples also reference [`Dimillian/AppRouter`](https://github.com/Dimillian/AppRouter).
- `skills/ios-macos-development/swiftui-view-refactor/references/mv-patterns.md` is inspired by Thomas Ricouard's "SwiftUI in 2025: Forget MVVM".
- `skills/rust-skills` is tracked from Leonardo Montini's MIT-licensed [`leonardomso/rust-skills`](https://github.com/leonardomso/rust-skills) project; its metadata cites the Rust API Guidelines, Rust Performance Book, and patterns from ripgrep, Tokio, Serde, and Polars.

## Notes

- `~/.zshrc` is managed by the linker on Unix/macOS. Use `~/.zshrc.local` for machine-specific shell snippets; existing unmanaged `~/.zshrc` content is preserved in a timestamped backup on first migration.
- `scripts/sync-github-folder.{sh,ps1}` remain available for project-level `.github` syncing.
- `tools/trash.ts` moves files and directories to the system trash on macOS, Windows, and Linux; Linux support is best-effort through the underlying XDG-compatible backend.
