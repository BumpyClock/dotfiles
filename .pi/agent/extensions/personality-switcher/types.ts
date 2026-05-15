export type UiTheme = {
	fg(
		color:
			| "accent"
			| "error"
			| "warning"
			| "muted"
			| "dim"
			| "success"
			| "toolTitle"
			| "text",
		text: string,
	): string;
};

export type ExtensionUi = {
	theme: UiTheme;
	notify(
		message: string,
		level: "info" | "warning" | "error" | "success",
	): void;
	select(title: string, items: string[]): Promise<string | undefined>;
	setStatus(key: string, value: string | undefined): void;
	setWidget(
		key: string,
		value: string[] | ((tui: unknown, theme: UiTheme) => Component) | undefined,
		options?: { placement?: "aboveEditor" | "belowEditor" },
	): void;
};

export type ExtensionContext = {
	hasUI: boolean;
	ui: ExtensionUi;
};

export type Component = {
	render(width: number): string[];
	invalidate(): void;
};

export type JsonSchema = Record<string, unknown>;

export type ToolContent = { type: "text"; text: string };

export type ToolResult<Details = unknown> = {
	content: ToolContent[];
	details?: Details;
	terminate?: boolean;
};

export type ToolRenderOptions = {
	expanded: boolean;
	isPartial?: boolean;
};

export type ToolDefinition<
	Params extends Record<string, unknown> = Record<string, unknown>,
	Details = unknown,
> = {
	name: string;
	label: string;
	description: string;
	promptSnippet?: string;
	promptGuidelines?: string[];
	parameters: JsonSchema;
	execute(
		toolCallId: string,
		params: Params,
		signal?: AbortSignal,
		onUpdate?: (result: ToolResult<Details>) => void,
		ctx?: ExtensionContext,
	): ToolResult<Details> | Promise<ToolResult<Details>>;
	renderResult?(
		result: ToolResult<Details>,
		options: ToolRenderOptions,
		theme: UiTheme,
	): Component;
};

export type ExtensionAPI = {
	registerCommand(
		name: string,
		options: {
			description: string;
			handler: (
				args: string | undefined,
				ctx: ExtensionContext,
			) => void | Promise<void>;
		},
	): void;
	registerTool(definition: ToolDefinition): void;
	registerShortcut(
		shortcut: string,
		options: {
			description: string;
			handler: (ctx: ExtensionContext) => void | Promise<void>;
		},
	): void;
	on(
		event: "session_start",
		handler: (event: unknown, ctx: ExtensionContext) => void | Promise<void>,
	): void;
	on(
		event: "before_agent_start",
		handler: (
			event: { systemPrompt: string },
			ctx: ExtensionContext,
		) =>
			| void
			| { systemPrompt: string }
			| Promise<void | { systemPrompt: string }>,
	): void;
};

export type PromptProfile = {
	name: string;
	label: string;
	instructions: string;
};

export type PersonalityState = {
	personality?: PersonalityName;
	styles: StyleName[];
};

export type PersistedPersonalityState = {
	personality?: string;
	styles?: string[];
};

/** Shape of Pi's `extensionSettings` object for keys this extension owns. */
export type PersonalitySwitcherSettings = {
	personalitySwitcher?: PersistedPersonalityState;
};

export type PiSettingsFile = {
	extensionSettings?: PersonalitySwitcherSettings;
} & Record<string, unknown>;

export type PersonalityName =
	keyof typeof import("./profiles.js").PERSONALITIES;
export type StyleName = keyof typeof import("./profiles.js").STYLES;
