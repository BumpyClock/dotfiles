import os from "node:os";
import path from "node:path";

export const DEFAULT_PORT = 9222;
export const DEFAULT_PROFILE_DIR = path.join(
	os.homedir(),
	".cache",
	"scraping",
);
export const DEFAULT_CHROME_BIN =
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export const DEFAULT_CHROME_USER_DATA_DIR = path.join(
	os.homedir(),
	"Library",
	"Application Support",
	"Google",
	"Chrome",
);
