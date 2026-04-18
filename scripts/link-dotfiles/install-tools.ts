import { lstat, mkdir, readFile, readdir, rename, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ensureLinked, getSymlinkTarget, normalizeForCompare, pathExists } from "./setup-ai-agents";

type ToolInstallMode = "compile" | "link";

export type InstallableTool = {
  mode: ToolInstallMode;
  name: string;
  sourcePath: string;
  targetPath: string;
};

const COMPILED_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);
const IGNORED_TOOL_FILES = new Set(["tools.md", "trash.ts"]);
const SUPPORTED_TOOL_PLATFORMS: Partial<Record<string, NodeJS.Platform[]>> = {
  "browser-tools": ["darwin"],
};
const TOOL_NAME_OVERRIDES = new Map<string, string>([
  ["fetch.ts", "web_fetch"],
  ["search.ts", "web_search"],
]);

function backupSuffix(): string {
  const now = new Date();
  return `.backup.${now.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "")}`;
}

function toolsDirFor(dotfilesDir: string): string {
  return path.join(dotfilesDir, "tools");
}

function localBinDir(): string {
  return path.join(os.homedir(), ".local", "bin");
}

async function hasShebang(filePath: string): Promise<boolean> {
  const content = await readFile(filePath, "utf8");
  return content.startsWith("#!");
}

function installModeFor(filePath: string): ToolInstallMode {
  return COMPILED_EXTENSIONS.has(path.extname(filePath).toLowerCase()) ? "compile" : "link";
}

export function installedToolFileName(toolName: string, platformName: NodeJS.Platform = process.platform): string {
  return platformName === "win32" ? `${toolName}.exe` : toolName;
}

export function isToolSupportedOnPlatform(
  toolName: string,
  platformName: NodeJS.Platform = process.platform,
): boolean {
  const supportedPlatforms = SUPPORTED_TOOL_PLATFORMS[toolName];
  if (!supportedPlatforms) {
    return true;
  }

  return supportedPlatforms.includes(platformName);
}

function toolNameFor(filePath: string): string {
  const override = TOOL_NAME_OVERRIDES.get(path.basename(filePath));
  if (override) {
    return override;
  }

  const mode = installModeFor(filePath);
  return mode === "compile" ? path.basename(filePath, path.extname(filePath)) : path.basename(filePath);
}

export async function listInstallableTools(dotfilesDir: string): Promise<InstallableTool[]> {
  const toolsDir = toolsDirFor(dotfilesDir);
  if (!(await pathExists(toolsDir))) {
    return [];
  }

  const entries = await readdir(toolsDir, { withFileTypes: true });
  const tools: InstallableTool[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    if (IGNORED_TOOL_FILES.has(entry.name)) {
      continue;
    }

    const sourcePath = path.join(toolsDir, entry.name);
    if (!(await hasShebang(sourcePath))) {
      continue;
    }

    const name = toolNameFor(sourcePath);
    const mode = installModeFor(sourcePath);
    if (!isToolSupportedOnPlatform(name)) {
      continue;
    }

    tools.push({
      mode,
      name,
      sourcePath,
      targetPath: path.join(localBinDir(), mode === "compile" ? installedToolFileName(name) : name),
    });
  }

  return tools.sort((left, right) => left.name.localeCompare(right.name));
}

function runBunCommand(args: string[], cwd: string): void {
  const result = Bun.spawnSync([process.execPath, ...args], {
    cwd,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  if (result.exitCode !== 0) {
    throw new Error(`bun ${args.join(" ")} failed with exit code ${result.exitCode}`);
  }
}

async function prepareCompiledBinaryTarget(targetPath: string): Promise<void> {
  await mkdir(path.dirname(targetPath), { recursive: true });

  if (!(await pathExists(targetPath))) {
    return;
  }

  const existing = await lstat(targetPath);
  if (existing.isDirectory() && !existing.isSymbolicLink()) {
    const backupPath = `${targetPath}${backupSuffix()}`;
    await rename(targetPath, backupPath);
    console.log(`[INFO] Backed up existing path: ${targetPath} -> ${backupPath}`);
    return;
  }

  await rm(targetPath, { force: true, recursive: true });
  console.log(`[INFO] Removed existing tool target: ${targetPath}`);
}

async function installToolDependencies(dotfilesDir: string, tools: InstallableTool[]): Promise<void> {
  if (!tools.some((tool) => tool.mode === "compile")) {
    return;
  }

  const toolsDir = toolsDirFor(dotfilesDir);
  const packageJsonPath = path.join(toolsDir, "package.json");
  if (!(await pathExists(packageJsonPath))) {
    return;
  }

  console.log("[INFO] Installing tool dependencies...");
  runBunCommand(["install"], toolsDir);
}

async function compileToolBinary(dotfilesDir: string, tool: InstallableTool): Promise<void> {
  await prepareCompiledBinaryTarget(tool.targetPath);
  runBunCommand(["build", "--compile", tool.sourcePath, "--outfile", tool.targetPath], toolsDirFor(dotfilesDir));
  console.log(`[ACTION] Compiled: ${tool.targetPath}`);
}

async function installLinkedTool(tool: InstallableTool): Promise<void> {
  await ensureLinked(tool.sourcePath, tool.targetPath);
}

export async function installTools(dotfilesDir: string): Promise<void> {
  console.log("[INFO] Installing tools...");
  const tools = await listInstallableTools(dotfilesDir);
  if (tools.length === 0) {
    console.log("[INFO] No installable tools found");
    return;
  }

  await mkdir(localBinDir(), { recursive: true });
  await installToolDependencies(dotfilesDir, tools);

  for (const tool of tools) {
    if (tool.mode === "compile") {
      await compileToolBinary(dotfilesDir, tool);
      continue;
    }

    await installLinkedTool(tool);
  }
}

export async function showToolStatus(dotfilesDir: string): Promise<void> {
  console.log("\nTools:");
  const tools = await listInstallableTools(dotfilesDir);
  if (tools.length === 0) {
    console.log("[MISSING] No installable tools found");
    return;
  }

  for (const tool of tools) {
    if (!(await pathExists(tool.targetPath))) {
      console.log(`[MISSING] ${tool.targetPath}`);
      continue;
    }

    if (tool.mode === "compile") {
      console.log(`[OK] ${tool.targetPath} (compiled from ${path.basename(tool.sourcePath)})`);
      continue;
    }

    const existingLinkTarget = await getSymlinkTarget(tool.targetPath);
    if (!existingLinkTarget) {
      console.log(`[OK] ${tool.targetPath}`);
      continue;
    }

    const matches = normalizeForCompare(existingLinkTarget) === normalizeForCompare(tool.sourcePath);
    if (matches) {
      console.log(`[OK] ${tool.targetPath} -> ${existingLinkTarget}`);
    } else {
      console.log(`[MISMATCH] ${tool.targetPath} -> ${existingLinkTarget} (expected ${tool.sourcePath})`);
    }
  }
}
