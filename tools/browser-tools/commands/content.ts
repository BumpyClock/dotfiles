import type { Command } from "commander";
import { getActivePage } from "../browser";
import { DEFAULT_PORT } from "../constants";
import { extractReadableContent } from "../readability";

export function registerContentCommand(program: Command): void {
	program
		.command("content <url>")
		.description("Extract readable content from a URL as markdown-like text.")
		.option(
			"--port <number>",
			"Debugger port (default: 9222)",
			(value) => Number.parseInt(value, 10),
			DEFAULT_PORT,
		)
		.option(
			"--timeout <seconds>",
			"Navigation timeout in seconds (default: 10).",
			(value) => Number.parseInt(value, 10),
			10,
		)
		.action(async (url: string, options) => {
			const port = options.port as number;
			const timeoutMs = Math.max(3, (options.timeout as number) ?? 10) * 1000;
			const { browser, page } = await getActivePage(port);
			try {
				await page
					.goto(url, { waitUntil: "networkidle2", timeout: timeoutMs })
					.catch(() => {});
				const article = await extractReadableContent(page);
				console.log(`URL: ${article.url}`);
				if (article.title) {
					console.log(`Title: ${article.title}`);
				}
				console.log("");
				console.log(article.content ?? "(No readable content)");
			} finally {
				await browser.disconnect();
			}
		});
}
