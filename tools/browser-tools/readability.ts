/** Injects Readability and Turndown helpers into a Puppeteer Page when possible. */
export async function ensureReadability(page: any) {
	try {
		await page.setBypassCSP?.(true);
	} catch {
		// ignore
	}
	const scripts = [
		"https://unpkg.com/@mozilla/readability@0.4.4/Readability.js",
		"https://unpkg.com/turndown@7.1.2/dist/turndown.js",
		"https://unpkg.com/turndown-plugin-gfm@1.0.2/dist/turndown-plugin-gfm.js",
	];
	for (const src of scripts) {
		try {
			const alreadyLoaded = await page.evaluate((url) => {
				return Boolean(document.querySelector(`script[src="${url}"]`));
			}, src);
			if (!alreadyLoaded) {
				await page.addScriptTag({ url: src });
			}
		} catch {
			// best-effort; continue
		}
	}
}

/** Extracts the current Puppeteer Page as markdown-like readable content. */
export async function extractReadableContent(
	page: any,
): Promise<{ title?: string; content?: string; url: string }> {
	await ensureReadability(page);
	const result = await page.evaluate(() => {
		const asMarkdown = (html: string | null | undefined) => {
			if (!html) return "";
			const TurndownService = (window as any).TurndownService;
			const turndownPluginGfm = (window as any).turndownPluginGfm;
			if (!TurndownService) {
				return "";
			}
			const turndown = new TurndownService({
				headingStyle: "atx",
				codeBlockStyle: "fenced",
			});
			if (turndownPluginGfm?.gfm) {
				turndown.use(turndownPluginGfm.gfm);
			}
			return turndown
				.turndown(html)
				.replace(/\n{3,}/g, "\n\n")
				.trim();
		};

		const fallbackText = () => {
			const main =
				document.querySelector(
					'main, article, [role="main"], .content, #content',
				) ||
				document.body ||
				document.documentElement;
			return main?.textContent?.trim() ?? "";
		};

		let title = document.title;
		let content = "";

		try {
			const Readability = (window as any).Readability;
			if (Readability) {
				const clone = document.cloneNode(true) as Document;
				const article = new Readability(clone).parse();
				title = article?.title || title;
				content = asMarkdown(article?.content) || article?.textContent || "";
			}
		} catch {
			// ignore readability failures
		}

		if (!content) {
			content = fallbackText();
		}

		content = content?.trim().slice(0, 8000);

		return { title, content, url: location.href };
	});
	return result;
}
