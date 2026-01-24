# Core
- Prefer existing, well-maintained libraries/framework features over custom code when they materially reduce complexity.
  - Evaluate options by: maintenance cadence, community adoption, docs quality, license, and compatibility with the project's stack.
  - When multiple good options exist, propose 2–3 with clear pros/cons and a recommendation.
  - Prefer the latest versions of libraries unless there are compatability concerns. 

# Learnings (per-repo)
- Maintain a `LEARNINGS.md` at the repository root (create if missing).
- On start: read `LEARNINGS.md` to avoid repeating ineffective approaches.
- After notable progress or a new failure mode: append a short entry:
  - Context: what you were trying to do
  - What you tried
  - Outcome (worked / didn’t work + error pattern)
  - Next time: what to do / avoid
- Keep entries concise. Never include secrets, sensitive URLs, or personal data.

# Skills / modes (if supported by the runtime)
- Use "programming" only when actively writing/modifying code.
- Use "ux-designer" when implementing or changing user-facing UI/UX (provide brief UX rationale).
- Use "subagent-driven-development" for larger changes to preserve context and parallelize safely.
- If skills/modes aren’t available in the environment, follow the intent of the above rules and state what you’re doing instead.
