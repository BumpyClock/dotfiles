---
name: tasque
description: Operational guide for Tasque (tsq) local task tracking and management.
---

<!-- tsq-managed-skill:v1 -->

Tasque = durable, local-first task memory for agent work.
Default day-to-day playbook.

## When to use tsq

- Use `tsq` for multi-step, multi-session, dependency-blocked, shared-agent work.
- Use transient checklist for short linear single-session work.

## Session routine (default)

```bash
tsq ready --lane planning
tsq ready --lane coding
tsq list --status blocked
```

Pick one task; inspect context:

```bash
tsq show <id>
```


### 1) Capture new work

```bash
tsq create "Implement <feature>" --kind feature -p 1 --needs-planning
tsq create "Fix <bug>" --kind task -p 1 --needs-planning
```

Planning already done:

```bash
tsq create "Implement <feature>" --planning planned
```

### 2) Split parent into many children (single command)

```bash
tsq create --parent <parent-id> \
  --child "Design API contract" \
  --child "Implement service logic" \
  --child "Add regression tests"
```

Shared defaults for all children:

```bash
tsq create --parent <parent-id> --kind task -p 2 --planning planned \
  --child "Wire CLI args" \
  --child "Update docs" \
  --child "Add integration tests"
```

Safe reruns without duplicate children:

```bash
tsq create --parent <parent-id> --ensure \
  --child "Wire CLI args" \
  --child "Update docs" \
  --child "Add integration tests"
```

### 3) Planning handoff -> coding

```bash
tsq spec attach <id> --text "## Plan\n...\n## Acceptance\n..."
tsq update <id> --planning planned
tsq update <id> --claim --assignee <name>
tsq update <id> --status in_progress
```

### 4) Model deps for parallel agents

Hard blocker (changes readiness):

```bash
tsq dep add <child-id> <blocker-id> --type blocks
```

Soft ordering only:

```bash
tsq dep add <later-id> <earlier-id> --type starts_after
```

Check actionable tasks:

```bash
tsq ready --lane coding
tsq ready --lane planning
```

### 5) Capture discovered follow-up work

```bash
tsq create "Handle edge case <x>" --discovered-from <current-id> --needs-planning
tsq link add <new-id> <current-id> --type relates_to
```

### 5b) Idempotent root/parent create for automation

```bash
tsq create "Implement auth module" --ensure
tsq create --parent <parent-id> --child "Add tests" --ensure
```

`--ensure` returns existing task when same normalized title already exists under the same parent.

### 6) Park / unpark work

```bash
tsq update <id> --status deferred
tsq list --status deferred
tsq update <id> --status open
```

### 7) Resolve duplicate/superseded work

```bash
tsq duplicate <id> --of <canonical-id> --reason "same root issue"
tsq duplicates
tsq merge <source-id...> --into <target-id> --dry-run
tsq merge <source-id...> --into <target-id> --force
tsq supersede <old-id> --with <new-id> --reason "replaced approach"
```

### 8) Close / report

```bash
tsq update <id> --status closed
tsq history <id> --limit 20
tsq list --tree
```

Agent/tool handoff: add `--json`.

## Built-in task authoring checklist

### Minimum quality bar

- Titles: clear, action-oriented (verb + object + scope).
- Set `kind`: `task|feature|epic`.
- Set priority intentionally: `0..3`.
- Add labels with consistent naming.
- Attach spec when scope/acceptance non-trivial.
- Add explicit deps/relations when relevant.

### Parallelization guidance

- Prefer multiple independent tasks over one large task.
- Use `blocks` only when work truly gates another task.
- Use `starts_after` for sequencing without blocking readiness.
- Add discovered work as new tasks via `--discovered-from`.
- Keep each task small enough for one focused agent pass.

### Practical authoring starter

```bash
tsq create "<title>" --kind task -p 2 --needs-planning
tsq spec attach <id> --text "<markdown spec>"
tsq dep add <child> <blocker> --type blocks
tsq link add <src> <dst> --type relates_to
```

## Required habits

- Keep lifecycle `status` and `planning_state` separate.
- Use deps to make parallel execution explicit.
- Create follow-up tasks; avoid chat TODOs.
- Prefer `--json` for automation.
- Use `--ensure` in scripts to prevent duplicate creates on rerun.

## Read when needed

- Planning/deferred semantics: `references/planning-workflow.md`
- JSON schema + durability details: `references/machine-output-and-durability.md`
- Full option matrix (edge cases): `references/command-reference.md`
- Install if missing: `npm install -g @bumpyclock/tasque`
