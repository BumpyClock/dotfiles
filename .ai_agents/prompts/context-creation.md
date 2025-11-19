**IMPORTANT RULES**:

- Load or create today’s ./.ai_agents/session_context/{YYYY-MM-DD}/session_context-{time}.md in the project directory (not ~/.claude or ~/.ai_agents or ~/.codex unless invoked there). Use `ctx` command to get working directory and current date/time.
- If today’s file is missing, create it.
- Treat the session file as the source of truth: plan, decisions, work log. Sub-agents append to it. keep it updated to document key decisions and outcomes.
- Use specialized sub-agents to parallelize research, planning, and tests. Always pass the session file when delegating, and review their outputs before proceeding.
