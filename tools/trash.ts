import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type MovePathsToTrashOptions = {
  allowMissing?: boolean;
};

export type MovePathsToTrashResult = {
  moved: string[];
  missing: string[];
  errors: string[];
};

const TOOLS_DIR = path.dirname(fileURLToPath(import.meta.url));
const TRASH_EVAL_SOURCE = "import trash from 'trash'; await trash([process.env.TRASH_TARGET], {glob: false});";

const getRuntimeEvalArgs = (source: string): string[] => {
  if (process.versions.bun) {
    return ['--eval', source];
  }

  return ['--input-type=module', '--eval', source];
};

const toText = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value).toString('utf8').trim();
  }

  return '';
};

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const processError = error as {
      stderr?: unknown;
      stdout?: unknown;
      message?: unknown;
    };

    const stderr = toText(processError.stderr);
    if (stderr) {
      return stderr;
    }

    const stdout = toText(processError.stdout);
    if (stdout) {
      return stdout;
    }

    const message = toText(processError.message);
    if (message) {
      return message;
    }
  }

  return String(error);
};

const moveAbsolutePathToTrashSync = (absolutePath: string): void => {
  execFileSync(process.execPath, getRuntimeEvalArgs(TRASH_EVAL_SOURCE), {
    cwd: TOOLS_DIR,
    env: {
      ...process.env,
      TRASH_TARGET: absolutePath,
    },
    stdio: 'pipe',
  });
};

export function movePathsToTrash(
  targets: string[],
  cwd: string,
  options: MovePathsToTrashOptions = {}
): MovePathsToTrashResult {
  const result: MovePathsToTrashResult = {
    moved: [],
    missing: [],
    errors: [],
  };

  for (const target of targets) {
    const trimmed = target.trim();
    if (!trimmed) {
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
      moveAbsolutePathToTrashSync(absolutePath);
      result.moved.push(trimmed);
    } catch (error) {
      result.errors.push(`rm: ${trimmed}: ${getErrorMessage(error)}`);
    }
  }

  return result;
}
