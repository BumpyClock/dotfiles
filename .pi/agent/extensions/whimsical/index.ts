import { WHIMSICAL_MESSAGES } from "./data/messages";

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

function pickRandom(exclude?: string): string {
	const messages: readonly string[] = WHIMSICAL_MESSAGES;
	if (messages.length === 0) return "";
	if (messages.length === 1) return messages[0]!;

	const choices =
		exclude === undefined
			? messages
			: messages.filter((message) => message !== exclude);
	const pool = choices.length > 0 ? choices : messages;
	return pool[Math.floor(Math.random() * pool.length)]!;
}

// Shimmer: a bright window moves across dim base text, then reverses direction
// at either edge. Implemented with 256-color grayscale ANSI so it stays
// terminal-portable; reset only foreground (`\x1b[39m`) so per-char codes won't
// fight any outer dim attribute.
const SHIMMER_BASE = 244; // medium gray
const SHIMMER_PEAK = 255; // near-white
const SHIMMER_WINDOW = 6; // radius of bright window
const SHIMMER_INTERVAL_MS = 70;
const SHIMMER_STEP = 1; // chars advanced per frame

const MESSAGE_HOLD_MS = 6400;
const MESSAGE_TRANSITION_MS = 980;
const MESSAGE_HOLD_FRAMES = Math.max(
	1,
	Math.round(MESSAGE_HOLD_MS / SHIMMER_INTERVAL_MS),
);
const MESSAGE_TRANSITION_FRAMES = Math.max(
	1,
	Math.round(MESSAGE_TRANSITION_MS / SHIMMER_INTERVAL_MS),
);

function splitMessage(text: string): string[] {
	return Array.from(text);
}

function buildShimmer(text: string, shimmerHead: number): string {
	const chars = splitMessage(text);
	if (chars.length === 0) return text;

	let out = "";
	for (let i = 0; i < chars.length; i++) {
		const ch = chars[i]!;
		if (ch === " ") {
			out += ch;
			continue;
		}
		const d = Math.abs(i - shimmerHead);
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

function transitionMessages(from: string, to: string, frame: number): string {
	const fromChars = splitMessage(from);
	const toChars = splitMessage(to);
	const exitFrames = Math.max(1, Math.floor(MESSAGE_TRANSITION_FRAMES / 2));
	const enterFrames = Math.max(1, MESSAGE_TRANSITION_FRAMES - exitFrames);

	if (frame < exitFrames) {
		const progress = Math.min(1, (frame + 1) / exitFrames);
		const visibleCount = Math.ceil(fromChars.length * (1 - progress));
		return fromChars.slice(0, visibleCount).join("").trimEnd();
	}

	const enterFrame = frame - exitFrames;
	const progress = Math.min(1, (enterFrame + 1) / enterFrames);
	const visibleCount = Math.ceil(toChars.length * progress);
	return toChars.slice(0, visibleCount).join("").trimEnd();
}

export default function (pi: ExtensionAPI) {
	let timer: ReturnType<typeof setInterval> | undefined;
	let currentMessage = "";
	let nextMessage: string | undefined;
	let transitionFrame = 0;
	let holdFramesRemaining = MESSAGE_HOLD_FRAMES;
	let shimmerHead = -SHIMMER_WINDOW;
	let shimmerDirection: 1 | -1 = 1;

	const getDisplayMessage = () =>
		nextMessage === undefined
			? currentMessage
			: transitionMessages(currentMessage, nextMessage, transitionFrame);

	const resetShimmer = () => {
		shimmerHead = -SHIMMER_WINDOW;
		shimmerDirection = 1;
	};

	const advanceShimmer = (message: string) => {
		const chars = splitMessage(message);
		if (chars.length === 0) {
			resetShimmer();
			return;
		}

		const minHead = -SHIMMER_WINDOW;
		const maxHead = chars.length - 1 + SHIMMER_WINDOW;
		shimmerHead += shimmerDirection * SHIMMER_STEP;

		if (shimmerHead >= maxHead) {
			shimmerHead = maxHead;
			shimmerDirection = -1;
		} else if (shimmerHead <= minHead) {
			shimmerHead = minHead;
			shimmerDirection = 1;
		}
	};

	const advanceMessage = () => {
		if (nextMessage !== undefined) {
			transitionFrame += 1;
			if (transitionFrame >= MESSAGE_TRANSITION_FRAMES) {
				currentMessage = nextMessage;
				nextMessage = undefined;
				transitionFrame = 0;
				holdFramesRemaining = MESSAGE_HOLD_FRAMES;
			}
			return;
		}

		if (holdFramesRemaining > 0) {
			holdFramesRemaining -= 1;
			return;
		}

		nextMessage = pickRandom(currentMessage);
		transitionFrame = 0;
	};

	const stopAnimation = () => {
		if (timer) {
			clearInterval(timer);
			timer = undefined;
		}
	};

	const renderFrame = (ctx: ExtensionContext) => {
		const displayMessage = getDisplayMessage();
		ctx.ui.setWorkingMessage(buildShimmer(displayMessage, shimmerHead));
		advanceShimmer(displayMessage);
		advanceMessage();
	};

	const restoreDefault = (ctx: ExtensionContext) => {
		stopAnimation();
		ctx.ui.setWorkingMessage(); // restore default
	};

	pi.on("turn_start", async (_event, ctx) => {
		stopAnimation();

		const targetMessage = pickRandom(currentMessage);
		if (currentMessage) {
			nextMessage = targetMessage;
			transitionFrame = 0;
			holdFramesRemaining = 0;
		} else {
			currentMessage = targetMessage;
			nextMessage = undefined;
			transitionFrame = 0;
			holdFramesRemaining = MESSAGE_HOLD_FRAMES;
		}

		resetShimmer();
		try {
			renderFrame(ctx);
			timer = setInterval(() => {
				try {
					renderFrame(ctx);
				} catch {
					stopAnimation();
				}
			}, SHIMMER_INTERVAL_MS);
		} catch {
			stopAnimation();
		}
	});

	pi.on("turn_end", async (_event, ctx) => {
		restoreDefault(ctx);
	});

	pi.on("agent_end", async (_event, ctx) => {
		restoreDefault(ctx);
	});

	pi.on("session_shutdown", async () => {
		stopAnimation();
	});
}
