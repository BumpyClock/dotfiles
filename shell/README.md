# Shell Configurations

Shell configurations and management scripts organized by shell type.

## Directory Structure

### `zsh/`
Zsh configuration files and management scripts:

**Configuration Files:**
- `.zshrc` - User's zsh configuration (managed by sync-config.sh)
- `shared.zsh` - Cross-platform zsh configuration with plugins, paths, and aliases
- `anthropic.zsh` - Anthropic API credentials loader

**Management Scripts:**
- `install-deps.sh` - Installs zsh, oh-my-zsh, plugins, and tools (eza, starship, fnm, pnpm, ast-grep)
- `sync-config.sh` - Injects/removes dotfiles zsh configuration into `~/.zshrc`

### `powershell/`
PowerShell configuration:

- `Microsoft.PowerShell_profile.ps1` - PowerShell profile with oh-my-posh, fnm, and utility functions

## Usage

### Zsh Setup

```bash
# First-time setup: Install all dependencies
./zsh/install-deps.sh

# Sync configuration to ~/.zshrc
./zsh/sync-config.sh

# Sync and install dependencies in one command
./zsh/sync-config.sh --with-deps

# Remove dotfiles zsh configuration from ~/.zshrc
./zsh/sync-config.sh --remove
```

### PowerShell Setup

The PowerShell profile should be symlinked using the root-level link-dotfiles.ps1:

```powershell
# From dotfiles root directory
.\link-dotfiles.ps1
```

This will symlink the PowerShell profile to your profile location automatically.

## Configuration Details

### Zsh Configuration

The zsh configuration is modular:
- **`shared.zsh`** - Loaded for all platforms, contains:
  - Oh My Zsh setup with fast plugins
  - PATH configuration for common tools
  - Lazy loading for heavy tools (conda)
  - Starship prompt
  - Useful aliases and functions
  - Claude AI integration (cz, ccy commands)

- **`anthropic.zsh`** - Loads Anthropic API credentials from the secrets submodule

The `sync-config.sh` script injects these configs into `~/.zshrc` between markers, preserving any existing configuration:
```bash
# >>> dotfiles zsh start
# ... injected config ...
# <<< dotfiles zsh end
```

### PowerShell Configuration

The PowerShell profile includes:
- oh-my-posh theme with Dracula colors
- fnm (Fast Node Manager) integration
- Terminal-Icons module
- Enhanced PSReadLine with history
- Conda lazy loading
- Context management for LLMs
- Custom utility functions

## Features

### Development Tools
- **Node.js**: fnm with automatic version switching
- **Package Managers**: pnpm, npm
- **Code Search**: ast-grep for structural search
- **Modern CLI**: eza, ripgrep, fd, bat, fzf

### AI Integration
- Claude CLI tools (cz, ccy)
- Context management utilities
- API credential management via secrets submodule

### Cross-Platform Support
- Consistent configuration across macOS, Linux, and Windows
- Platform-specific optimizations where needed
- Shared aliases and functions

## Customization

### Adding Zsh Configuration

1. Edit `shared.zsh` for cross-platform changes
2. Re-run `./zsh/sync-config.sh` to update `~/.zshrc`

### Adding PowerShell Configuration

1. Edit `powershell/Microsoft.PowerShell_profile.ps1`
2. Changes take effect on next PowerShell start

## Notes

- The zsh configuration files are injected into `~/.zshrc`, not replaced
- First-time backup of `~/.zshrc` is created automatically
- Scripts automatically detect the dotfiles root directory
- All relative paths work correctly without manual configuration
