import path from "node:path";
import { compileAgents } from "./agent-compiler";

type CompileArgs = {
  dotfilesDir: string;
  outputDir: string;
};

function parseArgs(argv: string[]): CompileArgs {
  let dotfilesDir = process.cwd();
  let outputDir = "";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dotfiles-dir") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Missing value for --dotfiles-dir");
      }

      dotfilesDir = value;
      index += 1;
      continue;
    }

    if (arg === "--out-dir") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Missing value for --out-dir");
      }

      outputDir = value;
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log("Usage: bun agent-templates/scripts/compile-agents.ts [--dotfiles-dir <path>] [--out-dir <path>]");
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  const resolvedDotfilesDir = path.resolve(dotfilesDir);

  return {
    dotfilesDir: resolvedDotfilesDir,
    outputDir: outputDir ? path.resolve(outputDir) : path.join(resolvedDotfilesDir, "agent-templates", "dist"),
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const templates = await compileAgents({
    agentsDir: path.join(args.dotfilesDir, "agent-templates"),
    configPath: path.join(args.dotfilesDir, "agent-templates", "config.toml"),
    outputDir: args.outputDir,
  });

  console.log(`Compiled ${templates.length} agent templates into ${args.outputDir}`);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error("compile-agents failed:", error);
    process.exit(1);
  });
}
