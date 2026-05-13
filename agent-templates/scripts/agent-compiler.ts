import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import {
	loadAgentTemplateConfig,
	type AgentTemplateConfig,
	type ModelClass,
	type ModelProfile,
} from "./agent-registry";

export type CodexSettings = {
	description?: string;
	model_reasoning_effort?: "low" | "medium" | "high" | "xhigh";
	web_search?: "live" | "off";
	personality?: string;
	suppress_unstable_features_warning?: boolean;
	tui_status_line?: string[];
};

export type PiSettings = {
	defaultContext?: "fresh" | "fork";
	defaultProgress?: boolean;
	defaultReads?: string[];
	extensions?: string[];
	fallbackModels?: string[];
	inheritProjectContext?: boolean;
	inheritSkills?: boolean;
	maxSubagentDepth?: number;
	model?: string;
	output?: string;
	skills?: string[];
	systemPromptMode?: "append" | "replace";
	thinking?: "off" | "minimal" | "low" | "medium" | "high" | "xhigh";
	tools?: string[];
};

export type MarkdownAgentTemplate = {
	body: string;
	claude: Record<string, unknown>;
	codex?: CodexSettings;
	commonFrontmatter: Record<string, unknown>;
	commonFrontmatterKeys: string[];
	copilot: Record<string, unknown>;
	description: string;
	fileName: string;
	modelClass: ModelClass;
	modelProfile?: ModelProfile;
	name: string;
	opencode: Record<string, unknown>;
	pi: PiSettings;
	rawSource: string;
	sourcePath: string;
};

type ParsedFrontmatter = {
	body: string;
	frontmatter: Record<string, unknown>;
};

const RESERVED_KEYS = new Set([
	"name",
	"description",
	"model_class",
	"model_profile",
	"claude",
	"copilot",
	"codex",
	"opencode",
	"pi",
]);

function parseFrontmatter(
	rawSource: string,
	sourcePath: string,
): ParsedFrontmatter | null {
	const match = rawSource.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) {
		return null;
	}

	const [, frontmatterBlock, body] = match;
	const parsed = YAML.parse(frontmatterBlock);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error(`Frontmatter must be a YAML object in ${sourcePath}`);
	}

	return {
		body,
		frontmatter: parsed as Record<string, unknown>,
	};
}

function asRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}

	return { ...(value as Record<string, unknown>) };
}

function assertString(
	value: unknown,
	fieldName: string,
	sourcePath: string,
): string {
	if (typeof value === "string" && value.length > 0) {
		return value;
	}

	throw new Error(`Missing or invalid ${fieldName} in ${sourcePath}`);
}

function assertModelClass(value: unknown, sourcePath: string): ModelClass {
	if (value === "fast" || value === "balanced" || value === "strong") {
		return value;
	}

	throw new Error(`Unsupported or missing model_class in ${sourcePath}`);
}

function parseModelProfile(
	value: unknown,
	sourcePath: string,
): ModelProfile | undefined {
	if (typeof value === "undefined") {
		return undefined;
	}

	if (value === "economy") {
		return value;
	}

	throw new Error(
		`Unsupported model_profile '${String(value)}' in ${sourcePath}`,
	);
}

function parseCodexSettings(
	value: unknown,
	sourcePath: string,
): CodexSettings | undefined {
	if (typeof value === "undefined") {
		return undefined;
	}

	const raw = asRecord(value);
	if (Object.keys(raw).length === 0) {
		throw new Error(`codex block must be an object in ${sourcePath}`);
	}

	return {
		description:
			typeof raw.description === "string" ? raw.description : undefined,
		model_reasoning_effort:
			raw.model_reasoning_effort === "low" ||
			raw.model_reasoning_effort === "medium" ||
			raw.model_reasoning_effort === "high" ||
			raw.model_reasoning_effort === "xhigh"
				? raw.model_reasoning_effort
				: undefined,
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

function parseStringList(
	value: unknown,
	fieldName: string,
	sourcePath: string,
): string[] | undefined {
	if (typeof value === "undefined") {
		return undefined;
	}

	if (typeof value === "string") {
		return value
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean);
	}

	if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
		return value;
	}

	throw new Error(
		`pi.${fieldName} must be a comma-separated string or string array in ${sourcePath}`,
	);
}

function parsePiSettings(value: unknown, sourcePath: string): PiSettings {
	if (typeof value === "undefined" || value === null) {
		return {};
	}

	const raw = asRecord(value);
	if (Object.keys(raw).length === 0) {
		return {};
	}

	return {
		defaultContext:
			raw.defaultContext === "fresh" || raw.defaultContext === "fork"
				? raw.defaultContext
				: undefined,
		defaultProgress:
			typeof raw.defaultProgress === "boolean"
				? raw.defaultProgress
				: undefined,
		defaultReads: parseStringList(raw.defaultReads, "defaultReads", sourcePath),
		extensions: parseStringList(raw.extensions, "extensions", sourcePath),
		fallbackModels: parseStringList(
			raw.fallbackModels,
			"fallbackModels",
			sourcePath,
		),
		inheritProjectContext:
			typeof raw.inheritProjectContext === "boolean"
				? raw.inheritProjectContext
				: undefined,
		inheritSkills:
			typeof raw.inheritSkills === "boolean" ? raw.inheritSkills : undefined,
		maxSubagentDepth:
			typeof raw.maxSubagentDepth === "number"
				? raw.maxSubagentDepth
				: undefined,
		model: typeof raw.model === "string" ? raw.model : undefined,
		output: typeof raw.output === "string" ? raw.output : undefined,
		skills: parseStringList(raw.skills ?? raw.skill, "skills", sourcePath),
		systemPromptMode:
			raw.systemPromptMode === "append" || raw.systemPromptMode === "replace"
				? raw.systemPromptMode
				: undefined,
		thinking:
			raw.thinking === "off" ||
			raw.thinking === "minimal" ||
			raw.thinking === "low" ||
			raw.thinking === "medium" ||
			raw.thinking === "high" ||
			raw.thinking === "xhigh"
				? raw.thinking
				: undefined,
		tools: parseStringList(raw.tools, "tools", sourcePath),
	};
}

function renderYamlFrontmatter(frontmatter: Record<string, unknown>): string {
	return `---\n${YAML.stringify(frontmatter, { lineWidth: 0 }).trimEnd()}\n---\n`;
}

export async function readMarkdownAgentTemplates(
	agentsDir: string,
): Promise<MarkdownAgentTemplate[]> {
	const entries = await readdir(agentsDir, { withFileTypes: true });
	const templates: MarkdownAgentTemplate[] = [];

	for (const entry of entries.sort((left, right) =>
		left.name.localeCompare(right.name),
	)) {
		if (!entry.isFile() || path.extname(entry.name) !== ".md") {
			continue;
		}

		const sourcePath = path.join(agentsDir, entry.name);
		const rawSource = await readFile(sourcePath, "utf8");
		const parsed = parseFrontmatter(rawSource, sourcePath);
		if (!parsed) {
			continue;
		}

		const fileName = path.basename(entry.name, ".md");
		const name = assertString(parsed.frontmatter.name, "name", sourcePath);
		if (fileName !== name) {
			throw new Error(
				`Filename '${fileName}' must match agent name '${name}' in ${sourcePath}`,
			);
		}

		const commonFrontmatterKeys = Object.keys(parsed.frontmatter).filter(
			(key) => !RESERVED_KEYS.has(key),
		);
		const commonFrontmatter = Object.fromEntries(
			commonFrontmatterKeys.map((key) => [key, parsed.frontmatter[key]]),
		);

		templates.push({
			body: parsed.body,
			claude: asRecord(parsed.frontmatter.claude),
			codex: parseCodexSettings(parsed.frontmatter.codex, sourcePath),
			commonFrontmatter,
			commonFrontmatterKeys,
			copilot: asRecord(parsed.frontmatter.copilot),
			description: assertString(
				parsed.frontmatter.description,
				"description",
				sourcePath,
			),
			fileName,
			modelClass: assertModelClass(parsed.frontmatter.model_class, sourcePath),
			modelProfile: parseModelProfile(
				parsed.frontmatter.model_profile,
				sourcePath,
			),
			name,
			opencode: asRecord(parsed.frontmatter.opencode),
			pi: parsePiSettings(parsed.frontmatter.pi, sourcePath),
			rawSource,
			sourcePath,
		});
	}

	return templates;
}

function resolveProviderModel(
	agent: MarkdownAgentTemplate,
	provider: keyof AgentTemplateConfig["providers"],
	config: AgentTemplateConfig,
): string {
	const mapping = config.providers[provider][agent.modelClass];
	return (
		(agent.modelProfile ? mapping.profiles?.[agent.modelProfile] : undefined) ??
		mapping.default
	);
}

function renderMarkdownAgent(
	agent: MarkdownAgentTemplate,
	provider: "claude" | "copilot" | "opencode",
	config: AgentTemplateConfig,
): string {
	const frontmatter: Record<string, unknown> =
		provider === "opencode"
			? {
					description: agent.description,
					mode: "subagent",
				}
			: {
					name: agent.name,
					description: agent.description,
				};

	for (const key of agent.commonFrontmatterKeys) {
		frontmatter[key] = agent.commonFrontmatter[key];
	}

	frontmatter.model = resolveProviderModel(agent, provider, config);

	const providerSettings =
		provider === "claude"
			? agent.claude
			: provider === "copilot"
				? agent.copilot
				: // OpenCode has its own frontmatter schema, so Copilot-only keys must stay out.
					agent.opencode;

	for (const [key, value] of Object.entries(providerSettings)) {
		frontmatter[key] = value;
	}

	const body =
		agent.body.startsWith("\n") || agent.body.startsWith("\r\n")
			? agent.body
			: `\n${agent.body}`;
	return `${renderYamlFrontmatter(frontmatter)}${body}`;
}

function defaultPiThinking(modelClass: ModelClass): PiSettings["thinking"] {
	if (modelClass === "fast") {
		return "low";
	}

	if (modelClass === "balanced") {
		return "medium";
	}

	return "high";
}

function serializePiValue(value: string | boolean | number | string[]): string {
	if (Array.isArray(value)) {
		return value.join(", ");
	}

	return String(value);
}

function renderPiFrontmatter(
	frontmatter: Record<string, string | boolean | number | string[] | undefined>,
): string {
	const lines = ["---"];
	for (const [key, value] of Object.entries(frontmatter)) {
		if (typeof value === "undefined") {
			continue;
		}

		lines.push(`${key}: ${serializePiValue(value)}`);
	}
	lines.push("---");
	return `${lines.join("\n")}\n`;
}

function renderPiMarkdown(
	agent: MarkdownAgentTemplate,
	config: AgentTemplateConfig,
): string {
	const frontmatter = {
		name: agent.name,
		description: agent.description,
		model: agent.pi.model ?? resolveProviderModel(agent, "pi", config),
		thinking: agent.pi.thinking ?? defaultPiThinking(agent.modelClass),
		systemPromptMode: agent.pi.systemPromptMode ?? "replace",
		inheritProjectContext: agent.pi.inheritProjectContext ?? true,
		inheritSkills: agent.pi.inheritSkills ?? false,
		tools: agent.pi.tools ?? [
			"read",
			"grep",
			"find",
			"ls",
			"bash",
			"edit",
			"write",
			"web_search",
			"fetch_content",
			"get_search_content",
			"intercom",
			"contact_supervisor",
		],
		defaultContext: agent.pi.defaultContext,
		defaultReads: agent.pi.defaultReads,
		defaultProgress: agent.pi.defaultProgress,
		output: agent.pi.output,
		fallbackModels: agent.pi.fallbackModels,
		skills: agent.pi.skills,
		extensions: agent.pi.extensions,
		maxSubagentDepth: agent.pi.maxSubagentDepth,
	};

	const body =
		agent.body.startsWith("\n") || agent.body.startsWith("\r\n")
			? agent.body
			: `\n${agent.body}`;
	return `${renderPiFrontmatter(frontmatter)}${body}`;
}

function appendOptionalTomlLine(
	lines: string[],
	key: string,
	value: string | undefined,
): void {
	if (value) {
		lines.push(`${key} = "${value}"`);
	}
}

function appendOptionalTomlBoolean(
	lines: string[],
	key: string,
	value: boolean | undefined,
): void {
	if (typeof value === "boolean") {
		lines.push(`${key} = ${value ? "true" : "false"}`);
	}
}

function appendOptionalTomlArray(
	lines: string[],
	key: string,
	value: string[] | undefined,
): void {
	if (!value || value.length === 0) {
		return;
	}

	const serialized = value.map((item) => `"${item}"`).join(", ");
	lines.push(`${key} = [${serialized}]`);
}

function escapeTomlMultiline(value: string): string {
	return value.replaceAll('"""', '\\"""');
}

function renderCodexToml(
	agent: MarkdownAgentTemplate,
	config: AgentTemplateConfig,
): string | null {
	if (!agent.codex) {
		return null;
	}

	const lines: string[] = [
		`name = "${agent.name}"`,
		`description = "${agent.codex.description ?? agent.description}"`,
		"",
		`model = "${resolveProviderModel(agent, "codex", config)}"`,
	];

	appendOptionalTomlLine(
		lines,
		"model_reasoning_effort",
		agent.codex.model_reasoning_effort,
	);
	appendOptionalTomlLine(lines, "web_search", agent.codex.web_search);
	appendOptionalTomlLine(lines, "personality", agent.codex.personality);
	appendOptionalTomlBoolean(
		lines,
		"suppress_unstable_features_warning",
		agent.codex.suppress_unstable_features_warning,
	);
	appendOptionalTomlArray(
		lines,
		"tui.status_line",
		agent.codex.tui_status_line,
	);
	lines.push("");
	lines.push('developer_instructions = """');
	lines.push(escapeTomlMultiline(agent.body.trimEnd()));
	lines.push('"""');

	return `${lines.join("\n")}\n`;
}

async function ensureCleanDirectory(directoryPath: string): Promise<void> {
	await rm(directoryPath, { recursive: true, force: true });
	await mkdir(directoryPath, { recursive: true });
}

export async function compileAgents(opts: {
	agentsDir: string;
	configPath: string;
	outputDir: string;
}): Promise<MarkdownAgentTemplate[]> {
	const [templates, config] = await Promise.all([
		readMarkdownAgentTemplates(opts.agentsDir),
		loadAgentTemplateConfig(opts.configPath),
	]);

	const claudeDir = path.join(opts.outputDir, "claude");
	const copilotDir = path.join(opts.outputDir, "copilot");
	const codexDir = path.join(opts.outputDir, "codex");
	const opencodeDir = path.join(opts.outputDir, "opencode");
	const piDir = path.join(opts.outputDir, "pi");

	await Promise.all([
		ensureCleanDirectory(claudeDir),
		ensureCleanDirectory(copilotDir),
		ensureCleanDirectory(codexDir),
		ensureCleanDirectory(opencodeDir),
		ensureCleanDirectory(piDir),
	]);

	for (const agent of templates) {
		await writeFile(
			path.join(claudeDir, `${agent.fileName}.md`),
			renderMarkdownAgent(agent, "claude", config),
		);
		await writeFile(
			path.join(copilotDir, `${agent.fileName}.md`),
			renderMarkdownAgent(agent, "copilot", config),
		);
		await writeFile(
			path.join(opencodeDir, `${agent.fileName}.md`),
			renderMarkdownAgent(agent, "opencode", config),
		);
		await writeFile(
			path.join(piDir, `${agent.fileName}.md`),
			renderPiMarkdown(agent, config),
		);

		const codexToml = renderCodexToml(agent, config);
		if (codexToml) {
			await writeFile(path.join(codexDir, `${agent.fileName}.toml`), codexToml);
		}
	}

	return templates;
}
