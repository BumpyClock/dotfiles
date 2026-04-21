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
./shell/zsh/sync-config.sh
```

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

## Submodules

```bash
git submodule update --init --recursive
```

## References and Attribution

- `skills/ux-designer` micro-polish guidance adapts principles from Jakub Krehel's ["Details that make interfaces feel better"](https://jakub.kr/writing/details-that-make-interfaces-feel-better).
- Related upstream skill: [`jakubkrehel/make-interfaces-feel-better`](https://github.com/jakubkrehel/make-interfaces-feel-better).

## Notes

- Zsh config sync is managed by `shell/zsh/sync-config.sh`.
- `scripts/sync-github-folder.{sh,ps1}` remain available for project-level `.github` syncing.
- `tools/trash.ts` moves files and directories to the system trash on macOS, Windows, and Linux; Linux support is best-effort through the underlying XDG-compatible backend.
