import { readFile } from "node:fs/promises";

export type ProviderName = "claude" | "copilot" | "codex" | "opencode" | "pi";
export type ModelClass = "fast" | "balanced" | "strong" | "heavy";
export type ReasoningEffort = "minimal" | "low" | "medium" | "high" | "xhigh";

export type ProviderModelDefinition = {
	model: string;
	reasoning?: ReasoningEffort;
};

export type CodexDefaults = {
	web_search?: "live" | "off";
	personality?: string;
	suppress_unstable_features_warning?: boolean;
	tui_status_line?: string[];
};

export type AgentTemplateConfig = {
	providers: Record<ProviderName, Record<ModelClass, ProviderModelDefinition>>;
	codexDefaults: CodexDefaults;
};

export const MODEL_CLASSES: ModelClass[] = [
	"fast",
	"balanced",
	"strong",
	"heavy",
];

const REASONING_EFFORTS = new Set<string>([
	"minimal",
	"low",
	"medium",
	"high",
	"xhigh",
]);

function assertProviderModels(
	value: unknown,
	configPath: string,
): Record<string, unknown> {
	if (!value || typeof value !== "object") {
		throw new Error(`Missing providers config in ${configPath}`);
	}

	return value as Record<string, unknown>;
}

function parseModelDefinition(
	value: unknown,
	providerName: string,
	modelClass: ModelClass,
	configPath: string,
): ProviderModelDefinition {
	if (typeof value === "string" && value.length > 0) {
		return { model: value };
	}

	if (value && typeof value === "object" && !Array.isArray(value)) {
		const raw = value as Record<string, unknown>;
		if (typeof raw.default === "string" || typeof raw.economy === "string") {
			throw new Error(
				`providers.${providerName}.${modelClass} uses the removed default/economy profile shape in ${configPath}; use model/reasoning keys`,
			);
		}

		if (typeof raw.model !== "string" || raw.model.length === 0) {
			throw new Error(
				`Missing providers.${providerName}.${modelClass}.model in ${configPath}`,
			);
		}

		if (
			typeof raw.reasoning !== "undefined" &&
			(typeof raw.reasoning !== "string" ||
				!REASONING_EFFORTS.has(raw.reasoning))
		) {
			throw new Error(
				`Invalid providers.${providerName}.${modelClass}.reasoning in ${configPath}`,
			);
		}

		return {
			model: raw.model,
			reasoning: raw.reasoning as ReasoningEffort | undefined,
		};
	}

	throw new Error(
		`Missing providers.${providerName}.${modelClass} in ${configPath}`,
	);
}

function normalizeProviderDefinition(
	providerConfig: Record<string, unknown>,
	providerName: ProviderName,
	configPath: string,
): Record<ModelClass, ProviderModelDefinition> {
	const normalized = {} as Record<ModelClass, ProviderModelDefinition>;

	for (const modelClass of MODEL_CLASSES) {
		normalized[modelClass] = parseModelDefinition(
			providerConfig[modelClass],
			providerName,
			modelClass,
			configPath,
		);
	}

	return normalized;
}

function toOpenCodeModel(modelId: string): string {
	if (modelId.includes("/")) {
		return modelId;
	}

	if (modelId.startsWith("claude-")) {
		return `anthropic/${modelId}`;
	}

	if (
		modelId.startsWith("gpt-") ||
		modelId.startsWith("o1") ||
		modelId.startsWith("o3") ||
		modelId.startsWith("o4")
	) {
		return `openai/${modelId}`;
	}

	return modelId;
}

function deriveOpenCodeProvider(
	copilot: Record<ModelClass, ProviderModelDefinition>,
): Record<ModelClass, ProviderModelDefinition> {
	const derived = {} as Record<ModelClass, ProviderModelDefinition>;

	for (const modelClass of MODEL_CLASSES) {
		// OpenCode has no reasoning-suffix syntax, so only the model id carries over.
		derived[modelClass] = { model: toOpenCodeModel(copilot[modelClass].model) };
	}

	return derived;
}

function normalizeProviderDefinitions(
	providers: Record<string, unknown>,
	configPath: string,
): AgentTemplateConfig["providers"] {
	const requiredProviderNames: Array<Exclude<ProviderName, "opencode">> = [
		"claude",
		"copilot",
		"codex",
		"pi",
	];
	const normalized = {} as AgentTemplateConfig["providers"];

	for (const providerName of requiredProviderNames) {
		const providerConfig = providers[providerName];
		if (!providerConfig || typeof providerConfig !== "object") {
			throw new Error(`Missing provider '${providerName}' in ${configPath}`);
		}

		normalized[providerName] = normalizeProviderDefinition(
			providerConfig as Record<string, unknown>,
			providerName,
			configPath,
		);
	}

	const opencodeConfig = providers.opencode;
	normalized.opencode =
		opencodeConfig && typeof opencodeConfig === "object"
			? normalizeProviderDefinition(
					opencodeConfig as Record<string, unknown>,
					"opencode",
					configPath,
				)
			: deriveOpenCodeProvider(normalized.copilot);

	return normalized;
}

function parseCodexDefaults(value: unknown): CodexDefaults {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}

	const raw = value as Record<string, unknown>;
	return {
		web_search:
			raw.web_search === "live" || raw.web_search === "off"
				? raw.web_search
				: undefined,
		personality:
			typeof raw.personality === "string" ? raw.personality : undefined,
		suppress_unstable_features_warning:
			typeof raw.suppress_unstable_features_warning === "boolean"
				? raw.suppress_unstable_features_warning
				: undefined,
		tui_status_line: Array.isArray(raw.tui_status_line)
			? raw.tui_status_line.filter(
					(item): item is string => typeof item === "string",
				)
			: undefined,
	};
}

export async function loadAgentTemplateConfig(
	configPath: string,
): Promise<AgentTemplateConfig> {
	const raw = await readFile(configPath, "utf8");
	const parsed = Bun.TOML.parse(raw) as Record<string, unknown>;

	return {
		providers: normalizeProviderDefinitions(
			assertProviderModels(parsed.providers, configPath),
			configPath,
		),
		codexDefaults: parseCodexDefaults(parsed.codex),
	};
}
