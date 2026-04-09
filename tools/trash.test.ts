import { expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { movePathsToTrash } from './trash.ts';

const createTempDir = (): string => fs.mkdtempSync(path.join(os.tmpdir(), 'dotfiles-trash-test-'));

const createUniqueName = (suffix: string): string =>
  `dotfiles-trash-test-${Date.now()}-${Math.random().toString(36).slice(2)}${suffix}`;

test('movePathsToTrash reports missing targets by default', () => {
  const cwd = createTempDir();

  try {
    expect(movePathsToTrash(['missing.txt'], cwd)).toEqual({
      moved: [],
      missing: ['missing.txt'],
      errors: [],
    });
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('movePathsToTrash ignores missing targets when allowMissing is enabled', () => {
  const cwd = createTempDir();

  try {
    expect(movePathsToTrash(['missing.txt'], cwd, { allowMissing: true })).toEqual({
      moved: [],
      missing: [],
      errors: [],
    });
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('movePathsToTrash moves an existing file resolved from cwd', () => {
  const cwd = createTempDir();
  const fileName = createUniqueName('.txt');
  const filePath = path.join(cwd, fileName);
  fs.writeFileSync(filePath, 'trash me');

  try {
    expect(movePathsToTrash([fileName], cwd)).toEqual({
      moved: [fileName],
      missing: [],
      errors: [],
    });
    expect(fs.existsSync(filePath)).toBeFalse();
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('movePathsToTrash moves an existing directory resolved from cwd', () => {
  const cwd = createTempDir();
  const dirName = createUniqueName('');
  const dirPath = path.join(cwd, dirName);
  fs.mkdirSync(dirPath);
  fs.writeFileSync(path.join(dirPath, 'nested.txt'), 'trash me');

  try {
    expect(movePathsToTrash([dirName], cwd)).toEqual({
      moved: [dirName],
      missing: [],
      errors: [],
    });
    expect(fs.existsSync(dirPath)).toBeFalse();
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
