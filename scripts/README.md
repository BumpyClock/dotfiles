# General Utility Scripts

## Link Dotfiles

`link-dotfiles/` contains the Bun-based linker workflow. For first-run setup, use the root `bootstrap.sh` (Unix/macOS) or `bootstrap.ps1` (Windows), which provision OS dependencies and then invoke this linker exactly once. The linker itself is also the routine re-apply/status command below.

```bash
# Interactive: choose dotfiles, ai-agents, or both
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD"

# Non-interactive
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup dotfiles
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup ai-agents
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --setup both

# Show current status (dotfiles/tools and AI-agent links)
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --show

# Remove only the managed shell profile block for this platform
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --remove-shell-profile
```

Internal scripts:
- `scripts/link-dotfiles/setup-dotfiles.ts`
- `scripts/link-dotfiles/setup-ai-agents.ts`
- `scripts/ai-agent-links.json`

During dotfiles setup, CLI sources in `tools/` are installed into `~/.local/bin`.
TypeScript/Bun entrypoints are compiled into native binaries, and non-TypeScript shebang scripts are linked in place.
Managed secrets in `secrets/api-keys/env.json` are rendered into `~/.config/dotfiles/env.sh` and `~/.config/dotfiles/env.ps1` during setup.

Shell profiles are not symlinked. The native `~/.zshrc` and PowerShell profile stay machine-owned; setup only writes a small marker-delimited managed block into each (between `# >>> dotfiles zsh start`/`# <<< dotfiles zsh end` and the PowerShell equivalents). The block sources the repo baseline (`shell/zsh/shared.zsh`, `shell/powershell/shared.ps1`) and a machine-local override. Anything outside the markers, including installer appends like pnpm, is left untouched. Put machine-specific config in `~/.zshrc.local` or the `profile.local.ps1` next to each profile; those files are seeded once and never overwritten. If the markers get corrupted, setup logs a `[CONFLICT]` and leaves the file for you to fix by hand. `--remove-shell-profile` removes only that managed block (zsh on Unix, the PowerShell profile targets on Windows) without running any other linking or setup work.

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
