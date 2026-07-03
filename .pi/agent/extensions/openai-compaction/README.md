# OpenAI Compaction (local Pi extension)

Local copy of the OpenAI native compaction extension for Pi.

## What it does

- Hooks `session_before_compact`.
- Calls the OpenAI Responses compaction endpoint for supported OpenAI/OpenAI Codex models.
- Stores the opaque compacted window in the Pi compaction entry `details`.
- Hooks `before_provider_request` and rewrites later OpenAI Responses payloads to replay that compacted window instead of Pi's markdown shim summary.
- Fails open: unsupported model/provider/API, auth failures, endpoint errors, or replay mismatches fall back to Pi's default compaction.

## Local fix

The upstream package imports old `@mariozechner/*` package names. This local copy imports current `@earendil-works/*` package names used by installed Pi.

## Config

Edit `settings.json` in this directory, or override in `~/.pi/agent/settings.json`:

```json
{
  "openaiNativeCompaction": {
    "enabled": true,
    "debug": true,
    "logProviderPayloads": true,
    "logCompactResponses": true,
    "redactSensitiveData": true
  }
}
```

Environment variables use `PI_OPENAI_NATIVE_COMPACTION_`, for example:

```bash
PI_OPENAI_NATIVE_COMPACTION_DEBUG=1 pi
```

## Verify

```bash
cd ~/.pi/agent/extensions/openai-compaction
bun test src/unit.test.ts src/validation.test.ts
pi --no-extensions --no-skills --no-context-files -e ~/.pi/agent/extensions/openai-compaction --list-models openai-codex
```

Reload Pi after edits:

```text
/reload
```
