import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	buildChromeLaunchArgs,
	resolveChromeProfileSettings,
} from "./browser-tools";

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const browserToolsPath = path.join(toolsDir, "browser-tools.ts");

function runHelp(command?: string) {
	const args = command
		? [browserToolsPath, command, "--help"]
		: [browserToolsPath, "--help"];
	const result = spawnSync(process.execPath, args, {
		cwd: toolsDir,
		encoding: "utf8",
	});

	expect(result.status).toBe(0);
	expect(result.stderr).toBe("");
	return result.stdout;
}

function expectHelpIncludes(command: string, snippets: string[]) {
	const help = runHelp(command);
	snippets.forEach((snippet) => {
		expect(help).toContain(snippet);
	});
}

describe("resolveChromeProfileSettings", () => {
	test("uses the live Chrome user data dir for --real-profile", () => {
		const settings = resolveChromeProfileSettings({
			profile: false,
			realProfile: true,
			profileDir: "/tmp/browser-tools-profile",
		});

		expect(settings).toEqual({
			mode: "real",
			userDataDir: path.join(
				os.homedir(),
				"Library",
				"Application Support",
				"Google",
				"Chrome",
			),
		});
	});

	test("rejects conflicting copied and real profile flags", () => {
		expect(() =>
			resolveChromeProfileSettings({
				profile: true,
				realProfile: true,
				profileDir: "/tmp/browser-tools-profile",
			}),
		).toThrow("--profile and --real-profile cannot be used together");
	});
});

describe("buildChromeLaunchArgs", () => {
	test("includes profile directory when provided", () => {
		expect(
			buildChromeLaunchArgs({
				port: 9222,
				userDataDir: "/tmp/browser-tools-profile",
				profileDirectory: "Profile 1",
			}),
		).toEqual([
			"--remote-debugging-port=9222",
			"--user-data-dir=/tmp/browser-tools-profile",
			"--no-first-run",
			"--disable-popup-blocking",
			"--profile-directory=Profile 1",
		]);
	});
});

describe("CLI help", () => {
	test("lists the stable command surface", () => {
		const help = runHelp();

		[
			"start",
			"nav",
			"eval",
			"screenshot",
			"pick",
			"console",
			"search",
			"content",
			"cookies",
			"inspect",
			"kill",
		].forEach((command) => {
			expect(help).toContain(command);
		});
	});

	test("preserves start options", () => {
		expectHelpIncludes("start", [
			"-p, --port <number>",
			"--profile",
			"--real-profile",
			"--profile-dir <path>",
			"--profile-directory <name>",
			"--chrome-path <path>",
			"--kill-existing",
		]);
	});

	test("preserves page command options", () => {
		expectHelpIncludes("nav", ["--port <number>", "--new"]);
		expectHelpIncludes("eval", ["--port <number>", "--pretty-print"]);
		expectHelpIncludes("screenshot", ["--port <number>"]);
		expectHelpIncludes("pick", ["--port <number>"]);
		expectHelpIncludes("content", ["--port <number>", "--timeout <seconds>"]);
		expectHelpIncludes("cookies", ["--port <number>"]);
	});

	test("preserves console options", () => {
		expectHelpIncludes("console", [
			"--port <number>",
			"--types <list>",
			"--follow",
			"--timeout <seconds>",
			"--color",
			"--no-color",
			"--no-serialize",
		]);
	});

	test("preserves search options", () => {
		expectHelpIncludes("search", [
			"--port <number>",
			"-n, --count <number>",
			"--content",
			"--timeout <seconds>",
		]);
	});

	test("preserves inspect and kill options", () => {
		expectHelpIncludes("inspect", [
			"--ports <list>",
			"--pids <list>",
			"--json",
		]);
		expectHelpIncludes("kill", [
			"--ports <list>",
			"--pids <list>",
			"--all",
			"--force",
		]);
	});
});
