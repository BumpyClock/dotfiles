import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";

const SERVICE_TIER = "priority";
const STATE_TYPE = "openai-codex-fast-mode";
const STATUS_KEY = "codex-fast-mode";

type FastModeState = {
	enabled: boolean;
};

type ModelLike = {
	provider?: string;
	id?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCodexModel(model: ModelLike | undefined): boolean {
	if (!model) return false;
	return model.provider === "openai-codex" || model.id?.includes("codex") === true;
}

function isOpenAICodexResponsesPayload(
	payload: unknown,
): payload is Record<string, unknown> {
	if (!isRecord(payload)) return false;

	const model = payload.model;
	if (typeof model === "string" && model.includes("codex")) return true;

	// Pi's OpenAI Codex Responses payload has this shape. This catches Codex-provider
	// requests even if a non-codex model id is routed through that provider.
	return (
		payload.stream === true &&
		typeof payload.instructions === "string" &&
		Array.isArray(payload.input) &&
		payload.tool_choice === "auto" &&
		"prompt_cache_key" in payload
	);
}

function restoreEnabledFromBranch(ctx: ExtensionContext): boolean {
	let enabled = true;

	for (const entry of ctx.sessionManager.getBranch()) {
		if (entry.type !== "custom" || entry.customType !== STATE_TYPE) continue;

		const data = entry.data as FastModeState | undefined;
		if (typeof data?.enabled === "boolean") {
			enabled = data.enabled;
		}
	}

	return enabled;
}

export default function (pi: ExtensionAPI) {
	let fastModeEnabled = true;

	function persistState() {
		pi.appendEntry<FastModeState>(STATE_TYPE, { enabled: fastModeEnabled });
	}

	function statusText() {
		return `OpenAI Codex fast mode is ${fastModeEnabled ? "on" : "off"}.`;
	}

	function updateStatus(ctx: ExtensionContext, model: ModelLike | undefined = ctx.model) {
		if (!isCodexModel(model)) {
			ctx.ui.setStatus(STATUS_KEY, undefined);
			return;
		}

		const label = `⚡ fast:${fastModeEnabled ? "on" : "off"}`;
		ctx.ui.setStatus(
			STATUS_KEY,
			fastModeEnabled
				? ctx.ui.theme.fg("accent", label)
				: ctx.ui.theme.fg("dim", label),
		);
	}

	function applyFastMode(ctx: ExtensionContext, enabled: boolean) {
		fastModeEnabled = enabled;
		persistState();
		updateStatus(ctx);
		ctx.ui.notify(statusText(), "info");
	}

	function toggleFastMode(ctx: ExtensionContext) {
		applyFastMode(ctx, !fastModeEnabled);
	}

	pi.registerCommand("fast", {
		description:
			"Toggle OpenAI Codex priority service tier. Usage: /fast [toggle|on|off|status]. No args toggles.",
		getArgumentCompletions: (prefix) => {
			const commands = ["toggle", "on", "off", "status"];
			const filtered = commands.filter((command) =>
				command.startsWith(prefix.trim()),
			);
			return filtered.length > 0
				? filtered.map((command) => ({ value: command, label: command }))
				: null;
		},
		handler: async (args, ctx) => {
			const action = args.trim().toLowerCase() || "toggle";

			if (action === "toggle") {
				toggleFastMode(ctx);
				return;
			}

			if (action === "on") {
				applyFastMode(ctx, true);
				return;
			}

			if (action === "off") {
				applyFastMode(ctx, false);
				return;
			}

			if (action === "status") {
				updateStatus(ctx);
				ctx.ui.notify(statusText(), "info");
				return;
			}

			ctx.ui.notify("Usage: /fast [toggle|on|off|status]", "warning");
		},
	});

	pi.registerShortcut("alt+shift+f", {
		description: "Toggle OpenAI Codex fast mode",
		handler: async (ctx) => {
			toggleFastMode(ctx);
		},
	});

	pi.on("session_start", async (_event, ctx) => {
		fastModeEnabled = restoreEnabledFromBranch(ctx);
		updateStatus(ctx);
	});

	pi.on("session_tree", async (_event, ctx) => {
		fastModeEnabled = restoreEnabledFromBranch(ctx);
		updateStatus(ctx);
	});

	pi.on("model_select", async (event, ctx) => {
		updateStatus(ctx, event.model);
	});

	pi.on("before_provider_request", (event) => {
		if (!fastModeEnabled) return;
		if (!isOpenAICodexResponsesPayload(event.payload)) return;

		return {
			...event.payload,
			service_tier: SERVICE_TIER,
		};
	});
}
