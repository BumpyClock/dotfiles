
## CLI Basics
- Launch long-running subagents inside tmux so the session can persist. Example:

  ```bash
  tmux new-session -d -s claude-haiku 'claude --model haiku'
  tmux attach -t claude-haiku
  ```

  Once inside the session, run `/model` to confirm the active alias (`haiku` maps to Claude 3.5 Haiku) and switch models if needed.
- Need to queue instructions without attaching? Use `bun scripts/agent-send.ts --session <name> -- "your command"` to inject text into a running agent session (single Enter is sent by default).
- Always switch to the fast Haiku model upfront (`claude --model haiku --dangerously-skip-permissions …` or `/model haiku` in-session) to keep turnaround fast.
- Two modes:
  - **One-shot tasks** (single summary, short answer): run `claude --model haiku --dangerously-skip-permissions --print …` in a tmux session, wait with `sleep 30`, then read the output buffer.
  - **Interactive tasks** (multi-file edits, iterative prompts): start `claude --model haiku --dangerously-skip-permissions` in tmux, send prompts with `tmux send-keys`, and capture completed responses with `tmux capture-pane`. Expect to sleep between turns so Haiku can finish before you scrape the pane.
- Ralph’s supervisor loop launches Claude the same way (`claude --dangerously-skip-permissions "<prompt>"`) to keep the tmux automation flowing.

## One-Shot Prompts
- The CLI accepts the prompt as a trailing argument in one-shot mode. Multi-line prompts can be piped: `echo "..." | claude --print`.
- Add `--output-format json` when you need structured fields (e.g., summary + bullets) for post-processing.
- Keep prompts explicit about reading full files: “Read docs/example.md in full and produce a 2–3 sentence summary covering all sections.”

## Bulk Markdown Conversion
- Produce the markdown inventory first (`pnpm run docs:list`) and feed batches of filenames to your Claude session.
- For each batch, issue a single instruction like “Rewrite these files with YAML front matter summaries, keep all other content verbatim.” Haiku can loop over multi-file edits when you provide the explicit list.
- After Claude reports success, diff each file locally (`git diff docs/<file>.md`) before moving to the next batch.

## Ralph Integration Notes
- Ralph (see `scripts/ralph.ts`) spins up tmux sessions, auto-wakes the worker, and calls Claude as the supervisor via `claude --dangerously-skip-permissions`.
- Supervisor responses must end with either `CONTINUE`, `SEND: <message>`, or `RESTART`; Ralph parses these tokens to decide the next action.
- To start Ralph manually: `bun scripts/ralph.ts start --goal "…" [--markdown path]`. Progress is tracked in `.ralph/progress.md` by default.
- Send ad-hoc instructions to the worker session with `bun scripts/ralph.ts send-to-worker -- "your guidance"`.


- Use `multi_tool_use.parallel` to run multiple tool calls concurrently (for example, multiple `functions.exec_command` or `functions.shell_command` entries in a single `multi_tool_use.parallel` call). Outputs return together. This is your tool to invoke multiple sub-agents in parallel.
- Only parallelize tasks that do not touch the same files, configuration, or interfaces. If in doubt, run sequentially.
- You cannot interact with sub-agents while they run, and you will not see output until they finish. Let them run uninterrupted for at least 30 minutes.
- Write all prompts up front before starting any sub-agents.

## Model / Agent Selection

Choose the right agent / model that is likely to succeed before spawning the implementer. Cheapest is not always right cost model, since it may fail and require several retries. Consider task complexity:

- ONLY USE THESE COMMANDS and PARAMETERS. DO NOT USE ANY OTHERS.
- **Simple or sometimes referred to as Haiku** (single-file edits, small configs, doc tweaks): `cz --dangerously-skip-permissions --verbose --print --output-format stream-json -p <prompt>`
- **Medium** (single-file changes, new tests, simple coding problems): `claude --dangerously-skip-permissions --print --verbose --output-format stream-json --model claude-sonnet-4-5 -p <prompt>`
- **Complex** (new features, cross-cutting changes, refactors, tricky debugging, medium complexity and higher problems): `claude --dangerously-skip-permissions --verbose --print --output-format stream-json --model claude-opus-4-5 -p <prompt>`
- **Reviews** (combined reviewer, final reviewer): You are the reviewer. Review the code that the agent produced.
