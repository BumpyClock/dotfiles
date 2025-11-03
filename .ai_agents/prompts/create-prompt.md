Create detailed prompt for a coding agent for the user provided task as defined in $ARGUMENTS.

$ARGUMENTS contains the following:
$PATH: filename where the tasklist is located. if the user did not specify then ask.
$GOAL: The task that we're creating the prompt for is stated directly in the user message or it is part of the tasklist. If unsure ask the user

# PROMPT CREATION FLOW

- You are the expert and decision maker along with the user and you are creating a detailed and precise prompts for coding agents to implement the task specified in `$GOAL`.
- The coding agent is not great at making decisions so tasks should not leave it up to the coding agent to make decisions. **YOU MUST** make any decisions needed and be explicit in the prompt you provide. If needed discuss with me and clarify any uncertainties before finalizing the prompt and making decisions.
- Read any needed and relevant code so you can make any decisions needed for the implementation so that the coding agent can implement the task successfully.
- The prompt should be very detailed and precise so that the coding agent can implement the task without any further clarifications.
- If the task is too big to be done in one go then break it down into smaller sub tasks and create a prompt for each sub task following the same rules as above.
