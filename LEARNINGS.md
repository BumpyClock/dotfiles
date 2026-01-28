- Context: Fix invalid YAML warnings for SKILL.md frontmatter
  What I tried: Inspected SKILL.md frontmatter; converted long description values to block scalars
  Outcome: Worked; YAML parser no longer treats "Triggers on:" as a mapping delimiter
  Next time: Quote or use block scalars for descriptions containing colons
- Context: Merge frontend-developer guidance into design-engineering
  What I tried: Extracted unique guidance into a new aesthetic-direction reference and linked it from design-engineering
  Outcome: Worked; overlap consolidated and skill archived
  Next time: Check for conflicts with existing design-engineering motion and marketing constraints
- Context: Enhance orchestrate prompt to leverage subagent-driven-development
  What I tried: Rewrote `.ai_agents/prompts/orchestrate.md` to include required workflow, prompt creation flow, codex agent selection, and parallel execution rules
  Outcome: Worked; prompt now aligns with skill guidance and codex constraints
  Next time: Include required report path and review-in-orchestrator reminder
- Context: Simplify orchestrate prompt to trigger subagent-driven-development
  What I tried: Replaced embedded workflow details with a directive to use the subagent-driven-development skill and kept only repo hygiene and parallelization guardrails
  Outcome: Worked; prompt now defers to the skill instead of duplicating it
  Next time: Keep orchestrator prompt minimal and let the skill own the workflow details
- Context: Enhance subagent-driven-development skill using orchestrate-coding guidance
  What I tried: Added a planning checklist with interface-first and test strategy steps, tightened guardrails, and moved parallelization examples into a reference file
  Outcome: Worked; skill now encodes stronger test expectations and clearer parallelization patterns
  Next time: Keep examples in references to avoid bloating SKILL.md
- Context: Add persistent task tracking to subagent-driven-development
  What I tried: Added a daily task tracker requirement and updated workflow/guardrails examples to reference it
  Outcome: Worked; progress tracking now survives compaction via a date-based task-tracker file
  Next time: Keep the tracker format minimal and update it on every state change
- Context: link-dotfiles.sh fails when dangling symlinks exist at write targets
  What I tried: Added `rm -f "$target"` before each sed/cp write to cz, ck, ccy targets
  Outcome: Worked; removes stale symlinks so redirected writes go to fresh regular files
  Next time: Always remove existing file/symlink before writing to a generated script target
