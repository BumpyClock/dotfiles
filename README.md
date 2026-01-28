# Dotfiles

Personal dotfiles and configuration management for cross-platform development environments.

## 📁 Repository Structure

```
dotfiles/
├── config/              # Configuration files
│   └── shell/           # Shell configurations (zsh, powershell)
├── scripts/             # Utility scripts
│   ├── setup/           # Initial setup and installation
│   └── sync/            # Synchronization and linking
├── bin/                 # Executable scripts (added to PATH)
├── docs/                # Documentation and guides
├── secrets/             # Secret management (git submodule)
├── agents/              # AI agent configurations (git submodule)
├── .github/             # GitHub workflows and copilot instructions
└── claude-code-workflows/ # Claude Code AI workflows
```

## 🚀 Quick Start

### Unix/Linux/macOS

```bash
# Clone the repository with submodules
git clone --recurse-submodules https://github.com/BumpyClock/dotfiles.git
cd dotfiles

# Install dependencies and set up zsh
./scripts/setup/install-zsh-deps.sh

# Link dotfiles to home directory
./scripts/sync/link-dotfiles.sh

# Sync zsh configuration
./scripts/sync/sync-zshrc.sh
```

### Windows/PowerShell

```powershell
# Clone the repository with submodules
git clone --recurse-submodules https://github.com/BumpyClock/dotfiles.git
cd dotfiles

# Link dotfiles (requires admin privileges)
.\scripts\sync\link-dotfiles.ps1

# Sync .github folder to projects
.\scripts\sync\sync-github-folder.ps1 -TargetPath "C:\path\to\project"
```

## 📚 Documentation

- [Config Documentation](config/README.md) - Shell configuration details
- [Scripts Documentation](scripts/README.md) - Script usage and reference
- [Development Guides](docs/) - Development workflows and best practices

## 🔧 Key Features

### Shell Configuration
- **Zsh**: Modular configuration with oh-my-zsh, plugins, and custom functions
- **PowerShell**: Enhanced profile with oh-my-posh, fnm integration, and utilities

### Development Tools
- **Node.js**: fnm (Fast Node Manager) with auto-switching
- **Package Managers**: pnpm configured and optimized
- **Code Search**: ast-grep for structural code search
- **Modern CLI**: eza (ls replacement), ripgrep, fd, bat, fzf

### AI Integration
- Claude Code workflows and instructions
- Custom AI agent configurations
- Context management utilities (cz, ccy commands)

### Cross-Platform Support
- Bash scripts for Unix/Linux/macOS
- PowerShell scripts for Windows
- Consistent configuration across platforms

## 🔄 Keeping Up to Date

```bash
# Pull latest changes including submodules
git pull --recurse-submodules

# Re-sync configurations
./scripts/sync/sync-zshrc.sh
./scripts/sync/link-dotfiles.sh
```

## 🛠️ Customization

1. **Zsh**: Edit files in `config/shell/zsh/`
2. **PowerShell**: Edit `config/shell/powershell/Microsoft.PowerShell_profile.ps1`
3. **Scripts**: Add new scripts to appropriate `scripts/` subdirectory
4. **Bin**: Add executable scripts to `bin/` for PATH access

After making changes, re-run the appropriate sync script.

## 📦 Git Submodules

This repository uses submodules for:
- `secrets/` - Private API keys and credentials
- `agents/` - AI agent configurations

Initialize submodules:
```bash
git submodule update --init --recursive
```

## 🤝 Contributing

Feel free to fork and customize for your own use. Pull requests welcome for bug fixes and improvements.

## 📄 License

See individual files and submodules for specific licenses.

## 🔐 Security Note

The `secrets/` submodule is private and contains sensitive information. Never commit actual secrets to the main repository. Use the secrets submodule or environment variables for credentials.
