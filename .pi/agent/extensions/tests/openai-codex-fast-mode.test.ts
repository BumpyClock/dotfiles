import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import fastModeExtension from "../openai-codex-fast-mode.ts";

type Handler = (...args: unknown[]) => unknown;

type RegisteredCommand = {
	handler: Handler;
};

function loadExtension(settingsPath: string) {
	const handlers = new Map<string, Handler>();
	const commands = new Map<string, RegisteredCommand>();

	fastModeExtension(
		{
			on(event: string, handler: Handler) {
				handlers.set(event, handler);
			},
			registerCommand(name: string, command: RegisteredCommand) {
				commands.set(name, command);
			},
			registerShortcut() {},
		} as never,
		settingsPath,
	);

	return { handlers, commands };
}

function createContext() {
	return {
		model: { provider: "openai-codex", id: "gpt-5.6-sol" },
		sessionManager: {
			getBranch: () => [
				{
					type: "custom",
					customType: "openai-codex-fast-mode",
					data: { enabled: true },
				},
			],
		},
		ui: {
			notify() {},
			setStatus() {},
			theme: { fg: (_color: string, text: string) => text },
		},
	};
}

const codexPayload = {
	model: "gpt-5.6-sol",
	stream: true,
	instructions: "test",
	input: [],
	tool_choice: "auto",
	prompt_cache_key: "test",
};

async function startSession(settingsPath: string) {
	const extension = loadExtension(settingsPath);
	const sessionStart = extension.handlers.get("session_start");
	assert.ok(sessionStart);
	await sessionStart({}, createContext());
	return extension;
}

async function providerRequest(extension: ReturnType<typeof loadExtension>) {
	const beforeProviderRequest = extension.handlers.get(
		"before_provider_request",
	);
	assert.ok(beforeProviderRequest);
	return beforeProviderRequest({ payload: codexPayload }, createContext());
}

test("fast mode persists globally, defaults off, and ignores session branch state", async () => {
	const home = await mkdtemp(join(tmpdir(), "pi-fast-mode-"));
	const settingsPath = join(home, ".pi", "agent", "settings.json");

	try {
		const missingSettingSession = await startSession(settingsPath);
		assert.equal(await providerRequest(missingSettingSession), undefined);

		await mkdir(dirname(settingsPath), { recursive: true });
		await writeFile(
			settingsPath,
			`${JSON.stringify(
				{
					defaultModel: "keep-me",
					extensionSettings: {
						openaiCodexFastMode: { enabled: false },
						personalitySwitcher: { personality: "caveman" },
					},
				},
				null,
				2,
			)}\n`,
			"utf8",
		);

		const disabledSession = await startSession(settingsPath);
		assert.equal(await providerRequest(disabledSession), undefined);

		const fastCommand = disabledSession.commands.get("fast");
		assert.ok(fastCommand);
		await fastCommand.handler("on", createContext());

		const enabledSettings = JSON.parse(
			await readFile(settingsPath, "utf8"),
		) as Record<string, unknown>;
		assert.equal(enabledSettings.defaultModel, "keep-me");
		assert.deepEqual(enabledSettings.extensionSettings, {
			openaiCodexFastMode: { enabled: true },
			personalitySwitcher: { personality: "caveman" },
		});

		const enabledSession = await startSession(settingsPath);
		assert.deepEqual(await providerRequest(enabledSession), {
			...codexPayload,
			service_tier: "priority",
		});

		const enabledFastCommand = enabledSession.commands.get("fast");
		assert.ok(enabledFastCommand);
		await enabledFastCommand.handler("off", createContext());

		const disabledNewSession = await startSession(settingsPath);
		assert.equal(await providerRequest(disabledNewSession), undefined);
	} finally {
		await rm(home, { recursive: true, force: true });
	}
});
