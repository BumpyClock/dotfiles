---
name: workflow-from-chats
description: Extract durable working preferences from recent local agent chats and convert them into skills, rules, or workflow docs. Use when asked to learn preferences, mine feedback, personalize workflows, or generate user/team-specific agent guidance.
source: https://github.com/shaneholloman/cursor-plugins/tree/main/cursor-team-kit/skills/workflow-from-chats
license: MIT
---

# Workflow From Chats

Infer durable working preferences from recent agent conversations. Do not summarize chats; extract reusable workflow guidance.

## Scope

- Default to the last 7 days unless the user asks for a different window.
- Use local transcript sources available to the current agent runtime. If the transcript location is unclear, search local agent/session directories before asking.
- Read parent conversations first. Use subagent content as supporting evidence, but cite only parent conversations or user-visible summaries.
- Do not expose local transcript paths, secrets, customer data, private chat content, credentials, or unrelated personal details.
- Scan chats from `~/.codex`, `~/.pi/`, `~/.claude` and `~/.copilot` unless user explicitly asks for a specific agent.

## Workflow

1. State the target workflow or preference surface in one paragraph.
2. Build an internal inventory: topic, approximate date, completion state, related subagents if visible, and why it may contain preference evidence.
3. Scan for explicit preferences, corrections, and workflow markers: "I prefer", "always", "never", "not what I asked", "stop", "review", "PR", "CI", "logs", "skill", and similar.
4. Extract preference atoms: trigger, workflow step, decision rule, quality bar, stop condition, evidence, and confidence.
5. Rate confidence as strong, medium, weak, or contradicted.
6. Cluster by workflow shape: shipping, review, simplification, debugging, capture, communication, delegation, validation, planning, or git hygiene.
7. Choose the artifact: new skill, skill edit, rule, workflow doc, learned doc, or no artifact.
8. Draft only reusable guidance. Drop anecdotes that will not help future tasks.

## Confidence

- Strong: explicit user preference, workflow-changing correction, repeated parent-chat pattern, or direct request to encode behavior.
- Medium: accepted workflow, repeated tool/model/validation preference, or subagent consensus that the parent used successfully.
- Weak: agent-chosen behavior with no user feedback, one ambiguous transcript, or a likely task-specific correction.
- Contradicted: evidence points in incompatible directions; ask the user before writing files.

## Artifact Choice

- Skill: recurring multi-step workflow with clear triggers.
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
- Open questions only if they block writing.
