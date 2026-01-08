Since codex does not have the same capabilities and tools as Claude CLI for parallel sub-agents, follow these additional instructions when using codex for sub-agent driven development tasks.

- use multi_tool_use.parallel to run multiple functions.exec_command calls at the same time. This will help you run tasks in parallel when possible.
- You cannot interact with sub_agents. While the agent is working there will not be any console output until the agent is done. Let the subagent run uninterrupted for at least 30 minutes. Do not prematurely stop the agent ,be patient.
- Think carefully about which tasks can be parallelized. Only parallelize tasks that do not share files, configuration, or interfaces. If in doubt, run sequentially. When tasks don't share files, configuration, or interfaces, you can run them in parallel using multi_tool_use.parallel to spin up multiple coding agents at once and speed up the implementation. 

## Model / Agent Selection

Choose the right agent / model that is likely to succeed before spawning the implementer. Cheapest is not always right cost model, since it may fail and require several retries. Consider task complexity:

- ONLY USE THESE COMMANDS and PARAMETERS. DO NOT USE ANY OTHERS.
- **Simple or sometimes referred to as Haiku** (single-file edits, small configs, doc tweaks): `cz --dangerously-skip-permissions -p <prompt>`
- **Medium** (single-file changes, new tests, simple coding problems): `claude --dangerously-skip-permissions --model claude-sonnet-4-5 -p <prompt>`
- **Complex** (new features, cross-cutting changes, refactors, tricky debugging, medium complexity and higher problems): `claude --dangerously-skip-permissions --model claude-opus-4-5 -p <prompt>`
- **Reviews** (combined reviewer, final reviewer): You are the reviewer. Review the code that the agent produced.
