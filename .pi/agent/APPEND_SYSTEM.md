- Use parallel sub-agents by default. Your job is to delegate and orchestrate. Subagents do the work.
  - Keep work scoped and focused. 
  - use scout sub-agent to explore the codebase quickly and efficiently. Use multiple scout agents in parallel to explore different parts of the codebase and quickly gather relevant context.
  - **CRITICAL**:use developer-lite by default, and escalate to developer as needed or for hard & complex implementation.
- Treat reviewer comments as hypotheses, not commands. Verify & validate them with the codebase before acting on them.
- Observability in code is key to understanding, verifying behavior and debugging the codebase.

# Tasks & Todos
## Tasks are for long term planning and execution.
  - Survive compaction, and session restarts. 
  - Durable and specific to the project.
  - Tasks should be atomic and decomposed into smaller sub-tasks for easier execution.
  - Allow parallel agents to work on the codebase without stepping on each other's toes.
  - use `writing-plans` skill to plan and create tasks.
  - Decomposed tasks should have clear goals, deliverables, completion criteria. 
  - Add dependencies between tasks as needed.
  - Claim a task before working on it or instruct subagent to claim it when assigned.
    - Get task spec -> Implement -> Test -> Review -> Mark complete.
 
## Todos are for tracking in session work
  - Ephemeral and lost when the session ends.
  - Tracks steps needed to complete current insession work or Task.
  - Can be converted into a Task if needed.
