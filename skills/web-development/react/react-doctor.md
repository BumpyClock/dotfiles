# React Doctor

## Use
- Run after meaningful React changes.
- Run during React bug triage when the issue may involve correctness, performance, security, or architecture.
- Skip for non-React or CSS-only work unless nearby React behavior changed too.

## Command
```bash
npx -y react-doctor@latest . --verbose --diff
```

## Workflow
- Run after edits.
- Fix highest-signal findings first: correctness, security, performance cliffs, architectural smells.
- Re-run after fixes.
- Treat the score as a hint, not source of truth.
- Ignore a finding only when it clearly conflicts with repo constraints and you can state why.
