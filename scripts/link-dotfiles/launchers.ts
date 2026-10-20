type EnvironmentValue = string | { fromEnv: string };

export type Launcher = {
	title: string;
	command: string;
	args: string[];
	env: Record<string, EnvironmentValue>;
	unset: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isVariableName(value: unknown): value is string {
	return typeof value === "string" && /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}

function isStringList(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function parseLaunchers(value: unknown): Record<string, Launcher> {
	if (!isRecord(value)) {
		throw new Error("shell/launchers.json must contain an object");
	}

	const launchers: Record<string, Launcher> = {};
	for (const [name, entry] of Object.entries(value)) {
		const fail: (message: string) => never = (message) => {
			throw new Error(`Invalid launcher '${name}': ${message}`);
		};
		if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name)) {
			fail("name must be a plain command name");
		}
		if (!isRecord(entry)) {
			fail("definition must be an object");
		}
		for (const key of Object.keys(entry)) {
			if (!["title", "command", "args", "env", "unset"].includes(key)) {
				fail(`unknown field '${key}'`);
			}
		}
		if (typeof entry.title !== "string" || /[\x00-\x1f\x7f]/.test(entry.title)) {
			fail("title must be a string without control characters");
		}
		if (typeof entry.command !== "string" || !entry.command.trim()) {
			fail("command must be a nonempty string");
		}
		if (!isStringList(entry.args)) {
			fail("args must be a string array");
		}
		if (!isRecord(entry.env)) {
			fail("env must be an object");
		}
		const env: Record<string, EnvironmentValue> = {};
		for (const [variable, setting] of Object.entries(entry.env)) {
			if (!isVariableName(variable)) {
				fail(`invalid environment variable '${variable}'`);
			}
			if (typeof setting === "string") {
				env[variable] = setting;
			} else if (
				isRecord(setting) &&
				Object.keys(setting).length === 1 &&
				isVariableName(setting.fromEnv)
			) {
				env[variable] = { fromEnv: setting.fromEnv };
			} else {
				fail(`'${variable}' must be a string or { "fromEnv": "VARIABLE" }`);
			}
		}
		const unset = entry.unset ?? [];
		if (!isStringList(unset) || !unset.every(isVariableName)) {
			fail("unset must be an array of environment variable names");
		}
		if (unset.some((variable) => variable in env)) {
			fail("a variable cannot appear in both env and unset");
		}
		launchers[name] = {
			title: entry.title,
			command: entry.command,
			args: entry.args,
			env,
			unset,
		};
	}
	return launchers;
}

function shellQuote(value: string): string {
	return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function powershellQuote(value: string): string {
	return `'${value.replaceAll("'", "''")}'`;
}

export function renderLauncher(
	name: string,
	launcher: Launcher,
	platform: NodeJS.Platform,
): string {
	const references = [
		...new Set(
			Object.values(launcher.env).flatMap((value) =>
				typeof value === "string" ? [] : [value.fromEnv],
			),
		),
	];
	const header = "# Generated from shell/launchers.json. Do not edit.";
	if (platform !== "win32") {
		const lines = ["#!/bin/bash", header];
		for (const variable of references) {
			lines.push(
				`if [ -z "\${${variable}:-}" ]; then`,
				`  printf '%s\\n' ${shellQuote(`${name}: required environment variable ${variable} is missing; reload the managed shell environment.`)} >&2`,
				"  exit 1",
				"fi",
			);
		}
		lines.push(`printf '\\033]0;%s\\007' ${shellQuote(launcher.title)}`);
		for (const variable of launcher.unset) {
			lines.push(`unset ${variable}`);
		}
		for (const [variable, value] of Object.entries(launcher.env)) {
			const expression = typeof value === "string"
				? shellQuote(value)
				: `"$${value.fromEnv}"`;
			lines.push(`export ${variable}=${expression}`);
		}
		lines.push(
			`exec ${[launcher.command, ...launcher.args].map(shellQuote).join(" ")} "$@"`,
			"",
		);
		return lines.join("\n");
	}

	const lines = [header, "$ErrorActionPreference = 'Stop'"];
	for (const variable of references) {
		lines.push(
			`if ([string]::IsNullOrEmpty($env:${variable})) {`,
			`    throw ${powershellQuote(`${name}: required environment variable ${variable} is missing; reload the managed shell environment.`)}`,
			"}",
		);
	}
	const variables = [
		...new Set([...launcher.unset, ...Object.keys(launcher.env)]),
	];
	lines.push(
		"$savedEnvironment = @{}",
		`foreach ($variable in @(${variables.map(powershellQuote).join(", ")})) {`,
		"    $savedEnvironment[$variable] = [Environment]::GetEnvironmentVariable($variable, 'Process')",
		"}",
		"try {",
		`    $Host.UI.RawUI.WindowTitle = ${powershellQuote(launcher.title)}`,
	);
	for (const variable of launcher.unset) {
		lines.push(
			// Not SetEnvironmentVariable(name, $null): PowerShell passes $null as "", which blanks the variable
			`    Remove-Item -LiteralPath ${powershellQuote(`Env:${variable}`)} -ErrorAction SilentlyContinue`,
		);
	}
	for (const [variable, value] of Object.entries(launcher.env)) {
		const expression = typeof value === "string"
			? powershellQuote(value)
			: `$env:${value.fromEnv}`;
		lines.push(`    $env:${variable} = ${expression}`);
	}
	lines.push(
		// A script-scope $LASTEXITCODE would hide the global one the command sets
		"    $global:LASTEXITCODE = 0",
		`    & ${[launcher.command, ...launcher.args].map(powershellQuote).join(" ")} @args`,
		"    $launcherExitCode = $global:LASTEXITCODE",
		"} finally {",
		"    foreach ($variable in $savedEnvironment.Keys) {",
		"        if ($null -eq $savedEnvironment[$variable]) {",
		"            Remove-Item -LiteralPath \"Env:$variable\" -ErrorAction SilentlyContinue",
		"        } else {",
		"            [Environment]::SetEnvironmentVariable($variable, $savedEnvironment[$variable], 'Process')",
		"        }",
		"    }",
		"}",
		"exit $launcherExitCode",
		"",
	);
	return lines.join("\n");
}
