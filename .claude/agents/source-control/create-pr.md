# Create Pull Request - Chain of Thought Prompt

You are tasked with analyzing git changes and generating comprehensive pull request content. Use the task tool to parallelize operations for maximum efficiency.

## Step 1: Environment Validation and Setup

First, validate the environment and check for uncommitted changes:

```bash
# Create temporary directory for results
mkdir -p /tmp/pr-gen

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo '{"status": "error", "error": "Not in a git repository"}'
  exit 1
fi

# Verify GitHub CLI authentication
if ! gh auth status > /dev/null 2>&1; then
  echo '{"status": "error", "error": "GitHub CLI not authenticated. Run: gh auth login"}'
  exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo '{"status": "error", "error": "Uncommitted changes detected. Please commit first or run local-commit workflow"}'
  exit 1
fi
```

## Step 2: Parallel Information Gathering

Use the task tool to create multiple sub-agents that run simultaneously:

### Sub-agent 1: Repository Analysis

```bash
task create-sub-agent --name "repo-info" --script '
  echo "{
    \"defaultBranch\": \"$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)\",
    \"currentBranch\": \"$(git branch --show-current)\",
    \"repoName\": \"$(gh repo view --json name -q .name)\",
    \"repoOwner\": \"$(gh repo view --json owner -q .owner.login)\"
  }" > /tmp/pr-gen/repo.json
'
```

### Sub-agent 2: Commit Analysis

```bash
task create-sub-agent --name "commits" --script '
  DEFAULT=$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name || echo "main")
  git log $DEFAULT..HEAD --pretty=format:"{\"sha\":\"%H\",\"message\":\"%s\"}" | jq -s "{commits: .}" > /tmp/pr-gen/commits.json
'
```

### Sub-agent 3: File Changes Analysis

```bash
task create-sub-agent --name "files" --script '
  DEFAULT=$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name || echo "main")
  FILES=$(git diff --name-only $DEFAULT..HEAD | jq -R -s -c "split(\"\n\") | map(select(. != \"\"))")
  STATS=$(git diff --shortstat $DEFAULT..HEAD)
  ADDS=$(echo "$STATS" | grep -oE "[0-9]+ insertion" | grep -oE "[0-9]+" || echo 0)
  DELS=$(echo "$STATS" | grep -oE "[0-9]+ deletion" | grep -oE "[0-9]+" || echo 0)

  echo "{
    \"changed\": $(echo "$FILES" | jq length),
    \"additions\": $ADDS,
    \"deletions\": $DELS,
    \"list\": $FILES
  }" > /tmp/pr-gen/files.json
'
```

### Sub-agent 4: Project Type Detection

```bash
task create-sub-agent --name "project-type" --script '
  TYPE="other"
  if [ -f package.json ]; then
    if grep -q "react\\|vue\\|angular\\|next" package.json; then TYPE="web"
    elif grep -q "\"bin\":" package.json; then TYPE="cli"
    elif grep -q "express\\|fastify\\|koa" package.json; then TYPE="api"
    else TYPE="library"
    fi
  fi
  echo "{\"projectType\": \"$TYPE\"}" > /tmp/pr-gen/project.json
'
```

### Sub-agent 5: GitHub Metadata

```bash
task create-sub-agent --name "metadata" --script '
  LABELS=$(gh label list --json name --jq "[.[].name]" 2>/dev/null || echo "[]")
  ISSUES=$(git log origin/main..HEAD --pretty=format:"%s %b" | grep -oE "#[0-9]+" | grep -oE "[0-9]+" | sort -u | jq -R -s "split(\"\n\") | map(select(. != \"\")) | map(tonumber)")

  echo "{
    \"availableLabels\": $LABELS,
    \"relatedIssues\": $ISSUES
  }" > /tmp/pr-gen/metadata.json
'
```

Wait for all sub-agents to complete:

```bash
task wait-all --timeout 30s
```

## Step 3: Content Generation and Analysis

Based on the gathered data, generate PR content:

```bash
# Load all collected data
REPO=$(cat /tmp/pr-gen/repo.json)
COMMITS=$(cat /tmp/pr-gen/commits.json)
FILES=$(cat /tmp/pr-gen/files.json)
PROJECT=$(cat /tmp/pr-gen/project.json)
METADATA=$(cat /tmp/pr-gen/metadata.json)

# Analyze commits to determine PR type and title
COMMIT_COUNT=$(echo "$COMMITS" | jq '.commits | length')
FIRST_COMMIT=$(echo "$COMMITS" | jq -r '.commits[0].message // "Update code"')

# Determine PR type from commit patterns
PR_TYPE="feature"
if echo "$COMMITS" | jq -r '.commits[].message' | grep -qi "fix\\|bug"; then
  PR_TYPE="fix"
elif echo "$COMMITS" | jq -r '.commits[].message' | grep -qi "refactor"; then
  PR_TYPE="refactor"
elif echo "$COMMITS" | jq -r '.commits[].message' | grep -qi "docs"; then
  PR_TYPE="docs"
fi

# Check for breaking changes
BREAKING=false
if echo "$COMMITS" | jq -r '.commits[].message' | grep -qi "breaking"; then
  BREAKING=true
fi

# Generate title
TITLE=$(echo "$FIRST_COMMIT" | sed -E 's/^(feat|fix|docs|refactor|test|chore)(\(.+\))?:\s*//i')
if [ "$BREAKING" = true ]; then
  TITLE="[BREAKING] $TITLE"
else
  TITLE="[${PR_TYPE^}] $TITLE"
fi

# Generate comprehensive body
BODY="## Summary

This pull request $(echo "$COMMITS" | jq -r '.commits | length') commits that $(echo "$FILES" | jq -r '.changed') files.

## Changes

$(echo "$FILES" | jq -r '.list[]' | head -10 | sed 's/^/- /')

## Statistics
- Files changed: $(echo "$FILES" | jq -r '.changed')
- Additions: +$(echo "$FILES" | jq -r '.additions')
- Deletions: -$(echo "$FILES" | jq -r '.deletions')

## Commits
$(echo "$COMMITS" | jq -r '.commits[] | "- \(.message)"')
"

# Add project-specific sections
PROJECT_TYPE=$(echo "$PROJECT" | jq -r '.projectType')
case "$PROJECT_TYPE" in
  "web")
    BODY="$BODY

## UI Changes
*Screenshots recommended - use Playwright MCP if available*"
    ;;
  "cli")
    BODY="$BODY

## CLI Examples
*Add terminal output examples after PR creation*"
    ;;
  "api")
    BODY="$BODY

## API Changes
*Document any endpoint changes or new routes*"
    ;;
esac

# Determine suggested labels
SUGGESTED_LABELS=$(echo "$METADATA" | jq --arg type "$PR_TYPE" '
  .availableLabels | map(select(. | ascii_downcase | contains($type))) |
  if length == 0 then ["enhancement"] else .[0:3] end
')
```

## Step 4: Assemble Final JSON Response

Create the complete JSON response with all PR details:

```bash
# Build the final JSON response
cat > /tmp/pr-gen/final.json <<EOF
{
  "status": "success",
  "data": {
    "title": "$TITLE",
    "body": $(echo "$BODY" | jq -Rs .),
    "type": "$PR_TYPE",
    "breaking": $BREAKING,
    "draft": true,
    "branch": {
      "current": $(echo "$REPO" | jq -r '.currentBranch' | jq -Rs .),
      "base": $(echo "$REPO" | jq -r '.defaultBranch' | jq -Rs .)
    },
    "commits": $(echo "$COMMITS" | jq '.commits'),
    "files": $(echo "$FILES"),
    "projectType": "$PROJECT_TYPE",
    "metadata": {
      "suggestedLabels": $SUGGESTED_LABELS,
      "relatedIssues": $(echo "$METADATA" | jq '.relatedIssues')
    }
  }
}
EOF

# Output the final JSON
cat /tmp/pr-gen/final.json
```

## Chain of Thought Summary

1. **Validate** environment (git repo, gh auth, no uncommitted changes)
2. **Parallelize** data collection using 5 sub-agents:
   - Repository information
   - Commit history
   - File changes
   - Project type
   - GitHub metadata (labels and related issues)
3. **Analyze** commits to determine PR type and detect breaking changes
4. **Generate** comprehensive title and body based on changes
5. **Enrich** with project-specific sections (UI, CLI, API)
6. **Suggest** appropriate labels based on PR type
7. **Return** structured JSON for upstream confirmation

## Expected JSON Output Structure

```json
{
  "status": "success",
  "data": {
    "title": "[Feature] Add user authentication",
    "body": "## Summary\n\nThis pull request...",
    "type": "feature",
    "breaking": false,
    "draft": true,
    "branch": {
      "current": "feature/auth",
      "base": "main"
    },
    "commits": [...],
    "files": {
      "changed": 12,
      "additions": 450,
      "deletions": 23,
      "list": [...]
    },
    "projectType": "web",
    "metadata": {
      "suggestedLabels": ["feature", "authentication"],
      "relatedIssues": [123, 456]
    }
  }
}
```

This JSON can then be used by the upstream command to:

1. Display the PR preview to the user
2. Get confirmation (draft/publish/cancel)
3. Execute `gh pr create` with the appropriate parameters
