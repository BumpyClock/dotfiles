# Dotfiles

Personal dotfiles and configuration management for cross-platform development environments.

## 📁 Repository Structure

```
dotfiles/
├── shell/               # Shell configurations and scripts
│   ├── zsh/             # Zsh configs + install-deps.sh, sync-config.sh
│   └── powershell/      # PowerShell profile
├── scripts/             # General utility scripts
│   ├── setup-github-runner.sh
│   ├── sync-github-folder.sh
│   └── sync-github-folder.ps1
├── link-dotfiles.ps1    # Top-level for Windows accessibility
├── link-dotfiles.sh     # Top-level for Unix/Linux/macOS
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
./shell/zsh/install-deps.sh

# Link dotfiles to home directory
./link-dotfiles.sh

# Sync zsh configuration
./shell/zsh/sync-config.sh
```

### Windows/PowerShell

```powershell
# Clone the repository with submodules
git clone --recurse-submodules https://github.com/BumpyClock/dotfiles.git
cd dotfiles

# Link dotfiles (requires admin privileges)
.\link-dotfiles.ps1

# Sync .github folder to projects
.\scripts\sync-github-folder.ps1 -TargetPath "C:\path\to\project"
```

## 📚 Documentation

- [Shell Documentation](shell/README.md) - Shell configuration and script details
- [Scripts Documentation](scripts/README.md) - General utility scripts
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

## � API Keys and Secrets

The `cz` script (Claude with Z.AI) requires an API key. The `link-dotfiles` scripts handle this automatically:

1. **With secrets submodule access**: API key is loaded from `secrets/anthropic.ps1` or `secrets/anthropic.sh`
2. **Without secrets submodule access**: You'll be prompted to enter your Z.ai API key manually

The generated scripts are written to `~/.local/bin/` with the API key embedded.

### Windows Execution Policy

For Windows users, you may need to set the execution policy to run scripts from `~/.local/bin`:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## �🔄 Keeping Up to Date

```bash
# Pull latest changes including submodules
git pull --recurse-submodules

# Re-sync configurations
./shell/zsh/sync-config.sh
./link-dotfiles.sh
```

## 🛠️ Customization

1. **Zsh**: Edit files in `shell/zsh/`
2. **PowerShell**: Edit `shell/powershell/Microsoft.PowerShell_profile.ps1`
3. **Scripts**: Add new scripts to `scripts/` or appropriate shell directory
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
