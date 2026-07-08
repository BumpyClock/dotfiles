---
name: advisor
description: Use to get advise from a different model when working on a hard problem.
---

Use cli's to request advice from a different model when working on a hard problem.

Claude : `claude --dangerously-skip-permissions -m <model> -p  <prompt> --effort <effort-level>`
Codex: `codex exec --sandbox danger-full-access --ephemeral <prompt>` 

## Picking the right models for workflows and subagents

Rankings, higher = better. Cost reflects what I actually pay (OpenAI has really generous
limits), not list price. Intelligence is how hard a problem you can hand the model
unsupervised. Taste covers UI/UX, code quality, API design, and copy.

| model    | cost | intelligence | taste |
|----------|------|--------------|-------|
| gpt-5.5  | 9    | 8            | 5     |
| sonnet-5 | 5    | 5            | 7     |
| opus-4.8 | 4    | 7            | 8     |
| fable-5  | 2    | 9            | 9     |

How to apply:
- These are defaults, not limits. You have standing permission to override them: if a cheaper
model's output doesn't meet the bar, rerun or redo the work with a smarter model without
asking. Judge the output, not the price tag. Escalating costs less than shipping mediocre
work.
- Cost is a tie-breaker only; when axes conflict for anything that ships, intelligence >
taste > cost.
- Bulk/mechanical work (clear-spec implementation, data analysis, migrations): gpt-5.5 – it's
effectively free.
- Anything user-facing (UI, copy, API design) needs taste ≥ 7.
- Reviews of plans/implementations: fable-5 or opus-4.8, optionally gpt-5.5 as an extra
independent perspective.
- Never use Haiku.
- Mechanics: gpt-5.5 is only reachable through the Codex CLI – `codex exec` / `codex review`
(my ~/.codex/config.toml defaults to gpt-5.5). Use the codex-implementation, codex-review,
and codex-computer-use skills; for work they don't cover (investigation, data analysis), run
codex directly with a self-contained prompt.
- Claude models (sonnet-5, opus-4.8, fable-5) run via the claude cli.
- use inbuilt models when available , use cli as needed.



## Claude
Using gpt-5.5 inside workflows and subagents (the model parameter only takes Claude models,
so use a wrapper):
- Spawn a thin Claude wrapper agent with `model: 'sonnet', effort: 'low'` whose prompt
instructs it to write a self-contained codex prompt, run `codex exec` via Bash, and return

## Oracle CLI
- Oracle bundles a prompt plus the right files so a Pro model (GPT-5.5 Pro,
  Gemini 3 Pro) can answer with real repo context. Use when stuck,
  debugging hard bugs, doing architecture review, or cross-validating a plan.
- Run `oracle --help` once per session before first use.
- use `--engine browser` to use the browser engine instead of the API.
