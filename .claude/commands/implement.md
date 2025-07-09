# Task Implementation Sub-Agent Workflow

Launch a sub-agent to implement tasks from a task list, updating progress in real-time. ultrathink

## Step 1: Parse Command

```
implement {phase/tasks} from {tasklist_file} -- {arguments}
```

**Arguments:**
- `--tasklist`: Task list file path (required)
- `--phase`: Phase to implement (default: "1")
- `--tasks`: Specific task IDs (e.g., "T1.1,T1.3")
- `--branch`: Git branch (default: "implementation-phase-{n}")
- `--testing`: Enable tests (default: false)
- `--test-command`: Test command if testing enabled
- `--journal`: Journal file path (default: `~/.claude/journal/{currentDate}.md`)
- `--build`: should build the project (default: false)

## Step 2: Gather Context

**Parallel Tasks:**
1. Parse tasklist and extract selected tasks
2. Run `eza --tree --git-ignore` for project structure
3. Read `~/.claude/docs/writing-code.md` for standards
4. Verify dependencies are complete
5. Detect tech stack and available tools

**Conditional:** If `--testing=true`, ensure tests pass before starting

## Step 3: Create Prompt for Sub-Agent

Create a detailed `{$prompt}` for the sub-agent with appropriate context:

### 3.1 Establish Expertise
```
You are an expert {detected_tech_stack} developer who:
- Writes clean, maintainable, performant code
- Follows established patterns rigorously
- Makes minimal, focused changes
- Documents progress meticulously
- {add_stack_specific_expertise}
```

### 3.2 Define Mission
```
Implement these {count} tasks from {tasklist_file}:

{formatted_task_list_with_details}

Working on branch: {branch_name}
Testing enabled: {yes/no}
{if_testing: Test command: {test_command}}
```

### 3.3 Provide Implementation Process
```
For EACH task, follow this exact process:

1. UNDERSTAND: Read requirements, examine current code, identify all dependencies
2. IMPLEMENT: Make minimal changes using MCP tools, follow provided examples
3. VALIDATE: Verify success criteria met, no regressions introduced
4. TEST: {if_testing: Run {test_command} and ensure pass | Skip - testing disabled}
5. UPDATE TASKLIST: Mark complete with timestamp

Task Status Updates:
- [ ] → [x] ✓ {timestamp} (completed)
- [ ] → [!] ⚠️ BLOCKED: {reason}
- [ ] → [?] NEEDS CLARIFICATION: {question}

Note: Do NOT commit changes. Leave files modified for manual review and testing.
```

### 3.4 Include Context
```
Project Structure:
{eza_output}

Coding Standards Summary:
{key_standards_from_writing_code_md}

Available Tools:
- MCP file operations (read, write, edit)
- Shell commands via subprocess
- {detected_language_tools}
- {detected_test_framework if testing}
```

### 3.5 Add Task Details
For each task, include:
```
## Task {id}: {description}
Status: [ ] Pending

Files to modify: {affected_files}
Dependencies: {dependency_list or "None"}
Success Criteria: {criteria}

{if_examples_exist:
Expected Change:
```before
{before_code}
```
```after
{after_code}
```
}
```

### 3.6 Set Quality Requirements
```
Before marking any task complete, ensure:
- No debug statements (console.log, print, etc.)
- Code follows {language} conventions
- Success criteria explicitly met
- {if_testing: Tests pass}
- Tasklist updated

Journal entries in {journal_path} should include:
- Start/end timestamps
- Files modified (for later commit reference)
- Challenges faced
- Design decisions
- Time taken per task
```

## Step 4: Launch Sub-Agent

Execute the sub-agent:
```bash
claude-yolo --model claude-sonnet-4-20250514 -p "{$prompt}"
```

Monitor progress via:
- Task list file changes
- Modified files in git status
- Journal entries

## Step 5: Verify Completion

1. **Audit Tasks:** Ensure all selected tasks were processed
2. **Validate Updates:** Check tasklist changes are correct
3. **Test Suite:** {if_testing: Run full test suite}
4. **Review Changes:** Run `git status` to see all modified files
5. **Summary Report:** Generate tasks completed/blocked/time metrics

## Error Handling

**Common Issues:**
- Unclear task → Mark [?] with specific questions
- Missing dependency → Mark [!] BLOCKED with reason
- Test failure → Revert, document issue, mark [!]
- Merge conflict → Stash, resolve, retry

## Success Criteria

✓ Every selected task has updated status
✓ Code changes match requirements exactly
✓ Modified files ready for manual review
✓ {if_testing: All tests passing}
✓ Journal documents full journey with file changes