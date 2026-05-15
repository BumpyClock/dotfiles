import { WHIMSICAL_MESSAGES } from "./whimsical-data/messages";

type ExtensionContext = {
  ui: {
    setWorkingMessage(message?: string): void;
  };
};

type ExtensionAPI = {
  on(
    event: string,
    handler: (event: any, ctx: ExtensionContext) => void | Promise<void>,
  ): void;
};

function pickRandom(): string {
  return WHIMSICAL_MESSAGES[Math.floor(Math.random() * WHIMSICAL_MESSAGES.length)]!;
}

// Shimmer: a moving bright window slides across dim base text, mimicking the
// gradient effect used by Codex/Claude Code. Implemented with 256-color
// grayscale ANSI so it stays terminal-portable; the loader resets only foreground
// (`\x1b[39m`) so per-char codes won't fight any outer dim attribute.
const SHIMMER_BASE = 244; // medium gray
const SHIMMER_PEAK = 255; // near-white
const SHIMMER_WINDOW = 6; // half-width of bright window
const SHIMMER_TAIL = 18; // extra frames after the head passes the last char
const SHIMMER_INTERVAL_MS = 70;
const SHIMMER_STEP = 1; // chars advanced per frame

function buildShimmer(text: string, phase: number): string {
  const len = text.length;
  if (len === 0) return text;
  const period = len + SHIMMER_TAIL;
  const head = ((phase % period) + period) % period;
  let out = "";
  for (let i = 0; i < len; i++) {
    const ch = text[i]!;
    if (ch === " ") {
      out += ch;
      continue;
    }
    const d = Math.abs(i - head);
    let level: number;
    if (d > SHIMMER_WINDOW) {
      level = SHIMMER_BASE;
    } else {
      const t = 1 - d / SHIMMER_WINDOW;
      level = Math.round(SHIMMER_BASE + (SHIMMER_PEAK - SHIMMER_BASE) * t);
    }
    out += `\x1b[38;5;${level}m${ch}`;
  }
  return `${out}\x1b[39m`;
}

export default function (pi: ExtensionAPI) {
  let timer: ReturnType<typeof setInterval> | undefined;
  let phase = 0;
  let currentMessage = "";

  const stopShimmer = () => {
    if (timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };

  pi.on("turn_start", async (_event, ctx) => {
    stopShimmer();
    currentMessage = pickRandom();
    phase = -SHIMMER_WINDOW; // start with the bright window off-screen left
    ctx.ui.setWorkingMessage(buildShimmer(currentMessage, phase));
    timer = setInterval(() => {
      phase += SHIMMER_STEP;
      try {
        ctx.ui.setWorkingMessage(buildShimmer(currentMessage, phase));
      } catch {
        stopShimmer();
      }
    }, SHIMMER_INTERVAL_MS);
  });

  pi.on("turn_end", async (_event, ctx) => {
    stopShimmer();
    ctx.ui.setWorkingMessage(); // restore default
  });
}
