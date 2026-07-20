import { afterEach, describe, expect, test } from "bun:test";
import {
	lstat,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	readlink,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
	POWERSHELL_MANAGED_START,
	ZSHRC_MANAGED_MARKER,
	flattenEnvironmentConfig,
	isManagedZshrc,
	loadManagedEnvironment,
	removeShellProfileBlock,
	renderManagedPowerShell,
	renderManagedZshrc,
	renderPowerShellEnvironmentScript,
	renderPowerShellProfileLocal,
	renderShellEnvironmentScript,
	renderZshrcLocal,
	setupPowerShellProfile,
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

	test("renders a managed zshrc block", () => {
		const content = renderManagedZshrc("/opt/dotfiles");

		expect(content).toStartWith("# >>> dotfiles zsh start\n");
		expect(content).toContain(ZSHRC_MANAGED_MARKER);
		expect(content).toContain("source '/opt/dotfiles/shell/zsh/shared.zsh'");
		expect(content).toContain('if [ -f "$HOME/.zshrc.local" ]; then');
		expect(content).toContain('source "$HOME/.zshrc.local"');
		expect(content).toContain("# <<< dotfiles zsh end");
	});

	test("detects managed zshrc content", () => {
		expect(isManagedZshrc(renderManagedZshrc("/x"))).toBe(true);
		expect(isManagedZshrc(`${ZSHRC_MANAGED_MARKER}\nsource /old/path\n`)).toBe(
			true,
		);
		expect(isManagedZshrc("# my custom zshrc\nexport FOO=bar\n")).toBe(false);
	});

	test("creates managed zshrc block and local override file", async () => {
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

	test("backs up unmanaged zshrc and preserves it after managed block", async () => {
		const homeDir = await createHomeFixture();
		const zshrcPath = path.join(homeDir, ".zshrc");
		const oldContent = "# my old config\nexport PATH=/usr/bin\n";
		await writeFile(zshrcPath, oldContent, "utf8");

		await setupZshrc({ dotfilesDir, homeDir, now: fixedDate });

		await expect(
			readFile(path.join(homeDir, ".zshrc.backup.20250315_103045"), "utf8"),
		).resolves.toBe(oldContent);
		await expect(readFile(zshrcPath, "utf8")).resolves.toBe(
			`${renderManagedZshrc(dotfilesDir)}${oldContent}`,
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
			`${renderManagedZshrc(dotfilesDir)}${currentContent}`,
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

	test("updates stale managed zshrc block in place", async () => {
		const homeDir = await createHomeFixture();
		const zshrcPath = path.join(homeDir, ".zshrc");

		await setupZshrc({ dotfilesDir: "/old/dotfiles", homeDir, now: fixedDate });
		await writeFile(
			zshrcPath,
			`${await readFile(zshrcPath, "utf8")}\n# pnpm\nexport PNPM_HOME=/x\n`,
			"utf8",
		);
		await setupZshrc({ dotfilesDir: "/new/dotfiles", homeDir, now: fixedDate });

		const backups = await Array.fromAsync(
			new Bun.Glob(".zshrc.backup.*").scan({ cwd: homeDir }),
		);
		expect(backups).toHaveLength(0);
		await expect(readFile(zshrcPath, "utf8")).resolves.toContain(
			"/new/dotfiles/shell/zsh/shared.zsh",
		);
		await expect(readFile(zshrcPath, "utf8")).resolves.toContain(
			"export PNPM_HOME=/x",
		);
	});

	test("migrates legacy managed zshrc without losing appended tool config", async () => {
		const homeDir = await createHomeFixture();
		const zshrcPath = path.join(homeDir, ".zshrc");
		const legacyContent = [
			ZSHRC_MANAGED_MARKER,
			"# Edits go in ~/.zshrc.local (sourced below).",
			"",
			"source '/old/dotfiles/shell/zsh/shared.zsh'",
			"",
			"# Source local overrides if present.",
			'if [ -f "$HOME/.zshrc.local" ]; then',
			'  source "$HOME/.zshrc.local"',
			"fi",
			"",
			"# pnpm",
			"export PNPM_HOME=/Users/test/Library/pnpm",
			"",
		].join("\n");
		await writeFile(zshrcPath, legacyContent, "utf8");

		await setupZshrc({ dotfilesDir, homeDir, now: fixedDate });

		const updatedContent = await readFile(zshrcPath, "utf8");
		expect(updatedContent).toStartWith("# >>> dotfiles zsh start\n");
		expect(updatedContent).toContain(
			"source '/fake/dotfiles/shell/zsh/shared.zsh'",
		);
		expect(updatedContent).toContain(
			"# pnpm\nexport PNPM_HOME=/Users/test/Library/pnpm",
		);
		const backups = await Array.fromAsync(
			new Bun.Glob(".zshrc.backup.*").scan({ cwd: homeDir }),
		);
		expect(backups).toHaveLength(0);
	});

	test("backs up a marked but unparseable legacy zshrc instead of migrating it", async () => {
		const homeDir = await createHomeFixture();
		const zshrcPath = path.join(homeDir, ".zshrc");
		// Starts with the managed marker but omits the local-source/fi structure
		// stripLegacyManagedZshrc looks for, so it cannot be confidently stripped.
		const legacyContent = [
			ZSHRC_MANAGED_MARKER,
			"source '/old/dotfiles/shell/zsh/shared.zsh'",
			"export PATH=/custom/bin:$PATH",
			"",
		].join("\n");
		await writeFile(zshrcPath, legacyContent, "utf8");

		await setupZshrc({ dotfilesDir, homeDir, now: fixedDate });

		// The unparseable legacy file is backed up (safety net), not silently migrated.
		await expect(
			readFile(path.join(homeDir, ".zshrc.backup.20250315_103045"), "utf8"),
		).resolves.toBe(legacyContent);
		// New block is prepended in front of the preserved original content.
		await expect(readFile(zshrcPath, "utf8")).resolves.toBe(
			`${renderManagedZshrc(dotfilesDir)}${legacyContent}`,
		);
	});
});

describe("managed PowerShell profile", () => {
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
		const homeDir = await mkdtemp(path.join(os.tmpdir(), "pwsh-test-home-"));
		temporaryDirectories.push(homeDir);
		return homeDir;
	}

	function pwshProfilePath(homeDir: string): string {
		return path.join(
			homeDir,
			"Documents",
			"PowerShell",
			"Microsoft.PowerShell_profile.ps1",
		);
	}

	function winPwshProfilePath(homeDir: string): string {
		return path.join(
			homeDir,
			"Documents",
			"WindowsPowerShell",
			"Microsoft.PowerShell_profile.ps1",
		);
	}

	async function listBackups(dir: string): Promise<string[]> {
		return Array.fromAsync(
			new Bun.Glob("Microsoft.PowerShell_profile.ps1.backup.*").scan({
				cwd: dir,
			}),
		);
	}

	test("renders a managed PowerShell block with guarded sources", () => {
		const content = renderManagedPowerShell("/opt/dotfiles");

		expect(content).toStartWith("# >>> dotfiles powershell start\n");
		expect(content).toContain(
			"$dotfilesShared = '/opt/dotfiles/shell/powershell/shared.ps1'",
		);
		expect(content).toContain("if (Test-Path $dotfilesShared) {");
		expect(content).toContain(
			"$dotfilesProfileLocal = Join-Path (Split-Path -Parent $PROFILE) 'profile.local.ps1'",
		);
		expect(content).toContain("# <<< dotfiles powershell end");
	});

	test("is a no-op on non-win32 platforms", async () => {
		const homeDir = await createHomeFixture();

		await setupPowerShellProfile({
			dotfilesDir,
			homeDir,
			now: fixedDate,
			platform: "darwin",
		});

		await expect(readFile(pwshProfilePath(homeDir), "utf8")).rejects.toThrow();
	});

	test("fresh install writes the block and seeds the local override", async () => {
		const homeDir = await createHomeFixture();

		await setupPowerShellProfile({
			dotfilesDir,
			homeDir,
			now: fixedDate,
			platform: "win32",
		});

		const profilePath = pwshProfilePath(homeDir);
		await expect(readFile(profilePath, "utf8")).resolves.toBe(
			renderManagedPowerShell(dotfilesDir),
		);
		await expect(
			readFile(
				path.join(path.dirname(profilePath), "profile.local.ps1"),
				"utf8",
			),
		).resolves.toBe(renderPowerShellProfileLocal());
		// WindowsPowerShell is not fabricated when Documents did not pre-exist.
		await expect(
			readFile(winPwshProfilePath(homeDir), "utf8"),
		).rejects.toThrow();
	});

	test("writes the legacy target when its directory already exists", async () => {
		const homeDir = await createHomeFixture();
		// The legacy target is only written when its own directory pre-exists.
		await mkdir(path.join(homeDir, "Documents", "WindowsPowerShell"), {
			recursive: true,
		});

		await setupPowerShellProfile({
			dotfilesDir,
			homeDir,
			now: fixedDate,
			platform: "win32",
		});

		await expect(readFile(pwshProfilePath(homeDir), "utf8")).resolves.toBe(
			renderManagedPowerShell(dotfilesDir),
		);
		await expect(readFile(winPwshProfilePath(homeDir), "utf8")).resolves.toBe(
			renderManagedPowerShell(dotfilesDir),
		);
	});

	test("does not fabricate the legacy profile across repeated runs", async () => {
		const homeDir = await createHomeFixture();
		// No Documents tree exists; run 1 creates Documents/PowerShell as a side
		// effect, which must NOT cause run 2 to fabricate WindowsPowerShell.

		await setupPowerShellProfile({
			dotfilesDir,
			homeDir,
			now: fixedDate,
			platform: "win32",
		});
		const afterFirst = await readFile(pwshProfilePath(homeDir), "utf8");

		await setupPowerShellProfile({
			dotfilesDir,
			homeDir,
			now: new Date("2025-03-15T11:00:00"),
			platform: "win32",
		});

		// Byte-identical modern profile, and the legacy profile never appears.
		await expect(readFile(pwshProfilePath(homeDir), "utf8")).resolves.toBe(
			afterFirst,
		);
		await expect(
			readFile(winPwshProfilePath(homeDir), "utf8"),
		).rejects.toThrow();

		// Full Documents subtree: only PowerShell/, no WindowsPowerShell/, no backups.
		const entries = (
			await readdir(path.join(homeDir, "Documents"), { recursive: true })
		).sort();
		expect(entries).toEqual(
			[
				"PowerShell",
				path.join("PowerShell", "Microsoft.PowerShell_profile.ps1"),
				path.join("PowerShell", "profile.local.ps1"),
			].sort(),
		);
	});

	test("migrates a repo-linked profile to a native managed block", async () => {
		const homeDir = await createHomeFixture();
		const profilePath = pwshProfilePath(homeDir);
		await mkdir(path.dirname(profilePath), { recursive: true });
		// Symlink resolves to this repo's profile, so it is dropped and rewritten.
		const repoFile = path.join(
			homeDir,
			"dotfiles",
			"shell",
			"powershell",
			"shared.ps1",
		);
		await mkdir(path.dirname(repoFile), { recursive: true });
		await writeFile(repoFile, "# repo profile\n", "utf8");
		await symlink(repoFile, profilePath);

		await setupPowerShellProfile({
			dotfilesDir,
			homeDir,
			now: fixedDate,
			platform: "win32",
		});

		// The repo file is untouched, the target is now a real managed file, and
		// no backup is created for a recognized repo link.
		await expect(readFile(repoFile, "utf8")).resolves.toBe("# repo profile\n");
		await expect(readFile(profilePath, "utf8")).resolves.toBe(
			renderManagedPowerShell(dotfilesDir),
		);
		expect(await listBackups(path.dirname(profilePath))).toHaveLength(0);
	});

	test("backs up an unknown-target symlink before taking over", async () => {
		const homeDir = await createHomeFixture();
		const profilePath = pwshProfilePath(homeDir);
		await mkdir(path.dirname(profilePath), { recursive: true });
		// Symlink points at a user file that is NOT the repo profile.
		const foreignFile = path.join(homeDir, "my-custom-profile.ps1");
		await writeFile(foreignFile, "# custom profile\n", "utf8");
		await symlink(foreignFile, profilePath);

		await setupPowerShellProfile({
			dotfilesDir,
			homeDir,
			now: fixedDate,
			platform: "win32",
		});

		// The profile is now a regular managed file.
		const stat = await lstat(profilePath);
		expect(stat.isSymbolicLink()).toBe(false);
		await expect(readFile(profilePath, "utf8")).resolves.toBe(
			renderManagedPowerShell(dotfilesDir),
		);
		// The original link is preserved as a backup symlink to its target.
		const backupPath = `${profilePath}.backup.20250315_103045`;
		expect((await lstat(backupPath)).isSymbolicLink()).toBe(true);
		await expect(readlink(backupPath)).resolves.toBe(foreignFile);
		await expect(readFile(foreignFile, "utf8")).resolves.toBe(
			"# custom profile\n",
		);
	});

	test("backs up an unmanaged profile and prepends the block", async () => {
		const homeDir = await createHomeFixture();
		const profilePath = pwshProfilePath(homeDir);
		await mkdir(path.dirname(profilePath), { recursive: true });
		const oldContent = "# my old profile\nfunction gs { git status }\n";
		await writeFile(profilePath, oldContent, "utf8");

		await setupPowerShellProfile({
			dotfilesDir,
			homeDir,
			now: fixedDate,
			platform: "win32",
		});

		await expect(
			readFile(`${profilePath}.backup.20250315_103045`, "utf8"),
		).resolves.toBe(oldContent);
		await expect(readFile(profilePath, "utf8")).resolves.toBe(
			`${renderManagedPowerShell(dotfilesDir)}${oldContent}`,
		);
	});

	test("second run is a byte-identical no-op with no new backups", async () => {
		const homeDir = await createHomeFixture();
		const profilePath = pwshProfilePath(homeDir);

		await setupPowerShellProfile({
			dotfilesDir,
			homeDir,
			now: fixedDate,
			platform: "win32",
		});
		const first = await readFile(profilePath, "utf8");

		await setupPowerShellProfile({
			dotfilesDir,
			homeDir,
			now: new Date("2025-03-15T11:00:00"),
			platform: "win32",
		});
		const second = await readFile(profilePath, "utf8");

		expect(second).toBe(first);
		expect(await listBackups(path.dirname(profilePath))).toHaveLength(0);
	});

	test("updates a stale block path while preserving appended content", async () => {
		const homeDir = await createHomeFixture();
		const profilePath = pwshProfilePath(homeDir);

		await setupPowerShellProfile({
			dotfilesDir: "/old/dotfiles",
			homeDir,
			now: fixedDate,
			platform: "win32",
		});
		await writeFile(
			profilePath,
			`${await readFile(profilePath, "utf8")}\n# pnpm\n$env:PNPM_HOME = 'C:\\pnpm'\n`,
			"utf8",
		);
		await setupPowerShellProfile({
			dotfilesDir: "/new/dotfiles",
			homeDir,
			now: fixedDate,
			platform: "win32",
		});

		const updated = await readFile(profilePath, "utf8");
		expect(updated).toContain("/new/dotfiles/shell/powershell/shared.ps1");
		expect(updated).toContain("$env:PNPM_HOME = 'C:\\pnpm'");
		expect(await listBackups(path.dirname(profilePath))).toHaveLength(0);
	});

	test("leaves a profile with malformed markers untouched", async () => {
		const homeDir = await createHomeFixture();
		const profilePath = pwshProfilePath(homeDir);
		await mkdir(path.dirname(profilePath), { recursive: true });
		// Start marker present but no matching end marker -> conflict.
		const brokenContent = `${POWERSHELL_MANAGED_START}\n. /some/shared.ps1\n# missing end marker\n`;
		await writeFile(profilePath, brokenContent, "utf8");

		await setupPowerShellProfile({
			dotfilesDir,
			homeDir,
			now: fixedDate,
			platform: "win32",
		});

		await expect(readFile(profilePath, "utf8")).resolves.toBe(brokenContent);
		expect(await listBackups(path.dirname(profilePath))).toHaveLength(0);
	});

	test("preserves an existing local override on re-run", async () => {
		const homeDir = await createHomeFixture();
		const profilePath = pwshProfilePath(homeDir);
		await mkdir(path.dirname(profilePath), { recursive: true });
		const localPath = path.join(path.dirname(profilePath), "profile.local.ps1");
		await writeFile(localPath, "$env:MY_LOCAL = '1'\n", "utf8");

		await setupPowerShellProfile({
			dotfilesDir,
			homeDir,
			now: fixedDate,
			platform: "win32",
		});

		await expect(readFile(localPath, "utf8")).resolves.toBe(
			"$env:MY_LOCAL = '1'\n",
		);
	});
});

describe("removeShellProfileBlock", () => {
	afterEach(async () => {
		await Promise.all(
			temporaryDirectories.map((directory) =>
				rm(directory, { force: true, recursive: true }),
			),
		);
		temporaryDirectories = [];
	});

	const dotfilesDir = "/fake/dotfiles";

	async function createHomeFixture(prefix: string): Promise<string> {
		const homeDir = await mkdtemp(path.join(os.tmpdir(), prefix));
		temporaryDirectories.push(homeDir);
		return homeDir;
	}

	test("removes the managed zshrc block on Unix, preserving surrounding content", async () => {
		const homeDir = await createHomeFixture("remove-zshrc-test-home-");
		const zshrcPath = path.join(homeDir, ".zshrc");
		const managed = renderManagedZshrc(dotfilesDir);
		await writeFile(
			zshrcPath,
			`# user head\n${managed}# pnpm append\nexport X=1\n`,
			"utf8",
		);

		await removeShellProfileBlock({ homeDir, platform: "darwin" });

		await expect(readFile(zshrcPath, "utf8")).resolves.toBe(
			"# user head\n# pnpm append\nexport X=1\n",
		);
	});

	test("is a no-op when .zshrc has no managed block", async () => {
		const homeDir = await createHomeFixture("remove-zshrc-test-home-");
		const zshrcPath = path.join(homeDir, ".zshrc");
		await writeFile(zshrcPath, "# my own config\n", "utf8");

		await removeShellProfileBlock({ homeDir, platform: "darwin" });

		await expect(readFile(zshrcPath, "utf8")).resolves.toBe(
			"# my own config\n",
		);
	});

	test("is a no-op when .zshrc does not exist", async () => {
		const homeDir = await createHomeFixture("remove-zshrc-test-home-");

		await expect(
			removeShellProfileBlock({ homeDir, platform: "darwin" }),
		).resolves.toBeUndefined();
	});

	test("leaves malformed zshrc markers untouched", async () => {
		const homeDir = await createHomeFixture("remove-zshrc-test-home-");
		const zshrcPath = path.join(homeDir, ".zshrc");
		const malformed = "# >>> dotfiles zsh start\nsource /a\n# no end marker\n";
		await writeFile(zshrcPath, malformed, "utf8");

		await removeShellProfileBlock({ homeDir, platform: "darwin" });

		await expect(readFile(zshrcPath, "utf8")).resolves.toBe(malformed);
	});

	test("removes the managed PowerShell profile block on Windows, preserving appended content", async () => {
		const homeDir = await createHomeFixture("remove-pwsh-test-home-");
		const profilePath = path.join(
			homeDir,
			"Documents",
			"PowerShell",
			"Microsoft.PowerShell_profile.ps1",
		);
		await mkdir(path.dirname(profilePath), { recursive: true });
		const managed = renderManagedPowerShell(dotfilesDir);
		await writeFile(
			profilePath,
			`${managed}# user tail\n$env:FOO = '1'\n`,
			"utf8",
		);

		await removeShellProfileBlock({ homeDir, platform: "win32" });

		await expect(readFile(profilePath, "utf8")).resolves.toBe(
			"# user tail\n$env:FOO = '1'\n",
		);
	});

	test("also removes the legacy WindowsPowerShell profile block when present", async () => {
		const homeDir = await createHomeFixture("remove-pwsh-test-home-");
		const legacyProfilePath = path.join(
			homeDir,
			"Documents",
			"WindowsPowerShell",
			"Microsoft.PowerShell_profile.ps1",
		);
		await mkdir(path.dirname(legacyProfilePath), { recursive: true });
		const managed = renderManagedPowerShell(dotfilesDir);
		await writeFile(legacyProfilePath, managed, "utf8");

		await removeShellProfileBlock({ homeDir, platform: "win32" });

		await expect(readFile(legacyProfilePath, "utf8")).resolves.toBe("");
	});
});
