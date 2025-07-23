# Create Pull Request Command

You will orchestrate the creation of a GitHub pull request by coordinating sub-agents and handling user interaction. Follow these steps carefully.

## Step 1: Generate PR Content

Use the task tool to create a sub-agent that analyzes the current repository and generates PR content:

```
task run ./agents/source-control/create-pr.md
```

This will return a JSON response. Parse it and handle the response based on the status field.

## Step 2: Handle Response Status

The response will have a `status` field. Handle each case:

### Case: "error"

If status is "error", display the error message and provide helpful guidance:

```
❌ Error generating PR content: [error message]

Common fixes:
- If "Not in a git repository": Navigate to your project directory
- If "GitHub CLI not authenticated": Run 'gh auth login'
- If "Uncommitted changes detected": Commit your changes first or run the local-commit workflow
```

### Case: "uncommitted_changes"

If status is "uncommitted_changes", show the uncommitted files and offer to run the commit workflow:

```
❌ Uncommitted changes detected:
[list each file]

You have uncommitted changes. Would you like to:
1. Run the local-commit workflow to commit them
2. Cancel PR creation

Please choose (1/2):
```

### Case: "success"

If status is "success", proceed to format and display the PR preview.

## Step 3: Format PR Preview

Extract the data from the JSON response and create a well-formatted preview:

```
═══════════════════════════════════════════════════════════════
                        PULL REQUEST PREVIEW
═══════════════════════════════════════════════════════════════

📌 Branch: [current branch] → [base branch]
📋 Type: [PR type] [if breaking, add "⚠️ BREAKING CHANGE"]
🏷️  Suggested Labels: [comma-separated labels]
🔗 Related Issues: [#123, #456 or "None"]

───────────────────────────────────────────────────────────────
[PR Title]
───────────────────────────────────────────────────────────────

[PR Body - formatted markdown]

───────────────────────────────────────────────────────────────
📊 Statistics:
   • Files changed: [number]
   • Lines added: +[additions]
   • Lines deleted: -[deletions]

📝 Commits included: [number]
───────────────────────────────────────────────────────────────
```

## Step 4: Get User Confirmation

After displaying the preview, ask for confirmation:

```
How would you like to proceed?

1. Create as DRAFT pull request (recommended for work in progress)
2. Create as READY for review (for completed work)
3. Cancel - don't create PR

Enter choice (1/2/3) or say 'draft', 'ready', or 'cancel':
```

Map user responses:

- "1", "draft", "yes" → Create as draft
- "2", "ready", "publish", "yes publish" → Create as ready for review
- "3", "cancel", "no" → Cancel operation

## Step 5: Create the Pull Request

Based on user choice, construct and execute the appropriate gh pr create command:

### For Draft PR:

```bash
gh pr create \
  --title "[extracted title]" \
  --body "[extracted body]" \
  --base "[base branch]" \
  --head "[current branch]" \
  --label "[comma-separated labels]" \
  --draft
```

### For Ready PR:

```bash
gh pr create \
  --title "[extracted title]" \
  --body "[extracted body]" \
  --base "[base branch]" \
  --head "[current branch]" \
  --label "[comma-separated labels]"
```

### Link Related Issues (if any):

If the metadata contains related issues, link them after PR creation:

```bash
# Get the PR number from the create output
PR_NUMBER=[extracted from gh pr create output]

# Link each issue
for issue in [related issues]; do
  gh pr edit $PR_NUMBER --add-issue "#$issue"
done
```

## Step 6: Display Result

### Success:

```
✅ Pull request created successfully!

📍 PR #[number]: [title]
🔗 View online: [URL]
📋 Status: [DRAFT or READY FOR REVIEW]

Next steps:
- Add reviewers: gh pr edit [number] --add-reviewer @username
- Add to project: gh pr edit [number] --add-project "Project Name"
- Check CI status: gh pr checks
- Merge when ready: gh pr merge [number]
```

### Failure:

```
❌ Failed to create pull request

Error: [error message]

Troubleshooting:
- Check your GitHub permissions
- Ensure the base branch exists
- Verify you have pushed your current branch
```

## Error Handling Throughout

At each step, handle potential failures gracefully:

1. **JSON parsing errors**: If the PR content generation returns invalid JSON, show the raw output and suggest re-running
2. **Missing required fields**: If title or body is missing, use sensible defaults
3. **gh command failures**: Capture error output and provide specific troubleshooting steps
4. **Network issues**: Suggest checking internet connection and GitHub status

## Additional Considerations

- If the PR type is "breaking", emphasize this in the preview with warning symbols
- For web projects, remind users to add screenshots after PR creation
- For CLI projects, suggest adding terminal output examples in comments
- If no labels match the PR type, use "enhancement" as default
- Always default to draft if the user just presses enter or gives an ambiguous response

Remember: Make the experience smooth and informative, guiding the user through each step while handling edge cases gracefully.
