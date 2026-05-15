import { clearPersonalityInsightWidget } from "./insight-tool.js";
import { PERSONALITIES, STYLES } from "./profiles.js";
import {
	availablePersonalities,
	availableStyles,
	emptyState,
	formatState,
	normalizeToken,
	NONE,
	resolvePersonality,
	resolveStyle,
	uniqueStyles,
	writePersistedState,
} from "./state.js";
import type { ExtensionContext, PersonalityState, StyleName } from "./types.js";

const PERSONALITY_STATUS_KEY = "personality";

export function updateStatus(
	ctx: ExtensionContext,
	_state: PersonalityState,
): void {
	if (!ctx.hasUI) return;
	ctx.ui.setStatus(PERSONALITY_STATUS_KEY, undefined);
}

async function persistState(
	nextState: PersonalityState,
	ctx: ExtensionContext,
	setRuntimeState: (state: PersonalityState) => void,
): Promise<PersonalityState> {
	const state = {
		personality: nextState.personality,
		styles: uniqueStyles(nextState.styles),
	};
	setRuntimeState(state);
	await writePersistedState(state);
	updateStatus(ctx, state);
	if (!state.styles.includes("explanatory")) {
		clearPersonalityInsightWidget(ctx);
	}
	return state;
}

export async function showSelector(
	ctx: ExtensionContext,
	setRuntimeState: (state: PersonalityState) => void,
): Promise<void> {
	if (!ctx.hasUI) return;

	const personalityChoice = await ctx.ui.select("Select personality", [
		NONE,
		...Object.keys(PERSONALITIES),
	]);
	if (!personalityChoice) return;

	const styleChoice = await ctx.ui.select("Select style modifier", [
		NONE,
		...Object.keys(STYLES),
	]);
	if (!styleChoice) return;

	const nextState = await persistState(
		{
			personality:
				personalityChoice === NONE
					? undefined
					: resolvePersonality(personalityChoice),
			styles:
				styleChoice === NONE
					? []
					: [resolveStyle(styleChoice)].filter((style): style is StyleName =>
							Boolean(style),
						),
		},
		ctx,
		setRuntimeState,
	);
	ctx.ui.notify(`Personality set to ${formatState(nextState)}`, "info");
}

async function handleStyleCommand(
	state: PersonalityState,
	args: string[],
	ctx: ExtensionContext,
	setRuntimeState: (state: PersonalityState) => void,
): Promise<void> {
	const styleArg = args[1];
	if (
		!styleArg ||
		normalizeToken(styleArg) === NONE ||
		normalizeToken(styleArg) === "none"
	) {
		const nextState = await persistState(
			{ ...state, styles: [] },
			ctx,
			setRuntimeState,
		);
		ctx.ui.notify(`Personality set to ${formatState(nextState)}`, "info");
		return;
	}

	const style = resolveStyle(styleArg);
	if (!style) {
		ctx.ui.notify(
			`Unknown style "${styleArg}". Available: ${availableStyles()}`,
			"error",
		);
		return;
	}

	const nextState = await persistState(
		{ ...state, styles: uniqueStyles([style]) },
		ctx,
		setRuntimeState,
	);
	ctx.ui.notify(`Personality set to ${formatState(nextState)}`, "info");
}

export async function handleDirectCommand(
	state: PersonalityState,
	rawArgs: string,
	ctx: ExtensionContext,
	setRuntimeState: (state: PersonalityState) => void,
): Promise<boolean> {
	const args = rawArgs.split(/\s+/).map(normalizeToken).filter(Boolean);
	if (args.length === 0) return false;

	const [first, ...rest] = args;

	if (first === "status") {
		ctx.ui.notify(`Personality: ${formatState(state)}`, "info");
		return true;
	}

	if (first === "style") {
		await handleStyleCommand(state, args, ctx, setRuntimeState);
		return true;
	}

	if (first === NONE || first === "none" || first === "clear") {
		await persistState(emptyState(), ctx, setRuntimeState);
		ctx.ui.notify("Personality disabled", "info");
		return true;
	}

	const personality = resolvePersonality(first);
	if (!personality) {
		ctx.ui.notify(
			`Unknown personality "${first}". Available: ${availablePersonalities()}`,
			"error",
		);
		return true;
	}

	const styles = rest
		.map(resolveStyle)
		.filter((style): style is StyleName => Boolean(style));
	const unknownStyles = rest.filter((style) => !resolveStyle(style));
	if (unknownStyles.length > 0) {
		ctx.ui.notify(
			`Unknown style(s): ${unknownStyles.join(", ")}. Available: ${availableStyles()}`,
			"error",
		);
		return true;
	}

	const nextState = await persistState(
		{ personality, styles },
		ctx,
		setRuntimeState,
	);
	ctx.ui.notify(`Personality set to ${formatState(nextState)}`, "info");
	return true;
}
