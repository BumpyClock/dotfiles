import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type SetupMode = "dotfiles" | "ai-agents" | "both";

type CliOptions = {
  dotfilesDir: string;
  projectAgentsPath?: string;
  setupMode?: SetupMode;
  show: boolean;
  skipSubmodules: boolean;
};

function info(message: string): void {
  console.log(`[INFO] ${message}`);
}

function parseArgs(argv: string[]): CliOptions {
  let dotfilesDir = process.cwd();
  let projectAgentsPath: string | undefined;
  let setupMode: SetupMode | undefined;
  let show = false;
  let skipSubmodules = false;

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

    if (arg === "--setup") {
      const value = argv[i + 1] as SetupMode | undefined;
      if (!value || !["dotfiles", "ai-agents", "both"].includes(value)) {
        throw new Error("--setup must be one of: dotfiles, ai-agents, both");
      }
      setupMode = value;
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

    if (arg === "--help" || arg === "-h") {
      console.log("Usage: bun scripts/link-dotfiles/link-dotfiles.ts [options]");
      console.log("");
      console.log("Options:");
      console.log("  --dotfiles-dir <path>            Dotfiles repo root (default: cwd)");
      console.log("  --setup <dotfiles|ai-agents|both>  Run without interactive prompt");
      console.log("  --project-agents <path>          Link repo agents into <path>/.claude/agents");
      console.log("  --show, -s                       Show current link status");
      console.log("  --skip-submodules                Skip submodule init for dotfiles setup");
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    dotfilesDir: path.resolve(dotfilesDir),
    projectAgentsPath: projectAgentsPath ? path.resolve(projectAgentsPath) : undefined,
    setupMode,
    show,
    skipSubmodules,
  };
}

async function promptSetupMode(): Promise<SetupMode> {
  const rl = createInterface({ input, output });

  try {
    while (true) {
      console.log("\nSelect setup mode:");
      console.log("  1. Dotfiles only");
      console.log("  2. AI agents only");
      console.log("  3. Both dotfiles and AI agents");

      const answer = (await rl.question("Enter 1, 2, or 3: ")).trim();
      if (answer === "1") {
        return "dotfiles";
      }
      if (answer === "2") {
        return "ai-agents";
      }
      if (answer === "3") {
        return "both";
      }

      console.log("Invalid choice. Please enter 1, 2, or 3.");
    }
  } finally {
    rl.close();
  }
}

async function runScript(scriptPath: string, args: string[]): Promise<void> {
  const proc = Bun.spawn([process.execPath, scriptPath, ...args], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`${path.basename(scriptPath)} failed with exit code ${exitCode}`);
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const scriptsDir = path.join(options.dotfilesDir, "scripts", "link-dotfiles");
  const dotfilesScript = path.join(scriptsDir, "setup-dotfiles.ts");
  const aiAgentsScript = path.join(scriptsDir, "setup-ai-agents.ts");

  if (options.show) {
    await runScript(dotfilesScript, ["--dotfiles-dir", options.dotfilesDir, "--show"]);
    return;
  }

  const setupMode = options.setupMode ?? (await promptSetupMode());

  if (setupMode === "dotfiles") {
    info("Running dotfiles setup...");
    const args = ["--dotfiles-dir", options.dotfilesDir, "--skip-ai-agents"];
    if (options.projectAgentsPath) {
      args.push("--project-agents", options.projectAgentsPath);
    }
    if (options.skipSubmodules) {
      args.push("--skip-submodules");
    }
    await runScript(dotfilesScript, args);
    return;
  }

  if (setupMode === "ai-agents") {
    info("Running AI agents setup...");
    await runScript(aiAgentsScript, ["--dotfiles-dir", options.dotfilesDir]);
    return;
  }

  info("Running dotfiles setup...");
  const dotfilesArgs = ["--dotfiles-dir", options.dotfilesDir, "--skip-ai-agents"];
  if (options.projectAgentsPath) {
    dotfilesArgs.push("--project-agents", options.projectAgentsPath);
  }
  if (options.skipSubmodules) {
    dotfilesArgs.push("--skip-submodules");
  }
  await runScript(dotfilesScript, dotfilesArgs);

  info("Running AI agents setup...");
  await runScript(aiAgentsScript, ["--dotfiles-dir", options.dotfilesDir]);
}

main().catch((error) => {
  console.error("link-dotfiles orchestrator failed:", error);
  process.exit(1);
});
