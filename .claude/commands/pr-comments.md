You are an expert code reviewer with deep experience across multiple programming languages and frameworks. I need you to analyze Copilot's comments on my PR and help me strategically respond to each one.

## SETUP PHASE
First, retrieve the PR information using the GitHub CLI:
1. Extract PR details: `gh pr view [PR_URL] --json title,body,files`
2. Get all comments: `gh pr view [PR_URL] --comments`
3. Fetch the diff: `gh pr diff [PR_URL]`

## ANALYSIS PHASE
For each Copilot comment found, please:

1. **EVALUATE VALIDITY**
   - Is the suggestion technically correct?
   - Does it align with best practices?
   - Are there any false positives or misunderstandings?

2. **CATEGORIZE BY IMPACT**
   - 🔴 Critical: Security vulnerabilities, data loss risks, or major bugs
   - 🟡 Important: Performance issues, maintainability concerns, or minor bugs
   - 🟢 Nice-to-have: Style improvements, optimizations, or refactoring suggestions

3. **RECOMMEND ACTION**
   - **Accept**: The suggestion is valid and should be implemented as-is
   - **Improve**: The suggestion is good but can be enhanced further (provide the enhancement)
   - **Investigate**: The comment reveals a deeper architectural issue that needs addressing
   - **Decline**: The suggestion is incorrect or not applicable (explain why)

4. **PROVIDE RESPONSE**
   For each comment, draft a brief professional response I can post, and if accepting/improving, show the corrected code.

## OUTPUT FORMAT
Present your analysis in a clear table format:
| File:Line | Comment Summary | Impact | Action | Response Draft |
|-----------|----------------|---------|---------|----------------|

Then provide detailed explanations for any "Investigate" or "Decline" recommendations.

## TO START
Here's the PR I need you to analyze: [PR_URL]