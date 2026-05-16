import type { Command } from "commander";
import { execSync, spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { connectBrowser } from "../browser";
import {
	DEFAULT_CHROME_BIN,
	DEFAULT_CHROME_USER_DATA_DIR,
	DEFAULT_PORT,
	DEFAULT_PROFILE_DIR,
} from "../constants";
import {
	buildChromeLaunchArgs,
	chromeStartModeSuffix,
	isChromeRunning,
	resolveChromeProfileSettings,
} from "../profile";

export function registerStartCommand(program: Command): void {
	program
		.command("start")
		.description("Launch Chrome with remote debugging enabled.")
		.option(
			"-p, --port <number>",
			"Remote debugging port (default: 9222)",
			(value) => Number.parseInt(value, 10),
			DEFAULT_PORT,
		)
		.option(
			"--profile",
			"Copy your default Chrome profile before launch.",
			false,
		)
		.option(
			"--real-profile",
			"Use the live Chrome user-data directory for sites that require your signed-in session.",
			false,
		)
		.option(
			"--profile-dir <path>",
			"Directory for the temporary Chrome profile.",
			DEFAULT_PROFILE_DIR,
		)
		.option(
			"--profile-directory <name>",
			'Chrome profile directory name, such as Default or "Profile 1".',
		)
		.option(
			"--chrome-path <path>",
			"Path to the Chrome binary.",
			DEFAULT_CHROME_BIN,
		)
		.option(
			"--kill-existing",
			"Stop any running Google Chrome before launch (default: false).",
			false,
		)
		.action(async (options) => {
			const {
				port,
				profile,
				realProfile,
				profileDir,
				profileDirectory,
				chromePath,
				killExisting,
			} = options as {
				port: number;
				profile: boolean;
				realProfile: boolean;
				profileDir: string;
				profileDirectory?: string;
				chromePath: string;
				killExisting: boolean;
			};

			if (killExisting) {
				try {
					execSync("killall 'Google Chrome'", { stdio: "ignore" });
				} catch {
					// ignore missing processes
				}
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}

			const profileSettings = resolveChromeProfileSettings({
				profile,
				realProfile,
				profileDir,
			});
			if (
				profileSettings.mode === "real" &&
				!killExisting &&
				isChromeRunning()
			) {
				throw new Error(
					"--real-profile requires Chrome to be closed first or use --kill-existing",
				);
			}

			if (profileSettings.mode !== "real") {
				await mkdir(profileDir, { recursive: true });
			}

			if (profileSettings.mode === "copied") {
				execSync(
					`rsync -a --delete "${DEFAULT_CHROME_USER_DATA_DIR}/" "${profileDir}/"`,
					{ stdio: "ignore" },
				);
			}

			spawn(
				chromePath,
				buildChromeLaunchArgs({
					port,
					userDataDir: profileSettings.userDataDir,
					profileDirectory,
				}),
				{
					detached: true,
					stdio: "ignore",
				},
			).unref();

			let connected = false;
			for (let attempt = 0; attempt < 30; attempt++) {
				try {
					const browser = await connectBrowser(port);
					await browser.disconnect();
					connected = true;
					break;
				} catch {
					await new Promise((resolve) => setTimeout(resolve, 500));
				}
			}

			if (!connected) {
				console.error(`✗ Failed to start Chrome on port ${port}`);
				process.exit(1);
			}
			console.log(
				`✓ Chrome listening on http://localhost:${port}${chromeStartModeSuffix(profileSettings.mode, profileDirectory)}`,
			);
		});
}
