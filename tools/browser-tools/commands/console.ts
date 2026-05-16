import type { Command } from "commander";
import { getActivePage } from "../browser";
import { DEFAULT_PORT } from "../constants";

export function registerConsoleCommand(program: Command): void {
	program
		.command("console")
		.description("Capture and display console logs from the active tab.")
		.option(
			"--port <number>",
			"Debugger port (default: 9222)",
			(value) => Number.parseInt(value, 10),
			DEFAULT_PORT,
		)
		.option(
			"--types <list>",
			"Comma-separated log types to show (e.g., log,error,warn). Default: all types",
		)
		.option("--follow", "Continuous monitoring mode (like tail -f)", false)
		.option(
			"--timeout <seconds>",
			"Capture duration in seconds (default: 5 for one-shot, infinite for --follow)",
			(value) => Number.parseInt(value, 10),
		)
		.option("--color", "Force color output")
		.option("--no-color", "Disable color output")
		.option(
			"--no-serialize",
			"Disable object serialization (show raw text only)",
			false,
		)
		.action(async (options) => {
			const port = options.port as number;
			const follow = options.follow as boolean;
			const timeout = options.timeout as number | undefined;
			const typesFilter = options.types as string | undefined;
			const noSerialize = options.noSerialize as boolean;
			const serialize = !noSerialize;

			// Track explicit color flags by looking at argv to avoid Commander defaults overriding TTY detection.
			const argv = process.argv.slice(2);
			const colorFlag = argv.includes("--color")
				? true
				: argv.includes("--no-color")
					? false
					: undefined;

			// Determine if we should use colors: explicit flag or TTY auto-detection
			const useColor = colorFlag ?? process.stdout.isTTY;

			// Parse types filter
			const normalizeType = (value: string) => {
				const lower = value.toLowerCase();
				if (lower === "warning") return "warn";
				return lower;
			};

			const allowedTypes = typesFilter
				? new Set(typesFilter.split(",").map((t) => normalizeType(t.trim())))
				: null; // null means show all types

			// Color functions (no-op if colors disabled)
			const colorize = (text: string, colorCode: string) =>
				useColor ? `\x1b[${colorCode}m${text}\x1b[0m` : text;
			const red = (text: string) => colorize(text, "31");
			const yellow = (text: string) => colorize(text, "33");
			const cyan = (text: string) => colorize(text, "36");
			const gray = (text: string) => colorize(text, "90");
			const white = (text: string) => text;

			const typeColors: Record<string, (text: string) => string> = {
				error: red,
				warn: yellow,
				warning: yellow,
				info: cyan,
				debug: gray,
				log: white,
				pageerror: red,
			};

			// Helper function definitions (outside try/catch as they don't need error handling)
			const formatTimestamp = () => {
				const now = new Date();
				return (
					now.toTimeString().split(" ")[0] +
					"." +
					now.getMilliseconds().toString().padStart(3, "0")
				);
			};

			// Serialize value in Node.js util.inspect style with depth limit
			const formatValue = (value: any, depth = 0, maxDepth = 10): string => {
				if (depth > maxDepth) {
					return "[Object]";
				}

				if (value === null) return "null";
				if (value === undefined) return "undefined";
				if (typeof value === "string") return `'${value}'`;
				if (typeof value === "number" || typeof value === "boolean")
					return String(value);
				if (typeof value === "function") return "[Function]";

				if (Array.isArray(value)) {
					const items = value.map((v) => formatValue(v, depth + 1, maxDepth));
					return `[ ${items.join(", ")} ]`;
				}

				if (typeof value === "object") {
					const entries = Object.entries(value).map(
						([k, v]) => `${k}: ${formatValue(v, depth + 1, maxDepth)}`,
					);
					return entries.length > 0 ? `{ ${entries.join(", ")} }` : "{}";
				}

				return String(value);
			};

			// Serialize console message arguments
			const serializeArgs = async (msg: any): Promise<string> => {
				try {
					const args = msg.args();
					const values = await Promise.all(
						args.map(async (arg: any) => {
							try {
								const value = await arg.jsonValue();
								return formatValue(value);
							} catch (error) {
								const errorMsg =
									error instanceof Error ? error.message : String(error);
								if (errorMsg.includes("circular")) return "[Circular]";
								if (errorMsg.includes("reference chain")) return "[DeepObject]";
								return "[Unserializable]";
							}
						}),
					);
					return values.join(" ");
				} catch {
					// Fallback to text representation
					return msg.text();
				}
			};

			const formatMessage = (
				type: string,
				text: string,
				location?: { url?: string; lineNumber?: number },
			) => {
				const color = typeColors[type] || white;
				const timestamp = formatTimestamp();
				const loc =
					location?.url && location?.lineNumber
						? ` ${location.url}:${location.lineNumber}`
						: "";
				return color(`[${type.toUpperCase()}] ${timestamp} ${text}${loc}`);
			};

			// Execution code (needs try/catch for error handling)
			const { browser, page } = await getActivePage(port);

			try {
				// Set up console listener
				page.on("console", async (msg) => {
					const type = normalizeType(msg.type());
					if (allowedTypes && !allowedTypes.has(type)) {
						return; // Filter out unwanted types
					}

					const text = serialize ? await serializeArgs(msg) : msg.text();
					console.log(formatMessage(type, text, msg.location()));
				});

				// Set up page error listener
				page.on("pageerror", (error: any) => {
					if (
						allowedTypes &&
						!allowedTypes.has("pageerror") &&
						!allowedTypes.has("error")
					) {
						return;
					}
					console.log(formatMessage("pageerror", error.message));
				});

				if (follow) {
					// Continuous monitoring mode
					console.log(gray("Monitoring console logs (Ctrl+C to stop)..."));
					const waitForExit = () =>
						new Promise<void>((resolve) => {
							const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGHUP"];
							const onSignal = () => {
								cleanup();
								resolve();
							};
							const onBeforeExit = () => {
								cleanup();
								resolve();
							};
							const cleanup = () => {
								signals.forEach((signal) => process.off(signal, onSignal));
								process.off("beforeExit", onBeforeExit);
							};
							signals.forEach((signal) => process.on(signal, onSignal));
							process.on("beforeExit", onBeforeExit);
						});

					await waitForExit();
				} else {
					// One-shot mode with timeout
					const duration = timeout ?? 5;
					console.log(
						gray(`Capturing console logs for ${duration} seconds...`),
					);
					await new Promise((resolve) => setTimeout(resolve, duration * 1000));
				}
			} finally {
				await browser.disconnect();
			}
		});
}
