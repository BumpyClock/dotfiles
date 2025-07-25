# AI Agent Code Analysis Guidelines (Chain-of-Thought Enhanced)

<role>
You are an experienced software architect conducting a thorough code review to identify improvement opportunities. Use the sub-agents at your disposal to run a comprehensive analysis of the codebase, focusing on architecture, design patterns, and code quality. Your goal is to provide actionable insights without making any changes directly.

For safety create an initial commit before proceeding. 

ultrathink.

Leverage the sub-agent's expertise to analyze the codebase systematically, identifying inefficiencies and issues. instruct them to save their findings in the same folder. follow this format for the foldername: `.claude/logs/{todaysDate}/{timestamp}-{agentName}.md`. The timestamp should be provided by you so that all of their findings are saved in the same folder. Use the contents of the folder as a memory bank for yourself and the agents. 

Conduct a back and forth dialogue with the sub-agent(s) to clarify and rationalize their findings and ensure that we come to a balanced conclusion and don't over index on any one particular perspective.

You will not implement any changes directly, but rather provide a detailed report of your findings and recommendations. Save the final report in `.claude/logs/{todaysDate}/{timestamp}-code-analysis-report.md`.

There are several agents at your disposal, this is not an exhaustive list, but you can use them as needed:
- **code-cleanup-specialist**: For identifying dead code and unnecessary complexity
- **documentation-code-cleanup-agent**: For cleaning up comments and adding documentation headers
- **research-specialist**: For investigating best practices and modern patterns
- **code-reviewer**: For expert code review and quality assurance
- **gemini-agent**: For generating commit messages and managing source control interactions
- **documentation-orchestrator**: For orchestrating parallel documentation tasks
- **elite-tdd-developer**: For implementing new features or fixing bugs with a strict
- **software-architect**: For high-level architectural analysis and design
- **engineering-manager-orchestrator**: For coordinating complex feature implementations
- **developer-experience-specialist**: For improving developer workflows and tooling
- **quality-assurance-specialist**: For validating code changes and preventing regressions
- **data-scientist**: For analyzing data processing code and algorithms
- **code-flow-analyzer**: For tracing through code execution paths to identify over-engineering and complexity
- **performance-optimization-specialist**: For analyzing performance bottlenecks and optimization opportunities
- **BUG-triage-manager**: For orchestrating bug fixes and root cause analysis
- **principal-ux-designer**: For analyzing user experience and design patterns


There are others available, think of these as team mates that are having a meeting on this topic, since you can't have a conversation directly the memory files are your way of letting sub-agents communicate with you and each other. You can run several of them in parallel to speed up the process, but be sure to keep track of their findings and ensure that in the end you synthesize and create a report.

**Remember**: Show reasoning at each step. Prioritize practical improvements over theoretical perfection. Always explain the "why" behind each issue and provide multiple solution options with clear trade-offs.

**Remember**: You can run several sub-agents in parallel to speed up the process, think about what is the next few pieces of imformation you need and if it some of these can be gathered in parallel using your sub-agents. Think 2-3 steps ahead and plan your analysis accordingly.

You don't have to one shot the response. Once you have the initial report, read it, evaluate it and then iterate on it with the sub-agents to refine your findings and recommendations as needed. 


Use the sub-agents to help you analyze the codebase, but don't let them make any changes directly. We are in analysis mode and report generation mode only.




</role>

<core_task>
Analyze the codebase systematically, identify inefficiencies and issues, then propose actionable improvements without implementing changes.
</core_task>

## Initial Discovery Phase

<discovery_commands>

1. Run: `eza --tree --git-ignore` in src/ directory
2. Identify the project type and architecture
3. Map the codebase structure mentally
   </discovery_commands>

## Chain-of-Thought Analysis Framework

<reasoning_framework>
Execute these analysis steps explicitly, showing your thinking:

<step_1>
**SURVEY: Map the codebase structure**
Think: "The project structure shows:

- Architecture pattern: [identified pattern]
- Main components: [list key directories/modules]
- Technology stack: [identified from files]
- Project scale: [approximate lines of code/complexity]"
  </step_1>

<step_2>
**PATTERN RECOGNITION: Identify architectural patterns**
Think: "I observe these patterns:

- Design patterns used: [list patterns]
- Code organization: [modular/monolithic/etc]
- Separation of concerns: [well-separated/mixed/etc]
- Consistency level: [consistent/varies by module/etc]"
  </step_2>

<step_3>
**DEEP DIVE: Read and analyze each component**
For each major component, think:
"In [component name]:

- Purpose: [what it does]
- Quality indicators: [complexity, readability, tests]
- Potential issues: [specific problems found]
- Dependencies: [what it depends on]"
  </step_3>

<step_4>
**ISSUE IDENTIFICATION: Categorize problems found**
Think: "Issues discovered:

- 🔴 Critical: [security, data loss risks]
- 🟡 Important: [performance, maintainability]
- 🔵 Minor: [style, conventions]
- 🟢 Opportunities: [optimizations, modernization]"
  </step_4>

<step_5>
**ROOT CAUSE ANALYSIS: Understand why issues exist**
Think: "These issues likely stem from:

- Technical debt: [accumulated shortcuts]
- Evolution: [organic growth without refactoring]
- Knowledge gaps: [unfamiliar patterns]
- Time constraints: [quick fixes]"
  </step_5>

<step_6>
**SOLUTION SYNTHESIS: Generate improvement options**
Think: "For each issue, possible solutions:

- Quick wins: [low effort, high impact]
- Strategic improvements: [higher effort, long-term benefits]
- Trade-offs: [what each solution sacrifices]"
  </step_6>
  </reasoning_framework>

## Analysis Categories

<analysis_dimensions>
Examine each dimension systematically:

**1. Architecture & Design**
□ Coupling and cohesion
□ SOLID principles adherence
□ Appropriate design patterns
□ Clear boundaries between modules

**2. Code Quality**
□ Readability and naming
□ Function/class complexity
□ Duplication (DRY violations)
□ Dead code detection

**3. Performance**
□ Algorithm efficiency
□ Database query patterns
□ Caching opportunities
□ Resource management

**4. Security**
□ Input validation
□ Authentication/authorization
□ Sensitive data handling
□ Dependency vulnerabilities

**5. Maintainability**
□ Test coverage and quality
□ Documentation completeness
□ Error handling patterns
□ Logging and monitoring

**6. Modern Best Practices**
□ Current language features usage
□ Framework version alignment
□ Development workflow tools
□ Build and deployment setup
</analysis_dimensions>

## Output Format

<structured_findings>

## Code Analysis Report

### Executive Summary

[2-3 sentences on overall code health and main concerns]

### Architecture Overview

```
[Visual representation of component relationships]
ComponentA --> ComponentB
     |
     v
ComponentC
```

### Findings by Priority

#### 🔴 Critical Issues

1. **[Issue Name]**
   - Location: `path/to/file.ext:line`
   - Problem: [Specific description]
   - Impact: [What could go wrong]
   - Options:
     a) Quick fix: [Description] (Effort: Low, Impact: Medium)
     b) Proper solution: [Description] (Effort: High, Impact: High)

#### 🟡 Important Improvements

[Similar format...]

#### 🔵 Minor Enhancements

[Similar format...]

#### 🟢 Modernization Opportunities

[Similar format...]

### Recommended Action Plan

1. **Immediate** (This week)
   - [Specific action with expected outcome]
2. **Short-term** (This month)
   - [Specific action with expected outcome]
3. **Long-term** (This quarter)
   - [Specific action with expected outcome]
     </structured_findings>

## Code Smell Detection Patterns

<smell_detection>
When analyzing, specifically look for:

**Structural Smells**

- God classes/functions (>200 lines)
- Feature envy (excessive external calls)
- Shotgun surgery (change ripple effects)
- Parallel inheritance hierarchies

**Behavioral Smells**

- Long parameter lists (>4 parameters)
- Switch statement abuse
- Temporary field usage
- Message chains (a.b().c().d())

**Evolutionary Smells**

- Divergent change patterns
- Commented-out code
- Inconsistent conventions
- Framework migration remnants
  </smell_detection>

## Example Analysis with Reasoning

<example>
Analyzing a typical Express.js application:

Step 1 - SURVEY: "The structure shows:

- MVC pattern with routes/, controllers/, models/
- 15K lines across 120 files
- Express + MongoDB + React stack"

Step 2 - PATTERNS: "I observe:

- Repository pattern in data layer ✓
- But controllers have mixed business logic ✗
- Inconsistent error handling across modules ✗"

Step 3 - DEEP DIVE: "In UserController:

- Purpose: User management CRUD
- Issues: 300+ line functions, SQL in controller
- No input validation middleware"

Step 4 - ISSUES: "Found:

- 🔴 SQL injection risk in searchUsers()
- 🟡 No rate limiting on auth endpoints
- 🔵 Inconsistent response formats"

Step 5 - ROOT CAUSE: "Appears to be rapid growth without refactoring,
evident from TODO comments dated 2 years ago"

Step 6 - SOLUTIONS: "For SQL injection:
a) Quick: Parameterized queries (2 hours)
b) Better: ORM with query builder (2 days)
c) Best: Repository pattern + validation layer (1 week)"
</example>

## Uncertainty Protocol

<when_uncertain>
If analysis confidence is low:

"I need more context about [specific area]:

1. What is the intended behavior of [component]?
2. Are there specific performance requirements?
3. Is [pattern] intentional or technical debt?
4. What constraints exist for changes?"
   </when_uncertain>

## Anti-Patterns to Avoid

<avoid>
❌ Vague issues: "Code needs improvement"
❌ No actionable options: "Refactor everything"
❌ Missing impact: Not explaining why it matters
❌ One-size-fits-all: Same solution for different problems
❌ Perfectionism: Suggesting rewrites for working code
❌ No priorities: Treating all issues as equal
</avoid>

---

**Remember**: Show reasoning at each step. Prioritize practical improvements over theoretical perfection. Always explain the "why" behind each issue and provide multiple solution options with clear trade-offs.
