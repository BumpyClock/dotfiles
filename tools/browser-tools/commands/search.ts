import type { Command } from "commander";
import { getActivePage } from "../browser";
import { DEFAULT_PORT } from "../constants";
import { extractReadableContent } from "../readability";

export function registerSearchCommand(program: Command): void {
	program
		.command("search <query...>")
		.description("Google search with optional readable content extraction.")
		.option(
			"--port <number>",
			"Debugger port (default: 9222)",
			(value) => Number.parseInt(value, 10),
			DEFAULT_PORT,
		)
		.option(
			"-n, --count <number>",
			"Number of results to return (default: 5, max: 50)",
			(value) => Number.parseInt(value, 10),
			5,
		)
		.option(
			"--content",
			"Fetch readable content for each result (slower).",
			false,
		)
		.option(
			"--timeout <seconds>",
			"Per-navigation timeout in seconds (default: 10).",
			(value) => Number.parseInt(value, 10),
			10,
		)
		.action(async (queryWords: string[], options) => {
			const port = options.port as number;
			const count = Math.max(1, Math.min(options.count as number, 50));
			const fetchContent = Boolean(options.content);
			const timeoutMs = Math.max(3, (options.timeout as number) ?? 10) * 1000;
			const query = queryWords.join(" ");

			const { browser, page } = await getActivePage(port);
			try {
				const results: {
					title: string;
					link: string;
					snippet: string;
					content?: string;
				}[] = [];
				let start = 0;
				while (results.length < count) {
					const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${start}`;
					await page
						.goto(searchUrl, {
							waitUntil: "domcontentloaded",
							timeout: timeoutMs,
						})
						.catch(() => {});
					await page
						.waitForSelector("div.MjjYud", { timeout: 3000 })
						.catch(() => {});

					const pageResults = await page.evaluate(() => {
						const items: { title: string; link: string; snippet: string }[] =
							[];
						document.querySelectorAll("div.MjjYud").forEach((result) => {
							const titleEl = result.querySelector("h3");
							const linkEl = result.querySelector("a");
							const snippetEl = result.querySelector(
								"div.VwiC3b, div[data-sncf]",
							);
							const link = linkEl?.getAttribute("href") ?? "";
							if (
								titleEl &&
								linkEl &&
								link &&
								!link.startsWith("https://www.google.com")
							) {
								items.push({
									title: titleEl.textContent?.trim() ?? "",
									link,
									snippet: snippetEl?.textContent?.trim() ?? "",
								});
							}
						});
						return items;
					});

					for (const r of pageResults) {
						if (results.length >= count) break;
						if (!results.some((existing) => existing.link === r.link)) {
							results.push(r);
						}
					}

					if (pageResults.length === 0 || start >= 90) {
						break;
					}
					start += 10;
				}

				if (fetchContent) {
					for (const result of results) {
						try {
							await page
								.goto(result.link, {
									waitUntil: "networkidle2",
									timeout: timeoutMs,
								})
								.catch(() => {});
							const article = await extractReadableContent(page);
							result.content = article.content ?? "(No readable content)";
						} catch (error) {
							const message =
								error instanceof Error ? error.message : String(error);
							result.content = `(Error fetching content: ${message})`;
						}
					}
				}

				results.forEach((r, index) => {
					console.log(`--- Result ${index + 1} ---`);
					console.log(`Title: ${r.title}`);
					console.log(`Link: ${r.link}`);
					if (r.snippet) {
						console.log(`Snippet: ${r.snippet}`);
					}
					if (r.content) {
						console.log(`Content:\n${r.content}`);
					}
					console.log("");
				});

				if (results.length === 0) {
					console.log("No results found.");
				}
			} finally {
				await browser.disconnect();
			}
		});
}
