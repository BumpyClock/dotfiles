# Configuration Files

This directory contains configuration files organized by category.

## Directory Structure

### `shell/`
Shell configuration files for different shells:

- **`zsh/`** - Zsh configuration
  - `.zshrc` - Main zsh configuration (managed by sync-zshrc.sh)
  - `shared.zsh` - Cross-platform zsh configuration with plugins, paths, and aliases
  - `anthropic.zsh` - Anthropic API credentials loader

- **`powershell/`** - PowerShell configuration
  - `Microsoft.PowerShell_profile.ps1` - PowerShell profile with oh-my-posh, fnm, and utility functions

## Usage

### Zsh Configuration

To sync your zsh configuration to `~/.zshrc`:

```bash
# Inject dotfiles zsh configuration into ~/.zshrc
../scripts/sync/sync-zshrc.sh

# Inject and install dependencies
../scripts/sync/sync-zshrc.sh --with-deps

# Remove dotfiles zsh configuration from ~/.zshrc
../scripts/sync/sync-zshrc.sh --remove
```

### PowerShell Configuration

The PowerShell profile should be symlinked to your PowerShell profile location:

```powershell
# Windows PowerShell
New-Item -ItemType SymbolicLink -Path $PROFILE -Target "path\to\dotfiles\config\shell\powershell\Microsoft.PowerShell_profile.ps1"

# Or use link-dotfiles.ps1 script
..\scripts\sync\link-dotfiles.ps1
```

## Notes

- The zsh configuration files are injected into `~/.zshrc` between markers by `sync-zshrc.sh`
- PowerShell profile requires oh-my-posh for theming
- All configuration files maintain backward compatibility with the original structure
