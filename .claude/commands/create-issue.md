# Create Issue Command

This command orchestrates the creation of well-structured GitHub issues through an AI-assisted workflow.

## Workflow Steps

1. **Prompt Enhancement**: Use the task tool to create a sub-agent running `./agents/prompt-enhancer/refine-prompt.md`

   - Input: User's initial issue description
   - Output: `{refined_prompt}` - An enhanced, detailed issue description

2. **Issue Creation**: Use the task tool to create a sub-agent running `./agents/source-control/create-issue.md`

   - Input: `{refined_prompt}` from step 1
   - Output: Structured issue with title, description, labels, and metadata

3. **User Review**: Present the generated issue to the user for confirmation or refinement

4. **GitHub Submission**: Use `gh` CLI to create the issue in the specified repository

## Context to Pass to Sub-agents

- Repository name
- Issue type (bug, feature, documentation, etc.)
- Any existing issue templates or formatting requirements
