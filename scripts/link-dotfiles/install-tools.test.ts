import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { installedToolFileName, isToolSupportedOnPlatform, listInstallableTools } from "./install-tools";

let temporaryDirectories: string[] = [];

async function createDotfilesFixture(): Promise<string> {
  const dotfilesDir = await mkdtemp(path.join(os.tmpdir(), "link-tools-test-"));
  temporaryDirectories.push(dotfilesDir);
  return dotfilesDir;
}

describe("listInstallableTools", () => {
  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.map((directory) => rm(directory, { force: true, recursive: true })),
    );
    temporaryDirectories = [];
  });

  test("includes shebang CLI scripts and skips internal files", async () => {
    const dotfilesDir = await createDotfilesFixture();
    const toolsDir = path.join(dotfilesDir, "tools");
    await mkdir(toolsDir, { recursive: true });

    await writeFile(path.join(toolsDir, "docs-list.ts"), "#!/usr/bin/env bun\nconsole.log('docs')\n");
    await writeFile(path.join(toolsDir, "committer.ts"), "#!/usr/bin/env bun\nconsole.log('commit')\n");
    await writeFile(path.join(toolsDir, "shazam-song"), "#!/usr/bin/env -S uv run --script\nprint('song')\n");
    await writeFile(path.join(toolsDir, "trash.ts"), "export const nothing = true;\n");
    await writeFile(path.join(toolsDir, "tools.md"), "# tools\n");

    const tools = await listInstallableTools(dotfilesDir);

    expect(
      tools.map((tool) => ({
        mode: tool.mode,
        name: tool.name,
        targetName: path.basename(tool.targetPath),
      })),
    ).toEqual([
      { mode: "compile", name: "committer", targetName: installedToolFileName("committer") },
      { mode: "compile", name: "docs-list", targetName: installedToolFileName("docs-list") },
      { mode: "link", name: "shazam-song", targetName: "shazam-song" },
    ]);
  });
});

describe("installedToolFileName", () => {
  test("adds exe suffix on windows only", () => {
    expect(installedToolFileName("docs-list", "darwin")).toBe("docs-list");
    expect(installedToolFileName("docs-list", "win32")).toBe("docs-list.exe");
  });
});

describe("isToolSupportedOnPlatform", () => {
  test("skips browser-tools outside darwin", () => {
    expect(isToolSupportedOnPlatform("browser-tools", "darwin")).toBe(true);
    expect(isToolSupportedOnPlatform("browser-tools", "win32")).toBe(false);
    expect(isToolSupportedOnPlatform("docs-list", "win32")).toBe(true);
  });
});
