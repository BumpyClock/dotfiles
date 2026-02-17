import type { CliOptions, ReasoningEffort } from "./types";
import { getProviderAdapter, listProviderNames } from "../providers/registry";
import { loadOuroborosConfig } from "./config";

type CliOverrides = {
  provider?: string;
  promptPath?: string;
  iterationLimit?: number;
  iterationsSet: boolean;
  previewLines?: number;
  parallelAgents?: number;
  pauseMs?: number;
  command?: string;
  model?: string;
  reasoningEffort?: ReasoningEffort;
  yolo?: boolean;
  logDir?: string;
  showRaw?: boolean;
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

function parseNonNegativeInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) || parsed < 0 ? fallback : parsed;
}

function parseCliOverrides(argv: string[]): CliOverrides {
  const overrides: CliOverrides = {
    iterationsSet: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--provider") {
      overrides.provider = (argv[i + 1] ?? "").trim().toLowerCase();
      i += 1;
    } else if (arg === "--prompt" || arg === "-p") {
      overrides.promptPath = argv[i + 1];
      i += 1;
    } else if (arg === "--iterations" || arg === "-n") {
      overrides.iterationLimit = parsePositiveInt(argv[i + 1], 50);
      overrides.iterationsSet = true;
      i += 1;
    } else if (arg === "--preview" || arg === "-l") {
      overrides.previewLines = parsePositiveInt(argv[i + 1], 3);
      i += 1;
    } else if (arg === "--parallel" || arg === "-P") {
      overrides.parallelAgents = parsePositiveInt(argv[i + 1], 1);
      i += 1;
    } else if (arg === "--pause-ms") {
      overrides.pauseMs = parseNonNegativeInt(argv[i + 1], 0);
      i += 1;
    } else if (arg === "--command" || arg === "-c") {
      overrides.command = argv[i + 1];
      i += 1;
    } else if (arg === "--model" || arg === "-m") {
      overrides.model = argv[i + 1] ?? "";
      i += 1;
    } else if (arg === "--reasoning-effort") {
      const value = (argv[i + 1] ?? "").toLowerCase();
      if (value === "low" || value === "medium" || value === "high") {
        overrides.reasoningEffort = value;
      }
      i += 1;
    } else if (arg === "--yolo") {
      overrides.yolo = true;
    } else if (arg === "--no-yolo") {
      overrides.yolo = false;
    } else if (arg === "--log-dir") {
      overrides.logDir = argv[i + 1];
      i += 1;
    } else if (arg === "--show-raw") {
      overrides.showRaw = true;
    }
  }

  return overrides;
}

export function printUsage(): void {
  const providers = listProviderNames().join(", ");
  console.log(`Usage:
  ouroboros [options]

Options:
  --provider <name>        Agent provider. default: codex (supported: ${providers})
  -p, --prompt <path>      Prompt file path. default: .ai_agents/prompt.md
  -n, --iterations <n>     Max loops. default: 50
  -l, --preview <n>        Number of recent messages shown. default: 3
  -P, --parallel <n>       Run n agents per iteration. default: 1
      --pause-ms <ms>      Pause between loops in milliseconds. default: 0
  -c, --command <cmd>      Base command to run. default: provider-specific
      --log-dir <path>     Directory for per-iteration logs. default: provider-specific
      --show-raw           Stream raw provider output to terminal (default: off)
  -h, --help               Show this help message

Provider-specific (codex):
  -m, --model <model>      Model passed to codex exec -m
      --reasoning-effort   low|medium|high for reasoning_effort
      --yolo               Pass --yolo to codex exec
      --no-yolo            Disable --yolo

Config:
  - Global config: ~/.ouroboros/config.json
  - Project config: ~/.ouroboros/projects/<derived-git-root-key>.json
  - Merge order: CLI > project > global > provider defaults`);
}

export function parseArgs(argv = process.argv.slice(2)): CliOptions {
  if (argv.includes("--help") || argv.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const config = loadOuroborosConfig(process.cwd());
  const cli = parseCliOverrides(argv);
  const providerName =
    cli.provider ?? config.projectConfig.provider ?? config.globalConfig.provider ?? "codex";
  const provider = getProviderAdapter(providerName);

  const pick = <T>(...values: Array<T | undefined>): T | undefined => {
    for (const value of values) {
      if (value !== undefined) {
        return value;
      }
    }
    return undefined;
  };

  const iterationLimit = pick(
    cli.iterationLimit,
    config.projectConfig.iterationLimit,
    config.globalConfig.iterationLimit,
    50
  ) as number;
  const iterationsSet =
    cli.iterationsSet ||
    config.projectConfig.iterationLimit !== undefined ||
    config.globalConfig.iterationLimit !== undefined;

  return {
    projectRoot: config.projectRoot,
    projectKey: config.projectKey,
    provider: provider.name,
    promptPath: pick(cli.promptPath, config.projectConfig.promptPath, config.globalConfig.promptPath, ".ai_agents/prompt.md") as string,
    iterationLimit,
    iterationsSet,
    previewLines: pick(cli.previewLines, config.projectConfig.previewLines, config.globalConfig.previewLines, 3) as number,
    parallelAgents: pick(cli.parallelAgents, config.projectConfig.parallelAgents, config.globalConfig.parallelAgents, 1) as number,
    pauseMs: pick(cli.pauseMs, config.projectConfig.pauseMs, config.globalConfig.pauseMs, 0) as number,
    command: pick(cli.command, config.projectConfig.command, config.globalConfig.command, provider.defaults.command) as string,
    model: pick(cli.model, config.projectConfig.model, config.globalConfig.model, provider.defaults.model) as string,
    reasoningEffort: pick(
      cli.reasoningEffort,
      config.projectConfig.reasoningEffort,
      config.globalConfig.reasoningEffort,
      provider.defaults.reasoningEffort
    ) as ReasoningEffort,
    yolo: pick(cli.yolo, config.projectConfig.yolo, config.globalConfig.yolo, provider.defaults.yolo) as boolean,
    logDir: pick(cli.logDir, config.projectConfig.logDir, config.globalConfig.logDir, provider.defaults.logDir) as string,
    showRaw: pick(cli.showRaw, config.projectConfig.showRaw, config.globalConfig.showRaw, false) as boolean,
  };
}
