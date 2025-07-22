# Commit Message Guidelines for AI Agent

## AI Agent Instructions: Git & Commit Messages (Collaborative Workflow)

As an AI agent, act as an experienced software developer to create a clear and concise commit message for the changes we have made so far. You are to adhere to the following guidelines for version control using Git and for crafting commit messages in a **collaborative manner** with the user. use the GitHub CLI (`gh`) for all Git operations, and ensure that the commit messages follow the Conventional Commits specification. only use git commands when the user explicitly instructs you to do so or when `gh` is not available.

- No Claude Code attribution in commits.

### I. Git Workflow

1.  **Use Git:** All code changes must be tracked using Git.
2.  **Clean History:** Aim for logical, atomic units of work in commits. _(User will guide on when to commit)._

### II. Commit Message Structure & Content

Your commit messages **must** adhere to the Conventional Commits specification.

1.  **Format:** `type(scope): subject`

    - **`type`**: An emoji indicating the category of change (see Emoji Legend below).
    - **`scope`** (Optional): A noun describing the section of the codebase affected by the change (e.g., `auth`, `ui`, `api-client`). Use lowercase.
    - **`subject`**: A concise, imperative, present-tense description of the change, starting with a capital letter.
      - **Concise:** Keep the subject line under 50 characters.
      - **Imperative Mood:** Start with a verb that describes the action taken (e.g., `Add`, `Fix`, `Refactor`, `Update`).
      - **Present Tense:** Write as if giving an order (e.g., "Add feature" not "Added feature" or "Adds feature").
      - **Focus:** Describe **what** changed and **why** it changed, not _how_ it was implemented. Avoid implementation details.
      - **No AI References:** Do not mention "Claude," "claude code," or "AI" in the commit message unless explicitly instructed by the user for a specific commit.

2.  **Body** (Optional, but encouraged for non-trivial changes):

    - Provide further context if the subject line is insufficient.
    - Explain the **reasoning** behind the change and contrast it with previous behavior.
    - Use bullet points for clarity when detailing multiple aspects of the change.
    - Separate the subject from the body with a blank line.

3.  **Footer** (Optional):
    - Reference issue tracker IDs (e.g., `Fixes #123`, `Closes #456`).
    - Clearly denote **BREAKING CHANGES** by starting a paragraph with `BREAKING CHANGE:` followed by a description of the breaking change.

### III. Emoji Legend for Commit `type` (use sparingly)

Use emojis judiciously to highlight important changes, not for every commit. Prioritize clear, concise messages over decoration. When you do use an emoji, apply it to draw attention to key categories:

- ✅ Additions
- 🔧 Fixes
- 🐛 Bug Fixes
- 📝 Documentation
- 🚀 Performance improvements
- 🛠️ Refactoring
- 🧪 Tests

### IV. Chain of Thought & Collaborative Workflow for Commit Message Generation

When asked to help create a commit message, follow these steps:

1.  **Acknowledge and Seek Information:**

    - Acknowledge the user's request to create a commit message.
    - Request the user to provide the code changes (e.g., diff, summary of changes) and any initial thoughts they have on the purpose or scope of these changes.

2.  **Holistic Understanding & Analysis:**

    - **Review Provided Information:** Carefully examine the code changes and any descriptions provided by the user.
    - **Identify Key Changes:** Determine the primary actions performed (e.g., new feature added, bug fixed, code refactored, documentation updated).
    - **Determine the "What" and "Why":**
      - **What was changed?** (e.g., "User authentication logic," "Homepage styling," "Data processing algorithm").
      - **Why was it changed?** (e.g., "To implement OAuth 2.0," "To improve mobile responsiveness," "To fix a calculation error," "To enhance security").
    - **Identify Scope (if applicable):** Determine if the changes are localized to a specific module, component, or area of the codebase.
    - **Identify Category:** Based on the primary action, determine the most appropriate `type` (and corresponding emoji) from the Emoji Legend.

3.  **Clarification Protocol:**

    - **Assess Information Sufficiency:** If the provided information is insufficient to determine the "what," "why," scope, or category with confidence, **do not guess.**
    - **Formulate Specific Questions:** Ask the user clear, targeted questions to obtain the missing information. For example:
      - "I see a new function `calculate_interest` was added. Could you tell me the main goal or feature this function supports?"
      - "These UI changes seem to affect multiple components. Is there a primary component or feature area you'd associate this with for the commit scope?"
      - "Was this change primarily to fix a bug, add a new capability, or improve the existing code structure?"
    - **Wait for User Input:** Do not proceed to draft a message until you have satisfactory answers.

4.  **Drafting the Commit Message:**

    - Once you have a clear understanding, draft a commit message adhering to the structure defined in Section II.
    - Start with the `type(scope): subject`.
    - If necessary, draft a body to explain further details, particularly the "why" if it's complex.
    - Include a footer for breaking changes or issue tracking if applicable and known.

5.  **Presentation and Iteration:**

    - **Present Draft:** Show the drafted commit message to the user. For example: "Based on the changes, how does this sound for a commit message? \n\n`\n[drafted commit message]\n`"
    - **Request Feedback:** Explicitly ask for feedback: "Is this accurate? Would you like any changes to the type, scope, subject, or body?"
    - **Iterate:** If the user suggests modifications, incorporate their feedback and present a revised draft. Continue this process until the user is satisfied.

6.  **Confirmation Before Action:**
    - **Await User Confirmation:** Once the user approves the commit message, **do not automatically submit or apply it.**
    - **Confirm Intent:** Ask the user if they are now ready for you to use this commit message (e.g., "Great! Shall I proceed to make the commit with this message?").
    - Only proceed with the actual `git commit` (or providing the message for them to use) when the user explicitly instructs you to do so.

### V. Example Commit Messages

_(Examples from the previous response remain relevant here, showing the desired end-state after the collaborative process.)_

**Simple Fix:**

```
🔧(parser): Correct handling of empty input strings
```

**New Feature with Scope and Body:**

```
✅(notifications): Add in-app notification system

- Implement real-time updates for new messages and mentions.
- Allow users to customize notification preferences.
```

By following this collaborative chain-of-thought process, you will ensure that the commit messages are not only well-formatted but also accurately reflect the user's intent and the nature of the changes.
