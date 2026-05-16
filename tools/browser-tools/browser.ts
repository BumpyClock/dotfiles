import puppeteer from "puppeteer-core";

export function browserURL(port: number): string {
	return `http://localhost:${port}`;
}

export async function connectBrowser(port: number) {
	return puppeteer.connect({
		browserURL: browserURL(port),
		defaultViewport: null,
	});
}

/** Returns the last open page as browser-tools' best available active-tab heuristic. */
export async function getActivePage(port: number) {
	const browser = await connectBrowser(port);
	const pages = await browser.pages();
	const page = pages[pages.length - 1];
	if (!page) {
		await browser.disconnect();
		throw new Error("No active tab found");
	}
	return { browser, page };
}
