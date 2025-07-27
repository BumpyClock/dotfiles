# Agent Color Coding System

This directory contains specialized agents organized by functional themes using a consistent color coding system. Each agent has a `color` field in its frontmatter that corresponds to its theme.

## Color Themes

### 🔴 **RED - Code Quality & Analysis**
*Agents focused on code review, analysis, and quality assurance*
- `code-flow-analyzer` - Analyzes execution flow to identify over-engineering and complexity
- `code-reviewer` - Expert code review for quality, security, and maintainability
- `BUG-triage-manager` - Coordinates and manages bug-fixing processes
- `source-control-create-local-commit` - Creates well-structured local commits

### 🟠 **ORANGE - Development & Implementation**
*Agents that write, implement, and build features*
- `elite-tdd-developer` - TDD-focused development with high code quality standards
- `principal-ux-designer` - Expert design guidance and UX reviews
- `typescript-expert-developer` - TypeScript development with modern frameworks
- `figma-frontend-developer` - Pixel-perfect frontend implementation from Figma designs

### 🟡 **YELLOW - Documentation & Content**
*Agents that handle documentation, comments, and content creation*
- `documentation-code-cleanup-agent` - Orchestrates parallel documentation tasks
- `Documentation-Code-Cleanup-Orchestrator` - Cleans up and standardizes code documentation

### 🟢 **GREEN - Source Control & Data**
*Agents that manage version control, data processing, and memory*
- `source-control-PR-generator` - Creates comprehensive pull requests from git changes
- `source-control-create-remote-commit-and-push` - Handles remote commits and pushes
- `memory-manager` - Manages persistent knowledge across Claude interactions
- `gemini-agent` - Leverages Gemini CLI for complex data processing tasks

### 🔵 **BLUE - Utilities & Enhancement**
*Agents that provide utility functions and enhancements*
- `LYRA-Prompt-Optimizer` - Refines prompts for better AI understanding

### 🟣 **PURPLE - Architecture & Planning**
*Agents focused on high-level design, architecture, and project planning*
- `software-architect` - Designs comprehensive software architectures
- `engineering-manager` - Coordinates complex feature implementations
- `sprint-planner` - Breaks down projects into organized sprints
- `sprint-planning-manager` - Creates implementation roadmaps and sprint boundaries

### 🩵 **CYAN - Code Maintenance & Improvement**
*Agents that focus on code cleanup and optimization*
- `code-cleanup-specialist` - Identifies and removes dead code, reduces complexity

### ⚫ **GRAY - Specialists & Support**
*Specialized agents that provide specific expertise and support functions*
- `BUG-debugger-sub-agent` - Debugging specialist for errors and test failures
- `dev-experience-specialist` - Refactors legacy code to modern conventions
- `data-scientist` - Data analysis expert for SQL queries and BigQuery operations
- `research-specialist` - Investigates options and provides actionable recommendations
- `quality-assurance-specialist` - Monitors and validates code changes
- `source-control-PR-comment-reviewer` - Analyzes and reviews PR comments

## Agent File Format

All agent files follow this frontmatter format:

```yaml
---
name: agent-name
description: Detailed description of the agent's purpose and usage
tools: optional-list-of-tools  # Optional field
color: theme-color
---
```

## Usage

Agents are organized in subdirectories by functional area:
- `architecture/` - Architecture and design agents
- `debugging/` - Bug fixing and debugging agents
- `documentation/` - Documentation and content agents
- `Engineering Manager/` - Project management and coordination agents
- `gemini/` - Gemini CLI integration agents
- `prompt-enhancer/` - Prompt optimization agents
- `source-control/` - Version control and Git-related agents
- `specialists/` - Specialized domain experts

## Maintenance

When adding new agents:
1. Follow the standard frontmatter format
2. Assign a color based on the agent's primary function
3. Place the agent in the appropriate subdirectory
4. Update this README if introducing a new color theme