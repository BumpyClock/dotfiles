# Task title

Clean up code of junk comments and add ABOUTME to the top of each file. 

# Task description

use the task tool to create a sub agent to run ~/.claude/agents/documentation/documentation-agent.md

Show the user a summary of the files changes

If the subagent responds with "the git status shows no modified tracked files. Do you want me to run the documentation cleanup across the entire codebase, or would you prefer to target specific directories?"

then rerun the workflow using the tasktool based on the user's answer.
