#!/usr/bin/env bun

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const docsListFile = fileURLToPath(import.meta.url);
const docsListDir = dirname(docsListFile);
const USAGE = `Usage: docs-list [--dotfiles-dir <path>]

List markdown docs in the dotfiles repo and print summary metadata.

Options:
  --dotfiles-dir <path>  Explicit dotfiles repository root
  -h, --help             Show help`;

const EXCLUDED_DIRS = new Set(['archive', 'research']);

function parseArgs(argv: string[]): { dotfilesDir?: string } {
  let dotfilesDir: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      console.log(USAGE);
      process.exit(0);
    }

    if (arg === '--dotfiles-dir') {
      const value = argv[i + 1];
      if (!value) {
        console.error('Error: missing value for --dotfiles-dir');
        process.exit(2);
      }

      dotfilesDir = value;
      i += 1;
      continue;
    }

    console.error(`Error: unknown argument: ${arg}`);
    console.error('Use --help for usage');
    process.exit(2);
  }

  return { dotfilesDir };
}

function isDotfilesRoot(dirPath: string): boolean {
  return existsSync(join(dirPath, 'docs')) && existsSync(join(dirPath, 'AGENTS.md'));
}

function findDotfilesRoot(startDir: string): string | null {
  let currentDir = startDir;

  while (true) {
    if (isDotfilesRoot(currentDir)) {
      return currentDir;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

function resolveDocsDir(dotfilesDir?: string): string {
  if (dotfilesDir) {
    return join(dotfilesDir, 'docs');
  }

  const dotfilesFromEnv = process.env.DOTFILES_DIR;
  if (dotfilesFromEnv) {
    return join(dotfilesFromEnv, 'docs');
  }

  const dotfilesFromCwd = findDotfilesRoot(process.cwd());
  if (dotfilesFromCwd) {
    return join(dotfilesFromCwd, 'docs');
  }

  const sourceRelativeDocsDir = join(docsListDir, '..', 'docs');
  if (existsSync(sourceRelativeDocsDir)) {
    return sourceRelativeDocsDir;
  }

  throw new Error('Could not locate docs directory; pass --dotfiles-dir or run inside the dotfiles repo');
}

function compactStrings(values: unknown[]): string[] {
  const result: string[] = [];
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }
    const normalized = String(value).trim();
    if (normalized.length > 0) {
      result.push(normalized);
    }
  }
  return result;
}

function walkMarkdownFiles(dir: string, base: string = dir): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) {
        continue;
      }
      files.push(...walkMarkdownFiles(fullPath, base));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(relative(base, fullPath));
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function extractMetadata(fullPath: string): {
  summary: string | null;
  readWhen: string[];
  error?: string;
} {
  const content = readFileSync(fullPath, 'utf8');

  if (!content.startsWith('---')) {
    return { summary: null, readWhen: [], error: 'missing front matter' };
  }

  const endIndex = content.indexOf('\n---', 3);
  if (endIndex === -1) {
    return { summary: null, readWhen: [], error: 'unterminated front matter' };
  }

  const frontMatter = content.slice(3, endIndex).trim();
  const lines = frontMatter.split('\n');

  let summaryLine: string | null = null;
  const readWhen: string[] = [];
  let collectingField: 'read_when' | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('summary:')) {
      summaryLine = line;
      collectingField = null;
      continue;
    }

    if (line.startsWith('read_when:')) {
      collectingField = 'read_when';
      const inline = line.slice('read_when:'.length).trim();
      if (inline.startsWith('[') && inline.endsWith(']')) {
        try {
          const parsed = JSON.parse(inline.replace(/'/g, '"')) as unknown;
          if (Array.isArray(parsed)) {
            readWhen.push(...compactStrings(parsed));
          }
        } catch {
          // ignore malformed inline arrays
        }
      }
      continue;
    }

    if (collectingField === 'read_when') {
      if (line.startsWith('- ')) {
        const hint = line.slice(2).trim();
        if (hint) {
          readWhen.push(hint);
        }
      } else if (line === '') {
      } else {
        collectingField = null;
      }
    }
  }

  if (!summaryLine) {
    return { summary: null, readWhen, error: 'summary key missing' };
  }

  const summaryValue = summaryLine.slice('summary:'.length).trim();
  const normalized = summaryValue
    .replace(/^['"]|['"]$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return { summary: null, readWhen, error: 'summary is empty' };
  }

  return { summary: normalized, readWhen };
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const docsDir = resolveDocsDir(options.dotfilesDir);

  console.log('Listing all markdown files in docs folder:');

  const markdownFiles = walkMarkdownFiles(docsDir);

  for (const relativePath of markdownFiles) {
    const fullPath = join(docsDir, relativePath);
    const { summary, readWhen, error } = extractMetadata(fullPath);
    if (summary) {
      console.log(`${relativePath} - ${summary}`);
      if (readWhen.length > 0) {
        console.log(`  Read when: ${readWhen.join('; ')}`);
      }
    } else {
      const reason = error ? ` - [${error}]` : '';
      console.log(`${relativePath}${reason}`);
    }
  }

  console.log(
    '\nReminder: keep docs up to date as behavior changes. When your task matches any "Read when" hint above (React hooks, cache directives, database work, tests, etc.), read that doc before coding, and suggest new coverage when it is missing.'
  );
}

main();
