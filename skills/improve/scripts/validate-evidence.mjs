#!/usr/bin/env node
/**
 * Mechanical evidence validation for improve-skill findings.
 *
 * Every check here has a ground truth: does the cited file exist inside the
 * repo, is the line range real, does the quote match the bytes at those
 * lines. Findings that fail any evidence check are dropped — the reviewer
 * model cannot vouch for code it did not actually read. Judgment calls
 * (by-design? impact real?) stay with the agent; this script only kills
 * fabricated or mis-attributed citations.
 *
 * Usage:
 *   node validate-evidence.mjs --repo <repo-root> --findings <findings.json> [--out <report.json>]
 *
 * Findings file shape (bare array also accepted):
 *   { "findings": [ { "id": "bug-api-unawaited-retry", "title": "...",
 *       "evidence": [ { "path": "src/api.ts", "startLine": 12, "endLine": 14,
 *                       "quote": "await retry(" } ] } ] }
 *
 * Exit codes: 0 all findings kept, 1 at least one dropped, 2 usage/input error.
 */
import { readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

export async function validateFindings(root, findings) {
  const realRoot = await realpath(root).catch(() => null);
  if (realRoot === null) {
    throw new Error(`repo root is not readable: ${root}`);
  }
  const cache = new Map();
  const kept = [];
  const dropped = [];
  for (const finding of findings) {
    const id = findingId(finding);
    const failures = [];
    const evidence = Array.isArray(finding.evidence) ? finding.evidence : [];
    if (evidence.length === 0) {
      failures.push({ path: null, reason: "finding has no evidence" });
    }
    for (const ref of evidence) {
      const failure = await checkEvidence(root, realRoot, ref, cache);
      if (failure !== null) {
        failures.push(failure);
      }
    }
    if (failures.length > 0) {
      dropped.push({ id, title: finding.title ?? null, failures });
    } else {
      kept.push({ id, title: finding.title ?? null });
    }
  }
  return { kept, dropped, checked: findings.length };
}

async function checkEvidence(root, realRoot, ref, cache) {
  if (ref === null || typeof ref !== "object" || typeof ref.path !== "string" || ref.path === "") {
    return { path: null, reason: "evidence ref is missing a path" };
  }
  const shownPath = ref.path;
  const normalized = normalizePath(shownPath);
  if (isAbsolute(normalized) || normalized.startsWith("../") || normalized === "..") {
    return { path: shownPath, reason: "evidence path escapes repository root" };
  }
  const contents = await fileContents(root, realRoot, normalized, cache);
  if (contents === null) {
    return { path: shownPath, reason: "evidence file is not readable inside repository" };
  }
  const { startLine, endLine } = ref;
  if (!isLineNumber(startLine) || !isLineNumber(endLine)) {
    return { path: shownPath, reason: "evidence needs integer startLine and endLine (1-based)" };
  }
  if (startLine > endLine) {
    return { path: shownPath, reason: `line range is inverted: ${startLine}-${endLine}` };
  }
  const lines = splitLines(contents);
  if (endLine > lines.length) {
    return {
      path: shownPath,
      reason: `line range ${startLine}-${endLine} exceeds file length (${lines.length} lines)`,
    };
  }
  if (typeof ref.quote !== "string" || ref.quote.trim() === "") {
    return { path: shownPath, reason: "evidence is missing a verbatim quote" };
  }
  const target = lines.slice(startLine - 1, endLine).join("\n");
  if (
    !target.includes(ref.quote) &&
    !compactWhitespace(target).includes(compactWhitespace(ref.quote))
  ) {
    return {
      path: shownPath,
      reason: `quote does not match file contents at lines ${startLine}-${endLine}`,
    };
  }
  return null;
}

async function fileContents(root, realRoot, normalized, cache) {
  const existing = cache.get(normalized);
  if (existing !== undefined) {
    return existing;
  }
  const loaded = readInsideRepo(root, realRoot, normalized);
  cache.set(normalized, loaded);
  return loaded;
}

async function readInsideRepo(root, realRoot, normalized) {
  const full = resolve(root, normalized);
  if (!isInside(root, full)) {
    return null;
  }
  const realFull = await realpath(full).catch(() => null);
  if (realFull === null || !isInside(realRoot, realFull)) {
    return null;
  }
  return readFile(full, "utf8").catch(() => null);
}

function findingId(finding) {
  if (typeof finding.id === "string" && finding.id.trim() !== "") {
    return finding.id;
  }
  if (typeof finding.title === "string" && finding.title.trim() !== "") {
    return finding.title;
  }
  return "(unidentified finding)";
}

function isLineNumber(value) {
  return Number.isInteger(value) && value >= 1;
}

function splitLines(contents) {
  if (contents.length === 0) {
    return [""];
  }
  const lines = contents.split("\n");
  return contents.endsWith("\n") ? lines.slice(0, -1) : lines;
}

function normalizePath(path) {
  return path.replace(/\\/gu, "/").replace(/^\.\/+/u, "");
}

function compactWhitespace(value) {
  return value.replace(/\s+/gu, " ").trim();
}

function isInside(root, candidate) {
  const relativePath = relative(root, candidate);
  return relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath));
}

function parseArgs(argv) {
  const args = { repo: null, findings: null, out: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--repo") {
      args.repo = argv[++i] ?? null;
    } else if (argv[i] === "--findings") {
      args.findings = argv[++i] ?? null;
    } else if (argv[i] === "--out") {
      args.out = argv[++i] ?? null;
    } else {
      throw new Error(`unknown argument: ${argv[i]}`);
    }
  }
  if (args.repo === null || args.findings === null) {
    throw new Error(
      "usage: node validate-evidence.mjs --repo <repo-root> --findings <findings.json> [--out <report.json>]",
    );
  }
  return args;
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(2);
  }
  let findings;
  try {
    const raw = JSON.parse(await readFile(args.findings, "utf8"));
    findings = Array.isArray(raw) ? raw : raw?.findings;
    if (!Array.isArray(findings)) {
      throw new Error('expected a JSON array or an object with a "findings" array');
    }
  } catch (error) {
    process.stderr.write(`cannot read findings file: ${error.message}\n`);
    process.exit(2);
  }
  let report;
  try {
    report = await validateFindings(args.repo, findings);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(2);
  }
  const serialized = JSON.stringify(report, null, 2);
  if (args.out !== null) {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(args.out, `${serialized}\n`, "utf8");
  } else {
    process.stdout.write(`${serialized}\n`);
  }
  process.stderr.write(
    `evidence validation: ${report.kept.length} kept, ${report.dropped.length} dropped (of ${report.checked})\n`,
  );
  for (const drop of report.dropped) {
    for (const failure of drop.failures) {
      process.stderr.write(
        `  DROP ${drop.id}: ${failure.reason}${failure.path === null ? "" : ` [${failure.path}]`}\n`,
      );
    }
  }
  process.exit(report.dropped.length > 0 ? 1 : 0);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
