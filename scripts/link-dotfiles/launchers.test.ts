import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseLaunchers, renderLauncher } from "./launchers";

const manifest = await Bun.file(
	new URL("../../shell/launchers.json", import.meta.url),
).json();
const launchers = parseLaunchers(manifest);
let temporaryDirectory = "";

afterEach(async () => {
	if (temporaryDirectory) {
		await rm(temporaryDirectory, { recursive: true, force: true });
		temporaryDirectory = "";
	}
});

async function setup() {
	temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "launchers-test-"));
	const mock = path.join(temporaryDirectory, "mock command.ts");
	const capture = path.join(temporaryDirectory, "capture.json");
	await writeFile(
		mock,
		`import { writeFileSync } from "node:fs";
writeFileSync(process.env.CAPTURE_FILE, JSON.stringify({
  args: process.argv.slice(2),
  token: process.env.ANTHROPIC_AUTH_TOKEN,
  baseUrl: process.env.ANTHROPIC_BASE_URL,
  opus: process.env.ANTHROPIC_DEFAULT_OPUS_MODEL,
  maxContext: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
  compactWindow: process.env.CLAUDE_CODE_AUTO_COMPACT_WINDOW,
  literal: process.env.LAUNCHER_LITERAL
}));
process.exit(23);
`,
	);
	const env = {
		...process.env,
		CAPTURE_FILE: capture,
		ZAI_API_KEY: "runtime-key-'\"$`with spaces",
		ANTHROPIC_AUTH_TOKEN: "inherited-token",
		ANTHROPIC_BASE_URL: "inherited-url",
	};
	return { mock, capture, env };
}

describe("launcher manifest validation", () => {
	test.each([
		{ "../escape": manifest.cz },
		{ cz: { ...manifest.cz, arg: [] } },
		{ cz: { ...manifest.cz, args: "--model opus" } },
		{ cz: { ...manifest.cz, env: { "BAD-NAME": "value" } } },
		{ cz: { ...manifest.cz, env: { TOKEN: { fromEnv: "BAD-NAME" } } } },
		{ cz: { ...manifest.cz, env: { TOKEN: { fromEnv: "KEY", typo: true } } } },
		{ cz: { ...manifest.cz, unset: ["ANTHROPIC_AUTH_TOKEN"] } },
	])("rejects invalid definition %#", (value) => {
		expect(() => parseLaunchers(value)).toThrow("Invalid launcher");
	});
});

describe.skipIf(process.platform === "win32")("Bash launchers", () => {
	test.each(Object.keys(launchers))(
		"%s preserves provider settings, arguments, and exit status",
		async (name) => {
			const { mock, capture, env } = await setup();
			const launcher = launchers[name];
			const target = path.join(temporaryDirectory, name);
			await writeFile(
				target,
				renderLauncher(name, {
					...launcher,
					command: process.execPath,
					args: [mock, ...launcher.args],
					env: { ...launcher.env, LAUNCHER_LITERAL: "literal ' \" $HOME `pwd`" },
				}, "linux"),
			);
			const result = Bun.spawnSync(
				["bash", target, "argument with spaces", "", "quote'\"$"],
				{ env },
			);
			expect(result.exitCode).toBe(23);
			const observed = JSON.parse(await readFile(capture, "utf8"));
			expect(observed.args).toEqual([
				...launcher.args, "argument with spaces", "", "quote'\"$",
			]);
			expect(observed.literal).toBe("literal ' \" $HOME `pwd`");
			if (name === "cz") {
				expect(observed.token).toBe(env.ZAI_API_KEY);
				expect(observed.maxContext).toBe("1000000");
				expect(observed.compactWindow).toBe("900000");
				env.ZAI_API_KEY = "rotated-without-regeneration";
				Bun.spawnSync(["bash", target], { env });
				expect(JSON.parse(await readFile(capture, "utf8")).token).toBe(
					"rotated-without-regeneration",
				);
			} else if (name === "ccy") {
				expect(observed.token).toBeUndefined();
				expect(observed.baseUrl).toBeUndefined();
			} else {
				expect(observed.token).toBe("sk-dummy");
				expect(observed.baseUrl).toBe("http://127.0.0.1:8317");
				expect(observed.opus).toBe(launcher.env.ANTHROPIC_DEFAULT_OPUS_MODEL);
			}
			expect(env.ANTHROPIC_AUTH_TOKEN).toBe("inherited-token");
		},
	);

	test.each(["", undefined])("fails before launching when a required key is %s", async (key) => {
		const { mock, env } = await setup();
		const target = path.join(temporaryDirectory, "cz");
		await writeFile(target, renderLauncher("cz", {
			...launchers.cz,
			command: process.execPath,
			args: [mock],
		}, "darwin"));
		const result = Bun.spawnSync(["bash", target], { env: { ...env, ZAI_API_KEY: key } });
		expect(result.exitCode).toBe(1);
		expect(result.stderr.toString()).toContain("required environment variable ZAI_API_KEY is missing");
		expect(await Bun.file(env.CAPTURE_FILE).exists()).toBe(false);
	});
});

describe("PowerShell launchers", () => {
	test.skipIf(!Bun.which("pwsh"))("fails before launching when the required key is missing", async () => {
		const { mock, capture, env } = await setup();
		const target = path.join(temporaryDirectory, "cz.ps1");
		await writeFile(target, renderLauncher("cz", {
			...launchers.cz,
			command: process.execPath,
			args: [mock],
		}, "win32"));
		const result = Bun.spawnSync(
			["pwsh", "-NoProfile", "-NonInteractive", "-File", target],
			{ env: { ...env, ZAI_API_KEY: "" } },
		);
		expect(result.exitCode).not.toBe(0);
		expect(result.stderr.toString()).toContain("ZAI_API_KEY is missing");
		expect(await Bun.file(capture).exists()).toBe(false);
	});

	test.skipIf(!Bun.which("pwsh"))(
		"preserves arguments and exit status and restores the parent environment",
		async () => {
			const { mock, capture, env } = await setup();
			const target = path.join(temporaryDirectory, "cz.ps1");
			await writeFile(target, renderLauncher("cz", {
				...launchers.cz,
				command: process.execPath,
				args: [mock, ...launchers.cz.args],
			}, "win32"));
			const escapedTarget = target.replaceAll("'", "''");
			const result = Bun.spawnSync([
				"pwsh", "-NoProfile", "-NonInteractive", "-Command",
				`& '${escapedTarget}' 'argument with spaces' '' 'quote''"$'; $code = $LASTEXITCODE; if ($env:ANTHROPIC_AUTH_TOKEN -ne 'inherited-token' -or $env:ANTHROPIC_BASE_URL -ne 'inherited-url') { throw 'Environment leaked' }; exit $code`,
			], { env });
			expect(result.stderr.toString()).toBe("");
			expect(result.exitCode).toBe(23);
			const observed = JSON.parse(await readFile(capture, "utf8"));
			expect(observed.token).toBe(env.ZAI_API_KEY);
			expect(observed.args).toEqual([
				...launchers.cz.args, "argument with spaces", "", "quote'\"$",
			]);
		},
	);

	test.skipIf(!Bun.which("pwsh"))("removes unset variables instead of blanking them", async () => {
		const { mock, capture, env } = await setup();
		const target = path.join(temporaryDirectory, "ccy.ps1");
		await writeFile(target, renderLauncher("ccy", {
			...launchers.ccy,
			command: process.execPath,
			args: [mock],
		}, "win32"));
		const result = Bun.spawnSync(
			["pwsh", "-NoProfile", "-NonInteractive", "-File", target],
			{ env },
		);
		expect(result.exitCode).toBe(23);
		const observed = JSON.parse(await readFile(capture, "utf8"));
		expect(observed).not.toHaveProperty("token");
		expect(observed).not.toHaveProperty("baseUrl");
	});

	test.skipIf(!Bun.which("pwsh"))("leaves variables that were unset before launch unset", async () => {
		const { mock, env } = await setup();
		const { ANTHROPIC_AUTH_TOKEN: _token, ANTHROPIC_BASE_URL: _baseUrl, ...unsetEnv } = env;
		for (const name of ["cz", "ccy"]) {
			const target = path.join(temporaryDirectory, `${name}.ps1`);
			await writeFile(target, renderLauncher(name, {
				...launchers[name],
				command: process.execPath,
				args: [mock],
			}, "win32"));
			const result = Bun.spawnSync([
				"pwsh", "-NoProfile", "-NonInteractive", "-Command",
				`& '${target.replaceAll("'", "''")}'; if ((Test-Path Env:ANTHROPIC_AUTH_TOKEN) -or (Test-Path Env:ANTHROPIC_BASE_URL)) { exit 4 }; exit 0`,
			], { env: unsetEnv });
			expect(result.stderr.toString()).toBe("");
			expect(result.exitCode).toBe(0);
		}
	});

	test.skipIf(!Bun.which("pwsh"))("restores the environment when the command cannot start", async () => {
		const { env } = await setup();
		const target = path.join(temporaryDirectory, "cz.ps1");
		await writeFile(target, renderLauncher("cz", {
			...launchers.cz,
			command: path.join(temporaryDirectory, "nonexistent-command"),
		}, "win32"));
		const result = Bun.spawnSync([
			"pwsh", "-NoProfile", "-NonInteractive", "-Command",
			`try { & '${target.replaceAll("'", "''")}' } catch { if ($env:ANTHROPIC_AUTH_TOKEN -ne 'inherited-token') { exit 2 }; exit 0 }; exit 3`,
		], { env });
		expect(result.exitCode).toBe(0);
	});
});
