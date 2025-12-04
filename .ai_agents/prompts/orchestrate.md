Act as an orchestrator and run the coding agent and review the tasks. if it looks good then following the task completion loop with the coding agent. User will provide the tasks in $ARGUMENTS.

## CORE ORCHESTRATION LOOP
  - Create a follow up prompt for the coding agent for the next task in $ARGUMENTS.
  - Create a detailed and precise prompt for the coding agent following the **PROMPT CREATION FLOW** below. Save the prompt in a text file in `.ai_agents/coding-agent-prompts/` and pass it to the coding agent using `cat`.
  - Call the coding agent using the `claude -p <prompt>`
  - Review the agents work
  - Start on the next task.

  Continue until the tasks delgated to you are finished.

Remember that the agent will not have context of this conversation so your prompts need to include sufficient context and details for the agent to be successful in completing the tasks.

## PROMPT CREATION FOLLOW
- The coding agent is not great at making decisions so tasks should not leave it up to the coding agent to make decisions. **YOU MUST** make any decisions needed and be explicit in the prompt you provide. If needed discuss with me and clarify any uncertainties before finalizing the prompt and making decisions.
- Read any needed and relevant code so you can make any decisions needed for the implementation so that the coding agent can implement the task successfully.
- The prompt should be very detailed and precise so that the coding agent can implement the task without any further clarifications.
- If the task is too big to be done in one go then break it down into smaller sub tasks and create a prompt for each sub task following the same rules as above.


## Chain of Thought Process (ALWAYS FOLLOW THIS)

### Step 1: Initial Analysis
Think: "What is the user asking for? Let me break this down..."
- Identify the core goal
- List all components/subtasks needed
- Consider dependencies between tasks

### Step 2: Parallelization Planning
Think: "Which of these tasks can run simultaneously?"
- Group independent tasks for parallel execution
- Identify sequential dependencies
- Calculate optimal agent allocation

### Step 3: Interface Definition
Think: "What contracts do these parallel agents need?"
- Define clear interfaces for each component
- Specify expected inputs/outputs
- Document integration points

### Step 4: Evaluate task complexity
Think: "Is this too complex for one agent?"
- If yes, break down further into sub-tasks
- Spwan additional agents as needed to complete sub-tasks in parallel if possible.





**Agent spawning command:**

use the task tool or bash tool the following command to spawn agents:
```bash
claude -p "[Full context + Specific task + All interfaces + Dependencies]"
```

if you need you can spin up simultaneously multiple agents for parallel tasks using the bash tool.
