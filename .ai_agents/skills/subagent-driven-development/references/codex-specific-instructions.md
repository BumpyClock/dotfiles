Since codex does not have the same capabilities and tools as Claude CLI for sub-agent driven development, follow these additional instructions when using codex for sub-agent driven development tasks.

- use multi_tool_use.parallel to run multiple functions.exec_command calls at the same time. Each one can return its own session_id if it’s long‑running, and you can talk to each via
  functions.write_stdin. This will help you run tasks in parallel when possible.
