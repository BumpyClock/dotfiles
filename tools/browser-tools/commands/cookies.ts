import type { Command } from "commander";
import { getActivePage } from "../browser";
import { DEFAULT_PORT } from "../constants";

export function registerCookiesCommand(program: Command): void {
	program
		.command("cookies")
		.description("Dump cookies from the active tab as JSON.")
		.option(
			"--port <number>",
			"Debugger port (default: 9222)",
			(value) => Number.parseInt(value, 10),
			DEFAULT_PORT,
		)
		.action(async (options) => {
			const port = options.port as number;
			const { browser, page } = await getActivePage(port);
			try {
				const cookies = await page.cookies();
				console.log(JSON.stringify(cookies, null, 2));
			} finally {
				await browser.disconnect();
			}
		});
}
