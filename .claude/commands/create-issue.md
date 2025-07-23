Use the task tool to create a sub-agent to run the ~/.claude/commands/agents/prompt-enhancer/refine-prompt.md workflow to help the user refine their prompt for better results. This agent will assist in clarifying the user's request and ensuring that the AI can provide the most relevant and accurate response possible.

The output of this agent should be a {refined_prompt} that we will pass to the the create-issue subagent agent.

use the task tool to create a sub agent to run ~/.claude/commands/agents/source-control/create-issue.md pass the {refined_prompt} as the input to the agent.
