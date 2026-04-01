# PowerShell Environment Documentation

## Auto-Installed Tools
The PowerShell profile automatically installs these tools if missing:
- **fnm** - Node.js version manager (`winget install Schniz.fnm -h`)
- **eza** - Enhanced ls replacement (`winget install eza-community.eza -h`)
- **GitHub CLI** - GitHub command line tool (`winget install GitHub.cli -h`)
- **Terminal-Icons** - PowerShell module for file icons

## Installer Behavior
- `shell/powershell/setup.ps1` writes the repo profile content into both current-user targets:
  `Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1` and
  `Documents\PowerShell\Microsoft.PowerShell_profile.ps1`
- The installer also unblocks matching OneDrive-backed profile/theme paths when they exist
- The installer does not require symlinks or Developer Mode
- The installer unblocks copied profile/theme files so PowerShell execution policy does not reject them as downloaded scripts
- If execution policy is `AllSigned` from `MachinePolicy`, `UserPolicy`, or the effective policy, unblocking is not enough; the profile must be signed or policy must change

## Development Workflow Commands

### Package Management (pnpm)
- `pn` - pnpm alias
- `pnx` - pnpm dlx alias
- `pi <package>` - pnpm install
- `pid <package>` - pnpm install --save-dev
- `pu [package]` - pnpm update
- `pr <package>` - pnpm remove

### Development Scripts
- `dev` - pnpm dev
- `build` - pnpm build
- `preview` - pnpm preview
- `test` - pnpm test
- `lint` - pnpm lint
- `format` - pnpm format
- `pnd` - Legacy pnpm dev alias

### Project Maintenance
- `clean-deps` - Remove node_modules and reinstall
- `fresh-start` - Remove node_modules + lockfile and reinstall

## Git Shortcuts

### Basic Git
- `gs` - git status
- `ga [file]` - git add (file or all)
- `gc <message>` - git commit -m
- `gp` - git push
- `gpl` - git pull
- `gb` - git branch
- `gco <branch>` - git checkout
- `gcom <message>` - add all, commit with message
- `lazyg <message>` - add all, commit, and push

### GitHub CLI
- `repo-view` - Open repo in browser
- `repo-clone <repo>` - Clone repository
- `repo-create <name>` - Create public repository
- `repo-fork` - Fork and clone

### Issues
- `issues` - List issues
- `issue-view <number>` - View issue
- `issue-create <title> <body>` - Create issue
- `issue-close <number>` - Close issue

### Pull Requests
- `prs` - List PRs
- `pr-view [number]` - View PR
- `pr-create` - Create PR
- `pr-checkout <number>` - Checkout PR
- `pr-merge [number]` - Merge PR
- `pr-diff [number]` - Show PR diff

### Releases & Workflows
- `releases` - List releases
- `workflows` - List workflows
- `runs` - List workflow runs

## File & System Operations

### File Management
- `ls` - Enhanced listing with eza
- `lt` - Tree view with git-ignore
- `touch <file>` - Create empty file
- `nf <name>` - New file
- `mkcd <dir>` - Make directory and cd into it

### Unix-like Commands
- `which <command>` - Find command location
- `grep <pattern> [dir]` - Search text
- `df` - List volumes
- `sudo <command>` - Run as administrator

### System Info
- `uptime` - Show system uptime
- `Get-PubIP` - Get public IP address
- `pstree` - Process tree
- `pkill <name>` - Kill process by name

## Development Tools

### VS Code
- `code-here` - Open current directory in VS Code
- `code-diff <file1> <file2>` - Compare files in VS Code

### Docker
- `docker-clean` - Clean up Docker system
- `docker-logs <container>` - Follow container logs

### Navigation
- `docs` - Go to Documents
- `desktop` - Go to Desktop
- `downloads` - Go to Downloads

## Profile Management

### Profile Functions
- `Edit-Profile` - Open profile in VS Code
- `Reload-Profile` - Reload PowerShell profile

### Claude Integration
- `claude-yolo` - Claude with --dangerously-skip-permissions
- `ccy` - Clear Z.AI Claude env overrides, then run claude with --dangerously-skip-permissions
