import type { Command } from "commander";
import { connectBrowser } from "../browser";
import { DEFAULT_PORT } from "../constants";

export function registerNavCommand(program: Command): void {
	program
		.command("nav <url>")
		.description("Navigate the current tab or open a new tab.")
		.option(
			"--port <number>",
			"Debugger port (default: 9222)",
			(value) => Number.parseInt(value, 10),
			DEFAULT_PORT,
		)
		.option("--new", "Open in a new tab.", false)
		.action(async (url: string, options) => {
			const port = options.port as number;
			const browser = await connectBrowser(port);
			try {
				if (options.new) {
					const page = await browser.newPage();
					await page.goto(url, { waitUntil: "domcontentloaded" });
					console.log("✓ Opened in new tab:", url);
				} else {
					const pages = await browser.pages();
					const page = pages[pages.length - 1];
					if (!page) {
						throw new Error("No active tab found");
					}
					await page.goto(url, { waitUntil: "domcontentloaded" });
					console.log("✓ Navigated current tab to:", url);
				}
			} finally {
				await browser.disconnect();
			}
		});
}
