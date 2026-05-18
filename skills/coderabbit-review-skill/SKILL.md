---
name: coderabbit-review-skill
description: Run a codereview using coderabbit cli and review the output.
---

# CodeRabbit Review

Run `coderabbit review --agent`, wait for finish (may take a while). Slow → run background, keep working. Long running task, timeout=10m min.


Examples:
  coderabbit review                           # Plain-text review of all local changes
  coderabbit review --agent                   # Emit structured findings for agents
  coderabbit review --base main               # Compare current branch against main
  coderabbit review --type committed          # Review only committed changes
  coderabbit review --files src/index.ts      # Review only selected files
  coderabbit review --dir /path/to/repo       # Review only git changes inside that directory
  coderabbit review --prompt-only             # Print agent prompts only

## Workflow

1. **Collect + triage comments**
   - Collect ALL CodeRabbit comments, dedupe
   - Output contains **multiple prompts**, each already shaped:
   - Prioritize by `Type`:
     - **Handle ALL non-nitpick first.** Highest severity → down.
        - First: `critical`, `major`, `potential_issue`, `refactor_suggestion` (+ similar non-nitpick).
     - **Only when zero non-nitpick remain** → process `nitpick`.
     - Non-nitpick exists → **ignore nitpicks** (no impl, no bikeshed).
   - Triage each:
     - (a) valid + actionable
     - (b) valid but out-of-scope
     - (c) invalid/incorrect
     - (d) needs more info

2. **Validate w/ parallel sub-agents**
   - Per major comment/theme → spawn sub-agent. Find repo evidence (paths, symbols, snippets)
   - Sub-agent returns: verdict (valid/invalid), reasoning, exact location(s), minimal fix

3. **Produce validated findings**
   - Valid: category (bug/security/perf/style/test/docs), impacted files, risk, proposed fix
   - Invalid: brief why + repo evidence

4. **Analyze findings**
   - Review findings for emerging architecture smells that we should address holistically rather than hot-patching individual files. 
   - Identify patterns/overrides that should be refactored together.
   - Prioritize fixes based on risk and impact.
   - When architectural refactor makes sense, stop and notify user. Continue, normally otherwise.


5. **Implement fixes — valid + actionable**
   - Parallel sub-agents for independent groups (no file overlap)
   - No unrelated refactor or changes.
   - Update/add tests when behavior changes

5. **Verify**
   - Narrowest tests first → broader if available
   - Format/lint on changed areas only if feasible

6. **Final output**
   - Validated comments list (valid/invalid/out-of-scope) + evidence
   - Changes by file (what/why)
   - Commands run + results (tests/lint/format)
   - Remaining items + next steps

## Constraints

- No "fixing" speculative issues w/o repo evidence
- Ambiguous fix → propose 1-2 options, user picks safest
- Blocked by missing context / conflicting reqs → stop + ask
- **Time budget**: highest-risk first
- **Scope limit**: only relevant files unless correctness demands
- **Risk tolerance**: smallest safe change; avoid API changes
- **Test strategy**: specify preferred cmds + fallbacks
- **Parallelism**: up to 4 sub-agents; no file overlap
- Run format + linters → meet code quality standards
