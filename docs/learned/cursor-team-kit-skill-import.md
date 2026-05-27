---
summary: "How Cursor Team Kit skills were adapted into this dotfiles skill system."
read_when:
  - Importing external skill packs.
  - Deciding whether workflow skills should be standalone or merged into parent skills.
  - Updating subagent-driven-development with orchestration ideas.
---

# Cursor Team Kit skill import

## Decision

- Keep standalone skills when the trigger is user-facing and not always tied to coding:
  - `verify-this`
  - `workflow-from-chats`
  - `weekly-review`
  - `what-did-i-get-done`
  - `pr-review-canvas`
- Fold git-adjacent skills into `skills/git-workflow`:
  - `make-pr-easy-to-review`
  - `get-pr-comments`
  - `fix-merge-conflicts`
  - `fix-ci`
- Fold `deslop` into `skills/programming` and `agent-templates/reviewer.md`.

## Why

The existing repo pattern favors one live parent skill for safety-sensitive domains, especially git. Duplicating PR comments, CI repair, and merge conflict rules as separate top-level skills would create drift around push consent, destructive operations, and `gh` usage.

Verification stays standalone because users often ask to verify a claim outside an implementation turn. It still complements programming's evidence-before-claims rule.

PR review canvas stays standalone because it includes bundled HTML/CSS/JS assets and produces a distinct review artifact, not a normal PR operation.

## Orchestrate vs local SDD

Cursor's `orchestrate` skill is stronger for very large, long-running cloud-agent trees because it uses isolated clones, script-owned JSON state, one-shot workers, structured handoffs, verifier nodes, and no sibling cross-talk.

Local `subagent-driven-development` is stronger for this repo's normal workflow because it uses `tsq`, respects local git safety rules, avoids implicit branch/clone changes, and keeps integration and final evidence under the controller.

Do not port Orchestrate's `plan.json` control plane. In this repo, Tasque (`tsq`) remains the durable task graph, scheduler state, and status source. Optional handoff files can support resumability, but they supplement `tsq` rather than replacing it.

Adopted ideas:

- explicit node roles,
- no sibling synchronization,
- durable handoff payloads for long-running work,
- late handoff handling before closing a root task,
- verifier role as separate from reviewer when acceptance evidence needs to be independently reproduced.

Rejected for local default:

- Cursor API dependency,
- cloud-only isolated clones,
- `plan.json` as scheduler state,
- automatic PR creation,
- Slack coupling,
- script-driven spawning as the only control loop.
