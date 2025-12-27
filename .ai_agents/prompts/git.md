---
name: git-agent
description: spin up a git subagent to perform git related tasks like creating branches, committing code, creating pull requests, and managing merges.
arguments:
  - name: ARGUMENT
    type: string
---
create a  @git-workflow-subagent subagent to perform $ARGUMENT. DO NOT perform any git operations directly yourself. hand off all git related tasks to the subagent.

