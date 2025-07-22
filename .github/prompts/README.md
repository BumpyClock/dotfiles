# GitHub Copilot Custom Instructions

This directory contains custom instructions for GitHub Copilot to provide context-aware code suggestions and follow project-specific guidelines.

## Structure

### Global Instructions
- **`../copilot-instructions.md`** - Main project-wide coding standards and principles

### Task-Specific Instructions
- **`architecture.md`** - System design and architecture guidelines
- **`bug-fixing.md`** - Bug investigation and fixing workflow
- **`implementation.md`** - Feature implementation best practices
- **`code-analysis.md`** - Code review and analysis guidelines

### Language-Specific Instructions
- **`python.md`** - Python development with uv package manager
- **`typescript.md`** - TypeScript/JavaScript with pnpm

### Workflow Instructions
- **`commits.md`** - Git commit message conventions
- **`pull-requests.md`** - PR creation and review guidelines
- **`testing.md`** - Testing strategies and best practices

## Usage

These instructions are automatically loaded by GitHub Copilot based on:
1. The `applyTo` glob patterns in each file's metadata
2. The context of the file you're currently editing
3. The type of task you're performing

## Customization

To add or modify instructions:
1. Create a new `.md` file in this directory
2. Add appropriate metadata headers:
   ```yaml
   ---
   applyTo: "**/*.ext"  # Glob pattern for file matching
   description: "Brief description"
   ---
   ```
3. Write clear, actionable guidelines
4. Keep instructions concise and specific

## Best Practices

- Keep instructions focused and relevant
- Avoid conflicting guidelines across files
- Update instructions as project evolves
- Test that Copilot suggestions align with guidelines
- Review and refine based on team feedback