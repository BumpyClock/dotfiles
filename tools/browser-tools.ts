#!/usr/bin/env bun

/**
 * Minimal Chrome DevTools helpers inspired by Mario Zechner's
 * "What if you don't need MCP?" article.
 *
 * Keeps the executable as a small CLI registry while command implementations
 * live in focused modules under tools/browser-tools/.
 */
import { Command } from "commander";
import { registerConsoleCommand } from "./browser-tools/commands/console";
import { registerContentCommand } from "./browser-tools/commands/content";
import { registerCookiesCommand } from "./browser-tools/commands/cookies";
import { registerEvalCommand } from "./browser-tools/commands/eval";
import { registerInspectCommand } from "./browser-tools/commands/inspect";
import { registerKillCommand } from "./browser-tools/commands/kill";
import { registerNavCommand } from "./browser-tools/commands/nav";
import { registerPickCommand } from "./browser-tools/commands/pick";
import { registerScreenshotCommand } from "./browser-tools/commands/screenshot";
import { registerSearchCommand } from "./browser-tools/commands/search";
import { registerStartCommand } from "./browser-tools/commands/start";

export type { ChromeProfileMode } from "./browser-tools/profile";
export {
	buildChromeLaunchArgs,
	resolveChromeProfileSettings,
} from "./browser-tools/profile";

/** Creates the fully registered Commander program used by the CLI entrypoint. */
export function createProgram(): Command {
	const program = new Command();
	program
		.name("browser-tools")
		.description("Lightweight Chrome DevTools helpers (no MCP required).")
		.configureHelp({ sortSubcommands: true })
		.showSuggestionAfterError();

	registerStartCommand(program);
	registerNavCommand(program);
	registerEvalCommand(program);
	registerScreenshotCommand(program);
	registerPickCommand(program);
	registerConsoleCommand(program);
	registerSearchCommand(program);
	registerContentCommand(program);
	registerCookiesCommand(program);
	registerInspectCommand(program);
	registerKillCommand(program);

	return program;
}

if (import.meta.main) {
	createProgram()
		.parseAsync(process.argv)
		.catch((error: unknown) => {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`Error: ${message}`);
			process.exit(1);
		});
}
