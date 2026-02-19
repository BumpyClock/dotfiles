# Create Pull Request Workflow

## Role

You are creating comprehensive, reviewer-friendly pull requests collaboratively with the user.

## Chain-of-Thought Reasoning Process

When creating a PR, execute these steps explicitly:

### Step 1: GATHER
Analyze all commits and changes.
```
Think: "This PR contains [X] commits affecting [list areas].
The changes include: [summarize each commit's purpose]"
```

### Step 2: SYNTHESIZE
Identify the overarching goal.
```
Think: "Looking at all changes together, the primary objective is [goal] to achieve [benefit/fix]"
```

### Step 3: CONTEXTUALIZE
Understand the why.
```
Think: "This work was needed because [problem/opportunity]. Without it, [consequence/missed benefit]"
```
If unclear, ASK: "What prompted these changes? What problem does this solve?"

### Step 4: CATEGORIZE
Determine PR type and scope.
```
Think: "This is primarily a [type] because [reasoning]. It affects [scope]"
```

### Step 5: ASSESS
Identify risks and review focus.
```
Think: "Potential risks: [list]. Reviewers should pay attention to: [areas]"
```

### Step 6: COMPOSE
Draft the complete PR.

---

## PR Structure

```markdown
**[Type] Brief description (#issue)**

## Summary
One paragraph explaining the why and what

## Changes
- Key change 1
- Key change 2

## Testing
How the changes were validated

## Review Notes
What reviewers should focus on
```

## Type Prefixes

| Prefix | Use For |
|--------|---------|
| `[Feature]` | New functionality |
| `[Fix]` | Bug fixes |
| `[Refactor]` | Code improvements (no behavior change) |
| `[Perf]` | Performance improvements |
| `[Docs]` | Documentation only |
| `[Test]` | Test additions/changes |
| `[Build]` | Build/CI changes |
| `[BREAKING]` | Breaking changes (always use for breaking changes) |

---

## Templates

### Feature PR

```markdown
**[Feature] {Concise description} (#{issue})**

## Summary
{What this adds and why it's valuable. User-facing impact.}

## Changes
- {Major component/feature added}
- {Integration points}
- {UI/UX changes}
- {API additions}

## Testing
- {Test coverage added}
- {Manual testing performed}
- {Performance testing if applicable}

## Review Notes
- {Complex logic locations}
- {Security considerations}
- {Performance implications}

## Screenshots/Demo
{If applicable}
```

### Fix PR

```markdown
**[Fix] {What was broken} (#{issue})**

## Summary
{Description of the bug, its impact, and the fix approach.}

## Root Cause
{Brief explanation of why the bug occurred}

## Changes
- {Specific fix implementation}
- {Preventive measures added}

## Testing
- {How the fix was verified}
- {Regression testing performed}
- {Edge cases considered}

## Review Notes
- {Areas that might be affected}
- {Specific scenarios to verify}
```

### Refactor PR

```markdown
**[Refactor] {What was improved} (#{issue})**

## Summary
{What motivated this refactor and benefits it provides.}

## Changes
- {Structural changes}
- {Pattern improvements}
- {Dependency updates}

## Testing
- {How behavior was verified unchanged}
- {Performance comparison if relevant}

## Review Notes
- {Before/after comparison}
- {Migration considerations}
```

---

## Breaking Change Handling

When PR includes breaking changes:

1. Title MUST start with `[BREAKING]`
2. Summary MUST include breaking change warning:
   ```
   **BREAKING CHANGE:** {description}
   ```
3. Include migration guide
4. List all affected APIs/interfaces
5. Specify deprecation timeline if applicable

Example:
```markdown
**BREAKING CHANGE:** Renamed `userId` to `userUuid` in all API responses.
See migration guide in docs/migrations/uuid-change.md
```

---

## Self-Verification Checklist

Before presenting a PR description, verify:

- [ ] Title clearly indicates change type and scope
- [ ] Reviewer can understand the "why" from summary alone
- [ ] All significant changes documented
- [ ] Testing approach specified
- [ ] Breaking changes clearly marked
- [ ] Review focus areas identified

---

## Anti-Patterns to Avoid

- Vague titles: "Updates" or "Fixes"
- Missing context: Changes without explaining why
- Wall of text: Unstructured information dumps
- Missing test info: "Tests added" without specifics
- Hidden breaking changes: Not prominently marked
- No review guidance: Making reviewers guess what to focus on

---

## Creating the PR

After drafting the description:

```bash
# Create PR with the drafted content
gh pr create --title "[Type] Description (#issue)" --body "$(cat <<'EOF'
## Summary
...

## Changes
...

## Testing
...

## Review Notes
...
EOF
)"

# Or create as draft first
gh pr create --draft --title "..." --body "..."
```

---

## Clarification Prompts

If key information is missing, ask:

**For Features:**
1. What user problem does this solve?
2. Are there any API changes?
3. How was this tested?
4. Any performance implications?

**For Fixes:**
1. What was the bug's impact?
2. Root cause of the issue?
3. How did you verify the fix?
4. Could this affect other areas?

**For Refactors:**
1. What motivated this refactor?
2. What benefits does it provide?
3. How did you ensure no behavior changed?
4. Any performance impact?
