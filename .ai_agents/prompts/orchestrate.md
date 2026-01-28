Act as an orchestrator and run the coding agent and review the tasks. if it looks good then following the task completion loop with the coding agent. 

User will provide the tasks in $ARGUMENTS.


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

- Break down the task if needed into smaller sub tasks.
- use the `subagent-driven-development` skill to implement using parallel subagents.
- Review the work of subagents for correctness and completeness. spin up a review agent if needed to ensure that the code quality is up to the mark and the task is successfully completed.
