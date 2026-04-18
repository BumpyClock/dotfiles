import { afterEach, describe, expect, test } from "bun:test";
import { lstat, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureMirrored, loadConfig, pathExists } from "./setup-ai-agents";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(testDirectory, "..", "ai-agent-links.json");
let temporaryDirectories: string[] = [];

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "setup-ai-agents-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

describe("ai-agent-links config", () => {
  afterEach(async () => {
    await Promise.all(temporaryDirectories.map((directory) => rm(directory, { force: true, recursive: true })));
    temporaryDirectories = [];
  });

  test("links tools.md into top-level agent home directories", async () => {
    const config = await loadConfig(configPath);

    expect(config.sources.tools_reference).toBe("tools.md");
    expect(
      config.targets
        .filter((target) => target.source === "tools_reference")
        .map((target) => ({ optional: target.optional ?? false, path: target.path })),
    ).toEqual([
      { optional: false, path: "~/.claude/tools.md" },
      { optional: false, path: "~/.codex/tools.md" },
      { optional: false, path: "~/.config/opencode/tools.md" },
      { optional: false, path: "~/.copilot/tools.md" },
      { optional: true, path: "~/.ai_agents/tools.md" },
    ]);
  });

  test("links generated agent directories per provider", async () => {
    const config = await loadConfig(configPath);

    expect(config.sources.claude_agents).toBe("agent-templates/dist/claude");
    expect(config.sources.copilot_agents).toBe("agent-templates/dist/copilot");
    expect(config.sources.codex_agents).toBe("agent-templates/dist/codex");
    expect(config.sources.opencode_agents).toBe("agent-templates/dist/opencode");
    expect(
      config.targets
        .filter((target) => target.path.endsWith("/agents"))
        .map((target) => ({ mode: target.mode ?? "link", path: target.path, source: target.source })),
    ).toEqual([
      { mode: "mirror", path: "~/.claude/agents", source: "claude_agents" },
      { mode: "mirror", path: "~/.codex/agents", source: "codex_agents" },
      { mode: "mirror", path: "~/.config/opencode/agents", source: "opencode_agents" },
      { mode: "mirror", path: "~/.copilot/agents", source: "copilot_agents" },
    ]);
  });

  test("mirrors generated agent directories by replacing stale files", async () => {
    const root = await createTemporaryDirectory();
    const sourcePath = path.join(root, "source");
    const targetPath = path.join(root, "target");

    await mkdir(path.join(sourcePath, "nested"), { recursive: true });
    await writeFile(path.join(sourcePath, "architect.md"), "architect-v1");
    await writeFile(path.join(sourcePath, "nested", "developer.md"), "developer-v1");

    await mkdir(targetPath, { recursive: true });
    await writeFile(path.join(targetPath, "stale.md"), "stale");

    await ensureMirrored(sourcePath, targetPath);

    expect((await readdir(targetPath)).sort()).toEqual(["architect.md", "nested"]);
    expect(await readFile(path.join(targetPath, "architect.md"), "utf8")).toBe("architect-v1");
    expect(await readFile(path.join(targetPath, "nested", "developer.md"), "utf8")).toBe("developer-v1");
    expect(await pathExists(path.join(targetPath, "stale.md"))).toBe(false);
    expect((await lstat(targetPath)).isSymbolicLink()).toBe(false);

    await rm(path.join(sourcePath, "nested"), { force: true, recursive: true });
    await writeFile(path.join(sourcePath, "architect.md"), "architect-v2");
    await writeFile(path.join(sourcePath, "reviewer.md"), "reviewer-v1");

    await ensureMirrored(sourcePath, targetPath);

    expect((await readdir(targetPath)).sort()).toEqual(["architect.md", "reviewer.md"]);
    expect(await readFile(path.join(targetPath, "architect.md"), "utf8")).toBe("architect-v2");
    expect(await readFile(path.join(targetPath, "reviewer.md"), "utf8")).toBe("reviewer-v1");
    expect(await pathExists(path.join(targetPath, "nested"))).toBe(false);
  });

  test("force replace refreshes mirrored directories even when contents already match", async () => {
    const root = await createTemporaryDirectory();
    const sourcePath = path.join(root, "source");
    const targetPath = path.join(root, "target");

    await mkdir(sourcePath, { recursive: true });
    await writeFile(path.join(sourcePath, "architect.md"), "architect-v1");

    await ensureMirrored(sourcePath, targetPath);
    const beforeStat = await lstat(targetPath);

    await ensureMirrored(sourcePath, targetPath, { replaceExisting: true });
    const afterStat = await lstat(targetPath);

    expect(await readFile(path.join(targetPath, "architect.md"), "utf8")).toBe("architect-v1");
    expect(afterStat.ino).not.toBe(beforeStat.ino);
    expect((await readdir(root)).filter((entry) => entry.startsWith("target.backup."))).toEqual([]);
  });
});
