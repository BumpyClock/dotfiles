import {
	configPath,
	fsPromises,
	parentDir,
	settingsPath,
} from "./node-builtins.js";
import {
	PERSONALITIES,
	PERSONALITY_ALIASES,
	STYLE_ALIASES,
	STYLES,
} from "./profiles.js";
import type {
	PersistedPersonalityState,
	PersonalityName,
	PersonalityState,
	PiSettingsFile,
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

function getErrorCode(error: unknown): string | undefined {
	return typeof error === "object" && error !== null && "code" in error
		? String(error.code)
		: undefined;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSettingsFile(raw: string): PiSettingsFile {
	const parsed = JSON.parse(raw) as unknown;
	return isObjectRecord(parsed) ? (parsed as PiSettingsFile) : {};
}

function readStateFromSettings(
	settings: PiSettingsFile,
): PersonalityState | undefined {
	const extensionSettings = settings.extensionSettings;
	if (!isObjectRecord(extensionSettings)) return undefined;

	const personalitySwitcher = extensionSettings.personalitySwitcher;
	if (!isObjectRecord(personalitySwitcher)) return undefined;

	return normalizeState(personalitySwitcher as PersistedPersonalityState);
}

function serializeState(state: PersonalityState): PersistedPersonalityState {
	return { personality: state.personality, styles: state.styles };
}

async function readLegacyPersistedState(): Promise<PersonalityState> {
	try {
		const parsed = JSON.parse(
			await fsPromises().readFile(configPath(), "utf8"),
		) as PersistedPersonalityState;
		return normalizeState(parsed);
	} catch (error) {
		const code = getErrorCode(error);
		if (code !== "ENOENT") {
			console.error(
				`Failed to read personality config from ${configPath()}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
		return emptyState();
	}
}

// Migration strategy: read settings.json first, then the old personality.json.
export async function readPersistedState(): Promise<PersonalityState> {
	try {
		const settings = parseSettingsFile(
			await fsPromises().readFile(settingsPath(), "utf8"),
		);
		return readStateFromSettings(settings) ?? readLegacyPersistedState();
	} catch (error) {
		const code = getErrorCode(error);
		if (code !== "ENOENT") {
			console.error(
				`Failed to read personality settings from ${settingsPath()}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
		return readLegacyPersistedState();
	}
}

// Writes only to settings.json so the next save completes the migration.
export async function writePersistedState(
	state: PersonalityState,
): Promise<void> {
	const path = settingsPath();
	let settings: PiSettingsFile = {};

	try {
		settings = parseSettingsFile(await fsPromises().readFile(path, "utf8"));
	} catch (error) {
		if (getErrorCode(error) !== "ENOENT") throw error;
	}

	settings.extensionSettings = {
		...(isObjectRecord(settings.extensionSettings)
			? settings.extensionSettings
			: {}),
		personalitySwitcher: serializeState(state),
	};

	await fsPromises().mkdir(parentDir(path), { recursive: true });
	await fsPromises().writeFile(
		path,
		`${JSON.stringify(settings, null, 2)}\n`,
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
