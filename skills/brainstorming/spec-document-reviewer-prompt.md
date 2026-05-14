# Spec Document Reviewer Prompt

Use after full-flow design spec is saved to `tsq` or exported to a repo file.

Purpose: catch serious blockers before implementation planning.

```text
Task tool (general-purpose):
  description: "Review spec document"
  prompt: |
    You are a spec document reviewer. Verify this spec is ready for implementation planning.

    Spec to review: [TSQ_PARENT_ID_AND_SPEC_TEXT_OR_SPEC_FILE_PATH]

    Check:
    - Completeness: TODOs, placeholders, TBDs, incomplete sections.
    - Consistency: contradictions or conflicting requirements.
    - Clarity: ambiguity that could make someone build the wrong thing.
    - Scope: focused enough for one plan; not multiple independent subsystems.
    - YAGNI: unrequested features or over-engineering.
    - Verification expectations: clear enough for plan tasks to include focused and smoke/live checks where needed.

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
