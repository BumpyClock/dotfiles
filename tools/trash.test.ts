import { expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { movePathsToTrash } from './trash.ts';

const createTempDir = (): string => fs.mkdtempSync(path.join(os.tmpdir(), 'dotfiles-trash-test-'));

const createUniqueName = (suffix: string): string =>
  `dotfiles-trash-test-${Date.now()}-${Math.random().toString(36).slice(2)}${suffix}`;

test('movePathsToTrash reports missing targets by default', async () => {
  const cwd = createTempDir();

  try {
    expect(await movePathsToTrash(['missing.txt'], cwd)).toEqual({
      moved: [],
      missing: ['missing.txt'],
      errors: [],
    });
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('movePathsToTrash ignores missing targets when allowMissing is enabled', async () => {
  const cwd = createTempDir();

  try {
    expect(await movePathsToTrash(['missing.txt'], cwd, { allowMissing: true })).toEqual({
      moved: [],
      missing: [],
      errors: [],
    });
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('movePathsToTrash moves an existing file resolved from cwd', async () => {
  const cwd = createTempDir();
  const fileName = createUniqueName('.txt');
  const filePath = path.join(cwd, fileName);
  fs.writeFileSync(filePath, 'trash me');

  try {
    expect(await movePathsToTrash([fileName], cwd)).toEqual({
      moved: [fileName],
      missing: [],
      errors: [],
    });
    expect(fs.existsSync(filePath)).toBeFalse();
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('movePathsToTrash moves an existing directory resolved from cwd', async () => {
  const cwd = createTempDir();
  const dirName = createUniqueName('');
  const dirPath = path.join(cwd, dirName);
  fs.mkdirSync(dirPath);
  fs.writeFileSync(path.join(dirPath, 'nested.txt'), 'trash me');

  try {
    expect(await movePathsToTrash([dirName], cwd)).toEqual({
      moved: [dirName],
      missing: [],
      errors: [],
    });
    expect(fs.existsSync(dirPath)).toBeFalse();
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('movePathsToTrash trims surrounding whitespace from targets', async () => {
  const cwd = createTempDir();
  const fileName = createUniqueName('.txt');
  const filePath = path.join(cwd, fileName);
  fs.writeFileSync(filePath, 'trash me');

  try {
    expect(await movePathsToTrash([`  ${fileName}  `], cwd)).toEqual({
      moved: [fileName],
      missing: [],
      errors: [],
    });
    expect(fs.existsSync(filePath)).toBeFalse();
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('movePathsToTrash skips blank targets', async () => {
  const cwd = createTempDir();

  try {
    expect(await movePathsToTrash(['', '   '], cwd)).toEqual({
      moved: [],
      missing: [],
      errors: [],
    });
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('compiled trash command moves an existing file', () => {
  const cwd = createTempDir();
  const binaryName = process.platform === 'win32' ? 'trash.exe' : 'trash';
  const binaryPath = path.join(cwd, binaryName);
  const filePath = path.join(cwd, createUniqueName('.txt'));
  fs.writeFileSync(filePath, 'trash me');

  try {
    const build = Bun.spawnSync([
      process.execPath,
      'build',
      '--compile',
      path.join(import.meta.dir, 'trash.ts'),
      '--outfile',
      binaryPath,
    ]);
    expect(Buffer.from(build.stderr).toString('utf8')).toBe('');
    expect(build.exitCode).toBe(0);

    const run = Bun.spawnSync([binaryPath, filePath]);
    expect(Buffer.from(run.stderr).toString('utf8')).toBe('');
    expect(run.exitCode).toBe(0);
    expect(fs.existsSync(filePath)).toBeFalse();
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
