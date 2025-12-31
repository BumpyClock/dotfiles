Use sub-agents in parallel to implement complex tasks efficiently. 

## Model / Agent Selection

Choose the right agent / model that is likely to succeed before spawning the implementer. Cheapest is not always right cost model, since it may fail and require several retries. Consider task complexity:

- ONLY USE THESE COMMANDS and PARAMETERS. DO NOT USE ANY OTHERS.
- **Simple** (single-file edits, small configs, doc tweaks): use the bash tool to run `cz --dangerously-skip-permissions -p <prompt>` this runs a lightweight model using claude code. 
- **Medium** spin up a developer-lite sub agent.
- **Complex** Spin up a developer sub agent.
- **Reviews** (combined reviewer, final reviewer): Spin up a reviewer sub-agent. Review the code that the agent produced. Use `reviewer-prompt.md` for combined spec compliance + code quality reviews.