import type { BeadIssue, BeadsSnapshot, PreviewEntry, Tone, UsageSummary } from "./types";
import { formatShort, wrapText } from "./text";

type LivePreviewLine = {
  label: string;
  tone: Tone;
  text: string;
};

type LiveAgentSnapshot = {
  totalEvents: number;
  lastUpdatedAt: number;
  lines: LivePreviewLine[];
};

const SPINNER_FRAMES = ["-", "\\", "|", "/"];

export const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
  white: "\x1b[97m",
};

function stylingEnabled(): boolean {
  return Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
}

export function colorize(text: string, ...codes: string[]): string {
  if (!stylingEnabled() || codes.length === 0) {
    return text;
  }
  return `${codes.join("")}${text}${ANSI.reset}`;
}

export function toneColor(tone: Tone): string {
  switch (tone) {
    case "info":
      return ANSI.cyan;
    case "success":
      return ANSI.green;
    case "warn":
      return ANSI.yellow;
    case "error":
      return ANSI.red;
    case "muted":
      return ANSI.gray;
    case "neutral":
    default:
      return ANSI.white;
  }
}

export function badge(text: string, tone: Tone): string {
  return colorize(`[${text}]`, ANSI.bold, toneColor(tone));
}

export function terminalWidth(): number {
  const width = process.stdout.columns ?? 100;
  return Math.max(70, Math.min(width, 140));
}

function hr(char = "-"): string {
  return char.repeat(Math.min(terminalWidth(), 100));
}

export function printSection(title: string): void {
  console.log(colorize(hr("="), ANSI.gray));
  console.log(`${badge("LOOP", "info")} ${colorize(title, ANSI.bold, ANSI.white)}`);
  console.log(colorize(hr("-"), ANSI.gray));
}

export function formatTokens(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString("en-US");
}

export function progressBar(current: number, total: number): string {
  const width = 22;
  const safeTotal = Math.max(total, 1);
  const ratio = Math.max(0, Math.min(1, current / safeTotal));
  const filled = Math.round(width * ratio);
  return `[${"#".repeat(filled)}${"-".repeat(width - filled)}] ${Math.round(ratio * 100)}%`;
}

export function labelTone(label: string): Tone {
  const normalized = label.toLowerCase();
  if (normalized.includes("error")) return "error";
  if (normalized.includes("tool") || normalized.includes("command")) return "info";
  if (normalized.includes("reasoning")) return "muted";
  if (normalized.includes("assistant")) return "success";
  if (normalized.includes("warn")) return "warn";
  return "neutral";
}

export function createSpinner(label: string): { stop: (message: string, tone?: Tone) => void } {
  if (!process.stdout.isTTY) {
    console.log(`${badge("RUN", "info")} ${label}`);
    return {
      stop: (message: string, tone = "success") => {
        console.log(`${badge("DONE", tone)} ${message}`);
      },
    };
  }

  const start = Date.now();
  let frame = 0;
  const timer = setInterval(() => {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const cursor = SPINNER_FRAMES[frame % SPINNER_FRAMES.length];
    frame += 1;
    const line = `${cursor} ${label} ${elapsed}s`;
    process.stdout.write(`\r${colorize(line, ANSI.cyan)}`);
  }, 100);

  return {
    stop: (message: string, tone = "success") => {
      clearInterval(timer);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      process.stdout.write("\r\x1b[2K");
      console.log(`${badge("DONE", tone)} ${message} ${colorize(`(${elapsed}s)`, ANSI.dim)}`);
    },
  };
}

export class LiveRunRenderer {
  private readonly enabled: boolean;
  private readonly startedAt = Date.now();
  private readonly agentIds: number[];
  private readonly previewLines: number;
  private frameIndex = 0;
  private timer: NodeJS.Timeout | null = null;
  private renderedLineCount = 0;
  private running = true;
  private statusMessage = "starting";
  private statusTone: Tone = "info";
  private readonly agentState = new Map<number, LiveAgentSnapshot>();
  private beadsSnapshot: BeadsSnapshot | null = null;
  private readonly agentPickedBeads = new Map<number, BeadIssue>();

  constructor(
    private readonly iteration: number,
    private readonly maxIterations: number,
    agentIds: number[],
    previewLines: number
  ) {
    this.enabled = Boolean(process.stdout.isTTY);
    this.agentIds = [...agentIds].sort((left, right) => left - right);
    this.previewLines = Math.max(1, previewLines);
    if (!this.enabled) {
      return;
    }
    this.render();
    this.timer = setInterval(() => {
      this.frameIndex += 1;
      this.render();
    }, 100);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  update(agentId: number, entry: PreviewEntry): void {
    if (!this.enabled || !this.running) {
      return;
    }
    const previous = this.agentState.get(agentId) ?? {
      totalEvents: 0,
      lastUpdatedAt: Date.now(),
      lines: [],
    };
    const nextLine: LivePreviewLine = {
      label: entry.label,
      tone: labelTone(entry.label),
      text: formatShort(entry.text, 220),
    };
    const last = previous.lines[previous.lines.length - 1];
    const nextLines =
      last && last.label === nextLine.label && last.text === nextLine.text
        ? previous.lines
        : [...previous.lines, nextLine].slice(-this.previewLines);
    this.agentState.set(agentId, {
      totalEvents: previous.totalEvents + 1,
      lastUpdatedAt: Date.now(),
      lines: nextLines,
    });
    this.statusMessage = "streaming events";
    this.statusTone = "info";
    this.render();
  }

  setBeadsSnapshot(snapshot: BeadsSnapshot | null): void {
    this.beadsSnapshot = snapshot;
    if (!this.enabled || !this.running) {
      return;
    }
    this.render();
  }

  setAgentPickedBead(agentId: number, issue: BeadIssue): void {
    this.agentPickedBeads.set(agentId, issue);
    if (!this.enabled || !this.running) {
      return;
    }
    this.render();
  }

  stop(message: string, tone: Tone = "success"): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (!this.enabled) {
      console.log(`${badge("DONE", tone)} ${message}`);
      return;
    }
    this.running = false;
    this.statusMessage = message;
    this.statusTone = tone;
    this.render();
  }

  private buildHeaderLine(): string {
    const elapsed = ((Date.now() - this.startedAt) / 1000).toFixed(1);
    const frame = this.running ? SPINNER_FRAMES[this.frameIndex % SPINNER_FRAMES.length] : "";
    const tone = this.running ? "info" : this.statusTone;
    const bodyColor = this.running ? ANSI.cyan : toneColor(tone);
    const parts = [
      frame,
      `iteration ${this.iteration}/${this.maxIterations}`,
      this.statusMessage,
      `${elapsed}s`,
    ]
      .filter(Boolean)
      .join(" ");
    return `${badge("LIVE", tone)} ${colorize(parts, bodyColor)}`;
  }

  private buildAgentLines(agentId: number): string[] {
    const snapshot = this.agentState.get(agentId);
    const prefix = badge(`A${agentId}`, "muted");
    if (!snapshot) {
      return [`${prefix} ${badge("WAIT", "muted")} ${colorize("waiting for events", ANSI.dim)}`];
    }

    const ageSeconds = Math.max(0, Math.floor((Date.now() - snapshot.lastUpdatedAt) / 1000));
    const header = `${prefix} ${badge("EVENTS", "muted")} ${colorize(
      String(snapshot.totalEvents),
      ANSI.bold
    )} ${colorize(`updated ${ageSeconds}s ago`, ANSI.dim)}`;
    const picked = this.agentPickedBeads.get(agentId);
    const pickedLine = picked
      ? `  ${colorize(">>", ANSI.dim)} ${badge("PICKED", "success")} ${colorize(
          `${picked.id} ${picked.title}`,
          ANSI.green
        )}`
      : `  ${colorize("..", ANSI.dim)} ${badge("PICKED", "muted")} ${colorize("none yet", ANSI.dim)}`;
    const maxLength = Math.max(36, terminalWidth() - 30);
    const detailLines = snapshot.lines.map((line, index) => {
      const lineLabel = badge(line.label.toUpperCase(), line.tone);
      const text = colorize(formatShort(line.text, maxLength), toneColor(line.tone));
      return `  ${colorize(String(index + 1).padStart(2, " "), ANSI.dim)} ${lineLabel} ${text}`;
    });
    while (detailLines.length < this.previewLines) {
      detailLines.unshift(
        `  ${colorize("..", ANSI.dim)} ${badge("EMPTY", "muted")} ${colorize("no event yet", ANSI.dim)}`
      );
    }
    return [header, pickedLine, ...detailLines];
  }

  private buildBeadsLines(): string[] {
    if (!this.beadsSnapshot) {
      return [];
    }
    if (!this.beadsSnapshot.available) {
      const suffix = this.beadsSnapshot.error
        ? ` ${colorize(`(${formatShort(this.beadsSnapshot.error, 100)})`, ANSI.dim)}`
        : "";
      return [`${badge("BEADS", "warn")} unavailable${suffix}`];
    }

    const summary = `${badge("BEADS", "info")} remaining ${colorize(
      String(this.beadsSnapshot.remaining),
      ANSI.bold
    )} | in_progress ${this.beadsSnapshot.inProgress} | open ${this.beadsSnapshot.open} | blocked ${
      this.beadsSnapshot.blocked
    } | closed ${this.beadsSnapshot.closed}`;
    const topRemaining = this.beadsSnapshot.remainingIssues.slice(0, 3).map((issue, index) => {
      const assignee = issue.assignee ? ` @${issue.assignee}` : "";
      return `  ${colorize(String(index + 1).padStart(2, " "), ANSI.dim)} ${badge(
        "REM",
        "muted"
      )} ${colorize(`${issue.id} ${issue.title}${assignee}`, ANSI.white)}`;
    });
    return [summary, ...topRemaining];
  }

  private render(): void {
    if (!this.enabled) {
      return;
    }
    const lines = [
      this.buildHeaderLine(),
      ...this.buildBeadsLines(),
      ...this.agentIds.flatMap((agentId) => this.buildAgentLines(agentId)),
    ];
    if (this.renderedLineCount > 0) {
      process.stdout.write(`\x1b[${this.renderedLineCount}A`);
    }
    for (const line of lines) {
      process.stdout.write(`\r\x1b[2K${line}\n`);
    }
    this.renderedLineCount = lines.length;
  }
}

function selectPreviewEntries(lines: PreviewEntry[], previewCount: number): PreviewEntry[] {
  if (lines.length <= previewCount) {
    return lines;
  }

  const picked = new Set<number>();
  const desiredOrder: PreviewEntry["kind"][] = ["assistant", "tool", "reasoning", "error"];
  for (const kind of desiredOrder) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].kind === kind) {
        picked.add(i);
        break;
      }
    }
    if (picked.size >= previewCount) {
      break;
    }
  }

  for (let i = lines.length - 1; i >= 0 && picked.size < previewCount; i--) {
    picked.add(i);
  }

  return [...picked]
    .sort((a, b) => a - b)
    .map((index) => lines[index])
    .slice(-previewCount);
}

export function printPreview(lines: PreviewEntry[], previewCount: number, contextLabel?: string): void {
  const preview = selectPreviewEntries(lines, previewCount);
  if (preview.length === 0) {
    console.log(`${badge("PREVIEW", "muted")} No message payloads found in this iteration.`);
    return;
  }
  const contextSuffix = contextLabel ? ` ${colorize(`(${contextLabel})`, ANSI.dim)}` : "";
  console.log(`${badge("PREVIEW", "info")} Recent activity (${preview.length}):${contextSuffix}`);
  const width = Math.max(40, terminalWidth() - 10);
  for (let i = 0; i < preview.length; i++) {
    const entry = preview[i];
    const tone = labelTone(entry.label);
    const header = `${i + 1}. ${badge(entry.label.toUpperCase(), tone)}`;
    console.log(header);
    const wrapped = wrapText(entry.text, width);
    for (const line of wrapped) {
      console.log(`   ${colorize(line, toneColor(tone))}`);
    }
  }
}

export function printUsageSummary(usage: UsageSummary, contextLabel?: string): void {
  const contextSuffix = contextLabel ? ` ${colorize(`(${contextLabel})`, ANSI.dim)}` : "";
  console.log(
    `${badge("TOKENS", "muted")} in ${formatTokens(usage.inputTokens)} | cached ${formatTokens(
      usage.cachedInputTokens
    )} | out ${formatTokens(usage.outputTokens)}${contextSuffix}`
  );
}
