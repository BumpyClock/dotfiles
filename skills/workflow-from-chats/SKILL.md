---
name: workflow-from-chats
description: "Extract preferences from agent chats → skills, rules, workflow docs. For learning preferences, mining feedback, personalizing workflows."
source: https://github.com/shaneholloman/cursor-plugins/tree/main/cursor-team-kit/skills/workflow-from-chats
license: MIT
---

# Workflow From Chats

Infer durable working preferences and repeated manual workflows from recent work. Do not summarize chats; extract reusable workflow guidance. Create only high-confidence missing assets.

## Scope

- Default: last 30 days unless user specifies different window. If less history available, use all.
- Use local transcript sources available to current agent runtime. If location unclear, search local agent/session directories before asking.
- Read parent conversations first. Subagent content = supporting evidence; cite only parent conversations or user-visible summaries.
- Do not expose local transcript paths, secrets, customer data, private chat content, credentials, or unrelated personal details.
- Scan chats from `~/.codex`, `~/.pi/`, `~/.claude` and `~/.copilot` unless user specifies a single agent.
- Look broadly across coding, research, writing, planning, communication, operations, analysis, personal administration.

## Evidence Order

1. Recent Codex sessions and task summaries.
2. Codex Memories and rollout summaries for cross-session repeated patterns.
3. Chronicle (if enabled) for discovery outside Codex. Confirm important details in relevant source system.
4. Existing skills, custom agents, automations — new work reuses/extends what already exists.

## Workflow

1. State target workflow or preference surface in one paragraph.
2. Build internal inventory: topic, approximate date, completion state, related subagents, why it may contain preference evidence.
3. Scan for explicit preferences, corrections, workflow markers: "I prefer", "always", "never", "not what I asked", "stop", "review", "PR", "CI", "logs", "skill", etc.
4. Extract preference atoms and workflow candidates: trigger, inputs, workflow steps, decision rules, quality bar, output, stop condition, evidence, confidence.
5. Rate confidence: strong, medium, weak, contradicted.
6. Cluster by workflow shape: shipping, review, simplification, debugging, capture, communication, delegation, validation, planning, operations, research, analysis, writing, git hygiene.
7. Check each candidate against existing skills, custom agents, docs, scripts, cron jobs, launch agents, other automations before recommending new asset.
8. Produce compact shortlist before writing files.
9. Choose artifact: new skill, skill edit, custom subagent, automation, rule, workflow doc, learned doc, or no artifact.
10. Create/extend only high-confidence missing items. Narrow, practical, source-aware, easy to validate.
11. Draft reusable guidance only. Drop anecdotes that won't help future tasks.

## Candidate Gate

Act on a candidate only when:
- occurred ≥2 times, or clearly likely to recur and costly to repeat;
- has stable inputs, repeatable procedure, clear output/stopping condition;
- would materially improve speed, quality, consistency, or reliability;
- not already adequately covered.

Skip one-off, ambiguous, sensitive, poorly evidenced, speculative, overlapping, or overly broad work.

## Confidence

- Strong: explicit user preference, workflow-changing correction, repeated parent-chat pattern, or direct request to encode behavior.
- Medium: accepted workflow, repeated tool/model/validation preference, or subagent consensus parent used successfully.
- Weak: agent-chosen behavior with no user feedback, one ambiguous transcript, or likely task-specific correction.
- Contradicted: evidence points incompatible directions; ask user before writing files.

## Artifact Choice

- Skill: recurring multi-step workflow/playbook with clear triggers.
- Custom subagent: bounded specialist role or investigation task suitable for delegation.
- Automation: scheduled/recurring check, report, reminder, or monitor.
- Extend existing: adequate asset exists but needs narrow improvement.
- Rule: broad behavior applying across tasks.
- Learned doc: repo-specific rationale, pitfalls, failure modes, architecture decision.
- Workflow doc: useful context not reliably triggerable.
- No artifact: situational, stale, low-confidence, or privacy-sensitive observation.

## Output

Concise synthesis:
- Target workflow.
- Evidence corpus (cite parent conversation summaries only).
- Preference profile.
- Adopt, consider, dismissed.
- Proposed artifacts.
- Compact shortlist: repeated workflow, supporting evidence + dates, frequency/confidence, recommended form, why worth/not worth creating.
- Created or extended.
- Deliberately skipped.
- Needs more evidence before packaging.
- Open questions only if they block writing.
