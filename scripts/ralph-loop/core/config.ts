import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import type { CliOptions, ReasoningEffort } from "./types";

type PartialOptions = Partial<
  Omit<CliOptions, "provider" | "projectRoot" | "projectKey" | "iterationsSet">
> & {
  provider?: string;
  reasoningEffort?: ReasoningEffort;
};

type LoadedConfig = {
  globalConfigPath: string;
  projectConfigPath: string;
  projectRoot: string;
  projectKey: string;
  globalConfig: PartialOptions;
  projectConfig: PartialOptions;
};

function resolveGitRoot(cwd: string): string {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    throw new Error("Unable to derive project config without a git repository root");
  }
}

function projectKeyFromRoot(projectRoot: string): string {
  const normalized = path.resolve(projectRoot).toLowerCase();
  const basename = path.basename(projectRoot).replace(/[^a-zA-Z0-9._-]/g, "_") || "project";
  const hash = createHash("sha1").update(normalized).digest("hex").slice(0, 10);
  return `${basename}-${hash}`;
}

function parseJsonFile(configPath: string): Record<string, unknown> {
  if (!existsSync(configPath)) {
    return {};
  }
  const raw = readFileSync(configPath, "utf8").trim();
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Config root must be an object");
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid config at ${configPath}: ${message}`);
  }
}

function toString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function toBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function toPositiveInt(value: unknown): number | undefined {
  const numeric = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return undefined;
  }
  return numeric;
}

function toNonNegativeInt(value: unknown): number | undefined {
  const numeric = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return undefined;
  }
  return numeric;
}

function toReasoningEffort(value: unknown): ReasoningEffort | undefined {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return undefined;
}

function normalizeConfigRecord(input: Record<string, unknown>): PartialOptions {
  return {
    provider: toString(input.provider)?.toLowerCase(),
    promptPath: toString(input.promptPath),
    iterationLimit: toPositiveInt(input.iterationLimit),
    previewLines: toPositiveInt(input.previewLines),
    parallelAgents: toPositiveInt(input.parallelAgents),
    pauseMs: toNonNegativeInt(input.pauseMs),
    command: toString(input.command),
    model: toString(input.model),
    reasoningEffort: toReasoningEffort(input.reasoningEffort),
    yolo: toBoolean(input.yolo),
    logDir: toString(input.logDir),
    showRaw: toBoolean(input.showRaw),
  };
}

export function loadOuroborosConfig(cwd = process.cwd()): LoadedConfig {
  const projectRoot = resolveGitRoot(cwd);
  const projectKey = projectKeyFromRoot(projectRoot);
  const ouroborosDir = path.join(homedir(), ".ouroboros");
  const globalConfigPath = path.join(ouroborosDir, "config.json");
  const projectConfigPath = path.join(ouroborosDir, "projects", `${projectKey}.json`);
  const globalConfig = normalizeConfigRecord(parseJsonFile(globalConfigPath));
  const projectConfig = normalizeConfigRecord(parseJsonFile(projectConfigPath));
  return {
    globalConfigPath,
    projectConfigPath,
    projectRoot,
    projectKey,
    globalConfig,
    projectConfig,
  };
}
