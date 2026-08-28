# General utility scripts

## Link dotfiles

`link-dotfiles/` holds the linker, a Bun-based script that links dotfiles into place. For first-run setup, run the root `bootstrap.sh` on Unix and macOS, or `bootstrap.ps1` on Windows. Each bootstrap script provisions OS dependencies, then invokes the linker once. You can also run the linker directly, as shown below, to re-apply links or check status.

```bash
# Link everything
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD"

# Show current status
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --show

# Remove only the managed shell profile block for this platform
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --remove-shell-profile
```

Internal modules:

- `scripts/link-dotfiles/install-tools.ts`
- `scripts/link-dotfiles/managed-block.ts`
- `scripts/link-dotfiles/fs-utils.ts`

During setup, the linker installs the CLI sources in `tools/` into `~/.local/bin`. It compiles TypeScript and JavaScript entrypoints into native binaries with Bun, and links other shebang scripts in place. If `secrets/api-keys/env.json` exists, the linker also renders it into `~/.config/dotfiles/env.sh` and `~/.config/dotfiles/env.ps1`.

The linker does not symlink shell profiles. The native `~/.zshrc` and PowerShell profile files stay owned by the machine. The linker only writes a small managed block into each file, delimited by `# >>> dotfiles zsh start` and `# <<< dotfiles zsh end`, or their PowerShell equivalents. The block sources the repo baseline, `shell/zsh/shared.zsh` or `shell/powershell/shared.ps1`, and a machine-local override. The linker leaves everything outside the markers untouched, including installer appends such as pnpm. Add machine-specific config to `~/.zshrc.local`, or to `profile.local.ps1` next to each profile. The linker seeds those files once and never overwrites them. If the markers get corrupted, the linker logs a `[CONFLICT]` message and leaves the file for you to fix by hand. `--remove-shell-profile` removes only that managed block, zsh on Unix or the PowerShell profile targets on Windows, without running any other linking or setup work.

Windows behavior:
- Directory links use junctions (no elevation required).
- File-link attempts fall back to hardlinks if symlink policy blocks them.

## Other scripts

### `setup-github-runner.sh`

```bash
sudo ./setup-github-runner.sh
```

### `sync-github-folder.sh` and `sync-github-folder.ps1`

```bash
./sync-github-folder.sh /path/to/project
```

```powershell
.\sync-github-folder.ps1 -TargetPath "C:\path\to\project"
```
