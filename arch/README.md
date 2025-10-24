# Arch Linux System Configuration

This directory contains your Arch Linux system configuration managed by [aconfmgr](https://github.com/CyberShadow/aconfmgr).

## What's Tracked

aconfmgr automatically captures:
- **Packages**: All explicitly installed packages (official repos + AUR)
- **Modified files**: Any changes to `/etc` and other system files (excluding kernels/boot files)
- **Systemd services**: Enabled/disabled services
- **File permissions**: Custom ownership and permissions

**Pre-configured to ignore**:
- Kernel files (`/boot/*`, `/usr/lib/modules/*`)
- Firmware and initramfs
- System-generated files (machine-id, logs, caches)
- Package manager databases

## Initial Setup

Run the setup script to capture your current system state:

```bash
cd ~/Projects/dotfiles
./arch/setup.sh
```

This will create configuration files in `arch/aconfmgr/` that describe your entire system.

## Daily Workflow

### Capturing Changes

Whenever you install new packages or modify system config:

```bash
cd ~/Projects/dotfiles
sudo aconfmgr -c arch/aconfmgr save
```

Review the changes:
```bash
git diff arch/aconfmgr/
```

Commit when you're happy:
```bash
git add arch/aconfmgr/
git commit -m "arch: update system snapshot"
git push
```

### Restoring on Fresh Install

1. Install Arch Linux (base system)
2. Install aconfmgr:
   ```bash
   # Install yay or another AUR helper first
   yay -S aconfmgr-git
   ```

3. Clone your dotfiles:
   ```bash
   git clone https://github.com/yourusername/dotfiles.git ~/Projects/dotfiles
   cd ~/Projects/dotfiles
   ```

4. Apply the configuration:
   ```bash
   sudo aconfmgr -c arch/aconfmgr apply
   ```

   This will:
   - Install all your packages
   - Restore modified system files
   - Enable systemd services
   - Set file permissions

5. Link your dotfiles (you already have this):
   ```bash
   ./link-dotfiles.sh
   ```

## Tips

- **Check diff before committing**: `aconfmgr -c arch/aconfmgr save` shows what changed
- **Dry run restore**: `sudo aconfmgr -c arch/aconfmgr apply` (review before confirming)
- **Ignore files**: Edit `arch/aconfmgr/*.sh` to add `IgnorePath` directives
- **Group packages**: Edit the generated config to organize packages logically

## Configuration Files

- `arch/aconfmgr/00-ignores.sh` - Pre-configured ignore rules (edit to customize)

After the initial save, you'll also see:
- `arch/aconfmgr/10-packages.sh` - Package lists
- `arch/aconfmgr/20-files.sh` - Modified system files
- `arch/aconfmgr/30-systemd.sh` - Service states
- `arch/aconfmgr/99-ignored.sh` - Auto-generated ignores

These are human-readable bash scripts you can edit directly.

## Common Commands

```bash
# Capture current state
sudo aconfmgr -c arch/aconfmgr save

# Preview what would be restored
sudo aconfmgr -c arch/aconfmgr apply

# Check for differences between system and config
sudo aconfmgr -c arch/aconfmgr check

# Inspect specific file
sudo aconfmgr -c arch/aconfmgr files /etc/pacman.conf
```

## Troubleshooting

**Config not found**: Make sure you're running from the dotfiles root, not the arch/ directory.

**Permission denied**: aconfmgr needs sudo to inspect system files.

**Want to ignore more files**: Edit `arch/aconfmgr/00-ignores.sh` and add more `IgnorePath` directives.
