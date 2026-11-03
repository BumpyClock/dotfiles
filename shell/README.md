# Shell configurations

Shell configurations and shell-specific setup scripts.

## Directory structure

### `zsh/`

- `.zshrc`
- `shared.zsh`
- `anthropic.zsh`
- `install-deps.sh`

### `powershell/`

- `shared.ps1`

## Usage

### First-run bootstrap

Use the root bootstrap script on a new machine. It installs OS dependencies, then runs the linker once.

```bash
# Unix and macOS
./bootstrap.sh
```

```powershell
# Windows
.\bootstrap.ps1
```

### Zsh setup

```bash
# Installs only OS-level dependencies (packages, plugins, Bun). Does not touch ~/.zshrc.
./zsh/install-deps.sh

# Full setup from the repo root. Links dotfiles and writes the managed ~/.zshrc block.
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD"
```

On Unix and macOS, the linker owns only a managed block inside `~/.zshrc`. That block sources `shell/zsh/shared.zsh`, then `~/.zshrc.local`. The linker backs up existing unmanaged `~/.zshrc` content once, then keeps it after the managed block, so installer snippets such as pnpm survive a rerun.

To remove only the managed block and keep everything else untouched, run:

```bash
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD" --remove-shell-profile
```

The linker also appends this guard to `~/.zshenv` on Unix/macOS if the line is not already present. Existing content is preserved, and reruns do not duplicate or rewrite an existing guard.

```zsh
[[ ! -o interactive && ( -n $CLAUDECODE || -n $CODEX_THREAD_ID ) ]] && setopt sh_word_split no_nomatch no_equals
```

Only noninteractive Claude Code or Codex shells get word splitting, literal unmatched globs, and literal leading equals signs. Interactive shells and other noninteractive shells keep their existing options. This guard is independent of the managed `.zshrc` block, so `--remove-shell-profile` leaves it in place. `--show` does not install it.

### Zsh startup performance

Startup keeps Oh My Zsh, completion security checks, autosuggestions, syntax highlighting, fnm directory switching, Starship, fzf, and managed environment loading enabled. Nothing is deferred until the first command.

Refresh native zsh bytecode after installing or updating shell tools:

```bash
zsh -f shell/zsh/compile-startup.zsh
```

This explicit maintenance step compiles `shared.zsh`, Oh My Zsh libraries, highlighting/autosuggestion implementations, and Bun completions beside their source files. It adds no startup hook. zsh falls back to source when a file is newer or bytecode is incompatible. Rerun to restore the speed benefit after updates. Machine-local `.zwc` files are ignored by Git. User profiles and the alias-dependent Git plugin remain interpreted. fnm's per-shell environment is never cached.

Measure the real installed configuration from a representative working directory:

```bash
python3 shell/zsh/profile-startup.py --runs 20
python3 shell/zsh/profile-startup.py --zprof
python3 shell/zsh/test-startup.py
```

The profiler reports warm median and p10/p90 for no-rc, interactive, login, and terminal-ready shells. Terminal-ready includes the first prompt and ZLE setup, not only `.zshrc`. It uses a disposable history copy. `--zprof` loads instrumentation before startup instead of sourcing `.zshrc` twice. Timings and profiles contain no environment dump or command trace.

[Measured bottlenecks, results, and verification](../docs/zsh-startup-profile.md).

### Cross-platform linking

Run the linker from the repo root:

```bash
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD"
```

```powershell
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD"
```

### `launchers.json`

The single source of truth for `cz`, `ccy`, `claudex`, `claude-grok`, and `claude-muse`. The linker generates executable Bash scripts on macOS/Linux and `.ps1` scripts on Windows in `~/.local/bin`. Both shell baselines make that directory available on `PATH`; adding a launcher needs no profile edits.

Each entry defines `title`, `command`, `args`, and `env`, plus an optional `unset` array. Environment values are strings or references to existing environment variables:

```json
{
  "cz": {
    "title": "Claude Code - Zai",
    "command": "claude",
    "args": ["--dangerously-skip-permissions"],
    "env": {
      "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
      "ANTHROPIC_AUTH_TOKEN": { "fromEnv": "ZAI_API_KEY" }
    }
  }
}
```

Keep API key values in `secrets/api-keys/env.json`, not this manifest. Shell profiles already load those keys through the generated `~/.config/dotfiles/env.sh` or `env.ps1`. Launchers resolve `fromEnv` references at launch time and report an error if a required variable is missing or empty. Keys are never embedded in the launcher scripts. PowerShell launchers restore modified environment variables when the command finishes, including on errors.

`cz` configures a 1,000,000-token context limit and a 900,000-token auto-compaction window for its GLM-5.3 and GLM-5.3 Flash model mappings.

The retired `ck` launcher is no longer generated. The linker removes previously managed copies from `~/.local/bin`, leaving unrelated commands with that name untouched.

After changing the manifest, rerun the linker on each machine:

```bash
bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD"
```

After rotating keys in the secrets submodule, rerun the linker to refresh the managed environment files and start a new terminal or reload the applicable environment file. `sync.sh` and `sync.ps1` only update Git content; they do not run the linker. Reload the PowerShell profile or start a new terminal once after migrating from the old per-command forwarding functions.

### `Brewfile`

Homebrew dependencies for macOS setup.

## Notes

- The linker updates only the block between `# >>> dotfiles zsh start` and `# <<< dotfiles zsh end`. Content outside that block belongs to you or other tools, and the linker preserves it.
- Use `~/.zshrc.local` for machine-specific PATH tweaks, aliases, and env vars. The managed block sources it after the shared baseline, and the linker never overwrites it.
- zsh loads managed env from `secrets/api-keys/env.json` through `~/.config/dotfiles/env.sh`. PowerShell loads it through `~/.config/dotfiles/env.ps1`.
- `shell/zsh/shared.zsh` sets `PNPM_HOME` and other cross-platform defaults only when they are not already set. `PNPM_HOME` defaults to `~/Library/pnpm` on macOS and `~/.local/share/pnpm` elsewhere.
- `install-deps.sh` only provisions OS-level dependencies: packages, zsh plugins, and Bun. It never writes links or config. `bootstrap.sh` and `bootstrap.ps1` call the linker afterward.
- `scripts/link-dotfiles/` is the source of truth for linking.
