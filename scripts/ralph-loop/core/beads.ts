import { spawn } from "node:child_process";
import type { BeadIssue, BeadsSnapshot } from "./types";

type ShellResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

function runCommand(command: string, args: string[], cwd: string): Promise<ShellResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => reject(error));
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

function safeJsonParse(input: string): unknown | null {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function extractIssueArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  const record = asRecord(payload);
  if (!record) {
    return [];
  }
  const candidates = [record.issues, record.items, record.data, record.results];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  return [];
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNumberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeIssue(raw: unknown): BeadIssue | null {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }
  const id = toStringValue(record.id ?? record.issue_id ?? record.key);
  const title = toStringValue(record.title ?? record.summary ?? record.name);
  const status = toStringValue(record.status ?? "open").toLowerCase() || "open";
  if (!id || !title) {
    return null;
  }
  return {
    id,
    title,
    status,
    priority: toNumberValue(record.priority),
    assignee: toStringValue(record.assignee) || undefined,
  };
}

function sortRemaining(issues: BeadIssue[]): BeadIssue[] {
  return [...issues].sort((left, right) => {
    const leftPriority = left.priority ?? -1;
    const rightPriority = right.priority ?? -1;
    if (leftPriority !== rightPriority) {
      return rightPriority - leftPriority;
    }
    return left.id.localeCompare(right.id);
  });
}

export function extractReferencedBeadIds(text: string, knownIds: Set<string>): string[] {
  const matches = text.match(/\b[a-z][a-z0-9]*(?:-[a-z0-9]+)+\b/gi) ?? [];
  const found = new Set<string>();
  for (const match of matches) {
    if (knownIds.has(match)) {
      found.add(match);
    }
  }
  return [...found];
}

export async function loadBeadsSnapshot(projectRoot: string): Promise<BeadsSnapshot> {
  try {
    const result = await runCommand("bd", ["list", "--json", "--all", "--limit", "0"], projectRoot);
    if (result.status !== 0) {
      return {
        available: false,
        source: "bd list --json --all --limit 0",
        projectRoot,
        total: 0,
        remaining: 0,
        open: 0,
        inProgress: 0,
        blocked: 0,
        closed: 0,
        deferred: 0,
        remainingIssues: [],
        byId: new Map(),
        error: result.stderr.trim() || result.stdout.trim() || `bd exited with status ${result.status}`,
      };
    }

    const parsed = safeJsonParse(result.stdout);
    const rawIssues = extractIssueArray(parsed);
    const issues = rawIssues.map(normalizeIssue).filter((issue): issue is BeadIssue => issue !== null);
    const byId = new Map(issues.map((issue) => [issue.id, issue]));

    const closed = issues.filter((issue) => issue.status === "closed").length;
    const open = issues.filter((issue) => issue.status === "open").length;
    const inProgress = issues.filter((issue) => issue.status === "in_progress").length;
    const blocked = issues.filter((issue) => issue.status === "blocked").length;
    const deferred = issues.filter((issue) => issue.status === "deferred").length;
    const remainingIssues = sortRemaining(issues.filter((issue) => issue.status !== "closed"));

    return {
      available: true,
      source: "bd list --json --all --limit 0",
      projectRoot,
      total: issues.length,
      remaining: remainingIssues.length,
      open,
      inProgress,
      blocked,
      closed,
      deferred,
      remainingIssues,
      byId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      available: false,
      source: "bd list --json --all --limit 0",
      projectRoot,
      total: 0,
      remaining: 0,
      open: 0,
      inProgress: 0,
      blocked: 0,
      closed: 0,
      deferred: 0,
      remainingIssues: [],
      byId: new Map(),
      error: message,
    };
  }
}
