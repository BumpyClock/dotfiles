---
name: maestri
description: Send messages to connected AI agents on the Maestri canvas and get their responses. Also read and write connected sticky notes. Use when the user's intent is to collaborate with another agent on the canvas. Look for actions like 'ask [name] to...', 'tell [name] to...', 'check on [name]', or 'create/update a note'.
user-invocable: false
---

# Maestri Inter-Agent Communication

You're running inside Maestri, a spatial workspace with other coding agents and sticky notes nearby.
Connected agents can exchange prompts and responses through the `maestri` CLI.
Connected notes can be read and written through the `maestri` CLI.

## Commands

- `maestri list` — list connected agents, notes, and portals
- `maestri ask "Agent Name" "your prompt"` — send a prompt to a connected agent and get the response
- `maestri check "Agent Name"` — read the agent's current terminal output on demand
- `maestri note create ["content"]` — create a new note on the canvas and link it to this terminal
- `maestri note read "Note Name"` — read the full note with line numbers
- `maestri note read "Note Name" 10 20` — read 20 lines starting from line 10
- `maestri note write "Note Name" "content"` — replace a note's content entirely
- `maestri note edit "Note Name" "old text" "new text"` — replace a substring within a note

The `maestri` CLI is pre-installed and available on PATH inside Maestri terminals. If `maestri` is not found on PATH (e.g., custom shell setups that reset PATH), use `"$MAESTRI_CLI"` instead — this environment variable always points to the full binary path.
Always run `maestri list` first to get the exact agent and note names.
The response from `ask` returns as soon as the other agent finishes. Scale the Bash tool timeout to the estimated completion time:
- **60000ms** (1 min) — quick questions, status checks, simple lookups
- **300000ms** (5 min) — delegating a small, focused task (a single file change, a quick refactor)
- **600000ms** (10 min) — code reviews, multi-step tasks, larger delegations
- **1200000ms** (20 min) — debugging sessions, complex investigations, multi-file refactors
If the timeout expires before the agent responds, do NOT re-send the prompt. Run `maestri check "Agent Name"` to see their progress, then wait again with an appropriate timeout. Never interrupt an agent that is still working, and do not edit files that the other agent is actively modifying — wait for them to finish first.
Use `check` to read what an agent is currently showing without sending a prompt — useful to check if a previous request completed or to see its current state.
Run `maestri help` to see all available commands. If the user is having connection or setup issues, run `maestri debug` to diagnose the problem.

## Connected Notes

Use `maestri note create` to create a new note on the canvas — it appears to the left of your terminal and is automatically connected. Optional initial content can be provided.
Use `maestri note read` to read, `maestri note write` to replace entirely, and `maestri note edit` to update a specific part.
When a note already has content, prefer `edit` over `write` to avoid losing existing text.
Changes are reflected in the Maestri canvas in real-time. Notes support markdown formatting.
Notes can be chained together. When a note connected to your terminal is also connected to other notes, you can read and write all notes in the chain. Use `maestri list` to see the full note tree — chained notes appear indented under their parent.

**Important:** By default, a note's name is derived from its first line of text. When you write or edit a note and change its first line, the note may be renamed automatically. Always run `maestri list` after writing to a note to check for name changes. If the user has set a custom name for a note (via rename), the name stays stable regardless of content changes.