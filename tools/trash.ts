#!/usr/bin/env bun

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import trash from 'trash';
// @ts-expect-error Bun resolves this executable through its file loader.
import macosTrashAsset from './node_modules/trash/lib/macos-trash' with { type: 'file' };
// @ts-expect-error Bun resolves this executable through its file loader.
import windowsTrashAsset from './node_modules/trash/lib/windows-trash.exe' with { type: 'file' };

export type MovePathsToTrashOptions = {
  allowMissing?: boolean;
};

export type MovePathsToTrashResult = {
  moved: string[];
  missing: string[];
  errors: string[];
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

const execFileAsync = promisify(execFile);

type MaterializedExecutable = {
  path: string;
  remove: () => Promise<void>;
};

async function materializePlatformTrashExecutable(): Promise<MaterializedExecutable | null> {
  let assetPath: string;
  let executableName: string;

  if (process.platform === 'win32') {
    assetPath = windowsTrashAsset;
    executableName = 'windows-trash.exe';
  } else if (process.platform === 'darwin') {
    assetPath = macosTrashAsset;
    executableName = 'macos-trash';
  } else {
    return null;
  }

  const temporaryDirectory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'dotfiles-trash-'));
  const executablePath = path.join(temporaryDirectory, executableName);
  try {
    const executableBytes = await Bun.file(assetPath).bytes();
    await fs.promises.writeFile(executablePath, executableBytes);
    if (process.platform !== 'win32') {
      await fs.promises.chmod(executablePath, 0o755);
    }
  } catch (error) {
    await fs.promises.rm(temporaryDirectory, { force: true, recursive: true });
    throw error;
  }

  return {
    path: executablePath,
    remove: () => fs.promises.rm(temporaryDirectory, { force: true, recursive: true }),
  };
}

async function moveAbsolutePathToTrash(
  absolutePath: string,
  platformExecutable: MaterializedExecutable | null
): Promise<void> {
  if (platformExecutable) {
    await execFileAsync(platformExecutable.path, [absolutePath]);
    return;
  }

  await trash([absolutePath], { glob: false });
}

export async function movePathsToTrash(
  targets: string[],
  cwd: string,
  options: MovePathsToTrashOptions = {}
): Promise<MovePathsToTrashResult> {
  const result: MovePathsToTrashResult = {
    moved: [],
    missing: [],
    errors: [],
  };

  const platformExecutable = await materializePlatformTrashExecutable();

  try {
    for (const target of targets) {
      const trimmed = target.trim();
      if (trimmed === '') {
        continue;
      }

      const absolutePath = path.isAbsolute(trimmed) ? trimmed : path.resolve(cwd, trimmed);
      if (!fs.existsSync(absolutePath)) {
        if (!options.allowMissing) {
          result.missing.push(trimmed);
        }
        continue;
      }

      try {
        await moveAbsolutePathToTrash(absolutePath, platformExecutable);
        result.moved.push(trimmed);
      } catch (error) {
        result.errors.push(`trash: ${trimmed}: ${getErrorMessage(error)}`);
      }
    }
  } finally {
    await platformExecutable?.remove();
  }

  return result;
}

type CliOptions = {
  allowMissing: boolean;
  targets: string[];
};

const USAGE = `Usage: trash [--allow-missing] <path> [<path> ...]

Move files and directories to the system trash.

Options:
  --allow-missing  Ignore paths that do not exist
  -h, --help       Show help`;

function parseArgs(argv: string[]): CliOptions {
  const targets: string[] = [];
  let allowMissing = false;
  let parseOptions = true;

  for (const arg of argv) {
    if (parseOptions && arg === '--') {
      parseOptions = false;
      continue;
    }

    if (parseOptions && (arg === '--help' || arg === '-h')) {
      console.log(USAGE);
      process.exit(0);
    }

    if (parseOptions && arg === '--allow-missing') {
      allowMissing = true;
      continue;
    }

    if (parseOptions && arg.startsWith('-')) {
      throw new Error(`unknown option: ${arg}`);
    }

    targets.push(arg);
  }

  if (targets.length === 0) {
    throw new Error('provide at least one path');
  }

  return { allowMissing, targets };
}

async function main(): Promise<number> {
  let options: CliOptions;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Error: ${getErrorMessage(error)}`);
    console.error('Use --help for usage');
    return 2;
  }

  const result = await movePathsToTrash(options.targets, process.cwd(), {
    allowMissing: options.allowMissing,
  });

  for (const target of result.moved) {
    console.log(`Moved to trash: ${target}`);
  }
  for (const target of result.missing) {
    console.error(`trash: ${target}: path does not exist`);
  }
  for (const error of result.errors) {
    console.error(error);
  }

  return result.missing.length > 0 || result.errors.length > 0 ? 1 : 0;
}

if (import.meta.main) {
  process.exit(await main());
}
