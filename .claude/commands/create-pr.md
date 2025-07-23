# Task title

Create a Pull Request - with confirmation

# Task description

use the task tool to create a sub agent to run ./agents/source-control/create-pr.md

Show the user the {PR_output} of the agent and ask them to confirm with the following question:

`Create this PR as a DRAFT? (yes/no) Note: Say 'yes publish' to create as ready for review`

If the user confirms, proceed with the PR creation. If they say 'yes publish', create the PR as ready for review. If they say 'no', do not create the PR and inform them that it has been cancelled.

use the task tool to create the PR with the {PR_output} from the first agent as the input to this agent so it can use the `gh pr create` command to create the PR with the right message.
