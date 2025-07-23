# Create Pull Request - Chain of Thought Prompt (Refined)

You are tasked with analyzing git changes and generating comprehensive pull request content. You have access to a task tool that allows you to run multiple operations in parallel. Follow this explicit chain of thought process with careful variable tracking.

## Variable Declarations

```typescript
// Global State Variables
let ENV_STATE = {
  isGitRepo: false,
  isAuthenticated: false,
  isClean: false,
  validationPassed: false,
};

let REPO_DATA = {
  defaultBranch: null,
  currentBranch: null,
  repoName: null,
  repoOwner: null,
};

let COMMIT_DATA = {
  commits: [],
  totalCount: 0,
  primaryCommit: null,
};

let FILE_DATA = {
  changed: 0,
  additions: 0,
  deletions: 0,
  list: [],
};

let PROJECT_DATA = {
  projectType: null,
  hasPackageJson: false,
  dependencies: [],
};

let GITHUB_DATA = {
  availableLabels: [],
  relatedIssues: [],
};

let PR_ANALYSIS = {
  type: null,
  breaking: false,
  patterns: {
    fixes: 0,
    features: 0,
    refactors: 0,
    docs: 0,
  },
};

let PR_CONTENT = {
  title: null,
  body: null,
  labels: [],
  draft: true,
};
```

## Step 1: Environment Validation [PARALLEL]

### Reasoning Step 1.1

**Think**: "I need to validate three environmental prerequisites. Each check is independent, so I'll run them in parallel. I'll track the results in ENV_STATE."

### Action Step 1.1: Parallel Validation Checks

```yaml
parallel_tasks:
  - task_id: "git_check"
    command: "test -d .git"
    on_success: SET ENV_STATE.isGitRepo = true
    on_failure: SET ENV_STATE.isGitRepo = false

  - task_id: "auth_check"
    command: "gh auth status"
    on_success: SET ENV_STATE.isAuthenticated = true
    on_failure: SET ENV_STATE.isAuthenticated = false

  - task_id: "clean_check"
    command: "git status --porcelain"
    on_success: SET ENV_STATE.isClean = (output.length === 0)
    on_failure: SET ENV_STATE.isClean = false
```

### Decision Step 1.2

**Think**: "Now I need to evaluate if all checks passed."

```javascript
// Evaluate validation state
ENV_STATE.validationPassed =
  ENV_STATE.isGitRepo &&
  ENV_STATE.isAuthenticated &&
  ENV_STATE.isClean

// Generate appropriate error if validation failed
if (!ENV_STATE.validationPassed) {
  let errors = []
  if (!ENV_STATE.isGitRepo) errors.push("Not in a git repository")
  if (!ENV_STATE.isAuthenticated) errors.push("GitHub CLI not authenticated. Run: gh auth login")
  if (!ENV_STATE.isClean) errors.push("Uncommitted changes detected. Please commit first")

  RETURN {
    status: "error",
    error: errors.join("; "),
    state: ENV_STATE
  }
}
```

**Checkpoint**: `ENV_STATE.validationPassed === true` before proceeding

## Step 2: Parallel Information Gathering [PARALLEL WITH TASK TOOL]

### Reasoning Step 2.1

**Think**: "Environment is valid. Now I need to gather 5 different types of repository information. Since these are independent, I'll parallelize them. Each sub-agent will populate its respective global variable."

### Action Step 2.2: Parallel Data Collection

```yaml
parallel_tasks:
  - task_id: "repo_analysis"
    description: "Extract repository metadata"
    commands:
      - "git symbolic-ref --short HEAD" → REPO_DATA.currentBranch
      - "git remote get-url origin" → parse → REPO_DATA.repoName, REPO_DATA.repoOwner
      - "git symbolic-ref refs/remotes/origin/HEAD" → REPO_DATA.defaultBranch
    output_variable: REPO_DATA

  - task_id: "commit_analysis"
    description: "Analyze commit history"
    commands:
      - "git log {REPO_DATA.defaultBranch}..HEAD --format='%H|%s'" → parse
    post_process:
      - COMMIT_DATA.commits = parsed_commits
      - COMMIT_DATA.totalCount = commits.length
      - COMMIT_DATA.primaryCommit = commits[0] || null
    output_variable: COMMIT_DATA

  - task_id: "file_analysis"
    description: "Quantify file modifications"
    commands:
      - "git diff --numstat {REPO_DATA.defaultBranch}...HEAD" → parse
      - "git diff --name-only {REPO_DATA.defaultBranch}...HEAD" → FILE_DATA.list
    post_process:
      - Calculate FILE_DATA.additions, FILE_DATA.deletions, FILE_DATA.changed
    output_variable: FILE_DATA

  - task_id: "project_detection"
    description: "Identify project type"
    commands:
      - "test -f package.json" → PROJECT_DATA.hasPackageJson
      - If hasPackageJson: "cat package.json" → parse dependencies
    decision_tree:
      - IF contains ["react", "vue", "angular", "next"] → PROJECT_DATA.projectType = "web"
      - ELIF has "bin" field → PROJECT_DATA.projectType = "cli"
      - ELIF contains ["express", "fastify", "koa"] → PROJECT_DATA.projectType = "api"
      - ELIF hasPackageJson → PROJECT_DATA.projectType = "library"
      - ELSE → PROJECT_DATA.projectType = "other"
    output_variable: PROJECT_DATA

  - task_id: "github_metadata"
    description: "Collect GitHub metadata"
    commands:
      - "gh label list --json name" → GITHUB_DATA.availableLabels
      - "git log --grep='#[0-9]' {REPO_DATA.defaultBranch}..HEAD" → extract issue numbers
    output_variable: GITHUB_DATA
```

### Synchronization Step 2.3

**Think**: "I need to wait for all parallel tasks to complete and verify data integrity."

```javascript
// Wait for all tasks
await Promise.all(parallel_tasks);

// Validate collected data
let dataValidation = {
  hasRepoData: REPO_DATA.currentBranch !== null,
  hasCommitData: COMMIT_DATA.totalCount > 0,
  hasFileData: FILE_DATA.changed > 0,
  hasProjectType: PROJECT_DATA.projectType !== null,
};

// Log intermediate state for debugging
console.log("Data Collection Summary:", {
  repoData: REPO_DATA,
  commitCount: COMMIT_DATA.totalCount,
  filesChanged: FILE_DATA.changed,
  projectType: PROJECT_DATA.projectType,
});
```

## Step 3: Sequential Analysis and Content Generation

### Reasoning Step 3.1

**Think**: "With all raw data collected, I now need to analyze patterns and generate content. This must be sequential as each step builds on previous analysis."

### Analysis Step 3.2: Commit Pattern Analysis

```javascript
// Initialize pattern counters
PR_ANALYSIS.patterns = { fixes: 0, features: 0, refactors: 0, docs: 0 };

// Analyze each commit message
for (let commit of COMMIT_DATA.commits) {
  let msg = commit.message.toLowerCase();

  // Count patterns
  if (msg.match(/\b(fix|bug|resolve|patch)\b/)) PR_ANALYSIS.patterns.fixes++;
  if (msg.match(/\b(feat|feature|add|implement)\b/))
    PR_ANALYSIS.patterns.features++;
  if (msg.match(/\b(refactor|restructure|reorganize)\b/))
    PR_ANALYSIS.patterns.refactors++;
  if (msg.match(/\b(docs|documentation|readme)\b/)) PR_ANALYSIS.patterns.docs++;

  // Check for breaking changes
  if (msg.match(/\bbreaking\b|BREAKING CHANGE|!/)) PR_ANALYSIS.breaking = true;
}

// Determine primary type based on highest count
let maxPattern = Math.max(...Object.values(PR_ANALYSIS.patterns));
if (PR_ANALYSIS.patterns.fixes === maxPattern) PR_ANALYSIS.type = "fix";
else if (PR_ANALYSIS.patterns.refactors === maxPattern)
  PR_ANALYSIS.type = "refactor";
else if (PR_ANALYSIS.patterns.docs === maxPattern) PR_ANALYSIS.type = "docs";
else PR_ANALYSIS.type = "feature";

// Log reasoning
console.log("Pattern Analysis:", PR_ANALYSIS);
```

### Generation Step 3.3: Title Generation

```javascript
// Extract base message
let baseMessage = COMMIT_DATA.primaryCommit.message.replace(
  /^(feat|fix|docs|refactor|test|chore)(\(.+\))?:\s*/i,
  ""
);

// Capitalize first letter
baseMessage = baseMessage.charAt(0).toUpperCase() + baseMessage.slice(1);

// Apply prefix based on analysis
if (PR_ANALYSIS.breaking) {
  PR_CONTENT.title = `[BREAKING] ${baseMessage}`;
} else {
  let typeLabel =
    PR_ANALYSIS.type.charAt(0).toUpperCase() + PR_ANALYSIS.type.slice(1);
  PR_CONTENT.title = `[${typeLabel}] ${baseMessage}`;
}

// Validate title length
if (PR_CONTENT.title.length > 72) {
  PR_CONTENT.title = PR_CONTENT.title.substring(0, 69) + "...";
}
```

### Generation Step 3.4: Body Generation

```javascript
// Build body sections
let bodySections = [];

// Summary section
bodySections.push(
  `## Summary\n\nThis pull request includes ${COMMIT_DATA.totalCount} commits that modify ${FILE_DATA.changed} files.`
);

// Changes section
let filesList = FILE_DATA.list
  .slice(0, 10)
  .map((f) => `- ${f}`)
  .join("\n");
if (FILE_DATA.list.length > 10) {
  filesList += `\n- ... and ${FILE_DATA.list.length - 10} more files`;
}
bodySections.push(`## Changes\n\n${filesList}`);

// Statistics section
bodySections.push(
  `## Statistics\n\n- Files changed: ${FILE_DATA.changed}\n- Additions: +${FILE_DATA.additions}\n- Deletions: -${FILE_DATA.deletions}`
);

// Commits section
let commitsList = COMMIT_DATA.commits.map((c) => `- ${c.message}`).join("\n");
bodySections.push(`## Commits\n\n${commitsList}`);

// Project-specific section
let projectSection = null;
switch (PROJECT_DATA.projectType) {
  case "web":
    projectSection =
      "## UI Changes\n\n*Screenshots recommended - use Playwright MCP if available*";
    break;
  case "cli":
    projectSection =
      "## CLI Examples\n\n*Add terminal output examples after PR creation*";
    break;
  case "api":
    projectSection =
      "## API Changes\n\n*Document any endpoint changes or new routes*";
    break;
}
if (projectSection) bodySections.push(projectSection);

// Related issues section if applicable
if (GITHUB_DATA.relatedIssues.length > 0) {
  let issuesList = GITHUB_DATA.relatedIssues
    .map((i) => `- Addresses #${i}`)
    .join("\n");
  bodySections.push(`## Related Issues\n\n${issuesList}`);
}

// Combine all sections
PR_CONTENT.body = bodySections.join("\n\n");
```

### Generation Step 3.5: Label Suggestions

```javascript
// Filter available labels based on PR type
PR_CONTENT.labels = GITHUB_DATA.availableLabels
  .filter((label) => {
    let lowerLabel = label.toLowerCase();
    return (
      lowerLabel.includes(PR_ANALYSIS.type) ||
      (PR_ANALYSIS.breaking && lowerLabel.includes("breaking")) ||
      (PR_ANALYSIS.type === "feature" && lowerLabel.includes("enhancement"))
    );
  })
  .slice(0, 3);

// Default if no matches
if (PR_CONTENT.labels.length === 0) {
  PR_CONTENT.labels = ["enhancement"];
}
```

## Step 4: Final Assembly and Validation

### Reasoning Step 4.1

**Think**: "All analysis and generation is complete. I need to assemble the final response and validate its integrity."

### Assembly Step 4.2: Build Response

```javascript
let finalResponse = {
  status: "success",
  data: {
    // Core PR content
    title: PR_CONTENT.title,
    body: PR_CONTENT.body,
    type: PR_ANALYSIS.type,
    breaking: PR_ANALYSIS.breaking,
    draft: PR_CONTENT.draft,

    // Branch information
    branch: {
      current: REPO_DATA.currentBranch,
      base: REPO_DATA.defaultBranch,
    },

    // Detailed data
    commits: COMMIT_DATA.commits,
    files: {
      changed: FILE_DATA.changed,
      additions: FILE_DATA.additions,
      deletions: FILE_DATA.deletions,
      list: FILE_DATA.list,
    },

    // Metadata
    projectType: PROJECT_DATA.projectType,
    metadata: {
      suggestedLabels: PR_CONTENT.labels,
      relatedIssues: GITHUB_DATA.relatedIssues,
      analysisPatterns: PR_ANALYSIS.patterns,
    },
  },

  // Debugging information
  debug: {
    environmentState: ENV_STATE,
    totalExecutionSteps: 4,
    parallelTasksRun: 5,
  },
};
```

### Validation Step 4.3: Quality Checks

```javascript
// Validate response structure
let validationErrors = [];

// Required fields check
if (!finalResponse.data.title) validationErrors.push("Missing title");
if (!finalResponse.data.body) validationErrors.push("Missing body");
if (!finalResponse.data.branch.current)
  validationErrors.push("Missing current branch");

// Data integrity checks
if (finalResponse.data.files.changed === 0)
  validationErrors.push("No files changed");
if (finalResponse.data.commits.length === 0)
  validationErrors.push("No commits found");

// Type validation
if (!["feature", "fix", "docs", "refactor"].includes(finalResponse.data.type)) {
  validationErrors.push("Invalid PR type");
}

// Final decision
if (validationErrors.length > 0) {
  return {
    status: "error",
    error: "Validation failed",
    validationErrors: validationErrors,
    partialData: finalResponse.data,
  };
}

// Return validated response
return finalResponse;
```

## Error Recovery Strategy

```javascript
// Define recovery actions for common failures
const RECOVERY_STRATEGIES = {
  auth_failure: "Please run 'gh auth login' and retry",
  no_commits: "Ensure you have commits to push. Run 'git log {base}..HEAD'",
  dirty_workspace: "Commit or stash changes. Run 'git status' to see changes",
  network_error: "Check internet connection and GitHub access",
};
```

## Performance Metrics

Track these metrics for optimization:

- Total execution time
- Time spent in parallel tasks vs sequential tasks
- Number of git commands executed
- Data collection success rate

## Chain of Thought Summary

1. **Variable Declaration**: All state is explicitly tracked
2. **Parallel Execution**: Independent tasks run concurrently
3. **Sequential Analysis**: Dependent operations maintain order
4. **Progressive Enhancement**: Each step builds on previous results
5. **Fail-Fast**: Early validation prevents wasted computation
6. **Comprehensive Logging**: Every decision point is tracked
7. **Graceful Degradation**: Partial results returned on non-critical failures
