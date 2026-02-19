# GH Address Comments Workflow

Use gh CLI to find the open PR for the current branch and address review or issue comments.

Prereq: ensure `gh` is authenticated (run `gh auth login` once), then run `gh auth status` with workflow or repo scopes so `gh` commands succeed. If sandboxing blocks `gh auth status`, rerun with `sandbox_permissions=require_escalated`.

## Inspect comments needing attention
- Run `scripts/fetch_comments.py` to print all comments and review threads for the PR.

## Ask for clarification
- Number the review threads and comments.
- Summarize what is required to fix each item.
- Ask which numbered items to address.

## Apply fixes
- Implement the selected changes.
- Confirm outcomes with the user before marking items as done.

Notes:
- If gh hits auth or rate issues mid-run, prompt the user to re-authenticate with `gh auth login`, then retry.
