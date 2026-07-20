import {
	chmod,
	copyFile,
	lstat,
	mkdir,
	readFile,
	readlink,
	rename,
	rm,
	writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { installTools, showToolStatus } from "./install-tools";
import {
	type ManagedBlockMarkers,
	formatTimestamp,
	prependManagedBlock,
	reconcileManagedBlock,
	removeManagedBlock,
} from "./managed-block";
import { ensureLinked, pathExists } from "./setup-ai-agents";

type CliOptions = {
	dotfilesDir: string;
	projectAgentsPath?: string;
	show: boolean;
	skipSubmodules: boolean;
	removeShellProfile: boolean;
};

type EnvironmentConfigValue = Record<string, string> | string;

const ENV_CONFIG_RELATIVE_PATH = "secrets/api-keys/env.json";
const ENV_CONFIG_TARGET_DIR = ".config/dotfiles";
const ENV_SCRIPT_NAME = "env.sh";
const POWERSHELL_ENV_SCRIPT_NAME = "env.ps1";

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
				"Usage: bun scripts/link-dotfiles/setup-dotfiles.ts [options]",
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

function homePath(relativePath: string): string {
	return path.join(os.homedir(), relativePath);
}

async function initializeSubmodules(dotfilesDir: string): Promise<void> {
	info("Initializing git submodules...");
	const result = Bun.spawnSync(
		["git", "submodule", "update", "--init", "--recursive"],
		{
			cwd: dotfilesDir,
			stdout: "ignore",
			stderr: "pipe",
		},
	);

	if (result.exitCode !== 0) {
		const stderr = Buffer.from(result.stderr).toString("utf8").trim();
		warn(`Failed to initialize submodules: ${stderr || "unknown error"}`);
		return;
	}

	info("Git submodules initialized");
}

async function linkIfPresent(
	dotfilesDir: string,
	sourceRelative: string,
	targetPath: string,
): Promise<void> {
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

	await linkIfPresent(
		dotfilesDir,
		".github/copilot-instructions.md",
		path.join(githubRoot, "copilot-instructions.md"),
	);
	await linkIfPresent(
		dotfilesDir,
		".github/prompts",
		path.join(githubRoot, "prompts"),
	);
	await linkIfPresent(dotfilesDir, "agents", path.join(githubRoot, "agents"));
}

async function linkConfigDirs(dotfilesDir: string): Promise<void> {
	info("Linking configuration directories...");
	const configRoot = homePath(".config");
	await mkdir(configRoot, { recursive: true });

	const targets = [
		{
			source: ".config/starship.toml",
			target: path.join(configRoot, "starship.toml"),
		},
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

	const terminalSettingsSource = path.join(
		dotfilesDir,
		".config/windows-terminal/settings.json",
	);
	const terminalRoots = [
		path.join(
			os.homedir(),
			"AppData/Local/Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/LocalState",
		),
		path.join(
			os.homedir(),
			"AppData/Local/Packages/Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe/LocalState",
		),
	];

	if (await pathExists(terminalSettingsSource)) {
		for (const terminalRoot of terminalRoots) {
			if (await pathExists(terminalRoot)) {
				await ensureLinked(
					terminalSettingsSource,
					path.join(terminalRoot, "settings.json"),
				);
			}
		}
	}
}

async function parseEnvValue(
	filePath: string,
	key: string,
): Promise<string | undefined> {
	if (!(await pathExists(filePath))) {
		return undefined;
	}

	const content = await readFile(filePath, "utf8");
	const regex = new RegExp(`${key}\\s*=\\s*"([^"]+)"`);
	const match = content.match(regex);
	return match?.[1];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateEnvironmentVariableName(name: string, context: string): void {
	if (!/^[A-Z_][A-Z0-9_]*$/.test(name)) {
		throw new Error(`Invalid environment variable '${name}' in ${context}`);
	}
}

export function flattenEnvironmentConfig(
	config: unknown,
): Record<string, string> {
	if (!isRecord(config)) {
		throw new Error("Environment config must be a JSON object");
	}

	const environment = new Map<string, string>();

	const addVariable = (name: string, value: string, context: string): void => {
		validateEnvironmentVariableName(name, context);

		if (environment.has(name)) {
			throw new Error(`Duplicate environment variable '${name}' in ${context}`);
		}

		environment.set(name, value);
	};

	for (const [groupName, groupValue] of Object.entries(
		config as Record<string, EnvironmentConfigValue>,
	)) {
		if (typeof groupValue === "string") {
			addVariable(groupName, groupValue, "root");
			continue;
		}

		if (!isRecord(groupValue)) {
			throw new Error(
				`Environment group '${groupName}' must be an object or string`,
			);
		}

		for (const [name, value] of Object.entries(groupValue)) {
			if (typeof value !== "string") {
				throw new Error(
					`Environment variable '${name}' in '${groupName}' must be a string`,
				);
			}

			addVariable(name, value, groupName);
		}
	}

	return Object.fromEntries(
		[...environment.entries()].sort(([left], [right]) =>
			left.localeCompare(right),
		),
	);
}

function escapeShellValue(value: string): string {
	return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function escapePowerShellValue(value: string): string {
	return value.replaceAll("'", "''");
}

export function renderShellEnvironmentScript(
	environment: Record<string, string>,
): string {
	const lines = [
		"# Generated by scripts/link-dotfiles/setup-dotfiles.ts",
		"# Source of truth: secrets/api-keys/env.json",
	];

	for (const [name, value] of Object.entries(environment)) {
		lines.push(`export ${name}=${escapeShellValue(value)}`);
	}

	return `${lines.join("\n")}\n`;
}

export function renderPowerShellEnvironmentScript(
	environment: Record<string, string>,
): string {
	const lines = [
		"# Generated by scripts/link-dotfiles/setup-dotfiles.ts",
		"# Source of truth: secrets/api-keys/env.json",
	];

	for (const [name, value] of Object.entries(environment)) {
		lines.push(`$env:${name} = '${escapePowerShellValue(value)}'`);
	}

	return `${lines.join("\n")}\n`;
}

export async function loadManagedEnvironment(
	dotfilesDir: string,
): Promise<Record<string, string>> {
	const configPath = path.join(dotfilesDir, ENV_CONFIG_RELATIVE_PATH);
	if (!(await pathExists(configPath))) {
		return {};
	}

	const content = await readFile(configPath, "utf8");
	let parsed: unknown;
	try {
		parsed = JSON.parse(content);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(
			`Invalid environment config JSON at ${configPath}: ${message}`,
		);
	}

	return flattenEnvironmentConfig(parsed);
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

async function removeGeneratedFile(targetPath: string): Promise<void> {
	if (!(await pathExists(targetPath))) {
		return;
	}

	await rm(targetPath, { force: true });
	action(`Removed: ${targetPath}`);
}

async function writeManagedEnvironmentFile(
	targetPath: string,
	content: string,
): Promise<void> {
	await ensureWritableTarget(targetPath);
	await writeFile(targetPath, content, "utf8");
	action(`Generated: ${targetPath}`);
}

async function installManagedEnvironment(dotfilesDir: string): Promise<void> {
	info("Installing managed environment variables...");

	const configPath = path.join(dotfilesDir, ENV_CONFIG_RELATIVE_PATH);
	const targetDir = homePath(ENV_CONFIG_TARGET_DIR);
	const shellTargetPath = path.join(targetDir, ENV_SCRIPT_NAME);
	const powershellTargetPath = path.join(targetDir, POWERSHELL_ENV_SCRIPT_NAME);

	// Start with environment from env.json
	const environment = await loadManagedEnvironment(dotfilesDir);

	// Add ZAI_API_KEY from GLM secrets if available
	const glmSecretsPath = path.join(
		dotfilesDir,
		"secrets/claude-code/glm/glm.sh",
	);
	const glmToken = await parseEnvValue(glmSecretsPath, "ANTHROPIC_AUTH_TOKEN");
	if (glmToken && glmToken !== "__ANTHROPIC_AUTH_TOKEN__") {
		environment.ZAI_API_KEY = glmToken;
	}

	if (Object.keys(environment).length === 0) {
		warn("No environment variables to install");
		await removeGeneratedFile(shellTargetPath);
		await removeGeneratedFile(powershellTargetPath);
		return;
	}

	await mkdir(targetDir, { recursive: true });
	await writeManagedEnvironmentFile(
		shellTargetPath,
		renderShellEnvironmentScript(environment),
	);
	await writeManagedEnvironmentFile(
		powershellTargetPath,
		renderPowerShellEnvironmentScript(environment),
	);
}

async function installUnixBinScripts(dotfilesDir: string): Promise<void> {
	info("Installing Unix bin scripts...");
	const binDir = homePath(".local/bin");
	await mkdir(binDir, { recursive: true });

	const glmSecrets = path.join(dotfilesDir, "secrets/claude-code/glm/glm.sh");
	let glmToken = await parseEnvValue(glmSecrets, "ANTHROPIC_AUTH_TOKEN");

	if (!glmToken) {
		warn(`GLM secrets not found at ${glmSecrets}`);
		const response = (
			await promptUser("Install cz script anyway? (y/n): ")
		).toLowerCase();
		if (response === "y") {
			glmToken = await promptUser("Enter your Z.ai GLM API key: ");
		}
	}

	if (glmToken) {
		await writeGeneratedScript(
			path.join(dotfilesDir, "shell/bin/zsh/cz.sh"),
			path.join(binDir, "cz"),
			{
				__ANTHROPIC_AUTH_TOKEN__: glmToken,
				__ANTHROPIC_BASE_URL__:
					(await parseEnvValue(glmSecrets, "ANTHROPIC_BASE_URL")) ??
					"https://api.z.ai/api/anthropic",
				__API_TIMEOUT_MS__:
					(await parseEnvValue(glmSecrets, "API_TIMEOUT_MS")) ?? "3000000",
				__ANTHROPIC_DEFAULT_HAIKU_MODEL__:
					(await parseEnvValue(glmSecrets, "ANTHROPIC_DEFAULT_HAIKU_MODEL")) ??
					"glm-5",
				__ANTHROPIC_DEFAULT_SONNET_MODEL__:
					(await parseEnvValue(glmSecrets, "ANTHROPIC_DEFAULT_SONNET_MODEL")) ??
					"glm-5",
				__ANTHROPIC_DEFAULT_OPUS_MODEL__:
					(await parseEnvValue(glmSecrets, "ANTHROPIC_DEFAULT_OPUS_MODEL")) ??
					"glm-5",
			},
			true,
		);
	}

	const kimiSecrets = path.join(
		dotfilesDir,
		"secrets/claude-code/kimi/kimi.sh",
	);
	const kimiToken = await parseEnvValue(kimiSecrets, "ANTHROPIC_AUTH_TOKEN");
	const kimiBaseUrl = await parseEnvValue(kimiSecrets, "ANTHROPIC_BASE_URL");
	const kimiModel = await parseEnvValue(
		kimiSecrets,
		"ANTHROPIC_DEFAULT_SONNET_MODEL",
	);

	if (
		kimiToken &&
		kimiToken !== "__KIMI_AUTH_TOKEN__" &&
		kimiBaseUrl &&
		kimiModel
	) {
		await writeGeneratedScript(
			path.join(dotfilesDir, "shell/bin/zsh/ck.sh"),
			path.join(binDir, "ck"),
			{
				__KIMI_AUTH_TOKEN__: kimiToken,
				__KIMI_BASE_URL__: kimiBaseUrl,
				__KIMI_MODEL__: kimiModel,
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

	const claudexSource = path.join(dotfilesDir, "shell/bin/zsh/claudex.sh");
	const claudexTarget = path.join(binDir, "claudex");
	if (await pathExists(claudexSource)) {
		await ensureWritableTarget(claudexTarget);
		await copyFile(claudexSource, claudexTarget);
		await chmod(claudexTarget, 0o755);
		action(`Copied: ${claudexTarget}`);
	}

	const claudeGrokSource = path.join(
		dotfilesDir,
		"shell/bin/zsh/claude-grok.sh",
	);
	const claudeGrokTarget = path.join(binDir, "claude-grok");
	if (await pathExists(claudeGrokSource)) {
		await ensureWritableTarget(claudeGrokTarget);
		await copyFile(claudeGrokSource, claudeGrokTarget);
		await chmod(claudeGrokTarget, 0o755);
		action(`Copied: ${claudeGrokTarget}`);
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
		const response = (
			await promptUser("Install cz.ps1 script anyway? (y/n): ")
		).toLowerCase();
		if (response === "y") {
			glmToken = await promptUser("Enter your Z.ai GLM API key: ");
		}
	}

	if (glmToken) {
		await writeGeneratedScript(
			path.join(dotfilesDir, "shell/bin/powershell/cz.ps1"),
			path.join(binDir, "cz.ps1"),
			{
				__ANTHROPIC_AUTH_TOKEN__: glmToken,
				__ANTHROPIC_BASE_URL__:
					(await parseEnvValue(glmSecrets, "ANTHROPIC_BASE_URL")) ??
					"https://api.z.ai/api/anthropic",
				__API_TIMEOUT_MS__:
					(await parseEnvValue(glmSecrets, "API_TIMEOUT_MS")) ?? "3000000",
				__ANTHROPIC_DEFAULT_HAIKU_MODEL__:
					(await parseEnvValue(glmSecrets, "ANTHROPIC_DEFAULT_HAIKU_MODEL")) ??
					"glm-5",
				__ANTHROPIC_DEFAULT_SONNET_MODEL__:
					(await parseEnvValue(glmSecrets, "ANTHROPIC_DEFAULT_SONNET_MODEL")) ??
					"glm-5",
				__ANTHROPIC_DEFAULT_OPUS_MODEL__:
					(await parseEnvValue(glmSecrets, "ANTHROPIC_DEFAULT_OPUS_MODEL")) ??
					"glm-5",
			},
			false,
		);
	}

	const kimiSecrets = path.join(
		dotfilesDir,
		"secrets/claude-code/kimi/kimi.ps1",
	);
	const kimiToken = await parseEnvValue(kimiSecrets, "ANTHROPIC_AUTH_TOKEN");
	const kimiBaseUrl = await parseEnvValue(kimiSecrets, "ANTHROPIC_BASE_URL");
	const kimiModel = await parseEnvValue(
		kimiSecrets,
		"ANTHROPIC_DEFAULT_SONNET_MODEL",
	);

	if (
		kimiToken &&
		kimiToken !== "__KIMI_AUTH_TOKEN__" &&
		kimiBaseUrl &&
		kimiModel
	) {
		await writeGeneratedScript(
			path.join(dotfilesDir, "shell/bin/powershell/ck.ps1"),
			path.join(binDir, "ck.ps1"),
			{
				__KIMI_AUTH_TOKEN__: kimiToken,
				__KIMI_BASE_URL__: kimiBaseUrl,
				__KIMI_MODEL__: kimiModel,
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

	const claudexSource = path.join(
		dotfilesDir,
		"shell/bin/powershell/claudex.ps1",
	);
	const claudexTarget = path.join(binDir, "claudex.ps1");
	if (await pathExists(claudexSource)) {
		await ensureWritableTarget(claudexTarget);
		await copyFile(claudexSource, claudexTarget);
		action(`Copied: ${claudexTarget}`);
	}

	const claudeGrokSource = path.join(
		dotfilesDir,
		"shell/bin/powershell/claude-grok.ps1",
	);
	const claudeGrokTarget = path.join(binDir, "claude-grok.ps1");
	if (await pathExists(claudeGrokSource)) {
		await ensureWritableTarget(claudeGrokTarget);
		await copyFile(claudeGrokSource, claudeGrokTarget);
		action(`Copied: ${claudeGrokTarget}`);
	}
}

async function linkProjectAgents(
	dotfilesDir: string,
	projectPath: string,
): Promise<void> {
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

async function printLinkStatus(
	pathLabel: string,
	targetPath: string,
): Promise<void> {
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

	await showToolStatus(dotfilesDir);
}

// =============================================================================
// Managed .zshrc helpers
// =============================================================================

export const ZSHRC_MANAGED_MARKER =
	"# MANAGED BY dotfiles/scripts/link-dotfiles - DO NOT EDIT";
export const ZSHRC_MANAGED_START = "# >>> dotfiles zsh start";
export const ZSHRC_MANAGED_END = "# <<< dotfiles zsh end";

export function renderManagedZshrc(dotfilesDir: string): string {
	const sharedZshPath = path.join(dotfilesDir, "shell", "zsh", "shared.zsh");
	const lines = [
		ZSHRC_MANAGED_START,
		ZSHRC_MANAGED_MARKER,
		"# Stable baseline lives in shell/zsh/shared.zsh.",
		"# Machine-specific edits go in ~/.zshrc.local or outside this block.",
		"",
		`# Resolve dotfiles location (supports symlinked repos and standard locations)`,
		`if [ -z "$DOTFILES_ROOT" ]; then`,
		`  # Try ~/.dotfiles symlink first, then ~/Projects/dotfiles`,
		`  if [ -L "$HOME/.dotfiles" ]; then`,
		`    export DOTFILES_ROOT="$(readlink -f "$HOME/.dotfiles" 2>/dev/null || readlink "$HOME/.dotfiles")"`,
		`  elif [ -d "$HOME/Projects/dotfiles" ]; then`,
		`    export DOTFILES_ROOT="$HOME/Projects/dotfiles"`,
		`  else`,
		`    # Fallback: resolve from .zshrc location (note: this uses zsh parameter expansion)`,
		`    export DOTFILES_ROOT="\${\${(%):-%x}:A:h:h}"`,
		`  fi`,
		`fi`,
		``,
		`source "$DOTFILES_ROOT/shell/zsh/shared.zsh"`,
		"",
		"# Source local overrides if present.",
		'if [ -f "$HOME/.zshrc.local" ]; then',
		'  source "$HOME/.zshrc.local"',
		"fi",
		ZSHRC_MANAGED_END,
		"",
	];

	return lines.join("\n");
}

export function renderZshrcLocal(): string {
	const lines = [
		"# ~/.zshrc.local - machine-specific zsh configuration",
		"# This file is sourced by the managed ~/.zshrc after shared.zsh.",
		"# Add local PATH tweaks, aliases, or env vars here.",
		"# This file is NOT managed by dotfiles and will not be overwritten.",
		"",
	];

	return lines.join("\n");
}

export function isManagedZshrc(content: string): boolean {
	return (
		content.includes(ZSHRC_MANAGED_START) ||
		content.startsWith(ZSHRC_MANAGED_MARKER)
	);
}

const ZSHRC_MARKERS: ManagedBlockMarkers = {
	start: ZSHRC_MANAGED_START,
	end: ZSHRC_MANAGED_END,
};

function stripLegacyManagedZshrc(content: string): string | null {
	if (!content.startsWith(ZSHRC_MANAGED_MARKER)) {
		return null;
	}

	const localSourceLine = '  source "$HOME/.zshrc.local"';
	const localSourceIndex = content.indexOf(localSourceLine);
	if (localSourceIndex === -1) {
		// Marker present but unexpected layout: signal "cannot strip" so the
		// caller backs up and prepends rather than silently duplicating the block.
		return null;
	}

	const fiIndex = content.indexOf("\nfi", localSourceIndex);
	if (fiIndex === -1) {
		return null;
	}

	let tailStart = fiIndex + "\nfi".length;
	while (content[tailStart] === "\n" || content[tailStart] === "\r") {
		tailStart += 1;
	}

	return content.slice(tailStart);
}

async function uniqueBackupPath(basePath: string): Promise<string> {
	if (!(await pathExists(basePath))) {
		return basePath;
	}

	for (let index = 1; ; index += 1) {
		const candidate = `${basePath}.${index}`;
		if (!(await pathExists(candidate))) {
			return candidate;
		}
	}
}

export type SetupZshrcOptions = {
	dotfilesDir: string;
	homeDir?: string;
	now?: Date;
};

export async function setupZshrc(options: SetupZshrcOptions): Promise<void> {
	if (process.platform === "win32") {
		return;
	}

	const homeDir = options.homeDir ?? os.homedir();
	const zshrcPath = path.join(homeDir, ".zshrc");
	const zshrcLocalPath = path.join(homeDir, ".zshrc.local");
	const desiredBlock = renderManagedZshrc(options.dotfilesDir);

	if (await pathExists(zshrcPath)) {
		const existingContent = await readFile(zshrcPath, "utf8");
		const result = reconcileManagedBlock(
			existingContent,
			desiredBlock,
			ZSHRC_MARKERS,
		);

		if (result.outcome === "conflict") {
			warn(
				`[CONFLICT] ${zshrcPath} has malformed dotfiles markers; fix them manually. Leaving the file untouched.`,
			);
		} else if (result.outcome === "unchanged") {
			info(".zshrc managed block already current");
		} else if (result.outcome === "replaced") {
			await writeFile(zshrcPath, result.content, "utf8");
			action("Updated managed .zshrc block");
		} else {
			const legacyTail = stripLegacyManagedZshrc(existingContent);
			if (legacyTail !== null) {
				await writeFile(
					zshrcPath,
					prependManagedBlock(legacyTail, desiredBlock),
					"utf8",
				);
				action("Migrated legacy managed .zshrc to managed block");
			} else {
				const timestamp = formatTimestamp(options.now ?? new Date());
				const backupPath = await uniqueBackupPath(
					`${zshrcPath}.backup.${timestamp}`,
				);
				await copyFile(zshrcPath, backupPath);
				action(`Backed up .zshrc to ${path.basename(backupPath)}`);
				await writeFile(zshrcPath, result.content, "utf8");
				action("Installed managed .zshrc block and preserved existing content");
			}
		}
	} else {
		await writeFile(zshrcPath, desiredBlock, "utf8");
		action("Created managed .zshrc block");
	}

	if (!(await pathExists(zshrcLocalPath))) {
		await writeFile(zshrcLocalPath, renderZshrcLocal(), "utf8");
		action("Created ~/.zshrc.local (add local overrides here)");
	}
}

// =============================================================================
// Managed PowerShell profile helpers
// =============================================================================

export const POWERSHELL_MANAGED_MARKER =
	"# MANAGED BY dotfiles/scripts/link-dotfiles - DO NOT EDIT";
export const POWERSHELL_MANAGED_START = "# >>> dotfiles powershell start";
export const POWERSHELL_MANAGED_END = "# <<< dotfiles powershell end";

const POWERSHELL_MARKERS: ManagedBlockMarkers = {
	start: POWERSHELL_MANAGED_START,
	end: POWERSHELL_MANAGED_END,
};

const POWERSHELL_PROFILE_NAME = "Microsoft.PowerShell_profile.ps1";
const POWERSHELL_PROFILE_LOCAL_NAME = "profile.local.ps1";

export function renderManagedPowerShell(dotfilesDir: string): string {
	const sharedPath = path.join(
		dotfilesDir,
		"shell",
		"powershell",
		"shared.ps1",
	);
	const lines = [
		POWERSHELL_MANAGED_START,
		POWERSHELL_MANAGED_MARKER,
		"# Stable baseline lives in shell/powershell/shared.ps1.",
		"# Machine-specific edits go in profile.local.ps1 or outside this block.",
		"",
		`$dotfilesShared = '${escapePowerShellValue(sharedPath)}'`,
		"if (Test-Path $dotfilesShared) {",
		"    . $dotfilesShared",
		"}",
		"",
		"# Source machine-local overrides if present.",
		`$dotfilesProfileLocal = Join-Path (Split-Path -Parent $PROFILE) '${POWERSHELL_PROFILE_LOCAL_NAME}'`,
		"if (Test-Path $dotfilesProfileLocal) {",
		"    . $dotfilesProfileLocal",
		"}",
		POWERSHELL_MANAGED_END,
		"",
	];

	return lines.join("\n");
}

export function renderPowerShellProfileLocal(): string {
	const lines = [
		"# profile.local.ps1 - machine-specific PowerShell configuration",
		"# This file is sourced by the managed profile after shared.ps1.",
		"# Add local PATH tweaks, aliases, or env vars here.",
		"# This file is NOT managed by dotfiles and will not be overwritten.",
		"",
	];

	return lines.join("\n");
}

async function seedPowerShellProfileLocal(profileDir: string): Promise<void> {
	const localPath = path.join(profileDir, POWERSHELL_PROFILE_LOCAL_NAME);
	if (!(await pathExists(localPath))) {
		await writeFile(localPath, renderPowerShellProfileLocal(), "utf8");
		action(`Created ${localPath} (add local overrides here)`);
	}
}

// Recognize a symlink that points at this repo's PowerShell profile (either the
// current shared.ps1 or the pre-rename Microsoft.PowerShell_profile.ps1). Such a
// link is just the managed baseline, so it can be dropped and rewritten as the
// block-only native file. Any other target is user-owned and must be preserved.
function isRepoProfileSymlinkTarget(
	linkTarget: string,
	linkPath: string,
): boolean {
	const resolved = path.isAbsolute(linkTarget)
		? linkTarget
		: path.resolve(path.dirname(linkPath), linkTarget);
	const normalized = path.normalize(resolved);
	const repoSuffixes = [
		path.join("shell", "powershell", "shared.ps1"),
		path.join("shell", "powershell", "Microsoft.PowerShell_profile.ps1"),
	];
	return repoSuffixes.some((suffix) => normalized.endsWith(suffix));
}

async function applyManagedPowerShellProfile(
	profilePath: string,
	desiredBlock: string,
	now: Date | undefined,
): Promise<void> {
	let existingStat: Awaited<ReturnType<typeof lstat>> | null = null;
	try {
		existingStat = await lstat(profilePath);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
			throw error;
		}
	}

	if (existingStat?.isSymbolicLink()) {
		const linkTarget = await readlink(profilePath);
		if (isRepoProfileSymlinkTarget(linkTarget, profilePath)) {
			// Link resolves to the repo profile: its content is the managed
			// baseline, so drop it and write the block-only native file.
			await rm(profilePath, { force: true });
			await writeFile(profilePath, desiredBlock, "utf8");
			action(
				`Replaced repo-linked PowerShell profile with managed block: ${profilePath}`,
			);
		} else {
			// Unknown symlink target: preserve the link as a timestamped backup
			// (rename operates on the link itself) before taking over the path.
			const timestamp = formatTimestamp(now ?? new Date());
			const backupPath = await uniqueBackupPath(
				`${profilePath}.backup.${timestamp}`,
			);
			await rename(profilePath, backupPath);
			action(
				`Backed up foreign PowerShell profile symlink to ${path.basename(backupPath)}`,
			);
			await writeFile(profilePath, desiredBlock, "utf8");
			action(`Installed managed PowerShell profile block: ${profilePath}`);
		}
		await seedPowerShellProfileLocal(path.dirname(profilePath));
		return;
	}

	if (existingStat) {
		const existingContent = await readFile(profilePath, "utf8");
		const result = reconcileManagedBlock(
			existingContent,
			desiredBlock,
			POWERSHELL_MARKERS,
		);

		if (result.outcome === "conflict") {
			warn(
				`[CONFLICT] ${profilePath} has malformed dotfiles markers; fix them manually. Leaving the file untouched.`,
			);
			return;
		}
		if (result.outcome === "unchanged") {
			info(`PowerShell profile managed block already current: ${profilePath}`);
		} else if (result.outcome === "replaced") {
			await writeFile(profilePath, result.content, "utf8");
			action(`Updated managed PowerShell profile block: ${profilePath}`);
		} else {
			const timestamp = formatTimestamp(now ?? new Date());
			const backupPath = await uniqueBackupPath(
				`${profilePath}.backup.${timestamp}`,
			);
			await copyFile(profilePath, backupPath);
			action(`Backed up PowerShell profile to ${path.basename(backupPath)}`);
			await writeFile(profilePath, result.content, "utf8");
			action(
				`Installed managed PowerShell profile block and preserved existing content: ${profilePath}`,
			);
		}
		await seedPowerShellProfileLocal(path.dirname(profilePath));
		return;
	}

	await mkdir(path.dirname(profilePath), { recursive: true });
	await writeFile(profilePath, desiredBlock, "utf8");
	action(`Created managed PowerShell profile block: ${profilePath}`);
	await seedPowerShellProfileLocal(path.dirname(profilePath));
}

export type SetupPowerShellProfileOptions = {
	dotfilesDir: string;
	homeDir?: string;
	now?: Date;
	platform?: NodeJS.Platform;
};

export async function setupPowerShellProfile(
	options: SetupPowerShellProfileOptions,
): Promise<void> {
	const platform = options.platform ?? process.platform;
	if (platform !== "win32") {
		return;
	}

	const homeDir = options.homeDir ?? os.homedir();
	const documentsDir = path.join(homeDir, "Documents");
	const winPowerShellDir = path.join(documentsDir, "WindowsPowerShell");
	// Gate the legacy WindowsPowerShell target on the existence of its own
	// directory, which this tool never creates. Writing the modern
	// Documents/PowerShell profile creates Documents as a side effect, so gating
	// on Documents would fabricate the legacy profile on the next run.
	const winPowerShellDirExists = await pathExists(winPowerShellDir);
	const desiredBlock = renderManagedPowerShell(options.dotfilesDir);

	const targets = [
		{
			path: path.join(documentsDir, "PowerShell", POWERSHELL_PROFILE_NAME),
			skip: false,
		},
		{
			path: path.join(winPowerShellDir, POWERSHELL_PROFILE_NAME),
			skip: !winPowerShellDirExists,
		},
	];

	for (const target of targets) {
		if (target.skip) {
			continue;
		}
		await applyManagedPowerShellProfile(target.path, desiredBlock, options.now);
	}
}

async function removeManagedBlockFromFile(
	filePath: string,
	markers: ManagedBlockMarkers,
): Promise<void> {
	if (!(await pathExists(filePath))) {
		info(`No file at ${filePath}; nothing to remove`);
		return;
	}

	const existingContent = await readFile(filePath, "utf8");
	const result = removeManagedBlock(existingContent, markers);

	if (result.outcome === "absent") {
		info(`No managed block found in ${filePath}`);
		return;
	}

	if (result.outcome === "conflict") {
		warn(
			`[CONFLICT] ${filePath} has malformed dotfiles markers; fix them manually. Leaving the file untouched.`,
		);
		return;
	}

	await writeFile(filePath, result.content, "utf8");
	action(`Removed managed shell profile block from ${filePath}`);
}

export type RemoveShellProfileOptions = {
	homeDir?: string;
	platform?: NodeJS.Platform;
};

/**
 * Remove only the marker-managed shell profile block for the current
 * platform (zsh on Unix, the PowerShell profile targets on Windows),
 * preserving all other content in the file untouched. Does not run any
 * other linking or setup work.
 */
export async function removeShellProfileBlock(
	options: RemoveShellProfileOptions = {},
): Promise<void> {
	const platform = options.platform ?? process.platform;
	const homeDir = options.homeDir ?? os.homedir();

	if (platform === "win32") {
		const documentsDir = path.join(homeDir, "Documents");
		const winPowerShellDir = path.join(documentsDir, "WindowsPowerShell");
		const targets = [
			path.join(documentsDir, "PowerShell", POWERSHELL_PROFILE_NAME),
			path.join(winPowerShellDir, POWERSHELL_PROFILE_NAME),
		];

		for (const target of targets) {
			await removeManagedBlockFromFile(target, POWERSHELL_MARKERS);
		}
		return;
	}

	await removeManagedBlockFromFile(path.join(homeDir, ".zshrc"), ZSHRC_MARKERS);
}

async function setupDotfilesSymlink(dotfilesDir: string): Promise<void> {
	if (process.platform === "win32") {
		return; // Skip on Windows
	}

	const symlinkPath = homePath(".dotfiles");

	// Check if symlink already exists and points to the right place
	if (await pathExists(symlinkPath)) {
		const stat = await lstat(symlinkPath);
		if (stat.isSymbolicLink()) {
			const existingTarget = await readlink(symlinkPath);
			const normalizedExisting = path.normalize(existingTarget);
			const normalizedDotfiles = path.normalize(dotfilesDir);

			if (normalizedExisting === normalizedDotfiles) {
				info("~/.dotfiles symlink already exists and points to the right location");
				return;
			}

			// Symlink points elsewhere - remove it
			warn(`~/.dotfiles points to ${existingTarget}, removing`);
			await rm(symlinkPath, { force: true });
		} else {
			// Regular file or directory exists - backup and remove
			const backupPath = `${symlinkPath}.backup.${formatTimestamp(new Date())}`;
			warn(`~/.dotfiles exists as a regular file/directory, backing up to ${backupPath}`);
			await rename(symlinkPath, backupPath);
		}
	}

	// Create the symlink
	const symlinkTarget = path.relative(homePath("."), dotfilesDir);
	await mkdir(path.dirname(symlinkPath), { recursive: true });
	action(`Creating ~/.dotfiles -> ${dotfilesDir}`);

	// Use relative path for the symlink target so it works if home dir moves
	const proc = Bun.spawn(["ln", "-s", symlinkTarget, symlinkPath], {
		stdout: "inherit",
		stderr: "inherit",
	});
	const exitCode = await proc.exited;
	if (exitCode !== 0) {
		warn("Failed to create ~/.dotfiles symlink (this is optional)");
	}
}

async function main(): Promise<void> {
	const options = parseArgs(process.argv.slice(2));
	const dotfilesDir = options.dotfilesDir;

	if (options.show) {
		await showStatus(dotfilesDir);
		return;
	}

	if (options.removeShellProfile) {
		await removeShellProfileBlock();
		return;
	}

	if (options.projectAgentsPath) {
		await linkProjectAgents(dotfilesDir, options.projectAgentsPath);
		return;
	}

	if (!options.skipSubmodules) {
		await initializeSubmodules(dotfilesDir);
	}

	await setupDotfilesSymlink(dotfilesDir);
	await linkDotfiles(dotfilesDir);

	await linkGitHubConfig(dotfilesDir);
	await linkConfigDirs(dotfilesDir);
	await installManagedEnvironment(dotfilesDir);
	await setupZshrc({ dotfilesDir });
	await setupPowerShellProfile({ dotfilesDir });
	await linkWindowsExtras(dotfilesDir);

	if (process.platform === "win32") {
		await installWindowsBinScripts(dotfilesDir);
	} else {
		await installUnixBinScripts(dotfilesDir);
	}

	await installTools(dotfilesDir);

	info("All linking tasks completed");
}

if (import.meta.main) {
	main().catch((error) => {
		console.error("link-dotfiles failed:", error);
		process.exit(1);
	});
}
