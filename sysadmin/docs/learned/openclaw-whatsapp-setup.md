# OpenClaw WhatsApp Setup

## Status
- Linked and connected as of 2026-01-31
- Phone: +14254035231 (personal number, selfChatMode)

## Config
- File: `~/.openclaw/openclaw.json` → `channels.whatsapp`
- DM policy: allowlist (only own number)
- Group policy: allowlist
- Credentials: `~/.openclaw/credentials/whatsapp/default/creds.json`

## Known Issues
- `openclaw channels login` may save creds but not hand off cleanly to gateway
- Fix: `openclaw gateway restart` after scanning QR — gateway picks up saved `creds.json`
- QR codes cycle every ~20s; ~5 attempts before timeout (408)
- Bun runtime not supported for WhatsApp (Baileys); must use Node

## Useful Commands
```bash
openclaw channels status          # check link state
openclaw channels login --channel whatsapp  # re-link (QR scan)
openclaw channels logout --channel whatsapp # unlink
openclaw gateway restart          # restart gateway (systemd)
openclaw doctor                   # health check
openclaw logs --follow            # live logs
```

## Sources
- https://docs.openclaw.ai/channels/whatsapp
- https://github.com/openclaw/openclaw
