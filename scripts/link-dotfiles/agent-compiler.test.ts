import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import { compileAgents, readMarkdownAgentTemplates } from "../../agent-templates/scripts/agent-compiler";
import { loadAgentTemplateConfig, type AgentTemplateConfig } from "../../agent-templates/scripts/agent-registry";

const repoRoot = path.resolve(import.meta.dir, "..", "..");
const templateConfigPath = path.join(repoRoot, "agent-templates", "config.toml");
let temporaryDirectories: string[] = [];

async function createOutputDirectory(): Promise<string> {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "compile-agents-test-"));
  temporaryDirectories.push(outputDir);
  return outputDir;
}

function stripFrontmatter(rawSource: string): string {
  return rawSource.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

function parseMarkdownAgent(text: string): { body: string; frontmatter: Record<string, unknown> } {
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
  return value.replace(/\r\n/g, "\n");
}

function resolveExpectedModel(
  config: AgentTemplateConfig,
  template: Awaited<ReturnType<typeof readMarkdownAgentTemplates>>[number],
  provider: keyof AgentTemplateConfig["providers"],
): string {
  const mapping = config.providers[provider][template.modelClass];
  return (template.modelProfile ? mapping.profiles?.[template.modelProfile] : undefined) ?? mapping.default;
}

function expectedMarkdownFrontmatter(
  config: AgentTemplateConfig,
  template: Awaited<ReturnType<typeof readMarkdownAgentTemplates>>[number],
  provider: "claude" | "copilot" | "opencode",
): Record<string, unknown> {
  const common = Object.fromEntries(template.commonFrontmatterKeys.map((key) => [key, template.commonFrontmatter[key]]));
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

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseTomlString(text: string, key: string): string | null {
  const match = text.match(new RegExp(`^${escapeRegex(key)} = "([\\s\\S]*?)"\\r?$`, "m"));
  return match ? match[1] : null;
}

function parseTomlBoolean(text: string, key: string): boolean | null {
  const match = text.match(new RegExp(`^${escapeRegex(key)} = (true|false)\\r?$`, "m"));
  return match ? match[1] === "true" : null;
}

function parseTomlArray(text: string, key: string): string[] | null {
  const match = text.match(new RegExp(`^${escapeRegex(key)} = (\\[[^\\r\\n]+\\])\\r?$`, "m"));
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
    const templates = await readMarkdownAgentTemplates(path.join(repoRoot, "agent-templates"));

    expect(templates.map((template) => template.name)).toContain("developer-lite");
    expect(templates.map((template) => template.name)).not.toContain("os2020");
    expect(templates.find((template) => template.name === "developer-lite")).toMatchObject({
      claude: {
        color: "yellow",
      },
      codex: {
        description: "Lite developer agent for coding and debugging simpler tasks",
      },
      modelClass: "balanced",
      modelProfile: "economy",
    });
  });
});

describe("compileAgents", () => {
  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.map((directory) => rm(directory, { force: true, recursive: true })),
    );
    temporaryDirectories = [];
  });

  test("reproduces archived claude markdown agents from template schema", async () => {
    const outputDir = await createOutputDirectory();
    const templates = await compileAgents({
      agentsDir: path.join(repoRoot, "agent-templates"),
      configPath: templateConfigPath,
      outputDir,
    });
    const config = await loadAgentTemplateConfig(templateConfigPath);

    for (const template of templates) {
      const compiledPath = path.join(outputDir, "claude", `${template.name}.md`);
      const compiled = parseMarkdownAgent(await readFile(compiledPath, "utf8"));

      expect(compiled.frontmatter).toEqual(expectedMarkdownFrontmatter(config, template, "claude"));
      expect(normalizeNewlines(compiled.body)).toBe(normalizeNewlines(stripFrontmatter(template.rawSource)));
    }
  });

  test("emits copilot agent markdown with provider-specific model ids", async () => {
    const outputDir = await createOutputDirectory();
    const templates = await compileAgents({
      agentsDir: path.join(repoRoot, "agent-templates"),
      configPath: templateConfigPath,
      outputDir,
    });
    const config = await loadAgentTemplateConfig(templateConfigPath);
    const templateMap = new Map(templates.map((template) => [template.name, template]));

    const copilotEntries = await readdir(path.join(outputDir, "copilot"));
    expect(copilotEntries).toContain("architect.md");
    expect(copilotEntries).toContain("developer-lite.md");
    expect(copilotEntries).not.toContain("os2020.md");

    for (const entry of copilotEntries.filter((name) => name.endsWith(".md"))) {
      const name = path.basename(entry, ".md");
      const template = templateMap.get(name);
      if (!template) {
        throw new Error(`Missing source template for ${name}`);
      }

      const compiled = parseMarkdownAgent(await readFile(path.join(outputDir, "copilot", entry), "utf8"));
      expect(compiled.frontmatter).toEqual(expectedMarkdownFrontmatter(config, template, "copilot"));
      expect(normalizeNewlines(compiled.body)).toBe(normalizeNewlines(stripFrontmatter(template.rawSource)));
    }
  });

  test("emits opencode markdown with provider-prefixed models and subagent mode", async () => {
    const outputDir = await createOutputDirectory();
    const templates = await compileAgents({
      agentsDir: path.join(repoRoot, "agent-templates"),
      configPath: templateConfigPath,
      outputDir,
    });
    const config = await loadAgentTemplateConfig(templateConfigPath);
    const templateMap = new Map(templates.map((template) => [template.name, template]));

    const opencodeEntries = await readdir(path.join(outputDir, "opencode"));
    expect(opencodeEntries).toContain("architect.md");
    expect(opencodeEntries).toContain("developer-lite.md");
    expect(opencodeEntries).not.toContain("os2020.md");

    for (const entry of opencodeEntries.filter((name) => name.endsWith(".md"))) {
      const name = path.basename(entry, ".md");
      const template = templateMap.get(name);
      if (!template) {
        throw new Error(`Missing source template for ${name}`);
      }

      const compiled = parseMarkdownAgent(await readFile(path.join(outputDir, "opencode", entry), "utf8"));
      expect(compiled.frontmatter).toEqual(expectedMarkdownFrontmatter(config, template, "opencode"));
      expect(typeof compiled.frontmatter.model).toBe("string");
      expect(String(compiled.frontmatter.model)).toContain("/");
      expect(compiled.frontmatter.mode).toBe("subagent");
      if (typeof compiled.frontmatter.tools !== "undefined") {
        expect(typeof compiled.frontmatter.tools).toBe("object");
        expect(Array.isArray(compiled.frontmatter.tools)).toBe(false);
      }
      expect(normalizeNewlines(compiled.body)).toBe(normalizeNewlines(stripFrontmatter(template.rawSource)));
    }
  });

  test("emits codex files from template metadata and shared markdown prompt bodies", async () => {
    const outputDir = await createOutputDirectory();
    const templates = await compileAgents({
      agentsDir: path.join(repoRoot, "agent-templates"),
      configPath: templateConfigPath,
      outputDir,
    });
    const config = await loadAgentTemplateConfig(templateConfigPath);
    const templateMap = new Map(templates.map((template) => [template.name, template]));
    const compiledNames = (await readdir(path.join(outputDir, "codex")))
      .filter((entry) => entry.endsWith(".toml"))
      .map((entry) => path.basename(entry, ".toml"))
      .sort();
    const expectedNames = templates
      .filter((template) => template.codex)
      .map((template) => template.name)
      .sort();

    expect(compiledNames).toEqual(expectedNames);

    for (const name of compiledNames) {
      const compiled = await readFile(path.join(outputDir, "codex", `${name}.toml`), "utf8");
      const template = templateMap.get(name);
      if (!template || !template.codex) {
        throw new Error(`Missing source template for ${name}`);
      }

      expect(parseTomlString(compiled, "name")).toBe(template.name);
      expect(parseTomlString(compiled, "description")).toBe(template.codex.description ?? template.description);
      expect(parseTomlString(compiled, "model")).toBe(resolveExpectedModel(config, template, "codex"));
      expect(parseTomlString(compiled, "model_reasoning_effort")).toBe(template.codex.model_reasoning_effort ?? null);
      expect(parseTomlString(compiled, "web_search")).toBe(template.codex.web_search ?? null);
      expect(parseTomlString(compiled, "personality")).toBe(template.codex.personality ?? null);
      expect(parseTomlBoolean(compiled, "suppress_unstable_features_warning")).toBe(
        template.codex.suppress_unstable_features_warning ?? null,
      );
      expect(parseTomlArray(compiled, "tui.status_line")).toEqual(template.codex.tui_status_line ?? null);
      expect(parseTomlBody(compiled)).toBe(stripFrontmatter(template.rawSource).trimEnd());
    }
  });
});
