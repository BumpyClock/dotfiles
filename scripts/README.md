# General Utility Scripts

## Link Dotfiles

`link-dotfiles/` contains the Bun-based linker workflow.

```bash
# Interactive: choose dotfiles, ai-agents, or both
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD"

# Non-interactive
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup dotfiles
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup ai-agents
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup both

# Show current status
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --show
```

Internal scripts:
- `scripts/link-dotfiles/setup-dotfiles.ts`
- `scripts/link-dotfiles/setup-ai-agents.ts`
- `scripts/ai-agent-links.json`

Windows behavior:
- Directory links use junctions (no elevation required).
- File-link attempts fall back to hardlinks if symlink policy blocks them.

## Other Scripts

### `ralph-loop/ouroboros.ts`

```bash
bun scripts/ralph-loop/ouroboros.ts --help
ouroboros --help
```

### `setup-github-runner.sh`

```bash
sudo ./setup-github-runner.sh
```

### `sync-github-folder.sh` / `sync-github-folder.ps1`

```bash
./sync-github-folder.sh /path/to/project
```

```powershell
.\sync-github-folder.ps1 -TargetPath "C:\path\to\project"
```
