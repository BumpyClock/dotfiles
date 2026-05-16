import type { Command } from "commander";
import { describeChromeSessions, parseNumberListArg } from "../sessions";

export function registerInspectCommand(program: Command): void {
	program
		.command("inspect")
		.description(
			"List Chrome processes launched with --remote-debugging-port and show their open tabs.",
		)
		.option(
			"--ports <list>",
			"Comma-separated list of ports to include.",
			parseNumberListArg,
		)
		.option(
			"--pids <list>",
			"Comma-separated list of PIDs to include.",
			parseNumberListArg,
		)
		.option("--json", "Emit machine-readable JSON output.", false)
		.action(async (options) => {
			const ports = (options.ports as number[] | undefined)?.filter(
				(entry) => Number.isFinite(entry) && entry > 0,
			);
			const pids = (options.pids as number[] | undefined)?.filter(
				(entry) => Number.isFinite(entry) && entry > 0,
			);
			const sessions = await describeChromeSessions({
				ports,
				pids,
				includeAll: !ports?.length && !pids?.length,
			});
			if (options.json) {
				console.log(JSON.stringify(sessions, null, 2));
				return;
			}
			if (sessions.length === 0) {
				console.log("No Chrome instances with DevTools ports found.");
				return;
			}
			sessions.forEach((session, index) => {
				if (index > 0) {
					console.log("");
				}
				const transport =
					session.port !== undefined
						? `port ${session.port}`
						: session.usesPipe
							? "debugging pipe"
							: "unknown transport";
				const header = [`Chrome PID ${session.pid}`, `(${transport})`];
				if (session.version?.Browser) {
					header.push(`- ${session.version.Browser}`);
				}
				console.log(header.join(" "));
				if (session.tabs.length === 0) {
					console.log("  (no tabs reported)");
					return;
				}
				session.tabs.forEach((tab, idx) => {
					const title = tab.title || "(untitled)";
					const url = tab.url || "(no url)";
					console.log(`  Tab ${idx + 1}: ${title}`);
					console.log(`           ${url}`);
				});
			});
		});
}
