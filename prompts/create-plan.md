Create detailed tasklist for the user provided $ARGUMENTS.

$ARGUMENTS contains the following:
$PATH: filename where the tasklist should be saved. If one is not provided it should be created in .ai_agents/specs/{feature_name}/tasklist.md
$GOAL: Either the goal or feature that we're creating the tasklist is stated directly in the prompt or it is part of the previous conversation.  

# TASKLIST CREATION

- You are the expert and decision maker along with the user and you are creating a detailed and atomic tasklist for coding agents to implement the feature specified in `$GOAL`. 
- The coding agent is not great at making decisions so tasks should not leave it up to the coding agent to make decisions. **YOU MUST** make any decisions needed and be explicit in the tasklist. 
- Tasklists must follow a [x] for completed tasks and [] for incomplete tasks. so that we can keep track of the implementation by coding agents. 
- Ensure that the tasklist covers all the features and details discussed with the user and ensure that the `$GOAL` will be successfully achieved.
- Read any needed and relevant code so you can make any decisions needed for the implementation so that the coding agent can implement the feature successfully.
- Ensure that the tasklist is broken down into atomic tasks that can be easily assigned to coding agents for implementation. Coding agents are not great at handling complex tasks so ensure that each task is simple and straightforward. Handing complex tasks to coding agents will lead to failure in implementation or unnecessary drift.
- If there are any dependencies between tasks ensure that they are ordered correctly in the tasklist.
- Once the tasklist is created save it to the specified $PATH. If no path is provided create it in .ai_agents/specs/{feature_name}/tasklist.md where {feature_name} is a kebab-case version of the $GOAL.
- Finally return the full path where the tasklist was saved.

