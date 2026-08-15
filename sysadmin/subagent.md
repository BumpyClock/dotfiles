---
summary: 'Multi-agent system directives and coordination rules. Master reference for agent behavior.'
read_when:
  - Coordinating subagents or running tmux-based agent sessions.
---

# Claude Subagent Quickstart

## CLI Basics
- Launch long-running subagents inside tmux so the session can persist. Example:

  ```bash
  tmux new-session -d -s claude-haiku 'claude --model haiku'
  tmux attach -t claude-haiku
  ```

  Once inside the session, run `/model` to confirm the active alias (`haiku` maps to Claude 3.5 Haiku) and switch models if needed.
- Need to queue instructions without attaching? Use `tmux send-keys -t <session> "your command" Enter` to inject text into a running agent session.
- Always switch to the fast Haiku model upfront (`claude --model haiku --dangerously-skip-permissions …` or `/model haiku` in-session) to keep turnaround fast.
- Two modes:
  - **One-shot tasks** (single summary, short answer): run `claude --model haiku --dangerously-skip-permissions --print …` in a tmux session, wait with `sleep 30`, then read the output buffer.
  - **Interactive tasks** (multi-file edits, iterative prompts): start `claude --model haiku --dangerously-skip-permissions` in tmux, send prompts with `tmux send-keys`, and capture completed responses with `tmux capture-pane`. Expect to sleep between turns so Haiku can finish before you scrape the pane.

## One-Shot Prompts
- The CLI accepts the prompt as a trailing argument in one-shot mode. Multi-line prompts can be piped: `echo "..." | claude --print`.
- Add `--output-format json` when you need structured fields (e.g., summary + bullets) for post-processing.
- Keep prompts explicit about reading full files: “Read docs/example.md in full and produce a 2–3 sentence summary covering all sections.”
