import { truncateToWidth } from "@earendil-works/pi-tui";
import type {
	ExtensionAPI,
	ExtensionContext,
	ToolDefinition,
	ToolResult,
	UiTheme,
} from "./types.js";

export const PERSONALITY_INSIGHT_WIDGET_KEY = "personality-insight";

let lastInsight: PersonalityInsightDetails | undefined;
let collapsed = false;

const INSIGHT_CATEGORIES = [
	"Insight",
	"Concept",
	"Designer Bridge",
	"Vibe Coding Move",
	"Tradeoff",
	"Pattern",
	"Pitfall",
	"Debug Read",
	"Verification",
] as const;

type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];

type PersonalityInsightParams = {
	category: InsightCategory;
	title?: string;
	bullets: string[];
	bridge?: string;
} & Record<string, unknown>;

type PersonalityInsightDetails = PersonalityInsightParams;

const PARAMETERS = {
	type: "object",
	properties: {
		category: {
			type: "string",
			enum: INSIGHT_CATEGORIES,
			description: "Insight category to show in the TUI widget.",
		},
		title: {
			type: "string",
			description: "Optional short title for the insight widget.",
		},
		bullets: {
			type: "array",
			description: "One to three concise teaching bullets.",
			items: { type: "string" },
			minItems: 1,
			maxItems: 3,
		},
		bridge: {
			type: "string",
			description: "Optional UX/design analogy or vibe-coding lesson.",
		},
	},
	required: ["category", "bullets"],
	additionalProperties: false,
};

function isInsightCategory(value: string): value is InsightCategory {
	return (INSIGHT_CATEGORIES as readonly string[]).includes(value);
}

function normalizeInsight(
	params: PersonalityInsightParams,
): PersonalityInsightDetails {
	return {
		category: isInsightCategory(params.category) ? params.category : "Insight",
		title: params.title?.trim() || undefined,
		bullets: params.bullets
			.map((bullet) => bullet.trim())
			.filter(Boolean)
			.slice(0, 3),
		bridge: params.bridge?.trim() || undefined,
	};
}

function colorForCategory(
	category: InsightCategory,
): Parameters<UiTheme["fg"]>[0] {
	switch (category) {
		case "Pitfall":
		case "Debug Read":
			return "warning";
		case "Verification":
			return "success";
		case "Tradeoff":
		case "Pattern":
			return "accent";
		default:
			return "toolTitle";
	}
}

const WIDGET_MIN_WIDTH = 80;
const WIDGET_MAX_WIDTH = 200;
const CONTENT_INDENT = 2;

function wrapText(text: string, width: number): string[] {
	const safeWidth = Math.max(1, width);
	const words = text.split(/\s+/).filter(Boolean);
	if (words.length === 0) return [""];
	const lines: string[] = [];
	let current = "";
	for (const word of words) {
		if (word.length > safeWidth) {
			if (current) {
				lines.push(current);
				current = "";
			}
			let rest = word;
			while (rest.length > safeWidth) {
				lines.push(rest.slice(0, safeWidth));
				rest = rest.slice(safeWidth);
			}
			current = rest;
			continue;
		}
		const candidate = current ? `${current} ${word}` : word;
		if (candidate.length > safeWidth) {
			lines.push(current);
			current = word;
		} else {
			current = candidate;
		}
	}
	if (current) lines.push(current);
	return lines;
}

function padRight(text: string, width: number): string {
	if (text.length >= width) return text.slice(0, width);
	return text + " ".repeat(width - text.length);
}

function boxRow(
	content: string,
	theme: UiTheme,
	color: Parameters<UiTheme["fg"]>[0],
): string {
	const border = theme.fg(color, "│");
	return `${border}${content}${border}`;
}

function formatWidgetLines(
	details: PersonalityInsightDetails,
	theme: UiTheme,
	widgetWidth: number,
): string[] {
	const innerWidth = Math.max(20, widgetWidth - 2);
	const contentWidth = Math.max(10, innerWidth - CONTENT_INDENT);
	const color = colorForCategory(details.category);
	const lines: string[] = [];

	// Top border with heading: ╭─ ★ Category · Title ─...─╮
	const headingText = `★ ${details.category}${details.title ? ` · ${details.title}` : ""}`;
	const headingMaxLen = Math.max(4, innerWidth - 4);
	const clippedHeading =
		headingText.length > headingMaxLen
			? `${headingText.slice(0, headingMaxLen - 1)}…`
			: headingText;
	const headingDashCount = innerWidth - 3 - clippedHeading.length;
	const topLeft = theme.fg(color, "╭─ ");
	const styledHeading = theme.fg(color, clippedHeading);
	const topRight = theme.fg(
		color,
		` ${"─".repeat(Math.max(0, headingDashCount))}╮`,
	);
	lines.push(`${topLeft}${styledHeading}${topRight}`);

	// Bullets
	for (const [index, bullet] of details.bullets.entries()) {
		const prefix = `${index + 1}. `;
		const wrapped = wrapText(bullet, contentWidth - prefix.length);
		for (const [wIdx, segment] of wrapped.entries()) {
			const body =
				wIdx === 0
					? `${prefix}${segment}`
					: `${" ".repeat(prefix.length)}${segment}`;
			const padded = padRight(`  ${body}`, innerWidth);
			lines.push(boxRow(theme.fg("text", padded), theme, color));
		}
	}

	// Bridge / UX section with divider
	if (details.bridge) {
		const label = " UX ";
		const dashFill = innerWidth - CONTENT_INDENT - 2 - label.length;
		const divider = `${" ".repeat(CONTENT_INDENT)}──${label}${"─".repeat(
			Math.max(0, dashFill),
		)}`;
		lines.push(
			boxRow(theme.fg("muted", padRight(divider, innerWidth)), theme, color),
		);
		const wrapped = wrapText(details.bridge, contentWidth);
		for (const segment of wrapped) {
			const padded = padRight(`  ${segment}`, innerWidth);
			lines.push(boxRow(theme.fg("muted", padded), theme, color));
		}
	}

	// Bottom border
	lines.push(theme.fg(color, `╰${"─".repeat(innerWidth)}╯`));

	return lines;
}

function renderInsightWidget(
	ctx: ExtensionContext,
	details: PersonalityInsightDetails,
): void {
	const theme = ctx.ui.theme;
	ctx.ui.setWidget(
		PERSONALITY_INSIGHT_WIDGET_KEY,
		(_tui, factoryTheme) => ({
			render(width: number): string[] {
				const t = (factoryTheme as UiTheme) ?? theme;
				if (collapsed) return formatCollapsedLines(details, t);
				const clamped = Math.min(
					WIDGET_MAX_WIDTH,
					Math.max(WIDGET_MIN_WIDTH, width || WIDGET_MIN_WIDTH),
				);
				return formatWidgetLines(details, t, clamped);
			},
			invalidate() {},
		}),
		{ placement: "aboveEditor" },
	);
}

function setInsightWidget(
	ctx: ExtensionContext | undefined,
	details: PersonalityInsightDetails,
): void {
	lastInsight = details;
	if (!ctx?.hasUI) return;
	renderInsightWidget(ctx, details);
}

function formatCollapsedLines(
	details: PersonalityInsightDetails,
	theme: UiTheme,
): string[] {
	const color = colorForCategory(details.category);
	const label = `★ ${details.category}${details.title ? ` · ${details.title}` : ""}`;
	const hint = theme.fg("muted", " [ctrl+shift+e expand]");
	return [`${theme.fg(color, label)}${hint}`];
}

export function togglePersonalityInsightCollapsed(ctx: ExtensionContext): void {
	if (!ctx.hasUI) return;
	if (!lastInsight) {
		ctx.ui.notify("No insight to collapse", "info");
		return;
	}
	collapsed = !collapsed;
	renderInsightWidget(ctx, lastInsight);
}

export function clearPersonalityInsightWidget(ctx: ExtensionContext): void {
	if (!ctx.hasUI) return;
	lastInsight = undefined;
	ctx.ui.setWidget(PERSONALITY_INSIGHT_WIDGET_KEY, undefined);
}

export function createPersonalityInsightTool(): ToolDefinition<
	PersonalityInsightParams,
	PersonalityInsightDetails
> {
	return {
		name: "personality_insight",
		label: "Insight",
		description:
			"Render a concise teaching insight as a persistent above-editor TUI widget. Use only when explanatory style is active and a brief concept/pattern/tradeoff note helps the user.",
		promptSnippet:
			"Render an explanatory teaching insight as an above-editor TUI widget",
		promptGuidelines: [
			"Use personality_insight only when the active style includes explanatory and the user benefits from a short teaching note.",
			"Use personality_insight instead of writing inline `★ Insight` markdown blocks.",
			"Do not use personality_insight for tiny tasks, raw-output requests, security/destructive flows, or uncertain context.",
		],
		parameters: PARAMETERS,
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const details = normalizeInsight(params);
			setInsightWidget(ctx, details);
			return {
				content: [
					{
						type: "text",
						text: `Insight widget updated: ${details.category}${details.title ? ` — ${details.title}` : ""}`,
					},
				],
				details,
			};
		},
		renderResult(result: ToolResult<PersonalityInsightDetails>) {
			return {
				render(width: number) {
					const text =
						result.content.find((item) => item.type === "text")?.text ??
						"Insight widget updated";
					const safeWidth = Math.max(0, Math.floor(width || 0));
					if (safeWidth === 0) return [""];
					return text
						.split(/\r?\n/)
						.map((line) => truncateToWidth(line, safeWidth, "…"));
				},
				invalidate() {},
			};
		},
	};
}

export function registerPersonalityInsightTool(pi: ExtensionAPI): void {
	pi.registerTool(createPersonalityInsightTool());
}
