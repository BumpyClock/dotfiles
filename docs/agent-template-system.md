---
summary: 'How agent templates compile into Claude, Copilot, OpenCode, and Codex agent configs from one shared markdown source.'
read_when:
  - Updating agent prompts, model mappings, or generated agent outputs.
  - Debugging why Claude, Copilot, OpenCode, or Codex agent configs differ.
---

# Agent template system

## Source of truth

Canonical agent templates live in:

- `agent-templates/*.md`

Each template is a markdown agent file with frontmatter:

- `name`
- `description`
- optional common fields such as `tools`
- `model_class`
- optional `model_profile`
- optional provider blocks like `claude:`, `copilot:`, `opencode:`, and `codex:`

`model_class` is required. Current classes:

- `fast`
- `balanced`
- `strong`

`model_profile` is optional. Current profiles:

- `economy`

Profiles are provider-specific overrides. If a provider/class combination does not define the requested profile in `agent-templates/config.toml`, the compiler falls back to that provider/class `default` model.

## Model mapping

Global provider model mappings live in:

- `agent-templates/config.toml`

This file controls:

- Claude model output
- Copilot model output
- OpenCode model output
- Codex model output

If a provider model name changes, update `agent-templates/config.toml` instead of editing individual templates.

Current resolution flow:

1. template declares `model_class`
2. template optionally declares `model_profile`
3. compiler loads provider mappings from `agent-templates/config.toml`
4. compiler merges provider-specific frontmatter blocks from the template
5. generated output gets concrete Claude, Copilot, OpenCode, or Codex model name

Per-agent provider-specific settings live in the template frontmatter itself, for example:

- `claude.color`
- `copilot.tools` or other future Copilot-only keys
- `opencode.mode`, `opencode.permission`, or other OpenCode-only keys
- `codex.description`
- `codex.model_reasoning_effort`
- `codex.web_search`
- `codex.personality`
- `codex.suppress_unstable_features_warning`
- `codex.tui_status_line`

## Generated outputs

Compiled agent configs are written to:

- `agent-templates/dist/claude/*.md`
- `agent-templates/dist/copilot/*.md`
- `agent-templates/dist/opencode/*.md`
- `agent-templates/dist/codex/*.toml`

The compile entrypoint is:

- `agent-templates/scripts/compile-agents.ts`

From `agent-templates/scripts/` you can run:

```bash
bun run compile-agents
```

Or from repo root:

```bash
bun .\agent-templates\scripts\compile-agents.ts --dotfiles-dir C:\Users\adityasharma\Projects\dotfiles
```

## Deploy flow

`setup-ai-agents.ts` compiles templates before deploying generated agents.

`scripts/ai-agent-links.json` now uses mirror-copy deploy for generated provider agent directories:

- Claude -> `agent-templates/dist/claude`
- Copilot -> `agent-templates/dist/copilot`
- OpenCode -> `agent-templates/dist/opencode`
- Codex -> `agent-templates/dist/codex`

Generated home-directory `agents` folders are copied from `agent-templates/dist/*`, not symlinked.

Source-authored shared content like `prompts`, `docs`, `skills`, `AGENTS.md`, and `tools.md` still uses links.

Home-directory agent paths should never point directly at `agent-templates/`.

## Archives

Legacy hand-maintained agent files are preserved in:

- `agents-archive/*.md`
- `agents-archive/codex/*.toml`

Use these for migration reference and parity checks only. Do not edit them as active source.

## Validation

Coverage lives in:

- `scripts/link-dotfiles/agent-compiler.test.ts`
- `scripts/link-dotfiles/setup-ai-agents.test.ts`

Current validation checks:

- shared templates load correctly
- Claude output matches current template frontmatter and body
- Copilot output uses mapped model IDs from current provider config
- OpenCode output uses provider-prefixed model IDs and subagent mode
- Codex output matches current template metadata while using shared markdown body
- deploy config marks generated provider agent directories for mirror-copy

Tests intentionally derive expected model IDs from the current `agent-templates/config.toml` mappings instead of pinning to archived model IDs. This keeps the validation aligned with the design goal that provider model mappings are user-editable.

Run:

```bash
bun test .\scripts\link-dotfiles
```

## Adding or changing an agent

1. Edit or add `agent-templates/<agent>.md`
2. If provider model mappings change, update `agent-templates/config.toml`
3. If agent-specific provider behavior changes, update the relevant `claude:`, `copilot:`, `opencode:`, or `codex:` block inside the template
4. Run compiler/tests
5. Re-run `setup-ai-agents.ts` if you want home-directory agent deploys refreshed

## Special cases

`agent-templates/os2020.md` is not part of the generated system because it does not use standard agent frontmatter. The compiler skips files without valid frontmatter.

Codex output is generated only for templates that define a `codex:` block. If that block is missing, Claude, Copilot, and OpenCode files are still generated, but no Codex TOML file is emitted.

OpenCode markdown agents are emitted to `~/.config/opencode/agents/`. Their model mappings mirror Copilot mappings, but use OpenCode's required `provider/model-id` format.
