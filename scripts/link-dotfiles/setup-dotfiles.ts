import { chmod, copyFile, lstat, mkdir, readFile, readlink, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ensureLinked, linkAiAgents, pathExists, showAiAgentLinks } from "./setup-ai-agents";

type CliOptions = {
  dotfilesDir: string;
  projectAgentsPath?: string;
  show: boolean;
  skipSubmodules: boolean;
  skipAiAgents: boolean;
};

function info(message: string): void {
  console.log(`[INFO] ${message}`);
}

function warn(message: string): void {
  console.log(`[WARN] ${message}`);
}

function action(message: string): void {
  console.log(`[ACTION] ${message}`);
}

function parseArgs(argv: string[]): CliOptions {
  let dotfilesDir = process.cwd();
  let projectAgentsPath: string | undefined;
  let show = false;
  let skipSubmodules = false;
  let skipAiAgents = false;

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

    if (arg === "--skip-ai-agents") {
      skipAiAgents = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log("Usage: bun scripts/link-dotfiles/setup-dotfiles.ts [options]");
      console.log("");
      console.log("Options:");
      console.log("  --dotfiles-dir <path>   Dotfiles repo root (default: cwd)");
      console.log("  --project-agents <path> Link repo agents into <path>/.claude/agents");
      console.log("  --show, -s              Show current link status");
      console.log("  --skip-submodules       Skip git submodule initialization");
      console.log("  --skip-ai-agents        Do not run AI agent mapping links");
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    dotfilesDir: path.resolve(dotfilesDir),
    projectAgentsPath: projectAgentsPath ? path.resolve(projectAgentsPath) : undefined,
    show,
    skipSubmodules,
    skipAiAgents,
  };
}

function homePath(relativePath: string): string {
  return path.join(os.homedir(), relativePath);
}

async function initializeSubmodules(dotfilesDir: string): Promise<void> {
  info("Initializing git submodules...");
  const result = Bun.spawnSync(["git", "submodule", "update", "--init", "--recursive"], {
    cwd: dotfilesDir,
    stdout: "ignore",
    stderr: "pipe",
  });

  if (result.exitCode !== 0) {
    const stderr = Buffer.from(result.stderr).toString("utf8").trim();
    warn(`Failed to initialize submodules: ${stderr || "unknown error"}`);
    return;
  }

  info("Git submodules initialized");
}

async function linkIfPresent(dotfilesDir: string, sourceRelative: string, targetPath: string): Promise<void> {
  const sourcePath = path.join(dotfilesDir, sourceRelative);
  if (!(await pathExists(sourcePath))) {
    return;
  }

  await ensureLinked(sourcePath, targetPath);
}

async function linkDotfiles(dotfilesDir: string): Promise<void> {
  info("Linking base dotfiles...");
  const targets = [
    { source: ".gitconfig", target: homePath(".gitconfig") },
    { source: ".gitignore_global", target: homePath(".gitignore_global") },
    { source: ".tmux.conf", target: homePath(".tmux.conf") },
    { source: ".vimrc", target: homePath(".vimrc") },
  ];

  for (const target of targets) {
    await linkIfPresent(dotfilesDir, target.source, target.target);
  }
}

async function linkGitHubConfig(dotfilesDir: string): Promise<void> {
  info("Linking GitHub configuration...");
  const githubRoot = homePath(".github");
  await mkdir(githubRoot, { recursive: true });

  await linkIfPresent(dotfilesDir, ".github/copilot-instructions.md", path.join(githubRoot, "copilot-instructions.md"));
  await linkIfPresent(dotfilesDir, ".github/prompts", path.join(githubRoot, "prompts"));
  await linkIfPresent(dotfilesDir, "agents", path.join(githubRoot, "agents"));
}

async function linkConfigDirs(dotfilesDir: string): Promise<void> {
  info("Linking configuration directories...");
  const configRoot = homePath(".config");
  await mkdir(configRoot, { recursive: true });

  const targets = [
    { source: ".config/starship.toml", target: path.join(configRoot, "starship.toml") },
    { source: ".config/nvim", target: path.join(configRoot, "nvim") },
    { source: ".config/alacritty", target: path.join(configRoot, "alacritty") },
    { source: ".config/kitty", target: path.join(configRoot, "kitty") },
    { source: ".config/wezterm", target: path.join(configRoot, "wezterm") },
  ];

  for (const target of targets) {
    await linkIfPresent(dotfilesDir, target.source, target.target);
  }
}

async function linkWindowsExtras(dotfilesDir: string): Promise<void> {
  if (process.platform !== "win32") {
    return;
  }

  info("Linking Windows-specific configuration...");

  const terminalSettingsSource = path.join(dotfilesDir, ".config/windows-terminal/settings.json");
  const terminalRoots = [
    path.join(os.homedir(), "AppData/Local/Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/LocalState"),
    path.join(os.homedir(), "AppData/Local/Packages/Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe/LocalState"),
  ];

  if (await pathExists(terminalSettingsSource)) {
    for (const terminalRoot of terminalRoots) {
      if (await pathExists(terminalRoot)) {
        await ensureLinked(terminalSettingsSource, path.join(terminalRoot, "settings.json"));
      }
    }
  }

  const profileSource = path.join(dotfilesDir, ".config/powershell/profile.ps1");
  if (await pathExists(profileSource)) {
    const profileTargets = [
      path.join(os.homedir(), "Documents/PowerShell/Microsoft.PowerShell_profile.ps1"),
      path.join(os.homedir(), "Documents/WindowsPowerShell/Microsoft.PowerShell_profile.ps1"),
    ];

    for (const profileTarget of profileTargets) {
      await ensureLinked(profileSource, profileTarget);
    }
  }
}

async function parseEnvValue(filePath: string, key: string): Promise<string | undefined> {
  if (!(await pathExists(filePath))) {
    return undefined;
  }

  const content = await readFile(filePath, "utf8");
  const regex = new RegExp(`${key}\\s*=\\s*\"([^\"]+)\"`);
  const match = content.match(regex);
  return match?.[1];
}

async function promptUser(question: string): Promise<string> {
  const rl = createInterface({ input, output });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

async function ensureWritableTarget(targetPath: string): Promise<void> {
  await mkdir(path.dirname(targetPath), { recursive: true });

  if (!(await pathExists(targetPath))) {
    return;
  }

  const stat = await lstat(targetPath);
  if (stat.isSymbolicLink()) {
    await rm(targetPath, { force: true, recursive: true });
  }
}

async function writeGeneratedScript(
  templatePath: string,
  targetPath: string,
  replacements: Record<string, string>,
  executable: boolean,
): Promise<void> {
  if (!(await pathExists(templatePath))) {
    return;
  }

  let content = await readFile(templatePath, "utf8");
  for (const [token, value] of Object.entries(replacements)) {
    content = content.replaceAll(token, value);
  }

  await ensureWritableTarget(targetPath);
  await writeFile(targetPath, content, "utf8");
  if (executable) {
    await chmod(targetPath, 0o755);
  }
  action(`Generated: ${targetPath}`);
}

async function installUnixBinScripts(dotfilesDir: string): Promise<void> {
  info("Installing Unix bin scripts...");
  const binDir = homePath(".local/bin");
  await mkdir(binDir, { recursive: true });

  const glmSecrets = path.join(dotfilesDir, "secrets/claude-code/glm/glm.sh");
  let glmToken = await parseEnvValue(glmSecrets, "ANTHROPIC_AUTH_TOKEN");

  if (!glmToken) {
    warn(`GLM secrets not found at ${glmSecrets}`);
    const response = (await promptUser("Install cz script anyway? (y/n): ")).toLowerCase();
    if (response === "y") {
      glmToken = await promptUser("Enter your Z.ai GLM API key: ");
    }
  }

  if (glmToken) {
    await writeGeneratedScript(
      path.join(dotfilesDir, "shell/bin/zsh/cz.sh"),
      path.join(binDir, "cz"),
      { "__ANTHROPIC_AUTH_TOKEN__": glmToken },
      true,
    );
  }

  const kimiSecrets = path.join(dotfilesDir, "secrets/claude-code/kimi/kimi.sh");
  const kimiToken = await parseEnvValue(kimiSecrets, "ANTHROPIC_AUTH_TOKEN");
  const kimiBaseUrl = await parseEnvValue(kimiSecrets, "ANTHROPIC_BASE_URL");
  const kimiModel = await parseEnvValue(kimiSecrets, "ANTHROPIC_DEFAULT_SONNET_MODEL");

  if (kimiToken && kimiToken !== "__KIMI_AUTH_TOKEN__" && kimiBaseUrl && kimiModel) {
    await writeGeneratedScript(
      path.join(dotfilesDir, "shell/bin/zsh/ck.sh"),
      path.join(binDir, "ck"),
      {
        "__KIMI_AUTH_TOKEN__": kimiToken,
        "__KIMI_BASE_URL__": kimiBaseUrl,
        "__KIMI_MODEL__": kimiModel,
      },
      true,
    );
  } else {
    warn("Kimi not configured, skipping ck script generation");
  }

  const ccySource = path.join(dotfilesDir, "shell/bin/zsh/ccy.sh");
  const ccyTarget = path.join(binDir, "ccy");
  if (await pathExists(ccySource)) {
    await ensureWritableTarget(ccyTarget);
    await copyFile(ccySource, ccyTarget);
    await chmod(ccyTarget, 0o755);
    action(`Copied: ${ccyTarget}`);
  }
}

async function installWindowsBinScripts(dotfilesDir: string): Promise<void> {
  info("Installing PowerShell bin scripts...");
  const binDir = homePath(".local/bin");
  await mkdir(binDir, { recursive: true });

  const glmSecrets = path.join(dotfilesDir, "secrets/claude-code/glm/glm.ps1");
  let glmToken = await parseEnvValue(glmSecrets, "ANTHROPIC_AUTH_TOKEN");

  if (!glmToken) {
    warn(`GLM secrets not found at ${glmSecrets}`);
    const response = (await promptUser("Install cz.ps1 script anyway? (y/n): ")).toLowerCase();
    if (response === "y") {
      glmToken = await promptUser("Enter your Z.ai GLM API key: ");
    }
  }

  if (glmToken) {
    await writeGeneratedScript(
      path.join(dotfilesDir, "shell/bin/powershell/cz.ps1"),
      path.join(binDir, "cz.ps1"),
      { "__ANTHROPIC_AUTH_TOKEN__": glmToken },
      false,
    );
  }

  const kimiSecrets = path.join(dotfilesDir, "secrets/claude-code/kimi/kimi.ps1");
  const kimiToken = await parseEnvValue(kimiSecrets, "ANTHROPIC_AUTH_TOKEN");
  const kimiBaseUrl = await parseEnvValue(kimiSecrets, "ANTHROPIC_BASE_URL");
  const kimiModel = await parseEnvValue(kimiSecrets, "ANTHROPIC_DEFAULT_SONNET_MODEL");

  if (kimiToken && kimiToken !== "__KIMI_AUTH_TOKEN__" && kimiBaseUrl && kimiModel) {
    await writeGeneratedScript(
      path.join(dotfilesDir, "shell/bin/powershell/ck.ps1"),
      path.join(binDir, "ck.ps1"),
      {
        "__KIMI_AUTH_TOKEN__": kimiToken,
        "__KIMI_BASE_URL__": kimiBaseUrl,
        "__KIMI_MODEL__": kimiModel,
      },
      false,
    );
  } else {
    warn("Kimi not configured, skipping ck.ps1 script generation");
  }

  const ccySource = path.join(dotfilesDir, "shell/bin/powershell/ccy.ps1");
  const ccyTarget = path.join(binDir, "ccy.ps1");
  if (await pathExists(ccySource)) {
    await ensureWritableTarget(ccyTarget);
    await copyFile(ccySource, ccyTarget);
    action(`Copied: ${ccyTarget}`);
  }
}

async function linkProjectAgents(dotfilesDir: string, projectPath: string): Promise<void> {
  info(`Linking agents into project: ${projectPath}`);
  if (!(await pathExists(projectPath))) {
    throw new Error(`Project path does not exist: ${projectPath}`);
  }

  const projectStat = await lstat(projectPath);
  if (!projectStat.isDirectory()) {
    throw new Error(`Project path is not a directory: ${projectPath}`);
  }

  const source = path.join(dotfilesDir, "agents");
  if (!(await pathExists(source))) {
    throw new Error(`Agents source missing: ${source}`);
  }

  const target = path.join(projectPath, ".claude/agents");
  await ensureLinked(source, target);
}

async function printLinkStatus(pathLabel: string, targetPath: string): Promise<void> {
  if (!(await pathExists(targetPath))) {
    return;
  }

  const stat = await lstat(targetPath);
  if (!stat.isSymbolicLink()) {
    return;
  }

  const linkTarget = await readlink(targetPath);
  console.log(`  ${pathLabel} -> ${linkTarget}`);
}

async function showStatus(dotfilesDir: string): Promise<void> {
  info("Current link status");
  console.log("");

  await printLinkStatus(".gitconfig", homePath(".gitconfig"));
  await printLinkStatus(".gitignore_global", homePath(".gitignore_global"));
  await printLinkStatus(".tmux.conf", homePath(".tmux.conf"));
  await printLinkStatus(".vimrc", homePath(".vimrc"));

  console.log("\nAI mappings:");
  await showAiAgentLinks({
    configPath: path.join(dotfilesDir, "scripts/ai-agent-links.json"),
    dotfilesDir,
  });
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const dotfilesDir = options.dotfilesDir;

  if (options.show) {
    await showStatus(dotfilesDir);
    return;
  }

  if (options.projectAgentsPath) {
    await linkProjectAgents(dotfilesDir, options.projectAgentsPath);
    return;
  }

  if (!options.skipSubmodules) {
    await initializeSubmodules(dotfilesDir);
  }

  await linkDotfiles(dotfilesDir);

  if (!options.skipAiAgents) {
    await linkAiAgents({
      configPath: path.join(dotfilesDir, "scripts/ai-agent-links.json"),
      dotfilesDir,
    });
  }

  await linkGitHubConfig(dotfilesDir);
  await linkConfigDirs(dotfilesDir);
  await linkWindowsExtras(dotfilesDir);

  if (process.platform === "win32") {
    await installWindowsBinScripts(dotfilesDir);
  } else {
    await installUnixBinScripts(dotfilesDir);
  }

  info("All linking tasks completed");
}

main().catch((error) => {
  console.error("link-dotfiles failed:", error);
  process.exit(1);
});
