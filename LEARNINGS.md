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
- Context: Add WinUI 3 skill templates for agents
  What I tried: Drafted WinUI 3 view refactor, concurrency, and system backdrop skills with checklists/snippets
  Outcome: New skills added under .ai_agents/skills
  Next time: Add version-specific notes when Windows App SDK changes
- Context: Consolidate WinUI guidance into single skill
  What I tried: Built winui3-csharp-app skill with indexed references; removed per-topic skills
  Outcome: Single top-level skill with focused references
  Next time: Add packaging step once usage is validated
- Context: codex-beads-loop live output readability
  What I tried: Replaced per-event console logging with an ANSI in-place renderer that updates one header and per-agent status rows
  Outcome: Worked; terminal output is stable and easier to scan during long runs
  Next time: Keep `ink` optional unless full interactive controls are needed
- Context: codex-beads-loop parallel live preview density
  What I tried: Changed the live renderer to keep a rolling per-agent buffer of preview entries (`--preview` lines each)
  Outcome: Worked; parallel runs now show independent 3-line windows per agent instead of one shared stream
  Next time: Keep renderer-mode throttling separate from non-render log throttling
- Context: codex-beads-loop parallel spawn control
  What I tried: Replaced eager `Promise.all` launch with staged launch gates tied to first response (and completion fallback) per started agent
  Outcome: Worked; agents now start one-by-one as responses begin, avoiding all-at-once startup spikes
  Next time: Keep readiness gating tolerant to early process exits to avoid deadlocks
- Context: codex-beads-loop provider-agnostic refactor
  What I tried: Split monolithic loop into `core/*` and `providers/*`, added provider adapter interface/registry, and moved codex parsing/args into `providers/codex.ts`
  Outcome: Worked; entrypoint is thin and `--provider` now selects adapter behavior (codex implemented)
  Next time: Add claude/copilot adapters by implementing the same `ProviderAdapter` contract
- Context: rename loop runtime to ouroboros + config hierarchy
  What I tried: Renamed entrypoint to `scripts/ralph-loop/ouroboros.ts` and added config loading from `~/.ouroboros` (global + git-root-derived project config)
  Outcome: Worked; merge precedence is `CLI > project > global > provider defaults` and run fails fast outside a git repo
  Next time: Keep config schema flat and typed to minimize ambiguity across providers
- Context: live beads visibility in ouroboros
  What I tried: Added `bd list --json --all --limit 0` snapshot loading, rendered remaining-bead summary in live UI, and mapped agent-picked beads by matching referenced issue IDs
  Outcome: Worked with graceful fallback when no beads DB is present
  Next time: When adding more providers, keep picked-bead attribution source-agnostic by matching against known bead IDs
- Context: Cross-platform dotfile linking on Windows without mandatory elevation
  What I tried: Standardized directory links to Windows junctions and added file-link fallback from symlink to hardlink when policy blocks symlink creation
  Outcome: Worked; directory linking no longer depends on elevated shell, and file linking remains functional under stricter Windows policies
  Next time: Keep link-status checks aware of both symlink/junction and hardlink states to preserve idempotency
