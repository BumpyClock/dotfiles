---
name: Review-PR-Comments
description: Review unresolved PR comments, validate them, implement fixes, and reply. Use subagents when available.
arguments:
  - name: PR_NUMBER
    type: string
---

# Capability check
- If your runtime supports subagents or a Task tool (for example, Claude Code), use them.
- If subagents are available, delegate git and GitHub operations to a `git-workflow` subagent.
- If subagents are not available (for example, Codex CLI), do the work yourself sequentially and follow the `git-workflow` skill.
- If repo or PR access is missing or ambiguous, ask for the repo or required permissions before proceeding.
- Lean heavily on subagents for independent tasks like validation, investigation, and implementation when possible.
- Ensure we are on the PR branch and up to date before addressing comments. If not, switch safely using `git-workflow`.
- Always include comments authored by `claude`, `codex`, `codex-cli`, or `coderabbit` even if the thread “resolved” status is missing/ambiguous; these often contain the real actionable feedback in child replies.

---

Relevant skills: `git-workflow`, `programming`, `issue-investig8tor`, `systematic-debugging`, `subagent-driven-development`, `dispatching-parallel-agents`.
Read only what you need.

## Steps

1. **Spin up a single Haiku agent to perform substeps (a–e)** (one pass)
   - The Haiku agent may coordinate a `git-workflow` subagent for git/GitHub operations (if available), and must return the artifacts needed for the later Sonnet reviewers: fetched threads, normalized comment list, applicable `CLAUDE.md` paths, and PR change summary.

   a. **Get PR context + fetch review threads (include replies)** (Haiku agent)
      - If subagents are available, spin up a `git-workflow` subagent to:
        - Confirm GitHub auth and repo access.
        - Fetch the PR branch, check it out, and update it.
        - Pull the PR diff/patch so validations can reference exact lines.
      - Use GitHub GraphQL (preferred) or `gh pr view` + `gh api` to fetch *all* review threads and their comments for PR `$PR_NUMBER`.
      - Distinguish resolved vs unresolved threads.
      - Include general PR comments and bot/AI reviewers that may not map cleanly onto “resolved” status.
      - `claude` may leave a single long comment instead of threads; treat it as one unresolved thread with multiple comments.

   b. **Quick eligibility check** (Haiku agent)
      - If there are no unresolved/actionable comments (and no relevant AI/bot comments to address), stop and say there’s nothing to do.
      - Ignore pure formatting nits unless a repo rule requires them.

   c. **Normalize comments** (Haiku agent)
      - Produce a structured list of threads and comments:
        - `thread_id`, `thread_url`, `is_resolved`
        - `comment_id`, `author`, `created_at`
        - `path`, `line`/`position` (if present)
        - `body` (full text), `severity` (guess), and `actionability`

   d. **Find applicable repo rules** (Haiku agent)
      - Locate relevant `CLAUDE.md` files (repo root + directories containing files referenced by comments or changed in the PR).
      - Prefer explicit rules over personal preference.

   e. **Get PR change summary** (Haiku agent)
      - View the PR diff and produce a brief summary of what changed.
      - Call out areas most relevant to the fetched comments/threads.

2. **Launch up to 8 parallel Sonnet review agents** (parallelize validation/investigation; implement fixes sequentially)

   a. **Per-thread comment validation**: For each thread (or comment if threads are large), classify as `valid`, `invalid`, or `needs-info` with evidence (code references, diffs, and/or test output). Propose: fix plan + tests + reply text.

   b. **CLAUDE.md compliance**: Check planned changes and replies against applicable `CLAUDE.md` rules.

   c. **Bug scan**: Shallow scan the PR diff for obvious bugs or regressions related to the comments. Focus on real issues; ignore lint-only/style issues.

   d. **Historical context**: Use `git blame` and `git log` on touched areas to understand intent and established patterns; flag conflicts.

   e. **Code comments compliance**: Ensure changes won’t violate guidance in existing code comments (TODOs, warnings, invariants).

3. **Score confidence** (up to 8 parallel Haiku agents)
   - For each validation result, assign confidence 0–100:
     - 0: false positive / not applicable
     - 25: might be real; couldn’t verify
     - 50: verified but minor/nitpick
     - 75: verified important; likely impacts behavior or violates repo rules
     - 100: definitely real; high impact and reproducible
   - For *non-comment* issues discovered during scanning, only surface those scoring **75+**.
   - For PR comments, always respond, but treat low-confidence findings as `needs-info` or `invalid` and avoid speculative code changes.

4. **Implement fixes (sequential)**
   - Group `valid` comments by area and severity (critical → low).
   - Parallelize investigation only when tasks are independent; implement fixes sequentially to avoid conflicts.
   - Use tests when behavior changes; skip heavy test work for mechanical edits/docs/config-only changes when safe.
   - If a fix is large or risky, ask the user before implementing.

5. **Run relevant tests**
   - Choose the smallest set that gives confidence (unit/lint/build/targeted integration).
   - Record commands and results.

6. **Reply on the PR and resolve threads**
   - For each thread:
     - **Valid**: explain what changed and reference commit hash and/or file/line.
     - **Invalid**: explain why, with concrete evidence.
     - **Needs-info**: ask targeted questions and explain what’s missing.
   - Resolve a thread only after posting a reply (or if explicitly requested). If you cannot post, provide draft replies and leave threads unresolved.
   - Resolve outdated threads that are already addressed elsewhere in the PR, with a short reply pointing to the relevant change.

7. **Summarize**
   - Provide a concise summary of comments reviewed, changes made, tests run, and remaining follow-ups/risks.

## Output format
- Comments fetched: counts (threads/comments) and brief list of unresolved threads
- Validation results: `valid` / `invalid` / `needs-info` with confidence
- Changes made: files + rationale
- Tests: commands + outcomes
- PR replies: posted or draft text (by thread link)
- Follow-ups or risks

## False positives to ignore
- Pre-existing issues not introduced by this PR (unless the comment is explicitly requesting a cleanup)
- Things linters/typecheckers catch (imports, formatting, basic types) unless they cause CI failures
- Pure style preferences without `CLAUDE.md` backing
- Lines not present/changed in the PR diff (unless the comment is about broader design)
- Intentional functionality changes already explained in the PR description
