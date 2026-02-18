import type { CliOptions, PreviewEntry, UsageSummary } from "../core/types";
import { formatShort } from "../core/text";
import type { ProviderAdapter } from "./types";

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return isObject(value);
}

function safeJsonParse(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function firstStringValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    const combined = value
      .map((entry) => firstStringValue(entry))
      .filter(Boolean)
      .join("\n")
      .trim();
    return combined;
  }
  if (!isRecord(value)) {
    return "";
  }

  const keyPriority = ["text", "content", "output", "message", "data", "summary"];
  for (const key of keyPriority) {
    const nested = firstStringValue(value[key]);
    if (nested) {
      return nested;
    }
  }

  const merged = Object.values(value)
    .map((entry) => firstStringValue(entry))
    .filter(Boolean)
    .join(" ")
    .trim();
  return merged;
}

function summarizeCommand(command: string): string {
  const compact = command.replace(/\s+/g, " ").trim();
  const commandMatch = compact.match(/-Command\s+(.+)$/i);
  if (commandMatch) {
    const extracted = commandMatch[1].trim().replace(/^['"]|['"]$/g, "");
    return formatShort(extracted, 140);
  }
  return formatShort(compact, 140);
}

function toJsonCandidates(line: string): unknown[] {
  const values: unknown[] = [];
  const direct = safeJsonParse(line);
  if (direct !== null) {
    values.push(direct);
    return values;
  }

  const start = line.indexOf("{");
  const end = line.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const embedded = safeJsonParse(line.slice(start, end + 1));
    if (embedded !== null) {
      values.push(embedded);
    }
  }

  return values;
}

function extractCodexPreviewLine(event: Record<string, unknown>): PreviewEntry | null {
  const type = typeof event.type === "string" ? event.type : "";

  if (type === "item.started" || type === "item.completed" || type === "item.delta") {
    const item = isRecord(event.item) ? event.item : null;
    if (!item) {
      return null;
    }

    const itemType = typeof item.type === "string" ? item.type : "item";
    if (itemType === "agent_message") {
      const payload = firstStringValue(item.text ?? item.content ?? item.message);
      return payload ? { kind: "assistant", label: "assistant", text: formatShort(payload) } : null;
    }
    if (itemType === "reasoning") {
      const payload = firstStringValue(item.text ?? item.summary ?? item.content ?? item.message);
      return payload
        ? { kind: "reasoning", label: "reasoning", text: formatShort(payload, 200) }
        : null;
    }
    if (
      itemType === "command_execution" ||
      itemType.includes("tool") ||
      itemType.includes("call")
    ) {
      const commandText = firstStringValue(item.command ?? item.input ?? item.name);
      const status = typeof item.status === "string" ? item.status : "";
      const exitCode = typeof item.exit_code === "number" ? item.exit_code : null;
      if (!commandText) {
        return null;
      }
      const summarized = summarizeCommand(commandText);
      const statusPrefix = status ? `${status}: ` : type === "item.started" ? "in_progress: " : "";
      const suffix = exitCode === null ? "" : ` (exit ${exitCode})`;
      return {
        kind: "tool",
        label: "tool",
        text: `${statusPrefix}${summarized}${suffix}`,
      };
    }

    const fallbackItemText = firstStringValue(item);
    if (!fallbackItemText) {
      return null;
    }
    const fallbackKind: PreviewEntry["kind"] = itemType.includes("reason")
      ? "reasoning"
      : itemType.includes("error")
        ? "error"
        : "message";
    return { kind: fallbackKind, label: itemType, text: formatShort(fallbackItemText) };
  }

  if (type === "error") {
    const payload = firstStringValue(event.error ?? event.message ?? event);
    return payload ? { kind: "error", label: "error", text: formatShort(payload) } : null;
  }

  const genericPayload = firstStringValue(event.message ?? event.content ?? event.text);
  if (!genericPayload) {
    return null;
  }
  const label = type || "message";
  return {
    kind: label.includes("reason") ? "reasoning" : label.includes("error") ? "error" : "message",
    label,
    text: formatShort(genericPayload),
  };
}

function previewEntriesFromLine(line: string): PreviewEntry[] {
  const entries: PreviewEntry[] = [];
  const trimmed = line.trim();
  if (!trimmed) {
    return entries;
  }

  const values = toJsonCandidates(trimmed);
  for (const value of values) {
    if (Array.isArray(value)) {
      for (const nested of value) {
        if (!isRecord(nested)) {
          continue;
        }
        const entry = extractCodexPreviewLine(nested);
        if (entry) {
          entries.push(entry);
        }
      }
    } else if (isRecord(value)) {
      const entry = extractCodexPreviewLine(value);
      if (entry) {
        entries.push(entry);
      }
    }
  }
  return entries;
}

function collectMessages(output: string): PreviewEntry[] {
  const messages: PreviewEntry[] = [];
  const lines = output.split(/\r?\n/);
  for (const line of lines) {
    messages.push(...previewEntriesFromLine(line));
  }
  return messages;
}

function collectRawJsonLines(output: string, previewCount: number): string[] {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.includes("{") || line.includes("}"));
  return lines.slice(-previewCount);
}

function toPositiveNumber(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  return numeric;
}

function extractUsageSummary(output: string): UsageSummary | null {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (const line of lines) {
    const parsed = safeJsonParse(line);
    if (!isRecord(parsed)) {
      continue;
    }
    if (parsed.type !== "turn.completed") {
      continue;
    }
    if (!isRecord(parsed.usage)) {
      continue;
    }

    const usage = parsed.usage;
    const inputTokens = toPositiveNumber(usage.input_tokens) ?? 0;
    const cachedInputTokens = toPositiveNumber(usage.cached_input_tokens) ?? 0;
    const outputTokens = toPositiveNumber(usage.output_tokens) ?? 0;
    return { inputTokens, cachedInputTokens, outputTokens };
  }
  return null;
}

function findRetrySeconds(value: unknown): number | null {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findRetrySeconds(entry);
      if (found !== null) {
        return found;
      }
    }
    return null;
  }
  if (!isRecord(value)) {
    return null;
  }

  const numericKeys = ["resets_in_seconds", "reset_seconds", "retry_after_seconds"];
  for (const key of numericKeys) {
    const found = toPositiveNumber(value[key]);
    if (found !== null) {
      return found;
    }
  }

  for (const nested of Object.values(value)) {
    const found = findRetrySeconds(nested);
    if (found !== null) {
      return found;
    }
  }
  return null;
}

function extractRetryDelaySeconds(output: string): number | null {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (const line of lines) {
    const parsed = safeJsonParse(line);
    const found = findRetrySeconds(parsed);
    if (found !== null) {
      return found;
    }
  }

  const secondMatch = output.match(/(?:try again|retry).{0,30}?(\d+)\s*(?:seconds?|secs?|s)\b/i);
  if (secondMatch) {
    return Number.parseInt(secondMatch[1], 10);
  }
  const minuteMatch = output.match(/(?:try again|retry).{0,30}?(\d+)\s*(?:minutes?|mins?|m)\b/i);
  if (minuteMatch) {
    return Number.parseInt(minuteMatch[1], 10) * 60;
  }
  return null;
}

function hasNoBeadsMarker(output: string): boolean {
  const normalized = output.toLowerCase();
  return normalized.includes("no beads available") || normalized.includes("no_beads_available");
}

function formatCommandHint(command: string): string {
  if (process.platform !== "win32") {
    return `make sure "${command}" is installed and available in PATH`;
  }
  return `on Windows, pass --command with a full path like "C:/Users/<user>/AppData/Local/pnpm/codex.CMD"`;
}

function buildCodexExecArgs(lastMessagePath: string, options: CliOptions): string[] {
  const args = ["exec", "--json"];
  if (options.model.trim()) {
    args.push("-m", options.model.trim());
  }
  args.push("-c", `reasoning_effort="${options.reasoningEffort}"`);
  if (options.yolo) {
    args.push("--yolo");
  }
  args.push("--output-last-message", lastMessagePath, "-");
  return args;
}

export const codexProvider: ProviderAdapter = {
  name: "codex",
  displayName: "Codex",
  defaults: {
    command: "codex",
    logDir: ".ai_agents/logs/codex-loop",
    model: "gpt-5.3-codex-spark",
    reasoningEffort: "high",
    yolo: true,
  },
  buildExecArgs: buildCodexExecArgs,
  previewEntriesFromLine,
  collectMessages,
  collectRawJsonLines,
  extractUsageSummary,
  extractRetryDelaySeconds,
  hasStopMarker: hasNoBeadsMarker,
  formatCommandHint,
};
