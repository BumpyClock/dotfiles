import { lstat, mkdir, readlink, rm, symlink } from "node:fs/promises";
import path from "node:path";

export async function pathExists(filePath: string): Promise<boolean> {
	try {
		await lstat(filePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Normalizes a path for symlink-target comparison. Windows file systems are
 * case-insensitive, so this lowercases the path there. Other platforms
 * compare the path unchanged.
 */
export function normalizeForCompare(filePath: string): string {
	if (process.platform === "win32") {
		return filePath.toLowerCase();
	}
	return filePath;
}

export async function getSymlinkTarget(
	symlinkPath: string,
): Promise<string | null> {
	try {
		return await readlink(symlinkPath);
	} catch {
		return null;
	}
}

/**
 * Makes targetPath a relative symlink to sourcePath. Replaces a wrong symlink
 * or an existing file or directory at targetPath. Does nothing if targetPath
 * already points to sourcePath.
 */
export async function ensureLinked(
	sourcePath: string,
	targetPath: string,
): Promise<void> {
	const targetDir = path.dirname(targetPath);
	await mkdir(targetDir, { recursive: true });

	if (await pathExists(targetPath)) {
		const stat = await lstat(targetPath);
		if (stat.isSymbolicLink()) {
			const existingTarget = await getSymlinkTarget(targetPath);
			if (existingTarget) {
				// readlink can return a relative path, or a \\?\-prefixed absolute
				// path for a Windows junction.
				const resolvedExisting = path.resolve(
					targetDir,
					existingTarget.replace(/^\\\\\?\\/, ""),
				);
				if (
					normalizeForCompare(resolvedExisting) ===
					normalizeForCompare(path.resolve(sourcePath))
				) {
					return;
				}
			}
			await rm(targetPath, { force: true });
		} else {
			await rm(targetPath, { force: true, recursive: true });
		}
	}

	const relativeSource = path.relative(targetDir, sourcePath);
	try {
		if (process.platform === "win32") {
			if ((await lstat(sourcePath)).isDirectory()) {
				// A directory junction needs no Developer Mode, but its target
				// must be an absolute path.
				await symlink(path.resolve(sourcePath), targetPath, "junction");
			} else {
				await symlink(relativeSource, targetPath, "file");
			}
		} else {
			await symlink(relativeSource, targetPath);
		}
	} catch (error) {
		const hint =
			process.platform === "win32" &&
			(error as NodeJS.ErrnoException).code === "EPERM"
				? " (file symlinks on Windows need Developer Mode or an elevated shell)"
				: "";
		throw new Error(
			`Failed to create symlink: ${targetPath} -> ${sourcePath}${hint}`,
			{ cause: error },
		);
	}
}
