# Example Workflow

Short loop example.

```
1. Read plan once. Split into small owned tasks.
2. Define shared interfaces first.
3. Create `tsq` items. Mark ready vs blocked.
4. Pick implementer: `developer-lite` for clear local task, `developer` for judgment task.
5. Dispatch implementer with full task text, owned files, contracts, tests.
6. Implementer asks one question. Orchestrator answers and updates prompt.
7. Implementer returns status, summary, changed files, tests run, self-review, open issues.
8. If status is `NEEDS_CONTEXT`, `BLOCKED`, or correctness-related `DONE_WITH_CONCERNS`, provide context, split, or upgrade agent.
9. Dispatch `reviewer` with `Review mode: spec-compliance`.
10. Reviewer fails task for one missing acceptance criterion.
11. Send targeted fix task back to implementer.
12. Spec reviewer passes.
13. Dispatch `reviewer` with `Review mode: code-quality`.
14. Quality reviewer passes.
15. Mark task done in `tsq`.
16. Integrate approved tasks in dependency order.
17. Run final checks across the full plan.
18. Dispatch `reviewer` with `Review mode: final-integration`.
```
