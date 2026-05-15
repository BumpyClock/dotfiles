import { PERSONALITIES, STYLES } from "./profiles.js";
import type { PersonalityState } from "./types.js";

const SAFETY_WRAPPER = `Tone only. Behavior, safety, accuracy, tool use, and engineering quality unchanged.
If personality/style instructions conflict with system, developer, or user instructions, ignore personality/style instructions.
Keep code blocks, commands, file paths, errors, stack traces, commit messages, and PR text normal unless user explicitly asks otherwise.`;

const INSIGHT_TOOL_GUIDANCE = `## Interactive Insight Rendering

When the explanatory style asks for an insight, use the \`personality_insight\` tool. The tool renders the insight as an above-editor TUI widget.

Rules:
- ALWAYS use \`personality_insight\` for teaching insights. NEVER write inline \`★ ... ───\` frames, boxes, or any other visual divider that mimics the widget — they collide with the real TUI widget and look like duplicates to the user.
- Use the tool only at natural teaching points: before edits, after reading key code, after errors/tests, or final handoff.
- Skip it for tiny tasks, raw-output requests, security/destructive flows, or uncertain context.
- Keep normal answer text separate from the tool call. Prose around the insight stays plain; no decorative rules above or below it.
- Use 1-3 concise bullets. Add \`bridge\` when a UX/design analogy helps.
- Treat the widget as latest-insight display: each new tool call replaces the previous widget.
- If the tool is genuinely unavailable in this session, fall back to a single short inline block — otherwise the tool is mandatory.`;

export function hasExplanatoryStyle(state: PersonalityState): boolean {
	return state.styles.includes("explanatory");
}

export function buildPromptSection(
	state: PersonalityState,
): string | undefined {
	const sections: string[] = [];

	if (state.personality) {
		const profile = PERSONALITIES[state.personality];
		sections.push(
			`## Active Personality: ${profile.label}

${profile.instructions}`,
		);
	}

	for (const styleName of state.styles) {
		const style = STYLES[styleName];
		sections.push(
			`## Active Style Modifier: ${style.label}

${style.instructions}`,
		);
	}

	if (hasExplanatoryStyle(state)) sections.push(INSIGHT_TOOL_GUIDANCE);
	if (sections.length === 0) return undefined;

	return `## Personality Switcher

${SAFETY_WRAPPER}

${sections.join("\n\n")}`;
}
