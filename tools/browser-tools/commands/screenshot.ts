import type { Command } from "commander";
import { writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getActivePage } from "../browser";
import { DEFAULT_PORT } from "../constants";

export function registerScreenshotCommand(program: Command): void {
	program
		.command("screenshot")
		.description("Capture the current viewport and print the temp PNG path.")
		.option(
			"--port <number>",
			"Debugger port (default: 9222)",
			(value) => Number.parseInt(value, 10),
			DEFAULT_PORT,
		)
		.action(async (options) => {
			const port = options.port as number;
			const { browser, page } = await getActivePage(port);
			const client = await page.target().createCDPSession();
			try {
				const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
				const filePath = path.join(os.tmpdir(), `screenshot-${timestamp}.png`);
				const layoutMetrics = await client
					.send("Page.getLayoutMetrics")
					.catch(() => undefined);
				const layoutViewport = layoutMetrics?.layoutViewport as
					| {
							clientWidth: number;
							clientHeight: number;
							pageX?: number;
							pageY?: number;
					  }
					| undefined;

				let cssWidth = layoutViewport?.clientWidth;
				let cssHeight = layoutViewport?.clientHeight;
				const pageX = layoutViewport?.pageX ?? 0;
				const pageY = layoutViewport?.pageY ?? 0;

				if (!cssWidth || !cssHeight) {
					const viewport = page.viewport();
					cssWidth = viewport?.width;
					cssHeight = viewport?.height;
				}

				if (!cssWidth || !cssHeight) {
					const fallback = await page.evaluate(() => ({
						width: window.innerWidth,
						height: window.innerHeight,
					}));
					cssWidth = fallback.width;
					cssHeight = fallback.height;
				}

				const maxDimension = 2000;
				const scale =
					cssWidth && cssHeight
						? Math.max(
								0.01,
								Math.min(1, maxDimension / Math.max(cssWidth, cssHeight)),
							)
						: 1;

				if (!cssWidth || !cssHeight) {
					await page.screenshot({ path: filePath });
					console.log(filePath);
					return;
				}

				const screenshot = await client.send("Page.captureScreenshot", {
					format: "png",
					fromSurface: true,
					captureBeyondViewport: false,
					clip: {
						x: pageX,
						y: pageY,
						width: cssWidth,
						height: cssHeight,
						scale,
					},
				});

				await writeFile(filePath, Buffer.from(screenshot.data, "base64"));
				console.log(filePath);
			} finally {
				try {
					await client.detach();
				} catch {
					// ignore
				}
				await browser.disconnect();
			}
		});
}
