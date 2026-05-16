import { execSync } from "node:child_process";
import http from "node:http";

export interface ChromeProcessInfo {
	pid: number;
	port?: number;
	usesPipe: boolean;
	command: string;
}

export interface ChromeTabInfo {
	id?: string;
	title?: string;
	url?: string;
	type?: string;
}

export interface ChromeSessionDescription extends ChromeProcessInfo {
	version?: Record<string, string>;
	tabs: ChromeTabInfo[];
}

export function parseNumberListArg(value: string): number[] {
	return parseNumberList(value) ?? [];
}

export function parseNumberList(
	inputValue: string | undefined,
): number[] | undefined {
	if (!inputValue) {
		return undefined;
	}
	const parsed = inputValue
		.split(",")
		.map((entry) => Number.parseInt(entry.trim(), 10))
		.filter((value) => Number.isFinite(value));
	return parsed.length > 0 ? parsed : undefined;
}

/**
 * Enumerates DevTools-enabled Chrome processes and fetches version/tab metadata
 * for candidates matched by port, PID, or `includeAll`.
 */
export async function describeChromeSessions(options: {
	ports?: number[];
	pids?: number[];
	includeAll?: boolean;
}): Promise<ChromeSessionDescription[]> {
	const { ports, pids, includeAll } = options;
	const processes = await listDevtoolsChromes();
	const portSet = new Set(ports ?? []);
	const pidSet = new Set(pids ?? []);
	const candidates = processes.filter((proc) => {
		if (includeAll) {
			return true;
		}
		if (portSet.size > 0 && proc.port !== undefined && portSet.has(proc.port)) {
			return true;
		}
		if (pidSet.size > 0 && pidSet.has(proc.pid)) {
			return true;
		}
		return false;
	});
	const results: ChromeSessionDescription[] = [];
	for (const proc of candidates) {
		let version: Record<string, string> | undefined;
		let filteredTabs: ChromeTabInfo[] = [];
		if (proc.port !== undefined) {
			const [versionResp, tabs] = await Promise.all([
				fetchJson(`http://localhost:${proc.port}/json/version`).catch(
					() => undefined,
				),
				fetchJson(`http://localhost:${proc.port}/json/list`).catch(() => []),
			]);
			version = versionResp as Record<string, string> | undefined;
			filteredTabs = Array.isArray(tabs)
				? (tabs as ChromeTabInfo[]).filter((tab) => {
						const type = tab.type?.toLowerCase() ?? "";
						if (type && type !== "page" && type !== "app") {
							if (
								!tab.url ||
								tab.url.startsWith("devtools://") ||
								tab.url.startsWith("chrome-extension://")
							) {
								return false;
							}
						}
						if (!tab.url || tab.url.trim().length === 0) {
							return false;
						}
						return true;
					})
				: [];
		}
		results.push({
			...proc,
			version,
			tabs: filteredTabs,
		});
	}
	return results;
}

export async function listDevtoolsChromes(): Promise<ChromeProcessInfo[]> {
	if (process.platform !== "darwin" && process.platform !== "linux") {
		console.warn(
			"Chrome inspection is only supported on macOS and Linux for now.",
		);
		return [];
	}
	let output = "";
	try {
		output = execSync("ps -ax -o pid=,command=", { encoding: "utf8" });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to enumerate processes: ${message}`);
	}
	const processes: ChromeProcessInfo[] = [];
	output
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.forEach((line) => {
			const match = line.match(/^(\d+)\s+(.+)$/);
			if (!match) {
				return;
			}
			const pid = Number.parseInt(match[1], 10);
			const command = match[2];
			if (!Number.isFinite(pid) || pid <= 0) {
				return;
			}
			if (
				!/chrome/i.test(command) ||
				(!/--remote-debugging-port/.test(command) &&
					!/--remote-debugging-pipe/.test(command))
			) {
				return;
			}
			const portMatch = command.match(/--remote-debugging-port(?:=|\s+)(\d+)/);
			if (portMatch) {
				const port = Number.parseInt(portMatch[1], 10);
				if (!Number.isFinite(port)) {
					return;
				}
				processes.push({ pid, port, usesPipe: false, command });
				return;
			}
			if (/--remote-debugging-pipe/.test(command)) {
				processes.push({ pid, usesPipe: true, command });
			}
		});
	return processes;
}

/** Fetches a DevTools JSON endpoint with a millisecond timeout; default timeout is 2000ms. */
export function fetchJson(url: string, timeoutMs = 2000): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const request = http.get(url, { timeout: timeoutMs }, (response) => {
			const chunks: Buffer[] = [];
			response.on("data", (chunk) => chunks.push(chunk));
			response.on("end", () => {
				const body = Buffer.concat(chunks).toString("utf8");
				if ((response.statusCode ?? 500) >= 400) {
					reject(new Error(`HTTP ${response.statusCode} for ${url}`));
					return;
				}
				try {
					resolve(JSON.parse(body));
				} catch {
					resolve(undefined);
				}
			});
		});
		request.on("timeout", () => {
			request.destroy(new Error(`Request to ${url} timed out`));
		});
		request.on("error", (error) => {
			reject(error);
		});
	});
}
