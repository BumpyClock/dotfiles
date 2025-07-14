**TASK IMPLEMENTATION SUB-AGENT ORCHESTRATION WORKFLOW**

Think deeply about this sophisticated parallel implementation strategy. You are about to orchestrate a multi-agent implementation system that transforms architectural blueprints into living code through coordinated parallel execution. Use the bash tool to launch multiple parallel instances of claude-code for implementation with 15-minute timeout for complex operations. All agents operate within the same branch sanctuary unless explicitly directed otherwise. **Ultrathink.**

**Variables:**

tasklist_file: $ARGUMENTS 
phase: $ARGUMENTS
tasks: $ARGUMENTS
branch: $ARGUMENTS
testing: $ARGUMENTS
test_command: $ARGUMENTS
journal: $ARGUMENTS
build: $ARGUMENTS

**PHASE 1: COMMAND RECONNAISSANCE & PARSING**

**Command Structure Analysis:**
```
implement {phase/tasks} from {tasklist_file} -- {arguments}
```

**ARGUMENTS ORCHESTRATION:**
Parse and deeply understand the following implementation parameters from "$ARGUMENTS":

1. **`tasklist`** - Sacred blueprint containing the implementation roadmap (default: .claude/tasks/tasks.md)
2. **`phase`** - Strategic implementation phase to execute (default: "1")
3. **`tasks`** - Specific task identifiers for surgical implementation (e.g., "T1.1,T1.3")
4. **`branch`** - Git branch for isolated development sanctuary (default: "implementation-phase-{n}")
5. **`testing`** - Quality assurance activation flag (default: false)
6. **`test_command`** - Test execution protocol when quality gates are enabled
7. **`journal`** - Implementation chronicle path (default: `~/.claude/journal/{currentDate}.md`)
8. **`build`** - Project compilation directive (default: false)

Each parameter shapes the implementation trajectory and must be parsed with precision.

**PHASE 2: STRATEGIC CONTEXT RECONNAISSANCE**

Orchestrate parallel intelligence gathering to construct a comprehensive implementation battlefield map:

**Parallel Intelligence Operations:**

**Operation Alpha: Task Analysis**
- Deep parse of tasklist architecture
- Extract selected implementation targets with surgical precision
- Map task dependencies and interconnections
- Identify critical path and parallelization opportunities

**Operation Beta: Project Topology Mapping**
- Execute `eza --tree --git-ignore` for complete structural reconnaissance
- Analyze directory hierarchies and module boundaries
- Identify key integration points and interfaces
- Map the implementation landscape

**Operation Gamma: Standards & Conventions Absorption**
- Ingest `~/.claude/docs/writing-code.md` for coding commandments
- Extract patterns, anti-patterns, and sacred conventions
- Understand the project's coding philosophy
- Prepare style enforcement protocols

**Operation Delta: Dependency Verification**
- Validate all prerequisite tasks are complete
- Check for blocking dependencies
- Ensure environmental readiness
- Verify toolchain availability

**Operation Epsilon: Technology Stack Detection**
- Identify primary languages and frameworks
- Detect testing frameworks and build tools
- Map available development utilities
- Prepare technology-specific strategies

**Pre-Implementation Quality Gate:**
If `testing === true`:
- Execute full test suite to establish baseline
- Ensure zero failing tests before implementation
- Document current coverage metrics
- Prepare for test-driven implementation

**PHASE 3: SUB-AGENT PROMPT ORCHESTRATION**

Craft a masterful implementation directive that transforms each Sub-Agent into a precision coding instrument:

**3.1 EXPERTISE CALIBRATION**
```
You are an elite {detected_tech_stack} implementation specialist who:
- Architects code with surgical precision and artistic elegance
- Treats existing patterns as sacred law while innovating within constraints
- Implements with atomic focus - each change purposeful and minimal
- Chronicles every decision with the detail of a master craftsman
- Optimizes for both immediate function and long-term evolution
- {stack_specific_mastery_traits}

Your code is not merely functional - it is a testament to engineering excellence.
```

**3.2 MISSION PARAMETERS**
```
MISSION BRIEFING: Implementation of {count} Strategic Tasks

Source Blueprint: {tasklist_file}
Implementation Manifest:
{formatted_task_list_with_comprehensive_details}

Operational Parameters:
- Development Branch: {branch_name} (your isolated workspace)
- Quality Assurance: {testing_status}
- Test Protocol: {test_command if testing_enabled}
- Build Directive: {build_status}
- Success Metrics: All tasks completed with zero regressions
```

**3.3 IMPLEMENTATION METHODOLOGY**
```
EXECUTION PROTOCOL - The Five Pillars of Implementation:

1. **RECONNAISSANCE & COMPREHENSION**
   - Deep-read task requirements with philosophical understanding
   - Analyze existing code like an archaeologist studying artifacts
   - Map every dependency, side effect, and integration point
   - Visualize the change's ripple effects across the codebase

2. **STRATEGIC IMPLEMENTATION**
   - Deploy changes with surgical precision using MCP arsenal
   - Honor existing patterns while achieving task objectives
   - Write code that feels native to the codebase
   - Implement with future maintainers in mind

3. **VALIDATION & VERIFICATION**
   - Confirm all success criteria with mathematical certainty
   - Scan for regressions like a security audit
   - Verify integration points remain intact
   - Ensure performance characteristics are preserved or improved

4. **QUALITY ASSURANCE GATES**
   {if_testing_enabled:
   - Execute: {test_command}
   - Achieve 100% pass rate or rollback
   - Document any new test requirements
   }
   {else:
   - Mark for post-implementation testing
   }

5. **PROGRESS CHRONICLING**
   Update tasklist with surgical precision:
   - [ ] → [x] ✓ {timestamp} "Flawlessly executed"
   - [ ] → [!] ⚠️ BLOCKED: "{specific_blocker_with_context}"
   - [ ] → [?] 🤔 CLARIFICATION_REQUIRED: "{precise_question}"
   - [ ] → [~] 🔄 IN_PROGRESS: "{current_status}"

CRITICAL: Maintain atomic changes. Do NOT commit. Your modifications await review.
```

**3.4 CONTEXTUAL INTELLIGENCE INJECTION**
```
PROJECT ARCHITECTURAL BLUEPRINT:
{comprehensive_eza_output_with_annotations}

CODING COMMANDMENTS & SACRED PATTERNS:
{detailed_standards_from_writing_code_md}
{project_specific_conventions}
{architectural_decisions_record}

IMPLEMENTATION ARSENAL:
- MCP Precision Tools: read, write, edit, multi-edit
- Shell Command Interface: subprocess execution
- Language-Specific Weaponry: {detected_language_tools}
- Testing Framework: {detected_test_framework if available}
- Build System: {detected_build_tools}
- Development Utilities: {available_dev_tools}

PERFORMANCE BASELINES:
{if_available: current_metrics}
```

**3.5 TASK INTELLIGENCE DOSSIERS**

For each implementation target, provide comprehensive intelligence:

## IMPLEMENTATION TARGET {id}: {description}

**Status Matrix:** [ ] AWAITING_IMPLEMENTATION

**Operational Intelligence:**
- Target Files: {detailed_file_paths_with_descriptions}
- Dependency Chain: {comprehensive_dependency_graph or "STANDALONE"}
- Integration Points: {affected_systems_and_interfaces}
- Risk Assessment: {potential_complications}

**Success Validation Criteria:**
{detailed_acceptance_criteria}
{performance_requirements}
{behavioral_expectations}

{if_examples_exist:
**Transformation Specification:**
```before
{annotated_before_code_with_context}
```

```after  
{annotated_after_code_with_improvements}
```

**Key Changes:**
{bullet_points_of_significant_modifications}
}

**Implementation Notes:**
{special_considerations}
{suggested_approach}



**3.6 QUALITY IMPERATIVES & EXCELLENCE STANDARDS**

PROGRESS TRACKING PROTOCOL:
- Update task status in real-time as implementation progresses
- Maintain atomic task completion - no partial victories
- Chronicle every significant decision and discovery

IMPLEMENTATION JOURNAL REQUIREMENTS:

Create detailed chronicles in {journal_path} capturing:

**Temporal Markers:**
- Implementation commencement: {ISO_timestamp}
- Milestone achievements: {timestamp_per_subtask}
- Total duration per task: {elapsed_time_with_breakdown}

**Change Manifest:**
- Modified files: {path:line_ranges for commit preparation}
- New files created: {full_paths_with_purpose}
- Deleted elements: {removed_code_with_justification}

**Engineering Narrative:**
- Technical challenges encountered and conquered
- Architectural decisions with rationale
- Performance optimizations applied
- Refactoring opportunities identified
- Technical debt observations
- Avoid over-engineering - focus on simplicity and clarity

**Quality Metrics:**
- Test coverage delta: {before/after if applicable}
- Complexity metrics: {if measurable}
- Performance impact: {if measurable}

**Wisdom Gained:**
- Patterns discovered
- Gotchas for future implementers
- Improvement suggestions for codebase

**PHASE 4: PARALLEL SUB-AGENT DEPLOYMENT & ORCHESTRATION**

**4.1 AGENT DEPLOYMENT STRATEGY**

Orchestrate multiple Sub-Agents for maximum implementation velocity and creative problem-solving diversity:


**Sub-Agent Distribution Strategy:**
- For count 1-5: Launch all agents simultaneously 
- For count 6-20: Launch in batches of 5 agents to manage coordination

**Agent Assignment Protocol:**
Each Sub Agent receives:
1. **Spec Context**: Complete specification file analysis
2. **Directory Snapshot**: Current state of output_dir at launch time
3. **Task Assignment**: Specific Task number (starting_number + agent_index)
4. **Uniqueness Directive**: Explicit instruction to avoid duplicating implementation from existing agents
5. **Quality Standards**: Detailed requirements from the specification and ~/.claude/docs/writing-code.md

**Agent Task Specification:**
```
TASK: implement task [NUMBER] from [SPEC_FILE]

You are Sub Agent [X] completing task [NUMBER]. 

CONTEXT:
- Specification: [Full spec analysis]
- Task Details: [Task description and requirements]
- Assigned creative direction: [Specific innovation dimension to explore]

REQUIREMENTS:
1. Read and understand the specification completely
2. Analyze existing iterations to ensure your output is unique
3. Generate content following the spec format exactly
4. Focus on [assigned task] while maintaining spec compliance
5. Create file with exact name pattern specified
6. Ensure your iteration adds genuine value and novelty

DELIVERABLE: Complete task.
```

**Parallel Execution Management:**
- Launch all assigned Sub Agents simultaneously using Task tool
- Monitor agent progress and completion
- Handle any agent failures by reassigning iteration numbers
- Ensure no duplicate iteration numbers are generated
- Collect and validate all completed iterations


**Multi-Agent Coordination Protocol:**
When task count > 5:
- Deploy agents in coordinated waves
- Assign non-overlapping task sets
- Prevent file modification conflicts
- Synchronize through task list updates

**4.2 REAL-TIME MONITORING DASHBOARD**

**Progress Tracking Vectors:**

**Vector Alpha: Task List Evolution**
- Monitor file changes in real-time
- Track task status transitions
- Identify blocked or stalled implementations

**Vector Beta: Git Status Surveillance**  
```bash
watch -n 5 'git status --short'
```
- Track file modifications as they occur
- Detect unexpected changes or conflicts
- Ensure branch isolation integrity

**Vector Gamma: Journal Intelligence Stream**
- Parse journal entries for insights
- Extract time metrics and bottlenecks  
- Identify recurring challenges

**Vector Delta: Test Suite Health** 
{if_testing_enabled:
```bash
watch -n 30 '{test_command}'
```
- Monitor test stability during implementation
- Catch regressions immediately
- Track coverage evolution
}

**4.3 AGENT COORDINATION & CONFLICT RESOLUTION**

**Synchronization Mechanisms:**
- File-level locking through task assignment
- Clear task ownership in tasklist
- Conflict detection through git status
- Rollback protocols for conflicts

**PHASE 5: VERIFICATION, VALIDATION & VICTORY ASSESSMENT**

**5.1 COMPREHENSIVE COMPLETION AUDIT**

**Task Completion Verification:**
- Cross-reference all selected tasks against final status
- Validate every task has explicit resolution (complete/blocked/clarification)
- Ensure no phantom or orphaned tasks
- Verify task count integrity

**5.2 IMPLEMENTATION INTEGRITY VALIDATION**

**Code Quality Gates:**
```bash
# Systematic quality verification
eza --tree --git-ignore  # Verify structure intact
git diff --stat         # Quantify changes
git diff --check        # Detect whitespace issues
```

**Standards Compliance Check:**
- Verify coding conventions adherence
- Check for pattern consistency
- Validate naming conventions
- Ensure documentation completeness

**5.3 TEST SUITE EXECUTION & ANALYSIS**
{if_testing_enabled:
```bash
# Full regression suite
{test_command}

# Coverage analysis
{coverage_command if available}

# Performance benchmarks
{benchmark_command if available}
```

**Test Results Analysis:**
- 100% pass rate required
- Coverage must not decrease
- Performance must not degrade
- New tests for new functionality
}

**5.4 CHANGE MANIFEST GENERATION**

```bash
# Comprehensive change analysis
git status --porcelain | wc -l  # Change count
git diff --shortstat            # Line metrics
git diff --name-only            # File list
```

**5.5 EXECUTIVE SUMMARY GENERATION**

**Implementation Metrics Dashboard:**
```
IMPLEMENTATION SUMMARY
=====================
Total Tasks Attempted: {total_count}
Successfully Completed: {completed_count} ({percentage}%)
Blocked: {blocked_count}
Clarification Needed: {clarification_count}

Execution Time: {total_duration}
Average Time per Task: {average_duration}
Files Modified: {file_count}
Lines Added/Removed: +{additions}/-{deletions}

Key Achievements:
{bullet_list_of_major_accomplishments}

Challenges Encountered:
{list_of_significant_obstacles}

Next Steps:
{recommended_actions}
```

**ERROR HANDLING & RECOVERY PROTOCOLS**

**FAILURE MODE ANALYSIS & MITIGATION:**

**Scenario Alpha: Task Ambiguity**
- **Detection:** Requirements lack specificity or examples
- **Response:** Mark [?] with precise clarification requests
- **Recovery:** Pause implementation, seek guidance
- **Prevention:** Request detailed task specifications upfront

**Scenario Beta: Dependency Blockade**
- **Detection:** Required predecessor task incomplete
- **Response:** Mark [!] BLOCKED with dependency graph
- **Recovery:** Pivot to independent tasks if available
- **Prevention:** Validate dependencies before starting

**Scenario Gamma: Test Suite Failure**
- **Detection:** Tests fail after implementation
- **Response:** Immediate rollback to clean state
- **Recovery:** Root cause analysis and targeted fix
- **Documentation:** Detailed failure report in journal
- **Prevention:** Run tests before each task

**Scenario Delta: Merge Conflicts**
- **Detection:** Git reports conflicts
- **Response:** Stash changes, analyze conflict
- **Recovery:** Resolve with architectural awareness
- **Prevention:** Frequent pulls and atomic changes

**Scenario Epsilon: Performance Degradation**
- **Detection:** Benchmarks show regression
- **Response:** Profile and identify bottleneck
- **Recovery:** Optimize or architectural revision
- **Prevention:** Performance-aware implementation

**GRACEFUL DEGRADATION STRATEGIES:**
- Partial implementation with clear boundaries
- Feature flags for risky changes
- Incremental rollout capabilities
- Comprehensive rollback procedures

**SUCCESS CRITERIA & VICTORY CONDITIONS**

**MISSION ACCOMPLISHMENT CHECKLIST:**

**✓ Task Completion Integrity**
- Every selected task has definitive status
- No ambiguous or pending states remain
- Clear documentation for any blockers

**✓ Implementation Excellence**
- Code changes precisely match specifications
- Architectural integrity maintained
- Performance characteristics preserved or improved
- Security posture unchanged or strengthened

**✓ Quality Assurance Victory**
- All existing tests continue passing
- {if_testing: New tests for new functionality}
- {if_testing: Coverage metrics maintained or improved}
- No regressions introduced

**✓ Documentation Completeness**
- Comprehensive journal with timestamps
- Every file change documented for commits
- Design decisions captured for posterity
- Implementation insights preserved

**✓ Codebase Harmony**
- All changes follow established patterns
- Integration points remain stable
- No technical debt introduced
- Future maintainability ensured

**ULTRA-THINKING DIRECTIVE:**

Before commencing implementation, engage in deep contemplation about:

**Strategic Considerations:**
- The broader architectural implications of each task
- How parallel implementations might interact or conflict
- Optimization opportunities across task boundaries
- Long-term maintainability of implementation choices

**Tactical Excellence:**
- Most efficient implementation sequence
- Parallelization opportunities for Sub-Agents
- Risk mitigation strategies for each task
- Performance optimization techniques

**Quality Philosophy:**
- How to exceed rather than merely meet requirements
- Ways to improve the codebase while implementing
- Documentation that teaches rather than just describes
- Tests that ensure rather than just check

**Team Coordination:**
- How multiple Sub-Agents can complement each other
- Communication patterns to prevent conflicts
- Knowledge sharing between parallel executions
- Collective intelligence emergence

Begin implementation with the wisdom of a master craftsman and the precision of a surgeon. Let every line of code be a testament to engineering excellence.

**EXECUTION PRINCIPLES:**

**Parallel Mastery:**
- Deploy Sub-Agents as a coordinated strike team
- Each agent a specialist in their assigned domain
- Synchronization through shared task list state
- Collective intelligence through journal insights

**Implementation Philosophy:**
- Code is poetry written in logic
- Every change purposeful and elegant
- Technical debt is future pain - avoid it
- Performance is a feature, not an afterthought

**Communication Excellence:**
- Over-communicate in journals and status updates
- Every decision has a rationale worth documenting  
- Share insights that help future implementers
- Build knowledge base through implementation

Proceed with confidence, precision, and the unified force of parallel execution mastery.