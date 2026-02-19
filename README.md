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

## Submodules

```bash
git submodule update --init --recursive
```

## Notes

- Zsh config sync is managed by `shell/zsh/sync-config.sh`.
- `scripts/sync-github-folder.{sh,ps1}` remain available for project-level `.github` syncing.
