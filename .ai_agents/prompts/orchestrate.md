Act as an orchestrator and run the coding agent and review the tasks. if it looks good then following the task completion loop with the coding agent. User will provide the tasks in $ARGUMENTS.


## Chain of Thought Process (ALWAYS FOLLOW THIS)

### Step 1: Initial Analysis
Think: "What is the user asking for? Let me break this down..."
- Identify the core goal
- List all components/subtasks needed
- Consider dependencies between tasks

### Step 2: Interface Definition
Think: "What contracts do these parallel agents need?"
- Define clear interfaces for each component
- Specify expected inputs/outputs
- Document integration points

### Step 3: Evaluate task complexity
Think: "Is this too complex for one agent?"
- If yes, break down further into sub-tasks
- Spwan additional agents as needed to complete sub-tasks in parallel if possible.

## CORE ORCHESTRATION LOOP

***Define work*** 
  - Create a follow up prompt for the coding agent for the next task in $ARGUMENTS.
  - Create a detailed and precise prompt for the coding agent following the **PROMPT CREATION FLOW** below. Save the prompt in a text file in `.ai_agents/coding-agent-prompts/` and pass it to the coding agent using `cat`.
  - Call the coding agent using the `claude --model claude-sonnet-4-5-20250929 -p <prompt>`
***REVIEW THE WORK***  
  - Review the agents work. If it looks good then continue with the next task. If it does not look good or drifts from the expected implementation then create another prompt and call the coding agent again to fix the issue. 
  - The new coding agent will not have context of your previous prompt so your prompts need to include sufficient context and details for the agent to be successful in completing the tasks.
  - Stay in the review step until you are satisfied with the work.
  - if the agent is unable to meet the requirements after 10 steps then break the loop and let the user know.
  
  ***Post task steps***
  - Update your todo list and **mark the task as completed**. if you're following an external tasklist, update the tasklist with the completion status.
  - Start on the next task.
  - Repeat until the tasks delgated to you are finished.


Remember that the agent will not have context of this conversation so your prompts need to include sufficient context and details for the agent to be successful in completing the tasks.

## PROMPT CREATION FOLLOW
- The coding agent is not great at making decisions so tasks should not leave it up to the coding agent to make decisions. **YOU MUST** make any decisions needed and be explicit in the prompt you provide. If needed discuss with me and clarify any uncertainties before finalizing the prompt and making decisions.
- Read any needed and relevant code so you can make any decisions needed for the implementation so that the coding agent can implement the task successfully.
- The prompt should be very detailed and precise so that the coding agent can implement the task without any further clarifications.
- If the task is too big to be done in one go then break it down into smaller sub tasks and create a prompt for each sub task following the same rules as above.
- In the prompt include that the agent must include a summary of their work, files they touched, and changed in `.ai_agents/session_context/{todaysdate}/task-{taskid}.md` this is how the agent can communicate their work.

**Agent spawning command:**

use the task tool or bash tool the following command to spawn agents:
```bash
claude --model claude-sonnet-4-5-20250929 -p "[Full context + Specific task + All interfaces + Dependencies]"
```

if you need you can spin up simultaneously multiple agents for parallel tasks using the bash tool.
