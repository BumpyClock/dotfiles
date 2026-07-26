import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";

const SERVICE_TIER = "priority";
const SETTINGS_KEY = "openaiCodexFastMode";
const STATUS_KEY = "codex-fast-mode";

type ModelLike = {
	provider?: string;
	id?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getErrorCode(error: unknown): string | undefined {
	return isRecord(error) && "code" in error ? String(error.code) : undefined;
}

function settingsPath(): string {
	return join(homedir(), ".pi", "agent", "settings.json");
}

function parseSettingsFile(raw: string): Record<string, unknown> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw) as unknown;
	} catch (error) {
		throw new Error(
			`Failed to parse settings.json: ${error instanceof Error ? error.message : String(error)}`,
			{ cause: error },
		);
	}
	if (!isRecord(parsed)) {
		throw new Error("settings.json must contain a JSON object");
	}
	return parsed;
}

export async function readFastModeSetting(
	path = settingsPath(),
): Promise<boolean> {
	let settings: Record<string, unknown>;
	try {
		settings = parseSettingsFile(await readFile(path, "utf8"));
	} catch (error) {
		if (getErrorCode(error) === "ENOENT") return false;
		throw error;
	}

	const extensionSettings = settings.extensionSettings;
	if (!isRecord(extensionSettings)) return false;

	const fastMode = extensionSettings[SETTINGS_KEY];
	return isRecord(fastMode) && typeof fastMode.enabled === "boolean"
		? fastMode.enabled
		: false;
}

export async function writeFastModeSetting(
	enabled: boolean,
	path = settingsPath(),
): Promise<void> {
	let settings: Record<string, unknown> = {};
	try {
		settings = parseSettingsFile(await readFile(path, "utf8"));
	} catch (error) {
		if (getErrorCode(error) !== "ENOENT") throw error;
	}

	const extensionSettings = isRecord(settings.extensionSettings)
		? settings.extensionSettings
		: {};
	const fastMode = isRecord(extensionSettings[SETTINGS_KEY])
		? extensionSettings[SETTINGS_KEY]
		: {};

	settings.extensionSettings = {
		...extensionSettings,
		[SETTINGS_KEY]: { ...fastMode, enabled },
	};

	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}

function isCodexModel(model: ModelLike | undefined): boolean {
	if (!model) return false;
	return (
		model.provider === "openai-codex" || model.id?.includes("codex") === true
	);
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

export default function (
	pi: ExtensionAPI,
	fastModeSettingsPath = settingsPath(),
) {
	let fastModeEnabled = false;

	function statusText() {
		return `OpenAI Codex fast mode is ${fastModeEnabled ? "on" : "off"}.`;
	}

	function updateStatus(
		ctx: ExtensionContext,
		model: ModelLike | undefined = ctx.model,
	) {
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

	async function applyFastMode(ctx: ExtensionContext, enabled: boolean) {
		try {
			await writeFastModeSetting(enabled, fastModeSettingsPath);
		} catch (error) {
			ctx.ui.notify(
				`Failed to save OpenAI Codex fast mode: ${error instanceof Error ? error.message : String(error)}`,
				"error",
			);
			return;
		}

		fastModeEnabled = enabled;
		updateStatus(ctx);
		ctx.ui.notify(statusText(), "info");
	}

	async function toggleFastMode(ctx: ExtensionContext) {
		await applyFastMode(ctx, !fastModeEnabled);
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
				await toggleFastMode(ctx);
				return;
			}

			if (action === "on") {
				await applyFastMode(ctx, true);
				return;
			}

			if (action === "off") {
				await applyFastMode(ctx, false);
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
			await toggleFastMode(ctx);
		},
	});

	pi.on("session_start", async (_event, ctx) => {
		try {
			fastModeEnabled = await readFastModeSetting(fastModeSettingsPath);
		} catch (error) {
			fastModeEnabled = false;
			ctx.ui.notify(
				`Failed to read OpenAI Codex fast mode setting: ${error instanceof Error ? error.message : String(error)}`,
				"warning",
			);
		}
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
