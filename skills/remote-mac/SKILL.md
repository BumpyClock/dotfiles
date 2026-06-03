---
name: remote-mac
description: "Remote Macs: MacBook, Mac Studio, clawmac, Tailscale, SSH, OpenClaw."
---

# Remote Mac

Use when the user says `MacBook`, `Mac Studio`, `framed` Tailscale, or asks to run/check something on one of Aditya's Macs.

## Aditya's Devices

- Primary daily driver: Aditya's MacBook Pro, and Aditya's Mac Studio, local host `adityas-macstudio`, Tailscale `adityas-macbook-pro-1`.
- Workhorse: Mac Studio, Tailscale `adityas-mac-studio`, usually best reached as `adityasharma@adityas-macstudio.local`.
- Framed: runs on arch linux, not `moltymac`, when healthy. Expected runtime is tmux session, details in `~/sysadmin` folder on that machine.

Manager repo source of truth:

- `/Users/adityasharma/Projects/manager/computers.yaml`
- `/Users/adityasharma/Projects/manager/agents.yaml`

## Discovery

1. Start with `tailscale status` and pick the matching host.
2. If Tailscale is down or SSH times out, try LAN discovery:

```bash
dns-sd -B _ssh._tcp local
arp -a
```

3. Try mDNS names such as `HOST.local` when visible.
4. For Mac Studio, prefer `steipete-macstudio.local` when Tailscale SSH times out.

## SSH Rules

Use non-interactive SSH by default:

```bash
ssh -o RequestTTY=no -o RemoteCommand=none HOST 'COMMAND'
```

The local SSH alias `adityas-mac-studio` auto-attaches tmux. For one-shot commands,

For long-running or interactive remote work, use tmux on the remote host and keep the session name obvious.

## OpenClaw Checks

Use login shells on remote Macs so Homebrew and pnpm are on PATH:

```bash
ssh -o RequestTTY=no -o RemoteCommand=none steipete@steipete-macstudio.local \
  'zsh -lc "openclaw gateway status --json; openclaw channels status --json"'
```

Mac Studio / Molty healthy shape:

- `tmux list-sessions` includes `openclaw-gateway-watch-main`.
- `ps axww` includes `pnpm gateway:watch --benchmark`.
- `lsof -nP -iTCP:18789 -sTCP:LISTEN` shows a listener on `*:18789`.
- `openclaw channels status --json` shows Discord `Molty`, Slack, and Telegram connected.

clawmac healthy shape:

## Safety

- Do not assume host identity from a stale IP; verify hostname/user when possible.
- Do not print secrets from remote files or shells.
- If a host is unavailable after Tailscale + LAN fallback, say what was tried.
- For OpenClaw Gateway on Peter's machines, follow repo docs/AGENTS; do not install/start/stop services unless asked.
