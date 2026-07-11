#!/usr/bin/env bun

import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { chmod, copyFile, mkdtemp, mkdir, open, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const PROXY_VERSION = "0.1.10";
const PROXY_PORT = 18765;
const PROXY_BASE_URL = `http://127.0.0.1:${PROXY_PORT}`;

type SupportedPlatform = "darwin" | "linux" | "win32";
type SupportedArch = "x64" | "arm64";

export type ProxyRelease = {
  archiveName: string;
  binarySha256: string;
  binaryName: string;
  sha256: string;
};

const RELEASES: Record<SupportedPlatform, Record<SupportedArch, ProxyRelease>> = {
  darwin: {
    x64: {
      archiveName: "claude-code-proxy-darwin-amd64.tar.gz",
      binarySha256: "e14b749c081d27d0dea05febfe56628114c2318e7ba4a10db8e9f02b3698bb1c",
      binaryName: "claude-code-proxy",
      sha256: "8c3086a26ca9cd9adc8e138492f27d04523f69a9a5af357325707b08d931f6e4",
    },
    arm64: {
      archiveName: "claude-code-proxy-darwin-arm64.tar.gz",
      binarySha256: "3c85ddfbb1eeb024c542478ca1237be315a08091da7393065e068391fc8a04b6",
      binaryName: "claude-code-proxy",
      sha256: "a9b740107f67a7afe87e006d3b9960df82772449c555fa393a69a301ac1ba161",
    },
  },
  linux: {
    x64: {
      archiveName: "claude-code-proxy-linux-amd64.tar.gz",
      binarySha256: "0be26ee03a38f7a1270f42dff7246e17638e4de47b9dd00d9c7d9497396ea7cd",
      binaryName: "claude-code-proxy",
      sha256: "76359a175dd5b018b81d95f42e50c5d52fba589b316756c7f9747fff04bb5e81",
    },
    arm64: {
      archiveName: "claude-code-proxy-linux-arm64.tar.gz",
      binarySha256: "ab094e57063c714da7e715176809154c1a0e63c7d9d7e93d744f4b1f44185810",
      binaryName: "claude-code-proxy",
      sha256: "35cd6987ff19aa01bc6fbac5d0857b99f9131088a9df23b93217efbbb8a1d473",
    },
  },
  win32: {
    x64: {
      archiveName: "claude-code-proxy-windows-amd64.zip",
      binarySha256: "bed7dcafc156c3b01c966b39c9af65e8e29b3f5517646f2e87717868392e8980",
      binaryName: "claude-code-proxy.exe",
      sha256: "377c91784376e1cf097201d654bf6c4428bd5fd6d32f7a8fa432c72049251d3f",
    },
    arm64: {
      archiveName: "claude-code-proxy-windows-arm64.zip",
      binarySha256: "bdedac554100ec108697a69f42a2e305d5c4705c3c1dbbaeab2d0b0dc13af1fb",
      binaryName: "claude-code-proxy.exe",
      sha256: "fbfea9e3645dbdda2268b4472fab107d9ed1118671b8f5d5ae468bc93cd92270",
    },
  },
};

export function proxyReleaseFor(platform: NodeJS.Platform, arch: string): ProxyRelease {
  if (!(platform in RELEASES) || (arch !== "x64" && arch !== "arm64")) {
    throw new Error(`claude-gpt does not support ${platform}/${arch}`);
  }

  return RELEASES[platform as SupportedPlatform][arch as SupportedArch];
}

export function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function validateArchiveEntries(entries: string[], expectedBinaryName: string): void {
  const normalized = entries.map((entry) => entry.trim()).filter(Boolean);
  if (normalized.length !== 1 || normalized[0] !== expectedBinaryName) {
    throw new Error(`Unexpected proxy archive layout: ${normalized.join(", ") || "empty archive"}`);
  }

  const entry = normalized[0];
  if (path.isAbsolute(entry) || entry.split(/[\\/]/).includes("..")) {
    throw new Error(`Unsafe proxy archive entry: ${entry}`);
  }
}

export function buildClaudeEnvironment(source: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const env = { ...source };
  for (const key of Object.keys(env)) {
    if (key.startsWith("ANTHROPIC_") || [
      "CLAUDE_CODE_USE_BEDROCK",
      "CLAUDE_CODE_USE_VERTEX",
      "CLAUDE_CODE_USE_FOUNDRY",
    ].includes(key)) {
      delete env[key];
    }
  }

  return {
    ...env,
    ANTHROPIC_BASE_URL: PROXY_BASE_URL,
    ANTHROPIC_AUTH_TOKEN: "unused",
    ANTHROPIC_MODEL: "gpt-5.6-sol[1m]",
    ANTHROPIC_SMALL_FAST_MODEL: "gpt-5.4-mini[1m]",
    ANTHROPIC_DEFAULT_FABLE_MODEL: "gpt-5.6-sol[1m]",
    ANTHROPIC_DEFAULT_OPUS_MODEL: "gpt-5.6-terra[1m]",
    ANTHROPIC_DEFAULT_SONNET_MODEL: "gpt-5.6-luna[1m]",
    ANTHROPIC_DEFAULT_HAIKU_MODEL: "gpt-5.4-mini[1m]",
    CLAUDE_CODE_AUTO_COMPACT_WINDOW: "372000",
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
    CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: "1",
  };
}

function localBinDir(): string {
  return path.join(os.homedir(), ".local", "bin");
}

function proxyPath(release: ProxyRelease): string {
  return path.join(localBinDir(), release.binaryName);
}

async function installedProxyMatches(filePath: string, expectedHash: string): Promise<boolean> {
  const result = spawnSync(filePath, ["--version"], { encoding: "utf8", windowsHide: true });
  if (result.status !== 0 || result.stdout.trim() !== `claude-code-proxy ${PROXY_VERSION}`) {
    return false;
  }
  try {
    return sha256(await readFile(filePath)) === expectedHash;
  } catch {
    return false;
  }
}

async function acquireInstallLock(targetPath: string): Promise<() => Promise<void>> {
  const lockPath = `${targetPath}.install-lock`;
  const lockOwner = `${process.pid}:${randomUUID()}`;
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const handle = await open(lockPath, "wx");
      try {
        await handle.writeFile(lockOwner);
      } catch (error) {
        await rm(lockPath, { force: true });
        throw error;
      } finally {
        await handle.close();
      }
      return async () => {
        try {
          if ((await readFile(lockPath, "utf8")).trim() === lockOwner) {
            await rm(lockPath, { force: true });
          }
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`Timed out waiting for proxy installation lock ${lockPath}; remove it only if no claude-gpt installer is running`);
}

async function installProxy(release: ProxyRelease): Promise<string> {
  const targetPath = proxyPath(release);
  if (await installedProxyMatches(targetPath, release.binarySha256)) {
    return targetPath;
  }

  await mkdir(localBinDir(), { recursive: true });
  const releaseLock = await acquireInstallLock(targetPath);
  if (await installedProxyMatches(targetPath, release.binarySha256)) {
    await releaseLock();
    return targetPath;
  }

  const stagedTarget = `${targetPath}.new`;
  const backupTarget = `${targetPath}.previous`;
  let workDir: string | undefined;

  try {
    workDir = await mkdtemp(path.join(os.tmpdir(), "claude-code-proxy-"));
    const archivePath = path.join(workDir, release.archiveName);
    const extractDir = path.join(workDir, "extract");
    const url = `https://github.com/raine/claude-code-proxy/releases/download/v${PROXY_VERSION}/${release.archiveName}`;
    console.error(`[claude-gpt] Installing checksum-verified proxy v${PROXY_VERSION}...`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Proxy download failed: HTTP ${response.status}`);
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    const actualHash = sha256(bytes);
    if (actualHash !== release.sha256) {
      throw new Error(`Proxy checksum mismatch: expected ${release.sha256}, got ${actualHash}`);
    }

    await writeFile(archivePath, bytes);
    const listing = spawnSync("tar", ["-tf", archivePath], { encoding: "utf8", windowsHide: true });
    if (listing.status !== 0) {
      throw new Error(`Could not inspect proxy archive: ${listing.stderr.trim()}`);
    }
    validateArchiveEntries(listing.stdout.split(/\r?\n/), release.binaryName);

    await mkdir(extractDir);
    const extraction = spawnSync("tar", ["-xf", archivePath, "-C", extractDir], {
      encoding: "utf8",
      windowsHide: true,
    });
    if (extraction.status !== 0) {
      throw new Error(`Could not extract proxy archive: ${extraction.stderr.trim()}`);
    }

    const extractedPath = path.join(extractDir, release.binaryName);
    if (!(await stat(extractedPath)).isFile()) {
      throw new Error("Proxy archive did not contain the expected executable");
    }
    const extractedHash = sha256(await readFile(extractedPath));
    if (extractedHash !== release.binarySha256) {
      throw new Error(`Extracted proxy checksum mismatch: expected ${release.binarySha256}, got ${extractedHash}`);
    }

    await copyFile(extractedPath, stagedTarget);
    if (process.platform !== "win32") {
      await chmod(stagedTarget, 0o755);
    }

    let hadExistingTarget = false;
    try {
      await rename(targetPath, backupTarget);
      hadExistingTarget = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }

    try {
      await rename(stagedTarget, targetPath);
    } catch (error) {
      if (hadExistingTarget) await rename(backupTarget, targetPath);
      throw error;
    }
    if (hadExistingTarget) await rm(backupTarget, { force: true });
    return targetPath;
  } finally {
    await rm(stagedTarget, { force: true }).catch(() => undefined);
    if (workDir) await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    await releaseLock();
  }
}

function ensureOAuth(proxy: string): void {
  const status = spawnSync(proxy, ["codex", "auth", "status"], { stdio: "ignore", windowsHide: true });
  if (status.status === 0) return;

  console.error("[claude-gpt] ChatGPT OAuth authorization is required for this device.");
  const login = spawnSync(proxy, ["codex", "auth", "login"], { stdio: "inherit", windowsHide: false });
  if (login.status !== 0) {
    throw new Error(`ChatGPT OAuth login failed with exit code ${login.status ?? "unknown"}`);
  }
}

async function isPortOpen(): Promise<boolean> {
  return await new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port: PROXY_PORT });
    socket.setTimeout(300);
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("timeout", () => { socket.destroy(); resolve(false); });
    socket.once("error", () => resolve(false));
  });
}

async function isHealthy(): Promise<boolean> {
  try {
    const response = await fetch(`${PROXY_BASE_URL}/healthz`, { signal: AbortSignal.timeout(500) });
    if (!response.ok) return false;
    const body = await response.json() as { ok?: unknown };
    return body.ok === true;
  } catch {
    return false;
  }
}

async function waitForExit(child: ChildProcess): Promise<number | null> {
  if (child.exitCode !== null) return child.exitCode;
  return await new Promise((resolve, reject) => {
    child.once("exit", (code) => resolve(code));
    child.once("error", reject);
  });
}

async function stopOwnedProxy(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  const exited = await Promise.race([
    waitForExit(child).then(() => true),
    new Promise<false>((resolve) => setTimeout(() => resolve(false), 2_000)),
  ]);
  if (!exited && child.exitCode === null) {
    child.kill("SIGKILL");
    await Promise.race([waitForExit(child), new Promise((resolve) => setTimeout(resolve, 2_000))]);
  }
}

async function ensureProxyServer(proxy: string): Promise<void> {
  if (await isPortOpen()) {
    if (!(await isHealthy())) {
      throw new Error(`Port ${PROXY_PORT} is occupied by a process that is not a healthy claude-code-proxy`);
    }
    return;
  }

  const child = spawn(proxy, ["serve", "--no-monitor"], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (await isHealthy()) {
      child.unref();
      return;
    }
    if (child.exitCode !== null) {
      throw new Error(`claude-code-proxy exited before becoming healthy (exit ${child.exitCode})`);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  await stopOwnedProxy(child);
  throw new Error("claude-code-proxy did not become healthy within 10 seconds");
}

async function run(): Promise<number> {
  const release = proxyReleaseFor(process.platform, process.arch);
  const proxy = await installProxy(release);
  ensureOAuth(proxy);
  await ensureProxyServer(proxy);
  const claudeCommand = process.platform === "win32" ? "claude.exe" : "claude";
  const claude = spawn(claudeCommand, process.argv.slice(2), {
    env: buildClaudeEnvironment(process.env),
    stdio: "inherit",
    windowsHide: false,
  });

  const forwardInterrupt = () => claude.kill("SIGINT");
  const forwardTermination = () => claude.kill("SIGTERM");
  process.on("SIGINT", forwardInterrupt);
  process.on("SIGTERM", forwardTermination);
  try {
    return (await waitForExit(claude)) ?? 1;
  } finally {
    process.off("SIGINT", forwardInterrupt);
    process.off("SIGTERM", forwardTermination);
  }
}

if (import.meta.main) {
  run().then((exitCode) => process.exit(exitCode)).catch((error) => {
    console.error(`[claude-gpt] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
