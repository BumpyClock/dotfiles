/**
 * Auto-names Pi sessions and terminal tabs from conversation context.
 * Configure under settings.json `extensionSettings.dynamicTitle`, or set
 * top-level `dynamicTitle: false` as a hard kill switch.
 */
const SETTINGS_KEY = "dynamicTitle";
const DEFAULT_MODEL = "openai-codex/gpt-5.3-codex-spark";
const DEFAULT_UPDATE_AFTER_TURNS = 10;
const DEFAULT_MAX_CONTEXT_CHARS = 6_000;
const MAX_TITLE_LENGTH = 60;
const PI_AI_MODULE = "@earendil-works/pi-ai";

const SYSTEM_PROMPT = `You name Pi coding sessions.

Return only a short title.
Rules:
- 2-6 words
- Describe the user's current task or topic
- No quotes
- No markdown
- No prefix like "π -" or "Title:"
- Title case is ok, but do not force it`;

type FsPromises = {
	readFile(path: string, encoding: "utf8"): Promise<string>;
};

type OsBuiltin = {
	homedir(): string;
};

type BuiltinModules = {
	"node:fs/promises": FsPromises;
	"node:os": OsBuiltin;
};

type ProcessLike = {
	getBuiltinModule?: <T extends keyof BuiltinModules>(
		specifier: T,
	) => BuiltinModules[T];
};

type Ui = {
	notify(
		message: string,
		level: "info" | "warning" | "error" | "success",
	): void;
	setTitle(title: string): void;
};

type ModelRef = {
	provider: string;
	id: string;
};

type ModelRegistry = {
	find(provider: string, id: string): unknown | undefined;
	getApiKeyAndHeaders(
		model: unknown,
	): Promise<
		| { ok: true; apiKey?: string; headers?: Record<string, string> }
		| { ok: false; error: string }
	>;
};

type SessionEntry =
	| {
			type: "message";
			message: AgentMessage;
	  }
	| {
			type: "compaction";
			summary: string;
			tokensBefore: number;
			timestamp: string;
	  }
	| Record<string, unknown>;

type SessionManager = {
	getBranch(): SessionEntry[];
};

type ExtensionContext = {
	cwd: string;
	hasUI: boolean;
	ui: Ui;
	modelRegistry: ModelRegistry;
	sessionManager: SessionManager;
};

type ExtensionAPI = {
	on(
		event: "session_start" | "agent_end" | "session_shutdown",
		handler: (event: unknown, ctx: ExtensionContext) => void | Promise<void>,
	): void;
	getSessionName(): string | undefined;
	setSessionName(name: string): void;
};

type AgentMessage = Record<string, unknown> & {
	role?: string;
	content?: unknown;
};

type Message = {
	role: "user";
	content: { type: "text"; text: string }[];
	timestamp: number;
};

type AssistantResponse = {
	content: unknown[];
	stopReason?: string;
	errorMessage?: string;
};

type CompleteFn = (
	model: unknown,
	context: { systemPrompt: string; messages: Message[] },
	options: {
		apiKey: string;
		headers?: Record<string, string>;
		maxTokens: number;
	},
) => Promise<AssistantResponse>;

type DynamicTitleConfig = {
	enabled: boolean;
	model: ModelRef;
	updateAfterTurns: number;
	maxContextChars: number;
};

type DynamicTitleSettingsObject = {
	dynamicTitle?: boolean;
	enabled?: boolean;
	model?: string | { provider?: unknown; model?: unknown; id?: unknown };
	updateAfterTurns?: unknown;
	maxContextChars?: unknown;
};

type PiSettingsFile = {
	extensionSettings?: Record<string, unknown>;
	[SETTINGS_KEY]?: unknown;
};

function processLike(): ProcessLike | undefined {
	return (globalThis as { process?: ProcessLike }).process;
}

function builtin<T extends keyof BuiltinModules>(
	specifier: T,
): BuiltinModules[T] {
	const module = processLike()?.getBuiltinModule?.(specifier);
	if (!module) throw new Error(`${specifier} builtin is unavailable`);
	return module;
}

function settingsPath(): string {
	return `${builtin("node:os").homedir()}/.pi/agent/settings.json`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseModelRef(value: unknown): ModelRef | undefined {
	if (typeof value === "string") {
		const [provider, ...rest] = value.split("/");
		const id = rest.join("/");
		if (provider && id) return { provider, id };
		return undefined;
	}

	if (!isRecord(value)) return undefined;
	const provider = value.provider;
	const id = value.model ?? value.id;
	if (typeof provider === "string" && typeof id === "string") {
		return { provider, id };
	}

	return undefined;
}

function positiveInteger(value: unknown, fallback: number): number {
	return Number.isInteger(value) && Number(value) > 0
		? Number(value)
		: fallback;
}

function normalizeSettings(value: unknown): DynamicTitleConfig {
	// Precedence: hard-off boolean false, then user-provided fields, then defaults.
	const defaults: DynamicTitleConfig = {
		enabled: true,
		model: parseModelRef(DEFAULT_MODEL)!,
		updateAfterTurns: DEFAULT_UPDATE_AFTER_TURNS,
		maxContextChars: DEFAULT_MAX_CONTEXT_CHARS,
	};

	if (value === false) return { ...defaults, enabled: false };
	if (!isRecord(value)) return defaults;

	const settings = value as DynamicTitleSettingsObject;
	const enabled = settings.dynamicTitle ?? settings.enabled ?? true;
	return {
		enabled: enabled !== false,
		model: parseModelRef(settings.model) ?? defaults.model,
		updateAfterTurns: positiveInteger(
			settings.updateAfterTurns,
			defaults.updateAfterTurns,
		),
		maxContextChars: positiveInteger(
			settings.maxContextChars,
			defaults.maxContextChars,
		),
	};
}

function readSettingsValue(settings: PiSettingsFile): unknown {
	if (settings[SETTINGS_KEY] === false) return false;

	const extensionSettings = settings.extensionSettings;
	if (isRecord(extensionSettings) && SETTINGS_KEY in extensionSettings) {
		return extensionSettings[SETTINGS_KEY];
	}

	return settings[SETTINGS_KEY];
}

async function readConfig(): Promise<DynamicTitleConfig> {
	try {
		const raw = await builtin("node:fs/promises").readFile(
			settingsPath(),
			"utf8",
		);
		const parsed = JSON.parse(raw) as unknown;
		if (!isRecord(parsed)) return normalizeSettings(undefined);
		return normalizeSettings(readSettingsValue(parsed as PiSettingsFile));
	} catch (error) {
		const code = isRecord(error) ? error.code : undefined;
		if (code !== "ENOENT") {
			console.error(
				`dynamic-title: failed to read settings.json: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
		return normalizeSettings(undefined);
	}
}

function entryToMessage(entry: SessionEntry): AgentMessage | undefined {
	if (entry.type === "message" && isRecord(entry.message)) {
		return entry.message as AgentMessage;
	}

	if (entry.type === "compaction" && typeof entry.summary === "string") {
		const timestamp =
			typeof entry.timestamp === "string"
				? new Date(entry.timestamp).getTime()
				: Date.now();
		return {
			role: "compactionSummary",
			summary: entry.summary,
			tokensBefore:
				typeof entry.tokensBefore === "number" ? entry.tokensBefore : 0,
			timestamp,
		};
	}
	return undefined;
}

function textFromContent(content: unknown): string {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return "";

	return content
		.map((part) => {
			if (!isRecord(part)) return "";
			if (part.type === "text" && typeof part.text === "string")
				return part.text;
			if (part.type === "toolCall" && typeof part.name === "string") {
				return `[tool call: ${part.name}]`;
			}
			return "";
		})
		.filter(Boolean)
		.join("\n");
}

function messageToText(message: AgentMessage): string {
	const role = typeof message.role === "string" ? message.role : "message";
	if (role === "compactionSummary" && typeof message.summary === "string") {
		return `Compaction summary: ${message.summary}`;
	}
	if (role === "bashExecution") {
		const command = typeof message.command === "string" ? message.command : "";
		return `Bash: ${command}`;
	}

	const text = textFromContent(message.content).trim();
	return text ? `${role}: ${text}` : "";
}

function conversationForTitle(
	ctx: ExtensionContext,
	maxContextChars: number,
): string {
	const conversation = ctx.sessionManager
		.getBranch()
		.map(entryToMessage)
		.filter((message): message is AgentMessage => message !== undefined)
		.map(messageToText)
		.filter(Boolean)
		.join("\n\n");

	if (conversation.length <= maxContextChars) return conversation;
	return conversation.slice(-maxContextChars);
}

function extractText(response: AssistantResponse): string {
	return response.content
		.filter((content): content is { type: "text"; text: string } => {
			return (
				isRecord(content) &&
				content.type === "text" &&
				typeof content.text === "string"
			);
		})
		.map((content) => content.text)
		.join("\n");
}

function cleanTitle(rawTitle: string): string | undefined {
	const title = rawTitle
		.split("\n")[0]
		.replace(/[\x00-\x1f\x7f]/g, "")
		.replace(/^\s*(?:title\s*:\s*)/i, "")
		.replace(/^\s*π\s*-\s*/i, "")
		.replace(/^["'`]+|["'`]+$/g, "")
		.replace(/[.!?:;]+$/g, "")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, MAX_TITLE_LENGTH)
		.trim();

	return title.length > 0 ? title : undefined;
}

function basename(path: string): string {
	const trimmed = path.replace(/\/+$/g, "");
	const lastSlash = trimmed.lastIndexOf("/");
	return lastSlash >= 0 ? trimmed.slice(lastSlash + 1) : trimmed;
}

function fallbackSessionName(ctx: ExtensionContext): string {
	return basename(ctx.cwd) || "Pi";
}

function safeFallbackSessionName(ctx: ExtensionContext): string {
	try {
		return fallbackSessionName(ctx);
	} catch {
		return "Pi";
	}
}

function applyTerminalTitle(ctx: ExtensionContext, sessionName: string): void {
	try {
		if (!ctx.hasUI) return;
		ctx.ui.setTitle(`π - ${sessionName}`);
	} catch {
		// Context can become stale during non-interactive shutdown while title generation is still resolving.
	}
}

function notifyWarning(ctx: ExtensionContext, message: string): void {
	try {
		if (!ctx.hasUI) return;
		ctx.ui.notify(message, "warning");
	} catch {
		// Context can become stale during non-interactive shutdown while title generation is still resolving.
	}
}

function isStaleContextError(error: unknown): boolean {
	return (
		error instanceof Error &&
		error.message.includes("This extension ctx is stale")
	);
}

function notifyHandlerError(ctx: ExtensionContext, error: unknown): void {
	if (isStaleContextError(error)) return;
	notifyWarning(
		ctx,
		`dynamic-title: ${error instanceof Error ? error.message : String(error)}`,
	);
}

async function completeTitle(
	model: unknown,
	message: Message,
	apiKey: string,
	headers: Record<string, string> | undefined,
): Promise<AssistantResponse> {
	const module = (await import(PI_AI_MODULE)) as { complete: CompleteFn };
	return module.complete(
		model,
		{ systemPrompt: SYSTEM_PROMPT, messages: [message] },
		{ apiKey, headers, maxTokens: 32 },
	);
}

async function generateSessionName(
	ctx: ExtensionContext,
	config: DynamicTitleConfig,
): Promise<string | undefined> {
	const conversation = conversationForTitle(ctx, config.maxContextChars);
	if (!conversation.trim()) return undefined;

	const model = ctx.modelRegistry.find(config.model.provider, config.model.id);
	if (!model) {
		notifyWarning(
			ctx,
			`dynamic-title: model not found: ${config.model.provider}/${config.model.id}`,
		);
		return undefined;
	}

	const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
	if (!auth.ok || !auth.apiKey) {
		notifyWarning(
			ctx,
			`dynamic-title: ${auth.ok ? `no API key for ${config.model.provider}` : auth.error}`,
		);
		return undefined;
	}

	const userMessage: Message = {
		role: "user",
		content: [
			{
				type: "text",
				text: `Working directory: ${ctx.cwd}\n\nConversation:\n${conversation}`,
			},
		],
		timestamp: Date.now(),
	};

	const response = await completeTitle(
		model,
		userMessage,
		auth.apiKey,
		auth.headers,
	);
	if (response.stopReason === "aborted") return undefined;
	if (response.stopReason === "error") {
		notifyWarning(
			ctx,
			`dynamic-title: ${response.errorMessage ?? "title generation failed"}`,
		);
		return undefined;
	}
	return cleanTitle(extractText(response));
}

/**
 * Registers hooks that name the active session and terminal title on startup,
 * then refresh the generated name after the configured number of completed agent turns.
 */
export default function dynamicTitle(pi: ExtensionAPI) {
	let turnsSinceTitleAttempt = 0;
	let attemptedInitialTitle = false;
	let generationId = 0;

	async function refreshTitle(
		ctx: ExtensionContext,
		config: DynamicTitleConfig,
	): Promise<void> {
		if (!config.enabled) return;

		const currentName = pi.getSessionName();
		applyTerminalTitle(ctx, currentName ?? safeFallbackSessionName(ctx));
		if (!conversationForTitle(ctx, config.maxContextChars).trim()) return;

		const localGenerationId = ++generationId;
		turnsSinceTitleAttempt = 0;
		attemptedInitialTitle = true;
		const generatedName = await generateSessionName(ctx, config);
		if (!generatedName || localGenerationId !== generationId) return;

		pi.setSessionName(generatedName);
		applyTerminalTitle(ctx, generatedName);
	}

	pi.on("session_start", async (_event, ctx) => {
		try {
			turnsSinceTitleAttempt = 0;
			const config = await readConfig();
			if (!config.enabled) return;

			const currentName = pi.getSessionName();
			applyTerminalTitle(ctx, currentName ?? safeFallbackSessionName(ctx));
			if (currentName) return;

			void refreshTitle(ctx, config).catch((error) => {
				notifyHandlerError(ctx, error);
				const fallback = pi.getSessionName() ?? safeFallbackSessionName(ctx);
				applyTerminalTitle(ctx, fallback);
			});
		} catch (error) {
			notifyHandlerError(ctx, error);
		}
	});

	pi.on("agent_end", async (_event, ctx) => {
		try {
			const config = await readConfig();
			if (!config.enabled) return;

			turnsSinceTitleAttempt += 1;
			const hasSessionName = Boolean(pi.getSessionName());
			const shouldAttemptInitialTitle =
				!hasSessionName && !attemptedInitialTitle;
			const shouldRefreshExistingTitle =
				hasSessionName && turnsSinceTitleAttempt >= config.updateAfterTurns;
			const shouldRetryFailedInitialTitle =
				!hasSessionName &&
				attemptedInitialTitle &&
				turnsSinceTitleAttempt >= config.updateAfterTurns;

			if (
				!shouldAttemptInitialTitle &&
				!shouldRefreshExistingTitle &&
				!shouldRetryFailedInitialTitle
			) {
				const fallback = pi.getSessionName() ?? safeFallbackSessionName(ctx);
				applyTerminalTitle(ctx, fallback);
				return;
			}

			void refreshTitle(ctx, config).catch((error) => {
				notifyHandlerError(ctx, error);
			});
		} catch (error) {
			notifyHandlerError(ctx, error);
		}
	});

	pi.on("session_shutdown", async () => {
		generationId += 1;
	});
}
