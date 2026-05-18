import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
	ZSHRC_MANAGED_MARKER,
	flattenEnvironmentConfig,
	isManagedZshrc,
	loadManagedEnvironment,
	renderManagedZshrc,
	renderPowerShellEnvironmentScript,
	renderShellEnvironmentScript,
	renderZshrcLocal,
	setupZshrc,
} from "./setup-dotfiles";

let temporaryDirectories: string[] = [];

async function createDotfilesFixture(): Promise<string> {
	const dotfilesDir = await mkdtemp(
		path.join(os.tmpdir(), "setup-dotfiles-test-"),
	);
	temporaryDirectories.push(dotfilesDir);
	return dotfilesDir;
}

describe("flattenEnvironmentConfig", () => {
	afterEach(async () => {
		await Promise.all(
			temporaryDirectories.map((directory) =>
				rm(directory, { force: true, recursive: true }),
			),
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
			temporaryDirectories.map((directory) =>
				rm(directory, { force: true, recursive: true }),
			),
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
		expect(
			renderShellEnvironmentScript({ GEMINI_API_KEY: "O'Brien" }),
		).toContain(`export GEMINI_API_KEY='O'"'"'Brien'`);
	});

	test("renders PowerShell exports with safe quoting", () => {
		expect(
			renderPowerShellEnvironmentScript({ GEMINI_API_KEY: "O'Brien" }),
		).toContain(`$env:GEMINI_API_KEY = 'O''Brien'`);
	});
});

describe("managed zshrc", () => {
	afterEach(async () => {
		await Promise.all(
			temporaryDirectories.map((directory) =>
				rm(directory, { force: true, recursive: true }),
			),
		);
		temporaryDirectories = [];
	});

	const fixedDate = new Date("2025-03-15T10:30:45");
	const dotfilesDir = "/fake/dotfiles";

	async function createHomeFixture(): Promise<string> {
		const homeDir = await mkdtemp(path.join(os.tmpdir(), "zshrc-test-home-"));
		temporaryDirectories.push(homeDir);
		return homeDir;
	}

	test("renders a managed zshrc entrypoint", () => {
		const content = renderManagedZshrc("/opt/dotfiles");

		expect(content.startsWith(ZSHRC_MANAGED_MARKER)).toBe(true);
		expect(content).toContain("source '/opt/dotfiles/shell/zsh/shared.zsh'");
		expect(content).toContain('if [ -f "$HOME/.zshrc.local" ]; then');
		expect(content).toContain('source "$HOME/.zshrc.local"');
	});

	test("detects managed zshrc content", () => {
		expect(isManagedZshrc(renderManagedZshrc("/x"))).toBe(true);
		expect(isManagedZshrc("# my custom zshrc\nexport FOO=bar\n")).toBe(false);
	});

	test("creates managed zshrc and local override file", async () => {
		const homeDir = await createHomeFixture();

		await setupZshrc({ dotfilesDir, homeDir, now: fixedDate });

		await expect(readFile(path.join(homeDir, ".zshrc"), "utf8")).resolves.toBe(
			renderManagedZshrc(dotfilesDir),
		);
		await expect(
			readFile(path.join(homeDir, ".zshrc.local"), "utf8"),
		).resolves.toBe(renderZshrcLocal());
	});

	test("preserves existing local override file", async () => {
		const homeDir = await createHomeFixture();
		const localPath = path.join(homeDir, ".zshrc.local");
		await writeFile(localPath, "export MY_VAR=1\n", "utf8");

		await setupZshrc({ dotfilesDir, homeDir, now: fixedDate });

		await expect(readFile(localPath, "utf8")).resolves.toBe(
			"export MY_VAR=1\n",
		);
	});

	test("backs up unmanaged zshrc before installing managed entrypoint", async () => {
		const homeDir = await createHomeFixture();
		const zshrcPath = path.join(homeDir, ".zshrc");
		const oldContent = "# my old config\nexport PATH=/usr/bin\n";
		await writeFile(zshrcPath, oldContent, "utf8");

		await setupZshrc({ dotfilesDir, homeDir, now: fixedDate });

		await expect(
			readFile(path.join(homeDir, ".zshrc.backup.20250315_103045"), "utf8"),
		).resolves.toBe(oldContent);
		await expect(readFile(zshrcPath, "utf8")).resolves.toBe(
			renderManagedZshrc(dotfilesDir),
		);
	});

	test("uses a unique backup path when timestamped backup already exists", async () => {
		const homeDir = await createHomeFixture();
		const zshrcPath = path.join(homeDir, ".zshrc");
		const existingBackupPath = path.join(
			homeDir,
			".zshrc.backup.20250315_103045",
		);
		const oldBackupContent = "# older backup\n";
		const currentContent = "# current unmanaged config\n";
		await writeFile(existingBackupPath, oldBackupContent, "utf8");
		await writeFile(zshrcPath, currentContent, "utf8");

		await setupZshrc({ dotfilesDir, homeDir, now: fixedDate });

		await expect(readFile(existingBackupPath, "utf8")).resolves.toBe(
			oldBackupContent,
		);
		await expect(readFile(`${existingBackupPath}.1`, "utf8")).resolves.toBe(
			currentContent,
		);
		await expect(readFile(zshrcPath, "utf8")).resolves.toBe(
			renderManagedZshrc(dotfilesDir),
		);
	});

	test("does not create repeated backups when zshrc is already managed", async () => {
		const homeDir = await createHomeFixture();

		await setupZshrc({ dotfilesDir, homeDir, now: fixedDate });
		await setupZshrc({
			dotfilesDir,
			homeDir,
			now: new Date("2025-03-15T11:00:00"),
		});

		const backups = await Array.fromAsync(
			new Bun.Glob(".zshrc.backup.*").scan({ cwd: homeDir }),
		);
		expect(backups).toHaveLength(0);
	});

	test("updates stale managed zshrc in place", async () => {
		const homeDir = await createHomeFixture();
		const zshrcPath = path.join(homeDir, ".zshrc");

		await setupZshrc({ dotfilesDir: "/old/dotfiles", homeDir, now: fixedDate });
		await setupZshrc({ dotfilesDir: "/new/dotfiles", homeDir, now: fixedDate });

		const backups = await Array.fromAsync(
			new Bun.Glob(".zshrc.backup.*").scan({ cwd: homeDir }),
		);
		expect(backups).toHaveLength(0);
		await expect(readFile(zshrcPath, "utf8")).resolves.toContain(
			"/new/dotfiles/shell/zsh/shared.zsh",
		);
	});
});
