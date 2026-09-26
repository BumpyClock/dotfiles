---
name: t3-code
description: >
  Set up and modify T3 Code provider instances: run the Claude Code or Codex harness
  against arbitrary models served by the local CLIProxyAPI. Covers adding instances
  (e.g. Claude Code backed by Codex GPT models), remapping the fable/opus/sonnet/haiku
  model slots, and adding custom models. Use when asked to add, rewire, or debug model
  backends and instances in T3 Code.
---

# T3 Code provider instances

T3 Code launches agent CLIs (Claude Code, Codex, Cursor agent) as "provider instances",
each with its own env and config home. Instances can point at CLIProxyAPI so any
backend model (GPT, GLM, Grok, Copilot models) runs under any harness.

## Where things live

- `~/.t3/userdata/settings.json` — `providerInstances.<id>`: `driver`
  (`claudeAgent` | `codex` | `cursor`), `displayName`, `environment` (env vars injected
  at launch), `config.binaryPath` / `homePath` / `customModels`.
- `~/.t3/userdata/client-settings.json` — `providerModelPreferences.<id>.hiddenModels`
  hides built-in Claude models so only custom models show in the picker.
- `~/.t3/userdata/connection-catalog.json` — encrypted; never edit.
- `~/.t3/caches/<id>.json` — per-instance status snapshot (useful for checking what
  T3 currently sees).

Write behavior (observed): T3 reads `settings.json` at startup and writes it only when
settings change in the UI. Editing it under a running app works, but any UI settings
change before restart clobbers the edit. Always restart T3 Code after editing.

Secrets: T3 saves sensitive env values redacted (`valueRedacted: true`) and injects the
real value from its secret store at launch. A hand-written instance with a literal
`value` and no `valueRedacted` works fine.

## Claude Code instances (driver `claudeAgent`)

Launched with `CLAUDE_CONFIG_DIR=<homePath>` plus the instance env. Model slots map via
env vars, all pointing at proxy model ids:

- `ANTHROPIC_MODEL` — default / fable slot
- `ANTHROPIC_DEFAULT_OPUS_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL`,
  `ANTHROPIC_DEFAULT_HAIKU_MODEL`

### Shadow home (homePath)

Create a fresh home per instance (e.g. `~/.claude-t3-codex`):

1. Copy `.claude.json` from an existing instance home — carries onboarding and project
   trust state so no interactive setup is needed.
2. Write `settings.json`. Its `env` map overrides process env, so it doubles as
   auth that survives even if T3 injects an empty token:
   `{"model": "<default slug>", "env": {"ANTHROPIC_BASE_URL": "http://127.0.0.1:8317", "ANTHROPIC_AUTH_TOKEN": "<proxy api key>"}}`
3. Write `models.json` — a JSON array of the custom model slugs.

## CLIProxyAPI (127.0.0.1:8317)

Config: `~/.config/cliproxyapi/config.yaml`. The API key is the non-`sk-dummy` entry
in its `api-keys` list. Serves OpenAI-compatible `/v1/models` and `/v1/responses`, and
the Anthropic-compatible `/v1/messages` that Claude Code instances use.

Backend naming on this proxy:

- cursor backend: `cursor/<model>`; effort suffixes work (`cursor/grok-4.7-high`)
- github-copilot backend: `github-copilot/<model>`
- codex backend (ChatGPT subscription): plain `gpt-*` (e.g. `gpt-6-astra`);
  effort suffixes do NOT work
- z.ai backend: plain aliases (e.g. `GLM-5.3`)

Model availability differs per backend — list what is actually served rather than
assuming (daybreak models, for example, are not on the proxy's codex backend):

```sh
curl -s -H "Authorization: Bearer $KEY" http://127.0.0.1:8317/v1/models
```

## Procedure

1. List `/v1/models`, pick slugs for the slots the user asked for.
2. Smoke-test every chosen slug through the Anthropic endpoint before wiring:
   ```sh
   curl -s http://127.0.0.1:8317/v1/messages \
     -H "x-api-key: $KEY" -H "anthropic-version: 2023-06-01" -H "content-type: application/json" \
     -d '{"model":"<slug>","max_tokens":16,"messages":[{"role":"user","content":"Reply with exactly: OK"}]}'
   ```
3. Create the shadow home as above.
4. Headless end-to-end test — strip inherited Anthropic vars so the home's own
   settings env is what's being tested:
   ```sh
   env -u ANTHROPIC_BASE_URL -u ANTHROPIC_AUTH_TOKEN -u ANTHROPIC_API_KEY -u ANTHROPIC_MODEL \
     -u ANTHROPIC_DEFAULT_OPUS_MODEL -u ANTHROPIC_DEFAULT_SONNET_MODEL -u ANTHROPIC_DEFAULT_HAIKU_MODEL \
     CLAUDE_CONFIG_DIR=<home> claude -p --model <slug> 'Reply with exactly: OK'
   ```
5. Back up then edit both T3 files (python json round-trip, keep backups with
   timestamped suffixes next to the originals). Add the instance to
   `providerInstances`, mirror an existing instance of the same driver for unknown
   fields. Hide built-ins in `client-settings.json` by copying the `hiddenModels`
   list from an existing claudeAgent instance.
6. Tell the user to restart T3 Code fully and not to change UI settings first.

## Gotchas

- The proxy key sits in plaintext in the T3 settings, the shadow home settings.json,
  and the cliproxyapi config. Keep all three out of synced/shared locations.
- Claude Code warns that proxy model ids aren't in its catalog and assumes a 200k
  window. Harmless; the request still succeeds.
- Slots the user didn't specify need a choice anyway — state which model was picked
  for each unspecified slot so it can be flipped later.
