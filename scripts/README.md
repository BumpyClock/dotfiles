# General Utility Scripts

Scripts for non-shell-specific tasks. For shell-specific scripts, see `shell/{zsh,powershell}/`.

## Available Scripts

### `ralph-loop/ouroboros.ts`
Provider-driven loop runner with staged parallel startup, live rich terminal rendering, and beads-aware progress summaries.

**Usage:**
```bash
# Source
bun scripts/ralph-loop/ouroboros.ts --help

# Compiled executable (installed)
ouroboros --help
```

Config files:
- Global: `~/.ouroboros/config.json`
- Project: `~/.ouroboros/projects/<derived-git-root-key>.json`

### `setup-github-runner.sh`
Sets up GitHub Actions runner as a service on Linux/macOS systems.

**Usage:**
```bash
sudo ./setup-github-runner.sh
```

Requires sudo for creating service users and installing as a system service.

### `sync-github-folder.sh` / `sync-github-folder.ps1`
Syncs the `.github` folder from this dotfiles repo to other projects.

**Usage:**
```bash
# Unix/Linux/macOS
./sync-github-folder.sh /path/to/project

# Windows/PowerShell
.\sync-github-folder.ps1 -TargetPath "C:\path\to\project"
```

Provides options to:
1. Create symbolic links (recommended - stays in sync)
2. Copy files (independent copy)

## Shell-Specific Scripts

For shell configuration management scripts, see:
- [shell/zsh/](../shell/zsh/) - `install-deps.sh`, `sync-config.sh`
- Root level - `link-dotfiles.sh`, `link-dotfiles.ps1`
