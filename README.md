# Dotfiles

Personal dotfiles and AI-agent workspace configuration for macOS/Linux/Windows.

## Repository Layout

```text
dotfiles/
├── AGENTS.md
├── prompts/
├── skills/
├── skills_archive/
├── agent-scripts/
├── tools/                     # Bun-based TypeScript helpers
├── codex_configs/
├── serena_config/
├── agents/                    # local agent definitions linked to ~/.claude/agents
├── agents-reference/          # git submodule reference bundle
├── shell/
│   ├── zsh/
│   └── powershell/
├── scripts/
│   ├── link-dotfiles/
│   │   ├── link-dotfiles.ts   # interactive orchestrator
│   │   ├── setup-dotfiles.ts
│   │   ├── setup-ai-agents.ts
│   │   └── package.json
│   ├── ai-agent-links.json
│   └── ralph-loop/
├── docs/
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
./shell/zsh/install-deps.sh
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup both
```

On Unix/macOS, the linker manages `~/.zshrc`. It backs up an existing unmanaged file once, writes a small managed entrypoint that sources `shell/zsh/shared.zsh`, and creates `~/.zshrc.local` for machine-specific customizations.

### Windows (PowerShell)

```powershell
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup both
```

On Windows, directory links are created as junctions (no elevation needed).  
If file symlinks are blocked, the linker falls back to hardlinks; only if both are blocked should you run elevated or enable Developer Mode.

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
