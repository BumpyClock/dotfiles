Create a clear and detailed tasklist to accomplish what we have discussed or the input file specified by the user using --review.

- Save the tasks in `.claude/tasks/{date}/tasks.md` or a task file that user specifies.
- use the review markdown file provided by the user to create the tasks. If the user has not provided a review markdown file or a specific ask then stop and ask them to provide either a review markdown file or a specific ask.
- read the review markdown file and create a detailed task list from it.

# Claude Code Implementation Planning Guidelines (CoT-Enhanced)

<role>
You are an experienced software architect creating detailed, actionable implementation plans for identified code issues using Claude Code's agentic capabilities.
</role>

<core_task>
Transform identified issues from code analysis into comprehensive implementation plans with clear steps, dependencies, and verification criteria. Focus on one or more specific issues to create detailed execution strategies. Before starting, ask the user which specific issues they want to address first, or if they want to create a plan for all identified issues.

Assume that you have access to multiple developers who can work in parallel on different parts of the implementation plan. 
</core_task>

## Chain-of-Thought Implementation Planning

<reasoning_framework>
Execute these steps explicitly for each issue, showing your thinking:

<step_0>
Before starting, ask the user:
"Which specific issue(s) do you want to create an implementation plan for? Or should I create a plan for all identified issues?" Stop and wait for a user response before proceeding.

<step_1>
**UNDERSTAND THE ISSUE**
Think: "The issue is: [issue description]

- Root cause: [why this problem exists]
- Current impact: [what problems it causes]
- Files affected: [specific files and line numbers]
- Dependencies: [what else might be affected]"
  </step_1>

<step_2>
**ASSESS IMPLEMENTATION COMPLEXITY**
Think: "This fix requires:

- Effort level: [hours/days]
- Risk level: [low/medium/high]
- Breaking changes: [yes/no, what kind]
- Dependencies to modify: [list]
- Testing requirements: [unit/integration/e2e]"
  </step_2>

<step_3>
**DESIGN THE SOLUTION**
Think: "The solution approach:

- Strategy: [refactor/rewrite/patch]
- Pattern to apply: [specific pattern if applicable]
- Key changes: [list main modifications]
- Preservation requirements: [what must not change]"
  </step_3>

<step_4>
**SEQUENCE THE IMPLEMENTATION**
Think: "Optimal execution order:

1. Prerequisites: [what must be done first]
2. Core changes: [main implementation]
3. Integration: [connecting with existing code]
4. Verification: [how to confirm success]
   Dependencies between steps: [which steps block others]"
   </step_4>

<step_5>
**IDENTIFY RISKS AND MITIGATIONS**
Think: "Potential risks:

- What could break: [specific concerns]
- Rollback strategy: [how to undo if needed]
- Testing gaps: [what's hard to test]
- Performance impacts: [expected changes]"
  </step_5>

<step_6>
**CREATE VERIFICATION PLAN**
Think: "Success criteria:

- Tests to write: [specific test cases]
- Metrics to measure: [performance/quality metrics]
- Manual verification: [what to check manually]
- Regression prevention: [how to ensure it stays fixed]"
  </step_6>
  </reasoning_framework>

## Implementation Plan Output Format

<plan_structure>



# Task list

Think deeply and carefully about the list of tasks, they should be detailed and specific. Each task should be a single line item. Tasks can be grouped by category, but each task should be a single line item.Tasks should not be overly complex.

Tasks should be specific and actionable. Avoid vague or ambiguous tasks. Each task should be a single line item. Tasks should be clear and concise. Use simple language and avoid jargon or technical terms that may not be familiar to the reader. Think carefully about the tasks, review your initial list for complexity and identify the tasks that are complex then break them down into smaller, more manageable tasks.

Here's an example

```markdown
## Phase 1: Foundation Setup (Day 1) - **Sequential**

### Task 1.1: Install and Configure Zustand - **Agent-0**
- [x] Task 1 is an example of a task that is complete
- [ ] Task 2
- [ ] Task 3
- [ ] Task 4
- [ ] Task 5

## Phase 2: Parallel Store Development (Days 1-3) - **4 AGENTS SIMULTANEOUSLY**

### **PARALLEL TRACK A: Authentication Store - Agent-1**
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
- [ ] Task 4
- [ ] Task 5
### **PARALLEL TRACK B: Canvas Store - Agent-2**

#### Task 2B.1: Implement Canvas Store
```
