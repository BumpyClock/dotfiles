import { describe, expect, test } from "bun:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./setup-ai-agents";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(testDirectory, "..", "ai-agent-links.json");

describe("ai-agent-links config", () => {
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
});
