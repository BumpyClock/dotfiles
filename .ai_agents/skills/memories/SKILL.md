---
name: memories
description: Capture, update, and curate durable project memories such as architecture decisions, coding preferences, workflows, tooling choices, and domain rules. Use when the user asks to save/remember a memory or when you identify high-leverage knowledge that should persist across sessions. Also use when asked to review, validate, or prune stored memories.
---

# Memories

When this skill triggers, keep the main agent context minimal. Immediately spin up a sub-agent to save or update the memory (the "xx" insight). Provide the sub-agent the insight text and direct it to read `references/memory-workflow.md` for the full workflow, templates, and scripts. The sub-agent should execute the workflow and report back with what changed.
