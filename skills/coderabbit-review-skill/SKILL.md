---
name: coderabbit-review-skill
description: Use when the user asks for a CodeRabbit review or mentions the coderabbit CLI. Runs `coderabbit review --agent` on local git changes, validates findings against the repo, and reports; applies fixes only when asked.
---

# CodeRabbit Review

CodeRabbit CLI reviews local git changes. It is slow (several minutes): run it in the background or with timeout ≥ 10m and keep working while it runs.

## Commands

```bash
coderabbit review --agent                   # Structured findings for agents (default here)
coderabbit review --base main               # Compare against a base branch
coderabbit review --type uncommitted        # Scope: all | committed | uncommitted
coderabbit review --dir <path>              # Only changes inside a directory
coderabbit review findings                  # Re-show last review WITHOUT re-running
coderabbit review --light                   # Faster, reduced-context pass
```

Auth errors → `coderabbit auth login`. Before re-running a review, check `coderabbit review findings` first — re-runs are expensive.

## Workflow

1. **Run** the review scoped to what the user asked about (default: all local changes).
2. **Triage**: dedupe, then order by severity — `critical` → `major` → `potential_issue` → `refactor_suggestion`. For `nitpick` findings, judge each rather than blanket-skip: worth keeping if it's trivial and touches code already being changed, or the user asked for nitpicks; otherwise skip. Give a one-line reason either way in the report.
3. **Validate**: CodeRabbit produces false positives. Confirm each finding against the actual code (claimed path/symbol/behavior exists, issue is reachable) before treating it as real. Many findings → fan out read-only sub-agents; a handful → verify inline.
4. **Report**: valid findings with location + smallest safe fix, invalid ones with the evidence that disproves them. Scan all findings — including skipped nitpicks — for clusters: several of the same shape usually mean one root cause (missing convention, missing abstraction, architectural smell). Surface the pattern and propose the holistic fix, not per-file patches.
5. **Fix only when the user asked for fixes.** Then follow normal change discipline: valid findings only, tests for behavior changes, verify before claiming done.
