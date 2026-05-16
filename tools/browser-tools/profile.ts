import { execSync } from "node:child_process";
import { DEFAULT_CHROME_USER_DATA_DIR } from "./constants";

export type ChromeProfileMode = "temporary" | "copied" | "real";

export type ChromeProfileSettings = {
	mode: ChromeProfileMode;
	userDataDir: string;
};

/**
 * Resolves Chrome profile mode from CLI flags and rejects mutually exclusive
 * copied-profile and real-profile requests.
 */
export function resolveChromeProfileSettings(options: {
	profile: boolean;
	realProfile: boolean;
	profileDir: string;
}): ChromeProfileSettings {
	const { profile, realProfile, profileDir } = options;
	if (profile && realProfile) {
		throw new Error("--profile and --real-profile cannot be used together");
	}

	if (realProfile) {
		return {
			mode: "real",
			userDataDir: DEFAULT_CHROME_USER_DATA_DIR,
		};
	}

	return {
		mode: profile ? "copied" : "temporary",
		userDataDir: profileDir,
	};
}

export function buildChromeLaunchArgs(options: {
	port: number;
	userDataDir: string;
	profileDirectory?: string;
}): string[] {
	const args = [
		`--remote-debugging-port=${options.port}`,
		`--user-data-dir=${options.userDataDir}`,
		"--no-first-run",
		"--disable-popup-blocking",
	];

	if (options.profileDirectory) {
		args.push(`--profile-directory=${options.profileDirectory}`);
	}

	return args;
}

export function chromeStartModeSuffix(
	mode: ChromeProfileMode,
	profileDirectory?: string,
): string {
	if (mode === "copied") {
		return profileDirectory
			? ` (profile copied: ${profileDirectory})`
			: " (profile copied)";
	}

	if (mode === "real") {
		return profileDirectory
			? ` (real profile: ${profileDirectory})`
			: " (real profile)";
	}

	return "";
}

export function isChromeRunning(): boolean {
	try {
		const output = execSync("ps -ax -o command=", { encoding: "utf8" });
		return output
			.split("\n")
			.map((line) => line.trim())
			.some((command) =>
				/Google Chrome(?:\.app\/Contents\/MacOS\/Google Chrome)?(?:\s|$)/.test(
					command,
				),
			);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to inspect running Chrome processes: ${message}`);
	}
}
