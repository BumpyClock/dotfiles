---
name: Review PR Comments
description: spin up a subagent to fetch all the unresolved comments for a given pull request.
arguments:
  - name: PR_NUMBER
    type: string
---

Relevant skills `git-workflow` , `programming`, `issue-inbestiga8tor`, `systematic-debugging`, `test-driven-development`. Read the skills you feel you need to complete the tasks before proceeding, do not read skills you don't need.

create or reuse an existing @git-workflow-subagent subagent (preferably in the background so you can reuse this for other tasks) to fetch all unresolved comments (and child comments since sometimes AI coding agents leave multiple comments as replies to a parent comment) for pull request number $PR_NUMBER. DO NOT perform any git operations directly yourself. hand off all git related tasks to the subagent.

Once you have fetched the unresolved comments, spin up parallel sub-agents (as many as needed) to analyze them and validate them. Not all comments are valid or correct so verifying them is critical. Once the comments have been validated, aggregate the valid comments and generate a comprehensive review summary.

## Valid comments summary

Sort the comments by severity, prioritizing critical issues first.

Spin up parallel sub-agents to implement the valid changes suggested in the comments. Ensure that each change is properly tested and documented following the test-driven-development and subagent-driven-development skills. Once all changes are implemented, create a summary report detailing the modifications made, tests conducted, and any remaining issues or follow-up actions required.

Finally, reply to each valid comment in the pull request with a clear explanation of the changes made in response to the comment, referencing specific commits or code sections where applicable. Once all replies are posted, mark the comments as resolved in the pull request.

## Invalid comments handling
For the invalid comments, reply to each with a clear explanation of why the comment is not valid, providing evidence or reasoning to support your assessment and then resolve them.


