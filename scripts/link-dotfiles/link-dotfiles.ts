import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type CliOptions = {
	dotfilesDir: string;
	projectAgentsPath?: string;
	show: boolean;
	skipSubmodules: boolean;
	removeShellProfile: boolean;
};

function info(message: string): void {
	console.log(`[INFO] ${message}`);
}

function parseArgs(argv: string[]): CliOptions {
	let dotfilesDir = process.cwd();
	let projectAgentsPath: string | undefined;
	let show = false;
	let skipSubmodules = false;
	let removeShellProfile = false;

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];

		if (arg === "--dotfiles-dir") {
			const value = argv[i + 1];
			if (!value) {
				throw new Error("Missing value for --dotfiles-dir");
			}
			dotfilesDir = value;
			i += 1;
			continue;
		}

		if (arg === "--project-agents") {
			const value = argv[i + 1];
			if (!value) {
				throw new Error("Missing value for --project-agents");
			}
			projectAgentsPath = value;
			i += 1;
			continue;
		}

		if (arg === "--show" || arg === "-s") {
			show = true;
			continue;
		}

		if (arg === "--skip-submodules") {
			skipSubmodules = true;
			continue;
		}

		if (arg === "--remove-shell-profile") {
			removeShellProfile = true;
			continue;
		}

		if (arg === "--help" || arg === "-h") {
			console.log(
				"Usage: bun scripts/link-dotfiles/link-dotfiles.ts [options]",
			);
			console.log("");
			console.log("Options:");
			console.log(
				"  --dotfiles-dir <path>   Dotfiles repo root (default: cwd)",
			);
			console.log(
				"  --project-agents <path> Link repo agents into <path>/.claude/agents",
			);
			console.log("  --show, -s              Show current link status");
			console.log(
				"  --skip-submodules       Skip git submodule initialization",
			);
			console.log(
				"  --remove-shell-profile  Remove only the managed shell profile block for this platform",
			);
			process.exit(0);
		}

		throw new Error(`Unknown argument: ${arg}`);
	}

	return {
		dotfilesDir: path.resolve(dotfilesDir),
		projectAgentsPath: projectAgentsPath
			? path.resolve(projectAgentsPath)
			: undefined,
		show,
		skipSubmodules,
		removeShellProfile,
	};
}

async function runScript(scriptPath: string, args: string[]): Promise<void> {
	const proc = Bun.spawn([process.execPath, scriptPath, ...args], {
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
	});

	const exitCode = await proc.exited;
	if (exitCode !== 0) {
		throw new Error(
			`${path.basename(scriptPath)} failed with exit code ${exitCode}`,
		);
	}
}

async function main(): Promise<void> {
	const options = parseArgs(process.argv.slice(2));
	const scriptsDir = path.join(options.dotfilesDir, "scripts", "link-dotfiles");
	const dotfilesScript = path.join(scriptsDir, "setup-dotfiles.ts");

	if (options.show) {
		await runScript(dotfilesScript, [
			"--dotfiles-dir",
			options.dotfilesDir,
			"--show",
		]);
		return;
	}

	if (options.removeShellProfile) {
		await runScript(dotfilesScript, [
			"--dotfiles-dir",
			options.dotfilesDir,
			"--remove-shell-profile",
		]);
		return;
	}

	if (options.projectAgentsPath) {
		await runScript(dotfilesScript, [
			"--dotfiles-dir",
			options.dotfilesDir,
			"--project-agents",
			options.projectAgentsPath,
		]);
		return;
	}

	info("Running dotfiles setup...");
	const args = ["--dotfiles-dir", options.dotfilesDir];
	if (options.skipSubmodules) {
		args.push("--skip-submodules");
	}
	await runScript(dotfilesScript, args);
	info("All linking tasks completed");
}

main().catch((error) => {
	console.error("link-dotfiles failed:", error);
	process.exit(1);
});
