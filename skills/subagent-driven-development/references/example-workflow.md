# Example Workflow

Short example of the loop.

```
1. Read plan once. Split into small owned tasks.
2. Define shared interfaces first.
3. Create `tsq` items. Mark ready vs blocked.
4. Dispatch implementer A with full task text, owned files, contracts, tests.
5. Implementer asks one question. Orchestrator answers and updates prompt.
6. Implementer returns summary, changed files, tests run, open issues.
7. Dispatch reviewer with requirements, diff context, test results.
8. Reviewer fails task for one missing acceptance criterion.
9. Send fix task back to implementer.
10. Reviewer passes.
11. Mark task done in `tsq`.
12. Integrate approved tasks in dependency order.
13. Run final checks across the full plan.
```
