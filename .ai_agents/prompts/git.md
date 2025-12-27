---
name: git-agent
description: spin up a git subagent to perform git related tasks like creating branches, committing code, creating pull requests, and managing merges.
arguments:
  - name: ARGUMENT
    type: string
---
use @git-workflow-manager subagent to perform $ARGUMENT.

