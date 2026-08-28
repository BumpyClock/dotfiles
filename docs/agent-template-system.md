---
summary: "Where the agent template system lives now and how this repo relates to it."
read_when:
  - Looking for agent templates, the compiler, or generated agent configs.
  - Debugging why Claude, Copilot, OpenCode, Codex, or Pi agent configs differ.
---

# Agent template system

The agent template system no longer lives in this repo. It moved to
[BumpyClock/agent-templates](https://github.com/BumpyClock/agent-templates),
which is cloned to `~/Projects/agent-templates`.

That repo owns:

- the markdown templates and `config.toml` model mappings
- the compiler and its tests
- the generated Claude, Copilot, OpenCode, Codex, and Pi agent configs
- the deploy step that copies generated agents into home directories
- `agents-archive/`, the legacy hand-maintained agent files kept for reference

Read its `docs/` directory for details. Start with `docs/architecture.md` and `docs/usage.md`.

## How this repo relates

- `bootstrap.sh` prints the clone and bootstrap commands for `agent-templates` after it links dotfiles.
- This repo links only shared, hand-written content: `skills/`, `.github/`, and `tools/`.

## Set up a new machine

1. Run `./bootstrap.sh` in this repo.
2. Clone `agent-templates` to `~/Projects/agent-templates`.
3. Run `./bootstrap.sh` in `agent-templates`.
