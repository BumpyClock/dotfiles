import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { installedToolFileName, listInstallableTools } from "./install-tools";

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

  test("discovers shebang scripts and selects an install mode by file type", async () => {
    const dotfilesDir = await createDotfilesFixture();
    const toolsDir = path.join(dotfilesDir, "tools");
    await mkdir(toolsDir, { recursive: true });

    await writeFile(path.join(toolsDir, "docs-list.ts"), "#!/usr/bin/env bun\nconsole.log('docs')\n");
    await writeFile(path.join(toolsDir, "committer.ts"), "#!/usr/bin/env bun\nconsole.log('commit')\n");
    await writeFile(path.join(toolsDir, "pr-comments.ts"), "#!/usr/bin/env bun\nconsole.log('comments')\n");
    await writeFile(path.join(toolsDir, "shazam-song"), "#!/usr/bin/env -S uv run --script\nprint('song')\n");
    await writeFile(path.join(toolsDir, "trash.ts"), "#!/usr/bin/env bun\nconsole.log('trash')\n");
    await writeFile(path.join(toolsDir, "tools.md"), "# tools\n");

    const tools = await listInstallableTools(dotfilesDir);

    expect(tools).toEqual([
      {
        mode: "compile",
        name: "committer",
        sourcePath: path.join(toolsDir, "committer.ts"),
        targetPath: path.join(os.homedir(), ".local", "bin", installedToolFileName("committer")),
      },
      {
        mode: "compile",
        name: "docs-list",
        sourcePath: path.join(toolsDir, "docs-list.ts"),
        targetPath: path.join(os.homedir(), ".local", "bin", installedToolFileName("docs-list")),
      },
      {
        mode: "compile",
        name: "pr-comments",
        sourcePath: path.join(toolsDir, "pr-comments.ts"),
        targetPath: path.join(os.homedir(), ".local", "bin", installedToolFileName("pr-comments")),
      },
      {
        mode: "link",
        name: "shazam-song",
        sourcePath: path.join(toolsDir, "shazam-song"),
        targetPath: path.join(os.homedir(), ".local", "bin", "shazam-song"),
      },
      {
        mode: "compile",
        name: "trash",
        sourcePath: path.join(toolsDir, "trash.ts"),
        targetPath: path.join(os.homedir(), ".local", "bin", installedToolFileName("trash")),
      },
    ]);
  });

});

describe("installedToolFileName", () => {
  test("adds exe suffix on windows only", () => {
    expect(installedToolFileName("docs-list", "darwin")).toBe("docs-list");
    expect(installedToolFileName("docs-list", "win32")).toBe("docs-list.exe");
  });
});
