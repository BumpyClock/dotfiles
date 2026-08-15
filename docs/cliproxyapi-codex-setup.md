# CLIProxyAPI + OpenAI Codex Setup

Local proxy that exposes OpenAI/Gemini/Claude/Codex-compatible APIs, backed by a
ChatGPT/Codex OAuth subscription (no API key needed for the upstream). This doc
records the exact steps used to install it on macOS and connect the OpenAI Codex
provider.

## Reference links

- Quick Start: <https://help.router-for.me/introduction/quick-start>
- Codex provider config: <https://help.router-for.me/configuration/provider/codex>
- Codex agent client: <https://help.router-for.me/agent-client/codex>
- Repo: <https://github.com/router-for-me/CLIProxyAPI>

## Steps

### 1. Install (Homebrew)

```bash
brew install cliproxyapi
```

- Binary: `/opt/homebrew/opt/cliproxyapi/bin/cliproxyapi`
- Default config: `/opt/homebrew/etc/cliproxyapi.conf`
- Default auth dir: `~/.cli-proxy-api`
- Default port: `8317`

### 2. Set the local API key

Clients authenticate to the *local proxy* with this key (upstream Codex uses
OAuth, not this key). Edit `/opt/homebrew/etc/cliproxyapi.conf`:

```yaml
api-keys:
  - "sk-dummy"
```

### 3. Connect the OpenAI Codex provider (OAuth)

```bash
cliproxyapi -codex-login
```

- Opens `https://auth.openai.com/oauth/authorize?...` in a browser.
- Callback listens on `http://localhost:1455/auth/callback`.
- Add `-no-browser` to print the URL instead of auto-opening.
- On success, credentials are written to
  `~/.cli-proxy-api/codex-<email>-<plan>.json`.

### 4. Run as a background service (auto-start on login/reboot)

```bash
brew services start cliproxyapi
```

- Installs LaunchAgent `~/Library/LaunchAgents/homebrew.mxcl.cliproxyapi.plist`
  with `RunAtLoad=true` (starts at login) and `KeepAlive=true` (auto-restart).
- For before-login start (LaunchDaemon): `sudo brew services start cliproxyapi`.

### 5. Verify

```bash
# List models (should include codex / gpt-5.x entries)
curl -s http://localhost:8317/v1/models \
  -H "Authorization: Bearer sk-dummy" | python3 -m json.tool

# Auth is enforced (returns 401 without a key)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8317/v1/models

# End-to-end chat through the Codex provider
curl -s http://localhost:8317/v1/chat/completions \
  -H "Authorization: Bearer sk-dummy" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-5.3-codex-spark","messages":[{"role":"user","content":"Reply with exactly: OK"}]}'
```

## Claude Code wrappers (local bin)

Dotfiles ship thin Claude Code launchers that point at this proxy
(`ANTHROPIC_BASE_URL=http://127.0.0.1:8317`, `ANTHROPIC_AUTH_TOKEN=sk-dummy`).
Sources live under `shell/bin/{zsh,powershell}/` and are copied to
`~/.local/bin` by `scripts/link-dotfiles/setup-dotfiles.ts`.

| Command | Default model env | Mapping |
| --- | --- | --- |
| `claudex` | fable | fable→`gpt-5.6-sol`, opus→`gpt-5.6-terra`, sonnet/haiku→`gpt-5.6-luna`, custom→`glm-5.2` |
| `claude-grok` | opus | opus→`grok-4.5`, fable→`gpt-5.6-sol`, sonnet/haiku→`glm-5.2`, custom→`gpt-5.6-terra` |

Requires `cliproxyapi` running (`brew services start cliproxyapi`) with the
models above exposed on `/v1/models`.

## Notes / pitfalls

- `--version` is informational only; the flag parser rejects `-version` (use no
  flag or `-config`). This is cosmetic.
- OAuth login requires a running desktop session for the browser callback on
  port `1455`; if `1455` is busy, close whatever holds it or use
  `-oauth-callback-port`.
- Config is hot-reloaded — editing `cliproxyapi.conf` (e.g. adding api-keys or
  Codex options) does not require a full restart, but `brew services restart
  cliproxyapi` is the safe reset.
- The `sk-dummy` key only guards the local proxy; keep the proxy bound to
  localhost (`host: ""` binds all interfaces — set `host: "127.0.0.1"` to
  restrict to local machine).
