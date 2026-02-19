import { link, lstat, mkdir, readFile, readlink, rename, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

type LinkConfig = {
  sources: Record<string, string>;
  targets: Array<{
    optional?: boolean;
    source: string;
    path: string;
  }>;
};

export type CliArgs = {
  configPath: string;
  dotfilesDir: string;
  show: boolean;
};

export function parseArgs(argv: string[]): CliArgs {
  let configPath = "scripts/ai-agent-links.json";
  let dotfilesDir = process.cwd();
  let show = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--config") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("Missing value for --config");
      }
      configPath = value;
      i += 1;
      continue;
    }

    if (arg === "--dotfiles-dir") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("Missing value for --dotfiles-dir");
      }
      dotfilesDir = value;
      i += 1;
      continue;
    }

    if (arg === "--show") {
      show = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log("Usage: bun scripts/link-dotfiles/setup-ai-agents.ts [--dotfiles-dir <path>] [--config <path>] [--show]");
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    configPath: path.resolve(dotfilesDir, configPath),
    dotfilesDir: path.resolve(dotfilesDir),
    show,
  };
}

export async function loadConfig(configPath: string): Promise<LinkConfig> {
  const raw = await readFile(configPath, "utf8");
  const parsed = JSON.parse(raw) as LinkConfig;

  if (!parsed.sources || !parsed.targets || !Array.isArray(parsed.targets)) {
    throw new Error(`Invalid config file: ${configPath}`);
  }

  return parsed;
}

export function expandHome(input: string): string {
  if (input === "~") {
    return os.homedir();
  }

  if (input.startsWith("~/")) {
    return path.join(os.homedir(), input.slice(2));
  }

  return input;
}

export function normalizeForCompare(input: string): string {
  let normalized = path.normalize(input);
  if (process.platform === "win32") {
    if (normalized.startsWith("\\\\?\\")) {
      normalized = normalized.slice(4);
    } else if (normalized.startsWith("\\??\\")) {
      normalized = normalized.slice(4);
    }

    if (normalized.startsWith("UNC\\")) {
      normalized = `\\\\${normalized.slice(4)}`;
    }

    normalized = normalized.replace(/[\\\/]+$/, "");
    return normalized.toLowerCase();
  }

  return normalized;
}

export async function getSymlinkTarget(targetPath: string): Promise<string | null> {
  try {
    const stat = await lstat(targetPath);
    if (!stat.isSymbolicLink()) {
      return null;
    }

    const rawTarget = await readlink(targetPath);
    return path.resolve(path.dirname(targetPath), rawTarget);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await lstat(targetPath);
    return true;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function backupSuffix(): string {
  const now = new Date();
  const date = now.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "");
  return `.backup.${date}`;
}

async function isHardLinkedFile(sourcePath: string, targetPath: string): Promise<boolean> {
  try {
    const [sourceStat, targetStat] = await Promise.all([lstat(sourcePath), lstat(targetPath)]);
    if (!sourceStat.isFile() || !targetStat.isFile()) {
      return false;
    }

    return sourceStat.dev === targetStat.dev && sourceStat.ino === targetStat.ino;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function createLink(sourcePath: string, targetPath: string, sourceIsDirectory: boolean): Promise<"symlink" | "junction" | "hardlink"> {
  if (sourceIsDirectory) {
    const linkType = process.platform === "win32" ? "junction" : "dir";
    await symlink(sourcePath, targetPath, linkType);
    return process.platform === "win32" ? "junction" : "symlink";
  }

  if (process.platform !== "win32") {
    await symlink(sourcePath, targetPath, "file");
    return "symlink";
  }

  try {
    await symlink(sourcePath, targetPath, "file");
    return "symlink";
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code !== "EPERM" && nodeError.code !== "EACCES") {
      throw error;
    }

    await link(sourcePath, targetPath);
    console.log(`[INFO] File symlink blocked by Windows policy; using hardlink: ${targetPath}`);
    return "hardlink";
  }
}

export async function ensureLinked(sourcePath: string, targetPath: string): Promise<void> {
  const sourceStat = await lstat(sourcePath);
  const existingLinkTarget = await getSymlinkTarget(targetPath);
  if (existingLinkTarget && normalizeForCompare(existingLinkTarget) === normalizeForCompare(sourcePath)) {
    console.log(`[SKIP] Already linked: ${targetPath}`);
    return;
  }

  if (!sourceStat.isDirectory() && !existingLinkTarget && (await isHardLinkedFile(sourcePath, targetPath))) {
    console.log(`[SKIP] Already linked (hardlink): ${targetPath}`);
    return;
  }

  await mkdir(path.dirname(targetPath), { recursive: true });

  if (await pathExists(targetPath)) {
    if (existingLinkTarget) {
      await rm(targetPath, { force: true, recursive: true });
      console.log(`[INFO] Removed stale symlink: ${targetPath}`);
    } else {
      const backupPath = `${targetPath}${backupSuffix()}`;
      await rename(targetPath, backupPath);
      console.log(`[INFO] Backed up existing path: ${targetPath} -> ${backupPath}`);
    }
  }

  try {
    const linkMode = await createLink(sourcePath, targetPath, sourceStat.isDirectory());
    console.log(`[LINK] ${sourcePath} -> ${targetPath} (${linkMode})`);
  } catch (error) {
    if (process.platform === "win32") {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === "EPERM" || nodeError.code === "EACCES") {
        throw new Error(
          `Windows permission error while linking ${targetPath}. Directory links use junctions (no elevation); file links may need Developer Mode or elevated shell.`,
        );
      }
    }
    throw error;
  }
}

export async function showLinks(config: LinkConfig, dotfilesDir: string): Promise<void> {
  console.log("AI agent link status:");

  for (const target of config.targets) {
    const sourceRelative = config.sources[target.source];
    if (!sourceRelative) {
      console.log(`[ERROR] Unknown source key '${target.source}' for target '${target.path}'`);
      continue;
    }

    const sourcePath = path.resolve(dotfilesDir, sourceRelative);
    const targetPath = path.resolve(expandHome(target.path));

    if (!(await pathExists(sourcePath))) {
      console.log(`[MISSING_SOURCE] ${sourcePath}`);
      continue;
    }

    const existingLinkTarget = await getSymlinkTarget(targetPath);
    if (!existingLinkTarget) {
      if (await pathExists(targetPath)) {
        if (await isHardLinkedFile(sourcePath, targetPath)) {
          console.log(`[OK] ${targetPath} (hardlink to ${sourcePath})`);
          continue;
        }
        if (target.optional) {
          console.log(`[OPTIONAL_CONFLICT] ${targetPath} (exists but is not a symlink)`);
          continue;
        }
        console.log(`[CONFLICT] ${targetPath} (exists but is not a symlink)`);
      } else {
        console.log(`[MISSING] ${targetPath}`);
      }
      continue;
    }

    const isMatch = normalizeForCompare(existingLinkTarget) === normalizeForCompare(sourcePath);
    if (isMatch) {
      console.log(`[OK] ${targetPath} -> ${existingLinkTarget}`);
    } else {
      console.log(`[MISMATCH] ${targetPath} -> ${existingLinkTarget} (expected ${sourcePath})`);
    }
  }
}

export async function linkAiAgents(opts: { configPath: string; dotfilesDir: string }): Promise<void> {
  const config = await loadConfig(opts.configPath);

  for (const target of config.targets) {
    const sourceRelative = config.sources[target.source];
    if (!sourceRelative) {
      console.log(`[ERROR] Unknown source key '${target.source}' for target '${target.path}'`);
      continue;
    }

    const sourcePath = path.resolve(opts.dotfilesDir, sourceRelative);
    if (!(await pathExists(sourcePath))) {
      console.log(`[WARN] Missing source path, skipping: ${sourcePath}`);
      continue;
    }

    const targetPath = path.resolve(expandHome(target.path));
    if (target.optional && (await pathExists(targetPath))) {
      const existingLinkTarget = await getSymlinkTarget(targetPath);
      if (!existingLinkTarget && !(await isHardLinkedFile(sourcePath, targetPath))) {
        console.log(`[INFO] Optional target exists and is not a link; skipping: ${targetPath}`);
        continue;
      }
    }

    try {
      await ensureLinked(sourcePath, targetPath);
    } catch (error) {
      if (target.optional) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`[WARN] Optional target failed: ${targetPath} (${message})`);
        continue;
      }
      throw error;
    }
  }
}

export async function showAiAgentLinks(opts: { configPath: string; dotfilesDir: string }): Promise<void> {
  const config = await loadConfig(opts.configPath);
  await showLinks(config, opts.dotfilesDir);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.show) {
    await showAiAgentLinks({ configPath: args.configPath, dotfilesDir: args.dotfilesDir });
    return;
  }

  await linkAiAgents({ configPath: args.configPath, dotfilesDir: args.dotfilesDir });
}

if (import.meta.main) {
  main().catch((error) => {
    console.error("setup-ai-agents failed:", error);
    process.exit(1);
  });
}
