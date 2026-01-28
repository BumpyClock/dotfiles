Since codex does not have the same capabilities and tools as Claude CLI for parallel sub-agents, follow these additional instructions when using codex for sub-agent driven development tasks.

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
