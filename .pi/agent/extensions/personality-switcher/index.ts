import { handleDirectCommand, showSelector, updateStatus } from "./commands.js";
import {
	registerPersonalityInsightTool,
	togglePersonalityInsightCollapsed,
} from "./insight-tool.js";
import { buildPromptSection } from "./prompt.js";
import { emptyState, readPersistedState } from "./state.js";
import type { ExtensionAPI, PersonalityState } from "./types.js";

export default function personalitySwitcher(pi: ExtensionAPI) {
	let state: PersonalityState = emptyState();
	const setRuntimeState = (nextState: PersonalityState) => {
		state = nextState;
	};

	registerPersonalityInsightTool(pi);

	pi.registerShortcut("ctrl+shift+e", {
		description: "Collapse or expand the teaching insight widget",
		handler: (ctx) => {
			togglePersonalityInsightCollapsed(ctx);
		},
	});

	pi.registerCommand("personality", {
		description: "Switch assistant personality and style modifier",
		handler: async (args, ctx) => {
			if (await handleDirectCommand(state, args ?? "", ctx, setRuntimeState)) {
				return;
			}
			await showSelector(ctx, setRuntimeState);
		},
	});

	pi.on("session_start", async (_event, ctx) => {
		state = await readPersistedState();
		updateStatus(ctx, state);
	});

	pi.on("before_agent_start", async (event) => {
		const promptSection = buildPromptSection(state);
		if (!promptSection) return;
		return {
			systemPrompt: `${event.systemPrompt}

${promptSection}`,
		};
	});
}
