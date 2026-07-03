import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateFindings } from "./validate-evidence.mjs";

async function makeRepo() {
  const root = await mkdtemp(join(tmpdir(), "validate-evidence-"));
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(
    join(root, "src", "api.ts"),
    ["async function load() {", "  const rows = await db.query(sql);", "  return rows;", "}", ""].join(
      "\n",
    ),
    "utf8",
  );
  return root;
}

function finding(overrides = {}) {
  return {
    id: "bug-api-example",
    title: "Example finding",
    evidence: [
      {
        path: "src/api.ts",
        startLine: 2,
        endLine: 2,
        quote: "const rows = await db.query(sql);",
        ...overrides,
      },
    ],
  };
}

test("keeps a finding whose quote matches the cited lines", async () => {
  const root = await makeRepo();
  const report = await validateFindings(root, [finding()]);
  assert.equal(report.kept.length, 1);
  assert.equal(report.dropped.length, 0);
});

test("keeps a quote that differs only in whitespace", async () => {
  const root = await makeRepo();
  const report = await validateFindings(root, [
    finding({ quote: "const rows =   await db.query(sql);" }),
  ]);
  assert.equal(report.kept.length, 1);
});

test("drops a quote that does not match the cited lines", async () => {
  const root = await makeRepo();
  const report = await validateFindings(root, [
    finding({ quote: "const rows = await cache.get(sql);" }),
  ]);
  assert.equal(report.dropped.length, 1);
  assert.match(report.dropped[0].failures[0].reason, /quote does not match/u);
});

test("drops a quote cited at the wrong lines even if it exists elsewhere", async () => {
  const root = await makeRepo();
  const report = await validateFindings(root, [
    finding({ startLine: 4, endLine: 4 }),
  ]);
  assert.equal(report.dropped.length, 1);
});

test("drops a line range beyond end of file", async () => {
  const root = await makeRepo();
  const report = await validateFindings(root, [finding({ startLine: 2, endLine: 99 })]);
  assert.equal(report.dropped.length, 1);
  assert.match(report.dropped[0].failures[0].reason, /exceeds file length/u);
});

test("drops inverted and non-integer line ranges", async () => {
  const root = await makeRepo();
  const report = await validateFindings(root, [
    finding({ startLine: 3, endLine: 2 }),
    { ...finding(), id: "second", evidence: [finding({ startLine: "2" }).evidence[0]] },
  ]);
  assert.equal(report.dropped.length, 2);
});

test("drops paths that escape the repository root", async () => {
  const root = await makeRepo();
  const report = await validateFindings(root, [
    finding({ path: "../outside.ts" }),
    { ...finding(), id: "abs", evidence: [finding({ path: "/etc/hosts" }).evidence[0]] },
  ]);
  assert.equal(report.dropped.length, 2);
  for (const drop of report.dropped) {
    assert.match(drop.failures[0].reason, /escapes repository root|not readable/u);
  }
});

test("drops symlinked paths that resolve outside the repository", async () => {
  const root = await makeRepo();
  await writeFile(join(tmpdir(), "validate-evidence-outside.ts"), "secret\n", "utf8");
  await symlink(join(tmpdir(), "validate-evidence-outside.ts"), join(root, "src", "link.ts"));
  const report = await validateFindings(root, [
    finding({ path: "src/link.ts", startLine: 1, endLine: 1, quote: "secret" }),
  ]);
  assert.equal(report.dropped.length, 1);
  assert.match(report.dropped[0].failures[0].reason, /not readable/u);
});

test("drops unreadable files, missing quotes, and empty evidence", async () => {
  const root = await makeRepo();
  const report = await validateFindings(root, [
    finding({ path: "src/missing.ts" }),
    { ...finding(), id: "no-quote", evidence: [finding({ quote: "  " }).evidence[0]] },
    { id: "no-evidence", title: "Empty", evidence: [] },
  ]);
  assert.equal(report.dropped.length, 3);
  assert.match(report.dropped[2].failures[0].reason, /no evidence/u);
});

test("one bad evidence ref drops the whole finding and reports every failure", async () => {
  const root = await makeRepo();
  const good = finding().evidence[0];
  const report = await validateFindings(root, [
    {
      id: "mixed",
      title: "Mixed evidence",
      evidence: [good, { ...good, quote: "nope" }, { ...good, path: "src/missing.ts" }],
    },
  ]);
  assert.equal(report.kept.length, 0);
  assert.equal(report.dropped[0].failures.length, 2);
});

test("falls back to title when id is missing", async () => {
  const root = await makeRepo();
  const noId = finding();
  delete noId.id;
  const report = await validateFindings(root, [noId]);
  assert.equal(report.kept[0].id, "Example finding");
});
