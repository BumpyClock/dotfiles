import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docsListScriptPath = fileURLToPath(new URL('./docs-list.ts', import.meta.url));

const createTempDir = (): string => fs.mkdtempSync(path.join(os.tmpdir(), 'dotfiles-docs-list-test-'));

const toText = (value: string | Uint8Array | undefined): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return Buffer.from(value).toString('utf8');
};

const runDocsList = (args: string[]) =>
  Bun.spawnSync([process.execPath, docsListScriptPath, ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

describe('docs-list CLI', () => {
  test('prints clear error when explicit dotfiles root has no docs directory', () => {
    const dotfilesDir = createTempDir();
    fs.writeFileSync(path.join(dotfilesDir, 'AGENTS.md'), '# temp root');

    try {
      const result = runDocsList(['--dotfiles-dir', dotfilesDir]);

      expect(result.exitCode).toBe(1);
      expect(toText(result.stdout)).toBe('');
      expect(toText(result.stderr)).toContain(`Error: Docs directory not found: ${path.join(dotfilesDir, 'docs')}`);
      expect(toText(result.stderr)).not.toContain('ENOENT');
    } finally {
      fs.rmSync(dotfilesDir, { recursive: true, force: true });
    }
  });

  test('prints clear error when docs path is file, not directory', () => {
    const dotfilesDir = createTempDir();
    fs.writeFileSync(path.join(dotfilesDir, 'docs'), 'not directory');

    try {
      const result = runDocsList(['--dotfiles-dir', dotfilesDir]);

      expect(result.exitCode).toBe(1);
      expect(toText(result.stdout)).toBe('');
      expect(toText(result.stderr)).toContain(`Error: Docs path is not a directory: ${path.join(dotfilesDir, 'docs')}`);
    } finally {
      fs.rmSync(dotfilesDir, { recursive: true, force: true });
    }
  });

  test('prints clear error when no docs directory can be located', () => {
    const tempDir = createTempDir();
    const tempScriptPath = path.join(tempDir, 'docs-list.ts');
    fs.copyFileSync(docsListScriptPath, tempScriptPath);

    try {
      const result = Bun.spawnSync([process.execPath, tempScriptPath], {
        cwd: tempDir,
        env: {
          ...process.env,
          DOTFILES_DIR: '',
        },
        stdout: 'pipe',
        stderr: 'pipe',
      });

      expect(result.exitCode).toBe(1);
      expect(toText(result.stdout)).toBe('');
      expect(toText(result.stderr)).toContain('Error: No docs directory found');
      expect(toText(result.stderr)).not.toContain('--dotfiles-dir');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
