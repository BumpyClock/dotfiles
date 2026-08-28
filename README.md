# Dotfiles

Personal dotfiles and system configuration for macOS, Linux, and Windows.

**Note:** AI agent configurations (prompts, skills, agents) have been moved to the [agent-templates](https://github.com/BumpyClock/agent-templates) repository. Local clones of agent marketplaces and vendored skills (`agents/`, `agents-reference/`, `skills/`) can sit in the working tree. They are gitignored and not part of this repo.

## Repository layout

```text
dotfiles/
├── bootstrap.sh               # first-run bootstrap for Unix and macOS
├── bootstrap.ps1              # first-run bootstrap for Windows
├── sync.sh                    # pull and update submodules (Unix)
├── sync.ps1                   # pull and update submodules (Windows)
├── tools.md                   # reference for the installed CLI tools
├── shell/                     # shell configurations
│   ├── zsh/
│   ├── powershell/
│   ├── bin/                   # wrapper scripts installed into ~/.local/bin
│   └── Brewfile
├── scripts/
│   ├── link-dotfiles/         # the linker (see Linker CLI)
│   └── ...                    # setup-github-runner.sh, sync-github-folder.{sh,ps1}
├── tools/                     # Bun-based TypeScript helpers
├── docs/
├── sysadmin/
├── terminal-profiles/
├── .github/
└── secrets/                   # private submodule
```

The tree is abbreviated. Run `git ls-files` for the full tracked set.

## Quick start

```bash
git clone --recurse-submodules https://github.com/BumpyClock/dotfiles.git
cd dotfiles
```

### Unix, Linux, and macOS

```bash
./bootstrap.sh
```

`bootstrap.sh` installs OS-level dependencies with `shell/zsh/install-deps.sh`, then runs the linker once. It passes extra arguments to the linker, for example `./bootstrap.sh --skip-submodules`.

### Windows (PowerShell)

```powershell
.\bootstrap.ps1
```

`bootstrap.ps1` calls `shell/powershell/setup.ps1` to provision tools, then runs the linker once. It accepts `-Optional`, `-SkipModules`, `-DryRun`, and `-SkipSubmodules`.

On Windows, the linker creates directory links as junctions, which need no elevation. File links are symlinks, which need Developer Mode or an elevated shell. There is no hardlink fallback.

After bootstrap, run the linker directly to re-apply links or to check status. See the Linker CLI section. This skips dependency provisioning.

## Linker CLI

The linker is `scripts/link-dotfiles/link-dotfiles.ts`.

```bash
# Link everything
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD"

# Status
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --show

# Remove only the managed shell profile block for this platform (zsh on Unix, PowerShell profile on Windows)
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --remove-shell-profile
```

The linker also installs the CLI sources in `tools/` into `~/.local/bin`. It compiles TypeScript tools to native binaries and links other shebang scripts in place.

If `secrets/api-keys/env.json` exists, the linker renders it to `~/.config/dotfiles/env.sh` and `~/.config/dotfiles/env.ps1`. The shell baseline sources that file. The linker also fills the `cz` and `ck` wrapper scripts from `ZAI_API_KEY` and `KIMI_API_KEY` in the same file.

On Unix and macOS, the linker owns one managed block in `~/.zshrc`. The block sources `shell/zsh/shared.zsh` and then `~/.zshrc.local`. The linker backs up an unmanaged `~/.zshrc` once, to a file such as `~/.zshrc.backup.20260518_143000`, and keeps the old content after the block. Put machine-specific shell config in `~/.zshrc.local`.

## Platform support

- **macOS**: Full support (Homebrew + zsh)
- **Linux**: Full support (distro-specific packages, zsh or bash)
- **Windows**: Full support (PowerShell)

## Integration with agent workspace

After installing system dotfiles, install AI agent configurations from the separate [agent-templates](https://github.com/BumpyClock/agent-templates) repository:

```bash
cd ~/Projects
git clone https://github.com/BumpyClock/agent-templates.git
cd agent-templates
./bootstrap.sh
```

This separation allows:
- independent versioning for system configs and AI configs
- easier syncing across machines without breaking AI tool configurations
- smaller, more focused repositories

## Submodules

```bash
git submodule update --init --recursive
```

## References and attribution

- `skills/ux-designer` micro-polish guidance adapts principles from Jakub Krehel's ["Details that make interfaces feel better"](https://jakub.kr/writing/details-that-make-interfaces-feel-better).
- Related upstream skill: [`jakubkrehel/make-interfaces-feel-better`](https://github.com/jakubkrehel/make-interfaces-feel-better).
- `skills/ios-macos-development` includes adapted material from OpenAI's MIT-licensed `Build iOS Apps` plugin (`build-ios-apps`, v0.1.0), covering App Intents, SwiftUI UI patterns, SwiftUI performance audits, SwiftUI view refactors, Liquid Glass, and XcodeBuildMCP simulator debugging.
- Reference source for the iOS/macOS skill update: OpenAI curated `build-ios-apps` plugin metadata points to [`openai/plugins`](https://github.com/openai/plugins).
- Some SwiftUI subguides retain or adapt prior material from Dimillian's `Dimillian/Skills`; navigation examples also reference [`Dimillian/AppRouter`](https://github.com/Dimillian/AppRouter).
- `skills/ios-macos-development/swiftui-view-refactor/references/mv-patterns.md` is inspired by Thomas Ricouard's "SwiftUI in 2025: Forget MVVM".
- `skills/rust-skills` is tracked from Leonardo Montini's MIT-licensed [`leonardomso/rust-skills`](https://github.com/leonardomso/rust-skills) project; its metadata cites the Rust API Guidelines, Rust Performance Book, and patterns from ripgrep, Tokio, Serde, and Polars.

## Notes

- The linker owns one managed block in `~/.zshrc`. See the Linker CLI section.
- The linker creates a `~/.dotfiles` symlink for portable config resolution.
- The linker manages environment variables, such as API keys, in `~/.config/dotfiles/env.sh`. It generates that file from `secrets/api-keys/env.json`.
- `scripts/sync-github-folder.{sh,ps1}` remain available for project-level `.github` syncing.
- `tools/trash.ts` moves files and directories to the system trash on macOS, Windows, and Linux. Linux support is best-effort, through the underlying XDG-compatible backend.
