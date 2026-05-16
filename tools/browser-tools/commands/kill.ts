import type { Command } from "commander";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { describeChromeSessions, parseNumberListArg } from "../sessions";

export function registerKillCommand(program: Command): void {
	program
		.command("kill")
		.description("Terminate Chrome instances that have DevTools ports open.")
		.option(
			"--ports <list>",
			"Comma-separated list of ports to target.",
			parseNumberListArg,
		)
		.option(
			"--pids <list>",
			"Comma-separated list of PIDs to target.",
			parseNumberListArg,
		)
		.option("--all", "Kill every matching Chrome instance.", false)
		.option("--force", "Skip the confirmation prompt.", false)
		.action(async (options) => {
			const ports = (options.ports as number[] | undefined)?.filter(
				(entry) => Number.isFinite(entry) && entry > 0,
			);
			const pids = (options.pids as number[] | undefined)?.filter(
				(entry) => Number.isFinite(entry) && entry > 0,
			);
			const killAll = Boolean(options.all);
			if (!killAll && !ports?.length && !pids?.length) {
				console.error(
					"Specify --all, --ports <list>, or --pids <list> to select targets.",
				);
				process.exit(1);
			}
			const sessions = await describeChromeSessions({
				ports,
				pids,
				includeAll: killAll,
			});
			if (sessions.length === 0) {
				console.log("No matching Chrome instances found.");
				return;
			}
			if (!options.force) {
				console.log("About to terminate the following Chrome sessions:");
				sessions.forEach((session) => {
					const transport =
						session.port !== undefined
							? `port ${session.port}`
							: session.usesPipe
								? "debugging pipe"
								: "unknown transport";
					console.log(`  PID ${session.pid} (${transport})`);
				});
				const rl = readline.createInterface({ input, output });
				const answer = (await rl.question("Proceed? [y/N] "))
					.trim()
					.toLowerCase();
				rl.close();
				if (answer !== "y" && answer !== "yes") {
					console.log("Aborted.");
					return;
				}
			}
			const failures: { pid: number; error: string }[] = [];
			sessions.forEach((session) => {
				try {
					process.kill(session.pid);
					const transport =
						session.port !== undefined
							? `port ${session.port}`
							: session.usesPipe
								? "debugging pipe"
								: "unknown transport";
					console.log(`✓ Killed Chrome PID ${session.pid} (${transport})`);
				} catch (error) {
					const message =
						error instanceof Error ? error.message : String(error);
					console.error(`✗ Failed to kill PID ${session.pid}: ${message}`);
					failures.push({ pid: session.pid, error: message });
				}
			});
			if (failures.length > 0) {
				process.exitCode = 1;
			}
		});
}
