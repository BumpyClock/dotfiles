#!/usr/bin/env bun

import { existsSync, rmSync } from "node:fs";
import path from "node:path";

type CliOptions = {
  commitMessage: string;
  files: string[];
  forceDeleteLock: boolean;
};

function usageText(): string {
  return `Usage: ${process.argv[1] ? path.basename(process.argv[1]) : "committer"} [--force] "commit message" "file" ["file" ...]`;
}

function printUsageAndExit(exitCode: number = 2): never {
  const writer = exitCode === 0 ? console.log : console.error;
  writer(usageText());
  process.exit(exitCode);
}

function parseArgs(argv: string[]): CliOptions {
  if (argv.includes("--help") || argv.includes("-h")) {
    printUsageAndExit(0);
  }

  let offset = 0;
  let forceDeleteLock = false;

  if (argv[0] === "--force") {
    forceDeleteLock = true;
    offset = 1;
  }

  const commitMessage = argv[offset];
  const files = argv.slice(offset + 1);
  if (!commitMessage || files.length === 0) {
    printUsageAndExit();
  }

  return {
    commitMessage,
    files,
    forceDeleteLock,
  };
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}

function runGit(args: string[]): { exitCode: number; stderr: string } {
  const result = Bun.spawnSync(["git", ...args], {
    stdin: "inherit",
    stdout: "pipe",
    stderr: "pipe",
  });

  if (result.stdout) {
    process.stdout.write(Buffer.from(result.stdout));
  }

  const stderr = result.stderr ? Buffer.from(result.stderr).toString("utf8") : "";
  if (stderr) {
    process.stderr.write(stderr);
  }

  return {
    exitCode: result.exitCode,
    stderr,
  };
}

function isTrackedOrCommitted(filePath: string): boolean {
  if (existsSync(filePath)) {
    return true;
  }

  const tracked = Bun.spawnSync(["git", "ls-files", "--error-unmatch", "--", filePath], {
    stdout: "ignore",
    stderr: "ignore",
  });
  if (tracked.exitCode === 0) {
    return true;
  }

  const inHead = Bun.spawnSync(["git", "cat-file", "-e", `HEAD:${filePath}`], {
    stdout: "ignore",
    stderr: "ignore",
  });
  return inHead.exitCode === 0;
}

function findLockPath(stderr: string): string | null {
  const match = stderr.match(/Unable to create .*?'([^']+index\.lock)'/);
  if (!match) {
    return null;
  }

  return match[1];
}

function validateOptions(options: CliOptions): void {
  if (!/\S/.test(options.commitMessage)) {
    exitWithError("Error: commit message must not be empty");
  }

  if (existsSync(options.commitMessage)) {
    exitWithError(`Error: first argument looks like a file path ("${options.commitMessage}"); provide the commit message first`);
  }

  for (const file of options.files) {
    if (file === ".") {
      exitWithError('Error: "." is not allowed; list specific paths instead');
    }

    if (!isTrackedOrCommitted(file)) {
      exitWithError(`Error: file not found: ${file}`);
    }
  }
}

function ensureStagedChanges(files: string[]): void {
  runGit(["restore", "--staged", ":/"]);
  runGit(["add", "-A", "--", ...files]);

  const diff = Bun.spawnSync(["git", "diff", "--staged", "--quiet"], {
    stdout: "ignore",
    stderr: "ignore",
  });
  if (diff.exitCode === 0) {
    exitWithError(`Warning: no staged changes detected for: ${files.join(" ")}`);
  }
}

function tryCommit(options: CliOptions): boolean {
  const result = runGit(["commit", "-m", options.commitMessage, "--", ...options.files]);
  if (result.exitCode === 0) {
    return true;
  }

  if (!options.forceDeleteLock) {
    return false;
  }

  const lockPath = findLockPath(result.stderr);
  if (!lockPath || !existsSync(lockPath)) {
    return false;
  }

  rmSync(lockPath, { force: true });
  console.error(`Removed stale git lock: ${lockPath}`);
  return runGit(["commit", "-m", options.commitMessage, "--", ...options.files]).exitCode === 0;
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  validateOptions(options);
  ensureStagedChanges(options.files);

  if (!tryCommit(options)) {
    process.exit(1);
  }

  console.log(`Committed "${options.commitMessage}" with ${options.files.length} files`);
}

main();
