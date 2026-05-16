import type { Command } from "commander";
import { getActivePage } from "../browser";
import { DEFAULT_PORT } from "../constants";

export function registerPickCommand(program: Command): void {
	program
		.command("pick <message...>")
		.description(
			"Interactive DOM picker that prints metadata for clicked elements.",
		)
		.option(
			"--port <number>",
			"Debugger port (default: 9222)",
			(value) => Number.parseInt(value, 10),
			DEFAULT_PORT,
		)
		.action(async (messageParts: string[], options) => {
			const message = messageParts.join(" ");
			const port = options.port as number;
			const { browser, page } = await getActivePage(port);
			try {
				await page.evaluate(() => {
					const scope = globalThis as typeof globalThis & {
						pickOverlayInjected?: boolean;
						pick?: (prompt: string) => Promise<unknown>;
					};
					if (scope.pickOverlayInjected) {
						return;
					}
					scope.pickOverlayInjected = true;
					scope.pick = async (prompt: string) =>
						new Promise((resolve) => {
							const selections: unknown[] = [];
							const selectedElements = new Set<HTMLElement>();

							const overlay = document.createElement("div");
							overlay.style.cssText =
								"position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;pointer-events:none";

							const highlight = document.createElement("div");
							highlight.style.cssText =
								"position:absolute;border:2px solid #3b82f6;background:rgba(59,130,246,0.1);transition:all 0.05s ease";
							overlay.appendChild(highlight);

							const banner = document.createElement("div");
							banner.style.cssText =
								"position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1f2937;color:#fff;padding:12px 24px;border-radius:8px;font:14px system-ui;box-shadow:0 4px 12px rgba(0,0,0,0.3);pointer-events:auto;z-index:2147483647";

							const updateBanner = () => {
								banner.textContent = `${prompt} (${selections.length} selected, Cmd/Ctrl+click to add, Enter to finish, ESC to cancel)`;
							};

							const cleanup = () => {
								document.removeEventListener("mousemove", onMove, true);
								document.removeEventListener("click", onClick, true);
								document.removeEventListener("keydown", onKey, true);
								overlay.remove();
								banner.remove();
								selectedElements.forEach((el) => {
									el.style.outline = "";
								});
							};

							const serialize = (el: HTMLElement) => {
								const parents: string[] = [];
								let current = el.parentElement;
								while (current && current !== document.body) {
									const id = current.id ? `#${current.id}` : "";
									const cls = current.className
										? `.${current.className.trim().split(/\s+/).join(".")}`
										: "";
									parents.push(`${current.tagName.toLowerCase()}${id}${cls}`);
									current = current.parentElement;
								}
								return {
									tag: el.tagName.toLowerCase(),
									id: el.id || null,
									class: el.className || null,
									text: el.textContent?.trim()?.slice(0, 200) || null,
									html: el.outerHTML.slice(0, 500),
									parents: parents.join(" > "),
								};
							};

							const onMove = (event: MouseEvent) => {
								const node = document.elementFromPoint(
									event.clientX,
									event.clientY,
								) as HTMLElement | null;
								if (!node || overlay.contains(node) || banner.contains(node))
									return;
								const rect = node.getBoundingClientRect();
								highlight.style.cssText = `position:absolute;border:2px solid #3b82f6;background:rgba(59,130,246,0.1);top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px`;
							};
							const onClick = (event: MouseEvent) => {
								if (banner.contains(event.target as Node)) return;
								event.preventDefault();
								event.stopPropagation();
								const node = document.elementFromPoint(
									event.clientX,
									event.clientY,
								) as HTMLElement | null;
								if (!node || overlay.contains(node) || banner.contains(node))
									return;

								if (event.metaKey || event.ctrlKey) {
									if (!selectedElements.has(node)) {
										selectedElements.add(node);
										node.style.outline = "3px solid #10b981";
										selections.push(serialize(node));
										updateBanner();
									}
								} else {
									cleanup();
									const info = serialize(node);
									resolve(selections.length > 0 ? selections : info);
								}
							};

							const onKey = (event: KeyboardEvent) => {
								if (event.key === "Escape") {
									cleanup();
									resolve(null);
								} else if (event.key === "Enter" && selections.length > 0) {
									cleanup();
									resolve(selections);
								}
							};

							document.addEventListener("mousemove", onMove, true);
							document.addEventListener("click", onClick, true);
							document.addEventListener("keydown", onKey, true);

							document.body.append(overlay, banner);
							updateBanner();
						});
				});

				const result = await page.evaluate((msg) => {
					const pickFn = (
						window as Window & { pick?: (message: string) => Promise<unknown> }
					).pick;
					if (!pickFn) {
						return null;
					}
					return pickFn(msg);
				}, message);

				if (Array.isArray(result)) {
					result.forEach((entry, index) => {
						if (index > 0) {
							console.log("");
						}
						Object.entries(entry).forEach(([key, value]) => {
							console.log(`${key}: ${value}`);
						});
					});
				} else if (result && typeof result === "object") {
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
