---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
source: https://github.com/obra/superpowers/tree/main/skills/brainstorming
license: MIT
---

# Brainstorming Ideas Into Designs

Use before creative/behavior-changing work. Goal: turn idea into approved design spec before any implementation.

Start with project context. Ask focused questions. Present design. Get approval. Write spec. Get written-spec approval. Then move to implementation planning.

<HARD-GATE>
Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it. This applies to EVERY project regardless of perceived simplicity.
</HARD-GATE>

## Local rules

- Follow stricter repo/user git policy.
- In dotfiles, do not commit design docs unless user explicitly asks.
- After design approval + spec review, invoke local `writing-plans`.
- If `writing-plans` unavailable, use repo normal implementation-planning workflow.

## Required sequence

Create/track tasks for each item. Complete in order.

1. Explore project context — files, docs, recent commits.
2. Offer visual companion only if upcoming questions are visual. Offer is its own message. No other content.
3. Ask clarifying questions one at a time. Learn purpose, constraints, success criteria.
4. Propose 2-3 approaches. Include tradeoffs + recommendation.
5. Present design in sections. Get user approval after each section.
6. Write design spec to `docs/specs/YYYY-MM-DD-<topic>-design.md` unless user preference overrides.
7. Self-review spec. Fix inline.
8. Ask user to review written spec. Wait for approval.
9. Transition to implementation planning with `writing-plans`.

Tiny flow:

```text
context → visual offer? → questions → approaches → design approval → spec → self-review → user review → plan
```

Terminal state: implementation planning. Not implementation.

## Context + scope

Before questions:

- Inspect current repo state.
- Follow existing patterns.
- If request spans independent subsystems, stop and decompose into sub-projects.
- Brainstorm first sub-project through normal flow.
- Each sub-project gets own spec → plan → implementation cycle.

Ask questions:

- One question per message.
- Multiple choice preferred when useful.
- Focus purpose, constraints, success criteria.
- Stop when those are clear enough to write tradeoffs.
- Do not over-question once enough info exists.

## Approaches

Before final design, present 2-3 viable approaches:

- Start with recommendation.
- Explain why.
- Name tradeoffs.
- Keep unchosen options visible enough for user to redirect.

## Design presentation

Present design section by section. Scale detail to complexity.

Cover when relevant:

- Architecture
- Components/modules
- Data flow
- Error handling
- Testing/verification
- User-visible behavior
- Non-goals

Ask after each section whether it looks right. If user rejects, revise. Do not advance on unresolved disagreement.

## Spec doc

Write validated design to:

```text
docs/specs/YYYY-MM-DD-<topic>-design.md
```

User path preference wins.

After saving spec, link it to the appropriate `tsq` task:

```bash
# Use current/parent feature task. If unsure which task, ask.
tsq spec <task-id> --file docs/specs/YYYY-MM-DD-<topic>-design.md
tsq note <task-id> "Spec: docs/specs/YYYY-MM-DD-<topic>-design.md"
```

Do not create a new `tsq` task just to attach the spec unless no appropriate task exists and user wants one.

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
4. Ambiguity — if requirement can mean 2 things, pick/ask and write explicit meaning.

Fix inline. Then user review gate.

## User review gate

After self-review, ask exactly:

> "Spec written to `<path>` and linked to `tsq` task `<task-id>`. Please review it and let me know if you want to make any changes before we start writing out the implementation plan."

Wait for user response.

If user requests changes:

- Edit spec.
- Re-run self-review.
- Ask for review again.

Proceed only after user approves.

## Spec reviewer prompt

If runtime and user instructions permit subagents, use `skills/brainstorming/spec-document-reviewer-prompt.md` after spec is written. Otherwise run same checklist inline.

Reviewer is advisory to catch serious planning blockers only.

## Visual companion gate

Use only when upcoming questions involve visual content.

Offer must be its own message with no other content:

> "Some of what we're working on might be easier to explain if I can show it to you in a web browser. I can put together mockups, diagrams, comparisons, and other visuals as we go. This feature is still new and can be token-intensive. Want to try it? (Requires opening a local URL)"

Wait for response.

- If declined: text-only.
- If accepted: read `visual-companion.md` before using browser.
- Acceptance means browser is available, not mandatory for every question.
- Decide per question: use browser only when seeing beats reading.

## Visual vs text choice

Use browser for:

- UI mockups
- Layout/spacing/visual hierarchy
- Architecture diagrams
- Flowcharts/entity relationships
- Side-by-side visual design options

Use terminal for:

- Requirements/scope questions
- Conceptual tradeoffs
- Technical approach decisions
- Text/table comparisons
- Clarifying questions answered in words
