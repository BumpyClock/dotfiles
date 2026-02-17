import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { ChildProcess, spawn } from "node:child_process";
import * as path from "node:path";
import { sleep } from "./state";
import type { StreamResult } from "./types";

type RunProcessArgs = {
  prompt: string;
  command: string;
  args: string[];
  logPath: string;
  showRaw: boolean;
  formatCommandHint: (command: string) => string;
  onChildChange?: (child: ChildProcess | null) => void;
  onStdoutLine?: (line: string) => void;
  onFirstResponse?: () => void;
};

function ensureDirectory(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function appendLogChunk(logPath: string, text: string): void {
  ensureDirectory(path.dirname(logPath));
  try {
    appendFileSync(logPath, text, "utf8");
  } catch (error) {
    const maybeErrno = error as NodeJS.ErrnoException;
    if (maybeErrno.code === "ENOENT") {
      ensureDirectory(path.dirname(logPath));
      appendFileSync(logPath, text, "utf8");
      return;
    }
    throw error;
  }
}

function resolveCommandExecutable(command: string): string | null {
  if (!command) {
    return null;
  }

  const isWindows = process.platform === "win32";
  const pathExtEntries = (process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD")
    .split(";")
    .map((entry) => entry.toLowerCase())
    .filter(Boolean);

  const resolveWindowsBase = (basePath: string): string | null => {
    const ext = path.extname(basePath).toLowerCase();
    if (ext) {
      return existsSync(basePath) ? basePath : null;
    }
    for (const extension of pathExtEntries) {
      const withExt = `${basePath}${extension}`;
      if (existsSync(withExt)) {
        return withExt;
      }
    }
    return existsSync(basePath) ? basePath : null;
  };

  if (path.isAbsolute(command) || command.includes(path.sep)) {
    const absolute = path.isAbsolute(command) ? command : path.resolve(process.cwd(), command);
    return isWindows ? resolveWindowsBase(absolute) : existsSync(absolute) ? absolute : null;
  }

  const pathEntries = (process.env.PATH ?? "")
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const ext = path.extname(command).toLowerCase();
  const extensions = isWindows ? (ext ? [ext] : pathExtEntries) : [""];

  for (const dir of pathEntries) {
    const base = path.join(dir, command);
    if (isWindows) {
      const resolved = resolveWindowsBase(base);
      if (resolved) {
        return resolved;
      }
      continue;
    }

    if (existsSync(base)) {
      return base;
    }
    for (const extension of extensions) {
      if (!extension) continue;
      const withExt = `${base}${extension}`;
      if (existsSync(withExt)) {
        return withExt;
      }
    }
  }

  return null;
}

export function resolveRunnableCommand(
  command: string,
  formatCommandHint: (command: string) => string
): string {
  const resolved = resolveCommandExecutable(command);
  if (resolved) {
    return resolved;
  }

  if (path.isAbsolute(command) || command.includes(path.sep)) {
    throw new Error(`Command not found: "${command}"`);
  }

  if (process.platform === "win32") {
    throw new Error(`Unable to find command "${command}". ${formatCommandHint(command)}.`);
  }

  return command;
}

export async function terminateChildProcess(child: ChildProcess): Promise<void> {
  const pid = child.pid;
  if (!pid) {
    return;
  }

  if (process.platform === "win32") {
    await new Promise<void>((resolve) => {
      const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
        stdio: "ignore",
      });
      killer.on("close", () => resolve());
      killer.on("error", () => {
        try {
          child.kill();
        } catch {
          // no-op
        }
        resolve();
      });
    });
    return;
  }

  try {
    child.kill("SIGTERM");
  } catch {
    return;
  }

  await sleep(300);
  if (!child.killed) {
    try {
      child.kill("SIGKILL");
    } catch {
      // no-op
    }
  }
}

export function runAgentProcess({
  prompt,
  command,
  args,
  logPath,
  showRaw,
  formatCommandHint,
  onChildChange,
  onStdoutLine,
  onFirstResponse,
}: RunProcessArgs): Promise<StreamResult> {
  return new Promise((resolve, reject) => {
    let child: ChildProcess;
    try {
      child = spawn(command, args, {
        stdio: ["pipe", "pipe", "pipe"],
      });
      onChildChange?.(child);
    } catch (error) {
      onChildChange?.(null);
      reject(error);
      return;
    }

    let stdout = "";
    let stderr = "";
    let stdoutBuffer = "";
    let settled = false;
    let firstResponseSeen = false;

    const notifyFirstResponse = () => {
      if (firstResponseSeen) {
        return;
      }
      firstResponseSeen = true;
      onFirstResponse?.();
    };

    const fail = (error: unknown) => {
      if (settled) {
        return;
      }
      settled = true;
      onChildChange?.(null);
      reject(error);
    };

    child.on("error", (error) => {
      const maybeErrno = error as NodeJS.ErrnoException;
      if (maybeErrno.code === "ENOENT") {
        fail(new Error(`Unable to spawn "${command}". ${formatCommandHint(command)}.`));
        return;
      }
      fail(error);
    });

    if (child.stdout) {
      child.stdout.on("data", (chunk) => {
        const text = chunk.toString();
        if (text.trim().length > 0) {
          notifyFirstResponse();
        }
        stdout += text;
        stdoutBuffer += text;
        try {
          appendLogChunk(logPath, text);
        } catch (error) {
          fail(error);
          return;
        }

        const lines = stdoutBuffer.split(/\r?\n/);
        stdoutBuffer = lines.pop() ?? "";
        for (const line of lines) {
          onStdoutLine?.(line);
        }

        if (showRaw) {
          process.stdout.write(text);
        }
      });
      child.stdout.on("end", () => {
        if (stdoutBuffer.trim().length > 0) {
          notifyFirstResponse();
          onStdoutLine?.(stdoutBuffer);
        }
        stdoutBuffer = "";
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (chunk) => {
        const text = chunk.toString();
        stderr += text;
        try {
          appendLogChunk(logPath, text);
        } catch (error) {
          fail(error);
          return;
        }
        if (showRaw) {
          process.stderr.write(text);
        }
      });
    }

    child.on("close", (status) => {
      if (settled) {
        return;
      }
      settled = true;
      onChildChange?.(null);
      resolve({ status, stdout, stderr });
    });

    child.stdin?.write(prompt);
    child.stdin?.end();
  });
}
