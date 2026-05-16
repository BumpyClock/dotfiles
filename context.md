# Code Context

## Files Retrieved

1. `/Users/adityasharma/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/usage.md` (lines 95-110, 190-215): context file loading (`AGENTS.md`/`CLAUDE.md`), system prompt file sources, and resource flags (`--skill`, `--no-skills`, `--system-prompt`, `--append-system-prompt`).
2. `/Users/adityasharma/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/skills.md` (lines 24-34, 64-72): skill discovery sources, startup scan behavior, and “progressive disclosure” statement.
3. `/Users/adityasharma/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/dist/core/resource-loader.js` (lines 292-336, 661-680): skill loading/update, context files (`agentsFiles`), and system/append-system discovery (`SYSTEM.md`, `APPEND_SYSTEM.md`).
4. `/Users/adityasharma/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/dist/core/agent-session.js` (lines 661-676, 843-857): system prompt rebuild pulls `skills` + `agentsFiles`; `/skill` expansion loads full SKILL.md at command time.
5. `/Users/adityasharma/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/dist/core/system-prompt.js` (lines 24-35, 103-114): system prompt construction appends project context and skill section, but not full skill bodies.
6. `/Users/adityasharma/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/dist/core/skills.js` (lines 254-281): `formatSkillsForPrompt()` emits `<available_skills>` with only `<name>`, `<description>`, `<location>`.
7. `/Users/adityasharma/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/sdk.md` (lines 450-463, 637-647): extension points for `systemPromptOverride` and `agentsFilesOverride`.
8. `/Users/adityasharma/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/README.md` (lines 575-576, 471-472): CLI system-prompt flags and explicit “No sub-agents” statement in runtime philosophy.
9. `/Users/adityasharma/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/examples/extensions/subagent/index.ts` (lines 265-267, 294-299): subagent extension passes per-agent prompt text via `--append-system-prompt` (temp file), demonstrating custom-agent behavior is extension-driven.
10. `/Users/adityasharma/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/examples/extensions/subagent/agents.ts` (lines 97-113): subagent-specific agent discovery (`.pi/agents`, user/project scope) and markdown parsing.
11. `/Users/adityasharma/Projects/dotfiles/agent-templates/ux-designer.md` (lines 1-27): frontmatter-driven agent template with `pi:` config (`model`, `tools`, etc.), but no corresponding loader in pi-coding-agent core was found.

## Key Code

- **Prompt context pipeline**: `AgentSession._rebuildSystemPrompt()` pulls `loader.getSystemPrompt()`, `getAppendSystemPrompt()`, `getSkills()`, and `getAgentsFiles()` and passes them into `buildSystemPrompt()` (`dist/core/agent-session.js:661-676`).
- **What becomes context**: `buildSystemPrompt()` appends project context files and `formatSkillsForPrompt(skills)`; this section is inserted regardless of tool selection (`dist/core/system-prompt.js:24-35`, `dist/core/system-prompt.js:103-114`).
- **Skill payload in context is shallow**: `formatSkillsForPrompt()` only includes name/description/location; no instruction body is embedded (`dist/core/skills.js:254-281`).
- **Full skill content is lazy**: `/skill:name` expansion in `_expandSkillCommand()` reads SKILL.md and wraps content in `<skill>...</skill>` only during prompt send, not during default system prompt assembly (`dist/core/agent-session.js:843-857`).
- **Loader extension points**: `DefaultResourceLoader` supports `systemPromptOverride`, `appendSystemPromptOverride`, `agentsFilesOverride`, and `skillsOverride`; no `agentTemplate`/custom-agent loader in core API (`dist/core/resource-loader.d.ts`, `docs/sdk.md:450-463`, `docs/sdk.md:637-647`).
- **Context file scope**: `.pi/AGENTS` and project/global `AGENTS.md`/`CLAUDE.md` via `loadProjectContextFiles` and CLI flags; not arbitrary template-based agent instructions (`dist/core/resource-loader.js:292-336`, docs/usage lines 95-110).
- **Custom agents are externalized**: core docs state no built-in sub-agents; extension example (`subagent`) implements isolated agents and injects prompts with CLI `--append-system-prompt` temp file (`README.md:471-472`, `examples/extensions/subagent/index.ts:265-267`, `examples/extensions/subagent/index.ts:294-299`).

## Architecture

- Data flow is: `DefaultResourceLoader.reload()` → `AgentSession._rebuildSystemPrompt()` → `buildSystemPrompt()`.
- The default system prompt carries:
  1. prompt override text,
  2. append-system prompt,
  3. loaded context files,
  4. serialized skill index.
- Full SKILL.md contents are injected only when requested via `/skill` or by model-triggered reads; therefore, there is no automatic preloading of custom agent-specific skill files into full context.
- For true “custom agents” with dedicated prompts/behavior, runtime provides hooks/extension points (subagent extension uses separate processes + `--append-system-prompt`), not a first-class built-in agent-template mechanism.

## Start Here

- Open `/Users/adityasharma/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/dist/core/agent-session.js` at lines 661-676 and 843-857 to verify prompt composition plus on-demand skill expansion in one pass.
