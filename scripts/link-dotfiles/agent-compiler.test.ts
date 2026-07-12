import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import {
	compileAgents,
	readMarkdownAgentTemplates,
} from "../../agent-templates/scripts/agent-compiler";
import {
	loadAgentTemplateConfig,
	type AgentTemplateConfig,
} from "../../agent-templates/scripts/agent-registry";

const repoRoot = path.resolve(import.meta.dir, "..", "..");
const templateConfigPath = path.join(
	repoRoot,
	"agent-templates",
	"config.toml",
);
let temporaryDirectories: string[] = [];

type Template = Awaited<ReturnType<typeof readMarkdownAgentTemplates>>[number];

async function createOutputDirectory(): Promise<string> {
	const outputDir = await mkdtemp(
		path.join(os.tmpdir(), "compile-agents-test-"),
	);
	temporaryDirectories.push(outputDir);
	return outputDir;
}

function parseMarkdownAgent(text: string): {
	body: string;
	frontmatter: Record<string, unknown>;
} {
	const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) {
		throw new Error("Missing markdown frontmatter");
	}

	return {
		body: match[2],
		frontmatter: (YAML.parse(match[1]) ?? {}) as Record<string, unknown>,
	};
}

function normalizeNewlines(value: string): string {
	return value.replace(/\r\n/g, "\n").trim();
}

function resolveExpectedModel(
	config: AgentTemplateConfig,
	template: Template,
	provider: keyof AgentTemplateConfig["providers"],
): string {
	const definition = config.providers[provider][template.modelClass];
	if (provider === "copilot" && definition.reasoning) {
		return `${definition.model}(${definition.reasoning})`;
	}

	return definition.model;
}

function expectedMarkdownFrontmatter(
	config: AgentTemplateConfig,
	template: Template,
	provider: "claude" | "copilot" | "opencode",
): Record<string, unknown> {
	const common = Object.fromEntries(
		template.commonFrontmatterKeys.map((key) => [
			key,
			template.commonFrontmatter[key],
		]),
	);
	if (provider === "claude") {
		return {
			name: template.name,
			description: template.description,
			...common,
			model: resolveExpectedModel(config, template, "claude"),
			...template.claude,
		};
	}

	if (provider === "copilot") {
		return {
			name: template.name,
			description: template.description,
			...common,
			model: resolveExpectedModel(config, template, "copilot"),
			...template.copilot,
		};
	}

	return {
		description: template.description,
		mode: "subagent",
		...common,
		model: resolveExpectedModel(config, template, "opencode"),
		...template.opencode,
	};
}

function expectedPiThinking(
	config: AgentTemplateConfig,
	template: Template,
): string {
	if (template.pi.thinking) {
		return template.pi.thinking;
	}

	const reasoning = config.providers.pi[template.modelClass].reasoning;
	if (reasoning) {
		return reasoning;
	}

	if (template.modelClass === "fast") {
		return "low";
	}

	if (template.modelClass === "balanced") {
		return "medium";
	}

	return "high";
}

function commaList(values: string[]): string {
	return values.join(", ");
}

function expectedPiFrontmatter(
	config: AgentTemplateConfig,
	template: Template,
): Record<string, unknown> {
	const frontmatter: Record<string, unknown> = {
		name: template.name,
		description: template.description,
		model: template.pi.model ?? config.providers.pi[template.modelClass].model,
		thinking: expectedPiThinking(config, template),
		systemPromptMode: template.pi.systemPromptMode ?? "replace",
		inheritProjectContext: template.pi.inheritProjectContext ?? true,
		inheritSkills: template.pi.inheritSkills ?? false,
		tools: commaList(
			template.pi.tools ?? [
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
		),
	};

	if (template.pi.defaultContext)
		frontmatter.defaultContext = template.pi.defaultContext;
	if (template.pi.defaultReads)
		frontmatter.defaultReads = commaList(template.pi.defaultReads);
	if (typeof template.pi.defaultProgress === "boolean")
		frontmatter.defaultProgress = template.pi.defaultProgress;
	if (template.pi.output) frontmatter.output = template.pi.output;
	if (template.pi.fallbackModels)
		frontmatter.fallbackModels = commaList(template.pi.fallbackModels);
	if (template.pi.skills) frontmatter.skills = commaList(template.pi.skills);
	if (template.pi.extensions)
		frontmatter.extensions = commaList(template.pi.extensions);
	if (typeof template.pi.maxSubagentDepth === "number")
		frontmatter.maxSubagentDepth = template.pi.maxSubagentDepth;

	return frontmatter;
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseTomlString(text: string, key: string): string | null {
	const match = text.match(
		new RegExp(`^${escapeRegex(key)} = "([\\s\\S]*?)"\\r?$`, "m"),
	);
	return match ? match[1] : null;
}

function parseTomlBoolean(text: string, key: string): boolean | null {
	const match = text.match(
		new RegExp(`^${escapeRegex(key)} = (true|false)\\r?$`, "m"),
	);
	return match ? match[1] === "true" : null;
}

function parseTomlArray(text: string, key: string): string[] | null {
	const match = text.match(
		new RegExp(`^${escapeRegex(key)} = (\\[[^\\r\\n]+\\])\\r?$`, "m"),
	);
	return match ? (JSON.parse(match[1]) as string[]) : null;
}

function parseTomlBody(text: string): string {
	const match = text.match(/developer_instructions = """([\s\S]*?)"""\r?\n?$/);
	if (!match) {
		throw new Error("Missing developer_instructions block");
	}

	return match[1].replace(/^\r?\n/, "").trimEnd();
}

describe("readMarkdownAgentTemplates", () => {
	test("loads standard agent markdown files and skips files without frontmatter", async () => {
		const templates = await readMarkdownAgentTemplates(
			path.join(repoRoot, "agent-templates"),
		);
		const names = templates.map((template) => template.name);

		expect(names).toContain("developer");
		expect(names).toContain("developer-lite");
		expect(names).toContain("developer-heavy");
		expect(names).not.toContain("os2020");
		expect(names).not.toContain("escalation");
	});

	test("resolves extends by inheriting body and merging frontmatter", async () => {
		const templates = await readMarkdownAgentTemplates(
			path.join(repoRoot, "agent-templates"),
		);
		const byName = new Map(templates.map((template) => [template.name, template]));
		const developer = byName.get("developer");
		const lite = byName.get("developer-lite");
		const heavy = byName.get("developer-heavy");
		if (!developer || !lite || !heavy) {
			throw new Error("Missing developer family templates");
		}

		expect(lite.extendsName).toBe("developer");
		expect(lite.modelClass).toBe("balanced");
		expect(heavy.modelClass).toBe("heavy");
		expect(developer.modelClass).toBe("strong");

		// Child overrides win; unset keys inherit from the parent.
		expect(lite.claude).toMatchObject({ color: "yellow", context: "fresh" });
		expect(heavy.claude).toMatchObject({ color: "red", context: "fresh" });
		expect(lite.pi.tools).toEqual(developer.pi.tools);
		expect(lite.pi.model).toBeUndefined();

		// Blank child bodies inherit the parent body verbatim.
		expect(lite.body).toBe(developer.body);
		expect(heavy.body).toBe(developer.body);

		// Identity never inherits.
		expect(lite.description).toContain("simple focused tasks");
	});

	test("expands partial includes into the body", async () => {
		const templates = await readMarkdownAgentTemplates(
			path.join(repoRoot, "agent-templates"),
		);

		for (const template of templates) {
			expect(template.body).not.toContain("{{include:");
			expect(template.body).toContain("Escalate, Don't Guess");
			expect(template.body).toContain("## Status protocol");
		}
	});
});

describe("compileAgents", () => {
	afterEach(async () => {
		await Promise.all(
			temporaryDirectories.map((directory) =>
				rm(directory, { force: true, recursive: true }),
			),
		);
		temporaryDirectories = [];
	});

	test("reproduces claude markdown agents from template schema", async () => {
		const outputDir = await createOutputDirectory();
		const templates = await compileAgents({
			agentsDir: path.join(repoRoot, "agent-templates"),
			configPath: templateConfigPath,
			outputDir,
		});
		const config = await loadAgentTemplateConfig(templateConfigPath);

		for (const template of templates) {
			const compiledPath = path.join(
				outputDir,
				"claude",
				`${template.name}.md`,
			);
			const compiled = parseMarkdownAgent(await readFile(compiledPath, "utf8"));

			expect(compiled.frontmatter).toEqual(
				expectedMarkdownFrontmatter(config, template, "claude"),
			);
			expect(normalizeNewlines(compiled.body)).toBe(
				normalizeNewlines(template.body),
			);
		}
	});

	test("emits copilot agent markdown with reasoning-suffixed model ids", async () => {
		const outputDir = await createOutputDirectory();
		const templates = await compileAgents({
			agentsDir: path.join(repoRoot, "agent-templates"),
			configPath: templateConfigPath,
			outputDir,
		});
		const config = await loadAgentTemplateConfig(templateConfigPath);
		const templateMap = new Map(
			templates.map((template) => [template.name, template]),
		);

		const copilotEntries = await readdir(path.join(outputDir, "copilot"));
		expect(copilotEntries).toContain("planner.md");
		expect(copilotEntries).toContain("developer-lite.md");
		expect(copilotEntries).toContain("developer-heavy.md");
		expect(copilotEntries).not.toContain("os2020.md");

		for (const entry of copilotEntries.filter((name) => name.endsWith(".md"))) {
			const name = path.basename(entry, ".md");
			const template = templateMap.get(name);
			if (!template) {
				throw new Error(`Missing source template for ${name}`);
			}

			const compiled = parseMarkdownAgent(
				await readFile(path.join(outputDir, "copilot", entry), "utf8"),
			);
			expect(compiled.frontmatter).toEqual(
				expectedMarkdownFrontmatter(config, template, "copilot"),
			);
			expect(normalizeNewlines(compiled.body)).toBe(
				normalizeNewlines(template.body),
			);
		}

		const developer = parseMarkdownAgent(
			await readFile(path.join(outputDir, "copilot", "developer.md"), "utf8"),
		);
		expect(developer.frontmatter.model).toBe("gpt-5.6-terra(high)");
	});

	test("emits opencode markdown with provider-prefixed models and subagent mode", async () => {
		const outputDir = await createOutputDirectory();
		const templates = await compileAgents({
			agentsDir: path.join(repoRoot, "agent-templates"),
			configPath: templateConfigPath,
			outputDir,
		});
		const config = await loadAgentTemplateConfig(templateConfigPath);
		const templateMap = new Map(
			templates.map((template) => [template.name, template]),
		);

		const opencodeEntries = await readdir(path.join(outputDir, "opencode"));
		expect(opencodeEntries).toContain("planner.md");
		expect(opencodeEntries).toContain("developer-lite.md");
		expect(opencodeEntries).not.toContain("os2020.md");

		for (const entry of opencodeEntries.filter((name) =>
			name.endsWith(".md"),
		)) {
			const name = path.basename(entry, ".md");
			const template = templateMap.get(name);
			if (!template) {
				throw new Error(`Missing source template for ${name}`);
			}

			const compiled = parseMarkdownAgent(
				await readFile(path.join(outputDir, "opencode", entry), "utf8"),
			);
			expect(compiled.frontmatter).toEqual(
				expectedMarkdownFrontmatter(config, template, "opencode"),
			);
			expect(typeof compiled.frontmatter.model).toBe("string");
			expect(String(compiled.frontmatter.model)).toContain("/");
			expect(String(compiled.frontmatter.model)).not.toContain("(");
			expect(compiled.frontmatter.mode).toBe("subagent");
			if (typeof compiled.frontmatter.tools !== "undefined") {
				expect(typeof compiled.frontmatter.tools).toBe("object");
				expect(Array.isArray(compiled.frontmatter.tools)).toBe(false);
			}
			expect(normalizeNewlines(compiled.body)).toBe(
				normalizeNewlines(template.body),
			);
		}
	});

	test("emits pi markdown agents with flat subagent frontmatter", async () => {
		const outputDir = await createOutputDirectory();
		const templates = await compileAgents({
			agentsDir: path.join(repoRoot, "agent-templates"),
			configPath: templateConfigPath,
			outputDir,
		});
		const config = await loadAgentTemplateConfig(templateConfigPath);
		const templateMap = new Map(
			templates.map((template) => [template.name, template]),
		);

		const piEntries = await readdir(path.join(outputDir, "pi"));
		expect(piEntries).toContain("developer-lite.md");
		expect(piEntries).toContain("planner.md");
		expect(piEntries).not.toContain("os2020.md");

		for (const entry of piEntries.filter((name) => name.endsWith(".md"))) {
			const name = path.basename(entry, ".md");
			const template = templateMap.get(name);
			if (!template) {
				throw new Error(`Missing source template for ${name}`);
			}

			const rawCompiled = await readFile(
				path.join(outputDir, "pi", entry),
				"utf8",
			);
			const compiled = parseMarkdownAgent(rawCompiled);
			expect(compiled.frontmatter).toEqual(
				expectedPiFrontmatter(config, template),
			);
			expect(rawCompiled.split("---", 3)[1]).not.toContain("\n  ");
			expect(normalizeNewlines(compiled.body)).toBe(
				normalizeNewlines(template.body),
			);
		}

		const developerLite = parseMarkdownAgent(
			await readFile(path.join(outputDir, "pi", "developer-lite.md"), "utf8"),
		);
		expect(developerLite.frontmatter.model).toBe("openai-codex/gpt-5.6-luna");
		expect(developerLite.frontmatter.thinking).toBe("xhigh");
	});

	test("emits codex toml for every agent using config defaults with template overrides", async () => {
		const outputDir = await createOutputDirectory();
		const templates = await compileAgents({
			agentsDir: path.join(repoRoot, "agent-templates"),
			configPath: templateConfigPath,
			outputDir,
		});
		const config = await loadAgentTemplateConfig(templateConfigPath);
		const templateMap = new Map(
			templates.map((template) => [template.name, template]),
		);
		const compiledNames = (await readdir(path.join(outputDir, "codex")))
			.filter((entry) => entry.endsWith(".toml"))
			.map((entry) => path.basename(entry, ".toml"))
			.sort();
		const expectedNames = templates.map((template) => template.name).sort();

		expect(compiledNames).toEqual(expectedNames);

		for (const name of compiledNames) {
			const compiled = await readFile(
				path.join(outputDir, "codex", `${name}.toml`),
				"utf8",
			);
			const template = templateMap.get(name);
			if (!template) {
				throw new Error(`Missing source template for ${name}`);
			}

			const codex = template.codex ?? {};
			const definition = config.providers.codex[template.modelClass];

			expect(parseTomlString(compiled, "name")).toBe(template.name);
			expect(parseTomlString(compiled, "description")).toBe(
				codex.description ?? template.description,
			);
			expect(parseTomlString(compiled, "model")).toBe(definition.model);
			expect(parseTomlString(compiled, "model_reasoning_effort")).toBe(
				codex.model_reasoning_effort ?? definition.reasoning ?? null,
			);
			expect(parseTomlString(compiled, "web_search")).toBe(
				codex.web_search ?? config.codexDefaults.web_search ?? null,
			);
			expect(parseTomlString(compiled, "personality")).toBe(
				codex.personality ?? config.codexDefaults.personality ?? null,
			);
			expect(
				parseTomlBoolean(compiled, "suppress_unstable_features_warning"),
			).toBe(
				codex.suppress_unstable_features_warning ??
					config.codexDefaults.suppress_unstable_features_warning ??
					null,
			);
			expect(parseTomlArray(compiled, "tui.status_line")).toEqual(
				codex.tui_status_line ?? config.codexDefaults.tui_status_line ?? null,
			);
			expect(normalizeNewlines(parseTomlBody(compiled))).toBe(
				normalizeNewlines(template.body),
			);
		}

		const plannerToml = await readFile(
			path.join(outputDir, "codex", "planner.toml"),
			"utf8",
		);
		expect(parseTomlString(plannerToml, "model_reasoning_effort")).toBe(
			"xhigh",
		);
		expect(parseTomlString(plannerToml, "model")).toBe("gpt-5.6-terra");
	});
});
