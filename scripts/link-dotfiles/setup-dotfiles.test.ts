import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  flattenEnvironmentConfig,
  loadManagedEnvironment,
  renderPowerShellEnvironmentScript,
  renderShellEnvironmentScript,
} from "./setup-dotfiles";

let temporaryDirectories: string[] = [];

async function createDotfilesFixture(): Promise<string> {
  const dotfilesDir = await mkdtemp(path.join(os.tmpdir(), "setup-dotfiles-test-"));
  temporaryDirectories.push(dotfilesDir);
  return dotfilesDir;
}

describe("flattenEnvironmentConfig", () => {
  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.map((directory) => rm(directory, { force: true, recursive: true })),
    );
    temporaryDirectories = [];
  });

  test("flattens grouped and root environment variables", () => {
    expect(
      flattenEnvironmentConfig({
        tools: {
          GEMINI_API_KEY: "gemini-key",
          BRAVE_API_KEY: "brave-key",
        },
        OPENAI_API_KEY: "openai-key",
      }),
    ).toEqual({
      BRAVE_API_KEY: "brave-key",
      GEMINI_API_KEY: "gemini-key",
      OPENAI_API_KEY: "openai-key",
    });
  });

  test("rejects duplicate environment variable names", () => {
    expect(() =>
      flattenEnvironmentConfig({
        first: { GEMINI_API_KEY: "first-key" },
        second: { GEMINI_API_KEY: "second-key" },
      }),
    ).toThrow("Duplicate environment variable 'GEMINI_API_KEY'");
  });
});

describe("loadManagedEnvironment", () => {
  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.map((directory) => rm(directory, { force: true, recursive: true })),
    );
    temporaryDirectories = [];
  });

  test("loads secrets/api-keys/env.json from the dotfiles repo", async () => {
    const dotfilesDir = await createDotfilesFixture();
    const secretsDir = path.join(dotfilesDir, "secrets", "api-keys");
    await mkdir(secretsDir, { recursive: true });
    await writeFile(
      path.join(secretsDir, "env.json"),
      JSON.stringify({
        search: { EXA_API_KEY: "exa-key" },
        GEMINI_API_KEY: "gemini-key",
      }),
    );

    await expect(loadManagedEnvironment(dotfilesDir)).resolves.toEqual({
      EXA_API_KEY: "exa-key",
      GEMINI_API_KEY: "gemini-key",
    });
  });
});

describe("environment script rendering", () => {
  test("renders shell exports with safe quoting", () => {
    expect(renderShellEnvironmentScript({ GEMINI_API_KEY: "O'Brien" })).toContain(
      `export GEMINI_API_KEY='O'"'"'Brien'`,
    );
  });

  test("renders PowerShell exports with safe quoting", () => {
    expect(renderPowerShellEnvironmentScript({ GEMINI_API_KEY: "O'Brien" })).toContain(
      `$env:GEMINI_API_KEY = 'O''Brien'`,
    );
  });
});
