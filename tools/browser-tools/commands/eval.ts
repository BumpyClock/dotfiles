import type { Command } from "commander";
import { inspect } from "node:util";
import { getActivePage } from "../browser";
import { DEFAULT_PORT } from "../constants";

type AsyncFunctionCtor = new (
	...args: string[]
) => (...fnArgs: unknown[]) => Promise<unknown>;

export function registerEvalCommand(program: Command): void {
	program
		.command("eval <code...>")
		.description("Evaluate JavaScript in the active page context.")
		.option(
			"--port <number>",
			"Debugger port (default: 9222)",
			(value) => Number.parseInt(value, 10),
			DEFAULT_PORT,
		)
		.option(
			"--pretty-print",
			"Format array/object results with indentation.",
			false,
		)
		.action(async (code: string[], options) => {
			const snippet = code.join(" ");
			const port = options.port as number;
			const pretty = Boolean(options.prettyPrint);
			const useColor = process.stdout.isTTY;

			const printPretty = (value: unknown) => {
				console.log(
					inspect(value, {
						depth: 6,
						colors: useColor,
						maxArrayLength: 50,
						breakLength: 80,
						compact: false,
					}),
				);
			};

			const { browser, page } = await getActivePage(port);
			try {
				const result = await page.evaluate((body) => {
					const ASYNC_FN = Object.getPrototypeOf(async () => {})
						.constructor as AsyncFunctionCtor;
					return new ASYNC_FN(`return (${body})`)();
				}, snippet);

				if (pretty) {
					printPretty(result);
				} else if (Array.isArray(result)) {
					result.forEach((entry, index) => {
						if (index > 0) {
							console.log("");
						}
						Object.entries(entry).forEach(([key, value]) => {
							console.log(`${key}: ${value}`);
						});
					});
				} else if (typeof result === "object" && result !== null) {
					Object.entries(result).forEach(([key, value]) => {
						console.log(`${key}: ${value}`);
					});
				} else {
					console.log(result);
				}
			} finally {
				await browser.disconnect();
			}
		});
}
