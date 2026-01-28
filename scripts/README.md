# Scripts

This directory contains utility scripts for setting up and synchronizing dotfiles.

## Directory Structure

### `setup/`
Initial setup and installation scripts:

- **`install-zsh-deps.sh`** - Installs zsh, oh-my-zsh, plugins, and related tools (eza, starship, fnm, pnpm, ast-grep)
- **`setup-github-runner.sh`** - Sets up GitHub Actions runner as a service (Linux/macOS)

### `sync/`
Synchronization and linking scripts:

- **`link-dotfiles.sh`** / **`link-dotfiles.ps1`** - Creates symlinks for dotfiles to their target locations
- **`sync-zshrc.sh`** - Injects/removes dotfiles zsh configuration into `~/.zshrc`
- **`sync-github-folder.sh`** / **`sync-github-folder.ps1`** - Syncs `.github` folder to projects

## Usage

### Initial Setup (Unix/Linux/macOS)

```bash
# Install all zsh dependencies and tools
./setup/install-zsh-deps.sh

# Link dotfiles to home directory
./sync/link-dotfiles.sh

# Sync zsh configuration to ~/.zshrc
./sync/sync-zshrc.sh --with-deps
```

### Initial Setup (Windows/PowerShell)

```powershell
# Link dotfiles to home directory (requires admin)
.\sync\link-dotfiles.ps1

# Sync .github folder to a project
.\sync\sync-github-folder.ps1 -TargetPath "C:\path\to\project"
```

### Sync Scripts

```bash
# Update zsh configuration in ~/.zshrc
./sync/sync-zshrc.sh

# Remove dotfiles zsh block from ~/.zshrc
./sync/sync-zshrc.sh --remove

# Link .github folder to a project
./sync/sync-github-folder.sh /path/to/project
```

### GitHub Actions Runner

```bash
# Set up GitHub Actions runner (requires sudo)
sudo ./setup/setup-github-runner.sh
```

## Notes

- Setup scripts should be run once during initial system configuration
- Sync scripts can be run repeatedly to update configurations
- All scripts automatically detect the dotfiles root directory
- PowerShell scripts may require administrator privileges for creating symlinks
- Cross-platform scripts exist for both bash and PowerShell where applicable
