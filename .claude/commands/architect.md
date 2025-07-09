# Architecture Review Sub-Agent Workflow

You will orchestrate an architecture review of a codebase by launching a specialized sub-agent. Follow this chain of thought to ensure a comprehensive and effective review.

## Step 1: Parse User Command

Process the user command with the following structure:
```
{command} -- {arguments}
```

### Valid Arguments:
- `--file`: Output file for the review (default: `arch-review.md`)
- `--overwrite`: Replace existing review if true (default: false)
- `--details`: Additional review details or focus areas
- `--context`: Additional context files or architectural information
- `--review`: Perform architecture review (default: true)
- `--plan`: Create review plan only (default: false)
- `--help`: Display help message

### Parsing Logic:
1. Extract the base command before `--`
2. Parse each argument after `--`
3. Validate arguments against the valid list
4. Apply defaults for missing arguments
5. If invalid arguments found, inform user and show valid options

## Step 2: Gather Project Context

Execute these tasks in parallel for efficiency:

### 2.1 Project Structure Analysis
```bash
eza --tree --git-ignore
```
Capture the directory structure to understand:
- Module organization
- File naming patterns
- Directory depth and complexity

### 2.2 Read Coding Standards
```
~/.claude/docs/writing-code.md
```
Extract key principles about:
- Preferred architectural patterns
- Complexity guidelines
- Documentation requirements

### 2.3 Check Existing Review
If `--file` exists and `--overwrite` is false:
- Read the existing review
- Plan to iterate/enhance rather than replace

### 2.4 Initialize Journal
Path: `~/.claude/journal/{today's-date}/journal.md`
- Create if doesn't exist
- Append session start marker
- Note: This is a private reflection space for honest thoughts

## Step 3: Analyze Review Requirements

Based on parsed arguments, determine:

1. **Scope**: Full architecture review or focused area?
2. **Depth**: High-level overview or detailed analysis?
3. **Output**: Review document, action plan, or both?
4. **Context**: Which files/patterns need special attention?

## Step 4: Construct Sub-Agent Prompt

Create a comprehensive prompt with the following structure:

### 4.1 Establish Expertise
```
You are a world-class system architect and code reviewer with extensive experience in:
- Identifying over-engineering and unnecessary complexity
- Simplifying architectures while preserving functionality
- Providing honest, actionable feedback
- Balancing theoretical best practices with practical constraints

Your reviews are known for being direct, insightful, and focused on real improvements rather than academic perfection.
```

### 4.2 Define the Mission
```
Your task is to review the architecture of {project_name} with the following objectives:
1. Identify areas of over-engineering or unnecessary complexity
2. Suggest simplifications that maintain current functionality
3. Highlight architectural strengths worth preserving
4. Provide specific, actionable recommendations
5. Be honest and direct - do not soften feedback to spare feelings
```

### 4.3 Provide Context
Include:
- Project structure from eza output
- Relevant coding standards
- Specific areas of concern from `--details`
- Additional context from `--context` argument
- Any existing review content (if iterating)

### 4.4 Set Review Parameters
```
Review Configuration:
- Output file: {file_path}
- Mode: {overwrite|iterate}
- Focus areas: {details_if_provided}
- Review type: {comprehensive|plan_only}
```

### 4.5 Establish Working Guidelines
```
Guidelines for your review:
1. Use MCP tools to explore the codebase thoroughly
2. Document your thought process in the journal at {journal_path}
3. Ask clarifying questions if something is ambiguous
4. Use "ultrathinking" - go deep on architectural decisions
5. Consider both immediate and long-term implications
6. Be specific with examples when identifying issues
7. Provide code snippets for suggested improvements
```

### 4.6 Define Output Structure
```
Your review should follow this structure:
1. Executive Summary (2-3 paragraphs)
2. Architecture Overview
   - Current state diagram/description
   - Key components and their interactions
3. Identified Issues
   - Ranked by impact/effort
   - Specific examples
   - Root cause analysis
4. Recommendations
   - Quick wins (low effort, high impact)
   - Strategic improvements (higher effort)
   - Things to preserve/celebrate
5. Implementation Roadmap
   - Prioritized action items
   - Dependencies and risks
6. Appendix
   - Detailed code examples
   - Alternative approaches considered
```

## Step 5: Launch Sub-Agent

use the task tool to Execute the sub-agent with enhanced parameters:
```bash
claude-yolo --model claude-opus-4-20250514 -p "{constructed_prompt}"
```

## Step 6: Post-Processing

After sub-agent completes:
1. Verify output file was created/updated
2. Log completion in journal
3. Provide user with summary of what was done
4. Suggest next steps based on the review

## Error Handling

At each step, handle potential issues:
- Invalid arguments → Show help and valid options
- Missing files → Create or request clarification
- Ambiguous context → Ask user for specifics
- Sub-agent failure → Log error and suggest alternatives

## Success Criteria

The review is successful when:
1. Architecture issues are clearly identified with examples
2. Recommendations are specific and actionable
3. The review balances criticism with recognition of good patterns
4. Output is well-structured and easy to navigate
5. Next steps are clear and prioritized