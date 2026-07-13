---
name: brainstorming
description: "Clarify ambiguous features, UX/UI changes, architecture decisions before coding."
source: https://github.com/obra/superpowers/tree/main/skills/brainstorming
license: MIT
---

# Brainstorming Ideas Into Designs

Use full flow before creative/behavior-changing work. Goal: approved design spec before implementation planning.

<HARD-GATE>
For full brainstorming flow, do NOT invoke implementation planning, write code, scaffold projects, or take implementation action until:
1. design direction approved,
2. written spec saved,
3. spec gate review passes when available,
4. user approves written spec.

Micro-flow only for trivial mechanical/non-behavior changes with exact user instructions and no design choice.
</HARD-GATE>

## Local rules

- Follow stricter repo/user git policy.
- In dotfiles, no commit of design docs unless user explicitly asks.
- After HARD-GATE satisfied → hand off to `planner` agent for implementation planning.
- `planner` agent unavailable → use repo normal implementation-planning workflow.

## Flow selection

Match ceremony to risk. Gates are fixed; ceremony volume scales.

**Micro-flow** — trivial mechanical/non-behavior changes only:

1. Inspect relevant files/docs.
2. State assumptions if needed.
3. Ask at most one blocking question if needed.
4. Proceed per user request.

Examples: typo fix, narrow config rename, doc formatting, exact one-line requested change.

**Standard flow** — behavior change with mostly-clear requirements, few files, no architecture decision. Full-flow gates, light ceremony:

- Batch independent clarifying questions in one message.
- 1-2 approaches; skip alternatives when one is obviously right — say so.
- Present design as one short doc; single whole-doc approval.
- Spec self-review inline; skip spec-gate subagent.
- Both HARD-GATE approvals still required.

Examples: new CLI flag, small feature behind existing pattern, contained UX tweak.

**Complex flow** — architecture decisions, ambiguous requirements, UX/UI direction, multi-subsystem/cross-system work, SDD-backed/durable implementation. Full ceremony:

1. Explore context.
2. Ask focused questions.
3. Present approaches.
4. Get design approval.
5. Write spec.
6. Run spec gate when available.
7. Get user written-spec approval.
8. Move to implementation planning.

Unsure between tiers → pick higher.

No governance/stakeholder/process/executive-workflow docs unless user explicitly asks.

## Required sequence

Create/track tasks for each full-flow item. Complete in order. Standard flow: same order, apply light-ceremony rules from Flow selection (skip step 9 subagent; step 6 = whole-doc approval).

1. Explore project context — files, docs, recent commits.
2. Create or reuse `tsq` parent task when planned implementation is SDD-backed or durable. `tsq` unavailable or downstream explicitly inline → carry spec in conversation/runtime artifacts, say why.
3. Offer interactive visuals only if upcoming questions are visual. Offer is its own message, no other content.
4. Ask clarifying questions one at a time. Learn purpose, constraints, success criteria.
5. Propose 2-3 approaches. Include tradeoffs + recommendation.
6. Present design in sections. Get user approval after each section.
7. Write design spec into `tsq` parent when one exists (SDD-backed/durable). Otherwise keep in conversation/runtime artifacts, say why. Export to repo file only when user asks, repo convention requires, or `tsq` unavailable.
8. Self-review spec. Fix inline.
9. Run spec gate when available. Fix blockers before user review.
10. Ask user to review written spec. Wait for approval.
11. Transition to implementation planning per Local rules.

Tiny flow:

```text
context → visual offer? → questions → approaches → design approval → spec in tsq → spec gate → user review → plan
```

Terminal state: implementation planning. Not implementation.

## Context + scope

Before questions:

- Inspect current repo state.
- Follow existing patterns.
- Request spans independent subsystems → stop, decompose into sub-projects.
- Brainstorm first sub-project through normal flow.
- Each sub-project gets own spec → plan → implementation cycle.

Ask questions:

- Batch independent questions in one message (use `AskUserQuestion` when available).
- Serialize only when a question depends on a prior answer.
- Multiple choice preferred when useful.
- Focus purpose, constraints, success criteria.
- Stop when those clear enough to write tradeoffs.
- Do not over-question once enough info exists.

## Approaches

Before final design, present 1-3 viable approaches:

- Start with recommendation.
- Explain why.
- Name tradeoffs.
- Keep unchosen options visible enough for user to redirect.
- Do not invent alternatives to fill a quota. One clearly right approach → present it alone, state why no real alternative.

## Design presentation

Scale detail and approval granularity to complexity. Design fits ~1 page → present whole, single approval. Larger → section by section.

Cover when relevant:

- Architecture
- Components/modules
- Data flow
- Error handling
- Testing/verification
- User-visible behavior
- Non-goals

Ask whether it looks right (per section when sectioned). User rejects → revise. Do not advance on unresolved disagreement.

## Spec storage

Write validated full-flow design spec into `tsq` parent task only when parent exists (SDD-backed/durable). Otherwise keep in conversation/runtime artifacts, say why.

Repo spec files under `docs/specs/YYYY-MM-DD-<topic>-design.md` are optional exports. Write only when:

- user asks for saved doc,
- repo convention requires one,
- `tsq` unavailable.

When exporting repo spec file, user path preference wins.

When `tsq` parent exists, attach/note spec on parent task:

```bash
tsq spec <task-id> --text "<markdown spec>"
tsq note <task-id> "Spec approved for planning"
```

Never claim path, task ID, dependency, or `tsq` state not actually created.

Spec should include enough for planning:

- Problem/purpose
- Approved scope
- Requirements
- Approach
- Constraints/non-goals
- Risks/open questions resolved so far
- Testing expectations

Commit only if user explicitly asks.

## Spec self-review

Run before user review:

1. Placeholder scan — remove `TBD`, `TODO`, incomplete sections, vague requirements.
2. Consistency — fix contradictions.
3. Scope — confirm single implementable project or decompose.
4. Ambiguity — requirement can mean 2 things → pick/ask, write explicit meaning.

Fix inline. Then run spec gate when available.

## User review gate

After self-review and spec gate, ask based on actual storage.

If exported to repo file and linked to `tsq`:

> "Spec written to `<path>` and linked to `tsq` task `<task-id>`. Please review it and let me know if you want changes before we start the implementation plan."

If stored in `tsq` only:

> "Spec saved to `tsq` task `<task-id>`. Please review it and let me know if you want changes before we start the implementation plan."

If not linked because `tsq` unavailable:

> "Spec written to `<path>`. I did not link it to `tsq` because `tsq` is unavailable. Please review it and let me know if you want changes before we start the implementation plan."

Wait for user response.

User requests changes:

- Edit spec.
- Re-run self-review.
- Re-run spec gate when available.
- Ask for review again.

Proceed only after user approves.

## Spec reviewer prompt

Complex flow only; standard flow uses inline self-review. Use `skills/brainstorming/spec-document-reviewer-prompt.md` after spec written. Reviewer cannot run → apply same checklist inline, say why.

Reviewer is advisory — catch serious planning blockers only.

## Interactive visuals

Purpose: show mockups, diagrams, comparisons, visual options in browser while terminal stays source of truth. Create self-contained interactive HTML file at right fidelity. Enables show-not-tell ideation.

Use only when upcoming questions involve visual content. Offer must be its own message, no other content:

> "Some of what we're working on might be easier to explain if I can show it to you in a web browser. I can put together mockups, diagrams, comparisons, and other visuals as we go — self-contained HTML files opened locally. This can be token-intensive. Want to try it?"

Wait for response.

- Declined → text-only.
- Accepted → visuals available, not mandatory for every question. Decide per question: browser only when seeing beats reading.

Mechanics:

- Save in `/tmp` or `/docs/ideation` if present in `.gitignore`. Throwaway artifacts; do not commit unless explicit ask.
- When done, open HTML file. Unless user asks, keep updating same file.

Browser for: UI mockups, layout/spacing/visual hierarchy, architecture diagrams, flowcharts/entity relationships, side-by-side visual design options.

Terminal for: requirements/scope questions, conceptual tradeoffs, technical approach decisions, text/table comparisons, clarifying questions answered in words.
