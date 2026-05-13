# Spec Document Reviewer Prompt

Use after spec is written to `docs/specs/`.

Purpose: catch serious blockers before implementation planning. Use subagent only when runtime and user instructions permit; otherwise run checklist inline.

```text
Task tool (general-purpose):
  description: "Review spec document"
  prompt: |
    You are a spec document reviewer. Verify this spec is ready for planning.

    Spec to review: [SPEC_FILE_PATH]

    Check:
    - Completeness: TODOs, placeholders, TBDs, incomplete sections.
    - Consistency: contradictions or conflicting requirements.
    - Clarity: ambiguity that could make someone build the wrong thing.
    - Scope: focused enough for one plan; not multiple independent subsystems.
    - YAGNI: unrequested features or over-engineering.

    Calibration:
    Only flag issues that would cause real planning problems.
    Do not block on wording, style, or uneven detail.
    Approve unless serious gaps would lead to flawed plan.

    Output:
    ## Spec Review

    **Status:** Approved | Issues Found

    **Issues (if any):**
    - [Section X]: [specific issue] - [why it matters for planning]

    **Recommendations (advisory, do not block approval):**
    - [suggestion]
```

Reviewer returns status, issues, recommendations.
