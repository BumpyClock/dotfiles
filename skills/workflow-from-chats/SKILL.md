---
name: workflow-from-chats
description: "Extract preferences from agent chats → skills, rules, workflow docs. For learning preferences, mining feedback, personalizing workflows."
source: https://github.com/shaneholloman/cursor-plugins/tree/main/cursor-team-kit/skills/workflow-from-chats
license: MIT
---

# Workflow From Chats

Infer durable working preferences and repeated manual workflows from recent work. Do not summarize chats; extract reusable workflow guidance and create only high-confidence missing assets.

## Scope

- Default to the last 30 days unless the user asks for a different window. If less history is available, use all available history.
- Use local transcript sources available to the current agent runtime. If the transcript location is unclear, search local agent/session directories before asking.
- Read parent conversations first. Use subagent content as supporting evidence, but cite only parent conversations or user-visible summaries.
- Do not expose local transcript paths, secrets, customer data, private chat content, credentials, or unrelated personal details.
- Scan chats from `~/.codex`, `~/.pi/`, `~/.claude` and `~/.copilot` unless user explicitly asks for a specific agent.
- Look broadly across coding, research, writing, planning, communication, operations, analysis, and personal administration.

## Evidence Order

Use available evidence in this order:

1. Recent Codex sessions and task summaries.
2. Codex Memories and rollout summaries to find patterns repeated across sessions.
3. Chronicle, if enabled, for discovery outside Codex. Confirm important details in the relevant source system when possible.
4. Existing skills, custom agents, and automations, so new work reuses or extends what already exists.

## Workflow

1. State the target workflow or preference surface in one paragraph.
2. Build an internal inventory: topic, approximate date, completion state, related subagents if visible, and why it may contain preference evidence.
3. Scan for explicit preferences, corrections, and workflow markers: "I prefer", "always", "never", "not what I asked", "stop", "review", "PR", "CI", "logs", "skill", and similar.
4. Extract preference atoms and workflow candidates: trigger, inputs, workflow steps, decision rules, quality bar, output, stop condition, evidence, and confidence.
5. Rate confidence as strong, medium, weak, or contradicted.
6. Cluster by workflow shape: shipping, review, simplification, debugging, capture, communication, delegation, validation, planning, operations, research, analysis, writing, or git hygiene.
7. Check each candidate against existing skills, custom agents, docs, scripts, cron jobs, launch agents, and other automations before recommending a new asset.
8. Produce a compact shortlist before writing files.
9. Choose the artifact: new skill, skill edit, custom subagent, automation, rule, workflow doc, learned doc, or no artifact.
10. Create or extend only high-confidence missing items. Keep them narrow, practical, source-aware, and easy to validate.
11. Draft only reusable guidance. Drop anecdotes that will not help future tasks.

## Candidate Gate

Only act on a candidate when it:

- occurred at least twice, or is clearly likely to recur and costly to repeat;
- has stable inputs, a repeatable procedure, and a clear output or stopping condition;
- would materially improve speed, quality, consistency, or reliability;
- is not already adequately covered.

Skip work that is too one-off, ambiguous, sensitive, poorly evidenced, speculative, overlapping, or overly broad.

## Confidence

- Strong: explicit user preference, workflow-changing correction, repeated parent-chat pattern, or direct request to encode behavior.
- Medium: accepted workflow, repeated tool/model/validation preference, or subagent consensus that the parent used successfully.
- Weak: agent-chosen behavior with no user feedback, one ambiguous transcript, or a likely task-specific correction.
- Contradicted: evidence points in incompatible directions; ask the user before writing files.

## Artifact Choice

- Skill: recurring multi-step workflow or playbook with clear triggers.
- Custom subagent: bounded specialist role or investigation task suitable for delegation.
- Automation: scheduled or recurring check, report, reminder, or monitor.
- Extend existing: adequate asset exists but needs a narrow improvement.
- Rule: broad behavior that should apply across tasks.
- Learned doc: repo-specific rationale, pitfalls, failure modes, or architecture decision.
- Workflow doc: useful context that is not reliably triggerable.
- No artifact: situational, stale, low-confidence, or privacy-sensitive observation.

## Output

Return a concise synthesis first:

- Target workflow.
- Evidence corpus, citing only parent conversation summaries.
- Preference profile.
- Adopt, consider, dismissed.
- Proposed artifacts.
- Compact shortlist with repeated workflow, supporting evidence and dates, frequency/confidence, recommended form, and why it is or is not worth creating.
- Created or extended.
- Deliberately skipped.
- Needs more evidence before packaging.
- Open questions only if they block writing.
