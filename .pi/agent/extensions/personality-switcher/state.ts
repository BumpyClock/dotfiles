import { configPath, fsPromises, parentDir } from "./node-builtins.js";
import { PERSONALITIES, PERSONALITY_ALIASES, STYLE_ALIASES, STYLES } from "./profiles.js";
import type {
	PersistedPersonalityState,
	PersonalityName,
	PersonalityState,
	StyleName,
} from "./types.js";

export const NONE = "off";

export function emptyState(): PersonalityState {
	return { styles: [] };
}

export function normalizeToken(value: string): string {
	return value.trim().toLowerCase();
}

export function uniqueStyles(styles: StyleName[]): StyleName[] {
	return Array.from(new Set(styles));
}

export function resolvePersonality(value: string): PersonalityName | undefined {
	const normalized = normalizeToken(value);
	if (normalized in PERSONALITIES) return normalized as PersonalityName;
	return PERSONALITY_ALIASES[normalized];
}

export function resolveStyle(value: string): StyleName | undefined {
	const normalized = normalizeToken(value);
	if (normalized in STYLES) return normalized as StyleName;
	return STYLE_ALIASES[normalized];
}

export function normalizeState(
	input: PersistedPersonalityState,
): PersonalityState {
	const personality = input.personality
		? resolvePersonality(input.personality)
		: undefined;
	const styles = uniqueStyles(
		(input.styles ?? [])
			.map(resolveStyle)
			.filter((style): style is StyleName => Boolean(style)),
	);
	return { personality, styles };
}

export async function readPersistedState(): Promise<PersonalityState> {
	try {
		const parsed = JSON.parse(
			await fsPromises().readFile(configPath(), "utf8"),
		) as PersistedPersonalityState;
		return normalizeState(parsed);
	} catch (error) {
		const code =
			typeof error === "object" && error !== null && "code" in error
				? String(error.code)
				: undefined;
		if (code !== "ENOENT") {
			console.error(
				`Failed to read personality config from ${configPath()}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
		return emptyState();
	}
}

export async function writePersistedState(
	state: PersonalityState,
): Promise<void> {
	const path = configPath();
	await fsPromises().mkdir(parentDir(path), { recursive: true });
	await fsPromises().writeFile(
		path,
		`${JSON.stringify({ personality: state.personality, styles: state.styles }, null, 2)}
`,
		"utf8",
	);
}

export function formatState(state: PersonalityState): string {
	const parts: string[] = [];
	if (state.personality) parts.push(state.personality);
	if (state.styles.length > 0) parts.push(...state.styles);
	return parts.length > 0 ? parts.join(" + ") : NONE;
}

export function availablePersonalities(): string {
	return [NONE, ...Object.keys(PERSONALITIES)].join(", ");
}

export function availableStyles(): string {
	return [NONE, ...Object.keys(STYLES)].join(", ");
}
