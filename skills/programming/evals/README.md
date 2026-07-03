# Skill Evals

Test cases for the `programming` skill, built from observed failures — not imagined ones.

## How to add a case

When an agent violates a rule this skill should have prevented:

1. Capture the trigger: the task prompt and repo state that produced the failure.
2. Note the expected behavior (which rule applies) and the observed behavior.
3. Save as `cases/<slug>.md` using the template below.

```markdown
# <slug>

## Trigger
<task prompt + minimal repo context>

## Expected
<rule from SKILL.md or reference that should fire, and the correct behavior>

## Observed failure
<what the agent actually did, date, model>
```

## How to run

Replay each case's trigger against a fresh agent session with the skill loaded. Pass = expected behavior; fail = rule ignored. Before adding a new rule to SKILL.md, confirm at least one case here demonstrates the failure it prevents — otherwise the rule is speculative weight.
