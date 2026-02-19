# Review Comments Workflow

Handle PR feedback systematically: fetch, triage, address, and resolve.

---

## Fetching Comments

### Get UNRESOLVED comments only (recommended for LLM context)

Use GraphQL to filter out resolved threads and minimize context:

```bash
# Fetch only unresolved review threads (recommended)
gh api graphql -f query='
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(first: 100) {
          nodes {
            isResolved
            comments(first: 10) {
              nodes {
                body
                author { login }
                path
                line
              }
            }
          }
        }
      }
    }
  }
' -f owner='{owner}' -f repo='{repo}' -F pr={pr_number} \
  --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | .comments.nodes[] | "File: \(.path):\(.line)\nAuthor: \(.author.login)\nComment: \(.body)\n---"'
```

### Compact unresolved summary (minimal context)

```bash
# One-liner per unresolved comment
gh api graphql -f query='
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(first: 100) {
          nodes {
            isResolved
            comments(first: 1) {
              nodes { path line body author { login } }
            }
          }
        }
      }
    }
  }
' -f owner='{owner}' -f repo='{repo}' -F pr={pr_number} \
  --jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | .comments.nodes[0] | "\(.path):\(.line) [@\(.author.login)] \(.body | split("\n")[0])"] | .[]'
```

### Count unresolved vs resolved

```bash
# Quick count before fetching full context
gh api graphql -f query='
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(first: 100) {
          nodes { isResolved }
        }
      }
    }
  }
' -f owner='{owner}' -f repo='{repo}' -F pr={pr_number} \
  --jq '{
    total: (.data.repository.pullRequest.reviewThreads.nodes | length),
    unresolved: ([.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)] | length),
    resolved: ([.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == true)] | length)
  }'
```

### Get ALL comments (when full context needed)

```bash
# View PR with all comments (includes resolved)
gh pr view {pr_number} --comments

# REST API - all review comments (no resolution filter)
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments

# REST API - issue-style comments
gh api repos/{owner}/{repo}/issues/{pr_number}/comments

# REST API - reviews with their comments
gh api repos/{owner}/{repo}/pulls/{pr_number}/reviews
```

### Parse all comments (legacy)
```bash
# Pretty print all review comments (includes resolved)
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments \
  --jq '.[] | "File: \(.path):\(.line)\nAuthor: \(.user.login)\nComment: \(.body)\n---"'
```

---

## Triaging Comments

Categorize each comment:

| Category | Action | Priority |
|----------|--------|----------|
| **Blocking** | Must fix before merge | High |
| **Suggestion** | Consider implementing | Medium |
| **Question** | Respond with explanation | Medium |
| **Nit** | Optional improvement | Low |
| **Praise** | Acknowledge, no action | None |

### Triage Process

1. Read all comments first (don't react immediately)
2. Group by category
3. Identify dependencies between comments
4. Start with blocking issues
5. Address related comments together

---

## Addressing Comments

### Workflow

1. **Acknowledge** - Reply briefly that you're addressing it
2. **Implement** - Make the change
3. **Commit** - Use descriptive commit message referencing the feedback
4. **Reply** - Explain what you did and mark as resolved

### Commit Messages for Feedback

```bash
# Reference the review in commit
git commit -m "fix: address review feedback on error handling

- Added null check per @reviewer suggestion
- Improved error message clarity"
```

### Responding to Comments

**Agree and fix:**
```
Good catch! Fixed in the latest commit.
```

**Disagree (with reasoning):**
```
I considered this, but [reasoning]. The current approach is preferable because [benefit].
Happy to discuss further if you still have concerns.
```

**Needs clarification:**
```
Could you elaborate on what you mean by X? I want to make sure I address this correctly.
```

**Won't fix (with justification):**
```
This is intentional because [reason]. I've added a comment to clarify.
```

---

## Resolving Conversations

### On GitHub UI
Click "Resolve conversation" after addressing feedback.

### Via API
```bash
# Mark a review comment as resolved (if supported)
# Note: GitHub doesn't have a direct API for this - use UI or bot integrations
```

### Best Practices

- Only resolve your own conversations if you're the author
- Let reviewer resolve if the feedback was significant
- Reply before resolving so reviewer sees your response

---

## Re-requesting Review

### After addressing all feedback
```bash
# Request re-review from specific users
gh pr edit {pr_number} --add-reviewer {username}

# Or via API
gh api repos/{owner}/{repo}/pulls/{pr_number}/requested_reviewers \
  -f 'reviewers[]=username1' -f 'reviewers[]=username2'
```

### When to re-request

- After addressing all blocking feedback
- After significant changes from suggestions
- NOT for minor nits (just push and mention in comments)

---

## Batch Operations

### Address multiple related comments

1. Group comments by file/feature
2. Make all related changes
3. Single commit with comprehensive message
4. Reply to each comment with: "Addressed in [commit SHA]"

### Template reply for batch fixes
```
Addressed in abc123:
- [Comment 1 summary]: done
- [Comment 2 summary]: done
- [Comment 3 summary]: done with slight modification - [explanation]
```

---

## Handling Conflicting Feedback

When reviewers disagree:

1. Don't pick sides immediately
2. Summarize both perspectives in a reply
3. Tag both reviewers: "@reviewer1 @reviewer2 - different views here, thoughts?"
4. Propose a middle ground if obvious
5. Escalate to team lead if no resolution

---

## Quick Reference

```bash
# Count unresolved comments (check before fetching)
gh api graphql -f query='query($owner:String!,$repo:String!,$pr:Int!){repository(owner:$owner,name:$repo){pullRequest(number:$pr){reviewThreads(first:100){nodes{isResolved}}}}}' \
  -f owner='{owner}' -f repo='{repo}' -F pr={pr} \
  --jq '[.data.repository.pullRequest.reviewThreads.nodes[]|select(.isResolved==false)]|length'

# Get unresolved comments only (recommended)
gh api graphql -f query='query($owner:String!,$repo:String!,$pr:Int!){repository(owner:$owner,name:$repo){pullRequest(number:$pr){reviewThreads(first:100){nodes{isResolved comments(first:10){nodes{body author{login}path line}}}}}}}' \
  -f owner='{owner}' -f repo='{repo}' -F pr={pr} \
  --jq '.data.repository.pullRequest.reviewThreads.nodes[]|select(.isResolved==false)|.comments.nodes[]|"\(.path):\(.line) @\(.author.login): \(.body)"'

# View all PR comments (includes resolved)
gh pr view {pr} --comments

# Check review status
gh pr status

# Push fixes and update PR
git push origin HEAD

# Request re-review
gh pr edit {pr} --add-reviewer {user}
```
