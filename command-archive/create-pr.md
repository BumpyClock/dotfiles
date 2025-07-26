# AI Agent Blueprint: High-Fidelity Pull Request Generation

**Objective**: You are an expert AI agent tasked with analyzing git changes and generating a comprehensive, review-ready pull request. Follow this Chain of Thought, explaining your reasoning at each step to ensure a high-quality, context-aware output.

## Phase 1: Environment Validation (Parallel)

**Think**: "My first responsibility is to ensure a stable and valid environment. Running these independent checks in parallel is the most efficient way to start. Failure at this stage is critical and must halt the process immediately to provide clear user feedback."

### Action: Execute Parallel Validation Checks

1. **git_repository check**: Verify the existence of a `.git` directory
2. **github_auth check**: Validate GitHub CLI authentication (`gh auth status`)
3. **clean_workspace check**: Ensure there are no uncommitted changes (`git status --porcelain`)

### Decision Logic

- **IF** all checks pass → proceed to Phase 2
- **IF** any check fails → **STOP** and return a specific error message with guidance for the user to resolve it

> **Reasoning**: Each check is a non-negotiable prerequisite for creating a valid pull request. Proceeding without them would lead to guaranteed failure.

## Phase 2: Data Collection & Semantic Pre-analysis (Parallel)

**Think**: "The environment is valid. Now I need to gather all raw data and perform an initial semantic analysis. I'll run these tasks in parallel, but I'll group related git commands and introduce a new AI-powered summary task to create a high-level understanding of the changes before I start generating content."

### Action: Optimized Parallel Collection & Analysis

#### Task 1: repository_context

- **Description**: Gather repository metadata and GitHub integration details
- **Subtasks**: 
  - Get current/default branches
  - Extract repo name/owner
  - Fetch available GitHub labels
- **Reasoning**: Grouping git/gh API calls is efficient

#### Task 2: change_analysis

- **Description**: Analyze commits and file-level changes
- **Subtasks**: 
  - Get commit history between branches
  - Calculate file statistics (additions/deletions)
  - List all modified files
- **Reasoning**: Commits and files are fundamentally linked and should be analyzed together

#### Task 3: project_detection (Enhanced)

- **Description**: Identify the project's primary programming language and type
- **Reasoning**: The project type dictates the PR template and review checklist. My analysis must be broader than just package.json

**Decision Tree**:
- `IF pom.xml` → `java`
- `IF pyproject.toml or requirements.txt` → `python`
- `IF package.json` → `javascript/typescript` (check dependencies for react, vue, node to refine)
- `IF go.mod` → `go`
- `ELSE` → `other`

**Expected Output**: `{ projectType, confidence }`

#### Task 4: semantic_summary (New AI Task)

- **Description**: Use the raw git diff to generate a concise, human-readable summary of the changes

**Action**:
1. Get the full git diff for the changes
2. Prompt LLM: *"Based on the following git diff, provide a 1-2 sentence summary of the core purpose of these changes. Focus on the 'what' and 'why'."*

**Reasoning**: BECAUSE a pure LLM summary captures semantic intent that keyword analysis might miss, THEREFORE this provides a qualitative check on my later, more structured analysis.

**Expected Output**: `{ aiSummary: "This PR refactors the authentication service for better performance and adds a new caching layer." }`

## Phase 3: Sequential Synthesis & Content Generation

**Think**: "With all data collected, I will now synthesize it into the final PR content. This must be sequential, as each step logically builds upon the last. My priority is to create content that is clear, concise, and maximally useful for a human reviewer."

### Step 3.1: Commit & Intent Analysis (Enhanced)

**Think**: "I need to determine the primary intent of this PR. Conventional Commit messages are the most reliable source. I will parse them first and only use keyword analysis as a fallback."

#### Primary Strategy: Conventional Commit Parsing

1. Analyze commit messages for the pattern `type(scope)!: description`
2. Extract type (e.g., `feat`, `fix`, `docs`, `refactor`, `perf`, `chore`)
3. Note any `!` as a `breakingChange`

#### Fallback Strategy: Keyword Matching

- **IF** no conventional commits are found, use keyword matching (`/\b(fix|bug)\b/`, etc.)
- **BECAUSE** this provides graceful degradation for repositories that don't use conventional commits

#### Synthesize Primary Intent

Determine `primaryType` based on the dominant commit type found. Prioritize in order of significance: `breakingChange > feat > fix > perf > refactor`

### Step 3.2: Title Generation (Refined)

**Think**: "The PR title is the most critical piece of information. It must be concise and immediately communicate intent. I will use my refined primaryType to construct it in the conventional commit format for maximum clarity."

#### Process

1. **Base Message**: Extract the message from the most significant commit
2. **Formatting**:
   - `IF isBreakingChange` → `title = "feat!: [description]"`
   - `ELSE` → `title = "type: [description]"`
   - **Example**: `fix: resolve user login race condition`
3. **Constraint**: Truncate the `[description]` if the total title length exceeds 72 characters

### Step 3.3: Body Composition (Enhanced)

**Think**: "The PR body must provide context, not just data. I will lead with the AI-generated summary for a quick overview, then provide structured details. The layout should guide the reviewer's attention from most to least important."

#### 1. AI Summary

```markdown
## 📝 Overview

Insert the aiSummary from Phase 2.
```

> **BECAUSE** a human-readable summary is the fastest way for a reviewer to understand the change's purpose.

#### 2. Breaking Changes (If Applicable)

```markdown
## 🚨 BREAKING CHANGES

**Details:** [Explain the breaking change, referencing the specific commit.]
```

> **BECAUSE** breaking changes must be the most visible part of the PR.

#### 3. Changes & Statistics

```markdown
## 📊 Changes & Statistics

Bulleted list of key changes and a statistics table (files changed, additions, deletions).
```

> **BECAUSE** quantitative data supports the qualitative summary.

#### 4. Project-Specific Checklist

```markdown
## ✅ Review Checklist

IF projectType === "web" -> Add [ ] UI changes reviewed on [staging link]
IF projectType === "api" -> Add [ ] API contract changes documented in [Swagger/Postman]
```

> **BECAUSE** a context-aware checklist makes the review process more rigorous.

#### 5. Related Issues

Link to any related issues found during data collection.

## Phase 4: Quality Assurance & Final Assembly

**Think**: "I have generated all the components. Before finalizing, I must perform a comprehensive quality check and calculate a confidence score. This score will determine if the PR can be created automatically or if it needs human review."

### Step 4.1: Confidence Score Calculation (Enhanced)

```javascript
let confidence = 1.0;

IF commit analysis relied on keyword fallback -> confidence -= 0.2
IF projectType === "other" -> confidence -= 0.1
IF isBreakingChange is true but no commit message explicitly said BREAKING CHANGE -> confidence -= 0.25
```

> **Reasoning**: BECAUSE confidence should reflect how much the agent relied on ideal data versus heuristics, THEREFORE a lower score indicates a higher need for human oversight.

### Step 4.2: Final Assembly & Validation

1. Assemble the final response object (title, body, labels, etc.)
2. Add the confidenceScore to the metadata

#### Decision Point

```javascript
IF confidenceScore < 0.7 or isBreakingChange is true:
    Set response.data.draft = true
    Add a reviewNotes field explaining why (e.g., "Confidence is low due to non-conventional commit messages.")
ELSE:
    Set response.data.draft = false
```

> **Reasoning**: BECAUSE a fully autonomous system should not merge potentially breaking or poorly understood changes without review, THEREFORE I will intelligently flag PRs for mandatory human inspection.