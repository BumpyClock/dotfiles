# Ghostty SSH Terminfo Fix

> read_when: Ghostty terminal, SSH garbled output, xterm-ghostty errors, terminfo missing

## Problem
Ghostty sets `TERM=xterm-ghostty`. Remote hosts without that terminfo entry produce:
- `missing or unsuitable terminal: xterm-ghostty`
- Garbled rendering (backspace renders as forward space, broken clear)
- Broken TUI apps (vim, htop, less)

## Root Cause
Ghostty ships its own terminfo (`xterm-ghostty`) to advertise capabilities beyond `xterm-256color` (Kitty keyboard protocol, synchronized rendering, styled underlines). Remote hosts lack this entry. ncurses >= 6.5-20241228 includes it, but most distros haven't caught up yet (as of early 2026).

## Fixes (pick one)

### 1. Copy terminfo to remote (best: full feature support)
```bash
infocmp -x xterm-ghostty | ssh REMOTE_HOST -- tic -x -
```
Installs into `~/.terminfo/` on remote. One-time per host.

### 2. Ghostty shell-integration (automated, v1.2.0+)
In `~/.config/ghostty/config`:
```
shell-integration-features = ssh-terminfo,ssh-env
```
- `ssh-terminfo` — auto-installs terminfo on first SSH to new host
- `ssh-env` — falls back to `TERM=xterm-256color` + propagates COLORTERM, TERM_PROGRAM, TERM_PROGRAM_VERSION
- Combined: tries install first, falls back if it fails

### 3. SSH config fallback (quick fix, loses some features)
```
# ~/.ssh/config
Host *
  SetEnv TERM=xterm-256color
```
Requires OpenSSH >= 8.7. Loses styled underlines and some Ghostty-specific features.

### 4. Shell RC conditional
```bash
# ~/.zshrc on remote
[[ "$TERM_PROGRAM" == "ghostty" && ! -e "/usr/share/terminfo/x/xterm-ghostty" ]] && export TERM=xterm-256color
```

## Sudo caveat
`sudo` resets env vars including TERMINFO. Fix:
- `shell-integration-features = sudo` in Ghostty config, OR
- Add `Defaults env_keep += "TERMINFO"` to sudoers

## macOS caveat
Pre-Sonoma: system `infocmp` too old. Use `brew install ncurses` then `/opt/homebrew/opt/ncurses/bin/infocmp`.

## Sources
- https://ghostty.org/docs/help/terminfo
- https://github.com/ghostty-org/ghostty/discussions/3161
- https://vninja.net/2024/12/28/ghostty-workaround-for-missing-or-unsuitable-terminal-xterm-ghostty/
- https://travis.media/blog/ghostty-ssh-unknown-terminal-error/
