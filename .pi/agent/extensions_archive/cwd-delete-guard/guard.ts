import { lstat, realpath } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
type Word = { value: string; dynamic: boolean };
type Token = Word | { operator: string };

type DeleteCheck = {
	command: string;
	targets: Word[];
	cwd: string;
};

const COMMAND_SEPARATORS = new Set([";", "&&", "||", "|", "\n"]);
const DELETE_COMMANDS = new Set(["rm", "rmdir", "unlink", "trash"]);
const WRAPPERS = new Set(["command", "exec", "noglob", "sudo"]);
const SHELL_PREFIXES = new Set([
	"{",
	"}",
	"do",
	"elif",
	"else",
	"if",
	"then",
	"while",
	"until",
]);

function tokenize(command: string): Token[] {
	const tokens: Token[] = [];
	let value = "";
	let dynamic = false;
	let quote: "'" | '"' | undefined;

	const pushWord = () => {
		if (value || dynamic) tokens.push({ value, dynamic });
		value = "";
		dynamic = false;
	};

	for (let i = 0; i < command.length; i += 1) {
		const char = command[i]!;

		if (quote === "'") {
			if (char === "'") quote = undefined;
			else value += char;
			continue;
		}

		if (char === '"') {
			quote = quote === '"' ? undefined : '"';
			continue;
		}
		if (!quote && char === "'") {
			quote = "'";
			continue;
		}
		if (char === "\\") {
			i += 1;
			if (i < command.length) value += command[i];
			continue;
		}
		if (
			char === "$" ||
			char === "`" ||
			(!quote && (char === "<" || char === ">"))
		) {
			dynamic = true;
			value += char;
			continue;
		}
		if (!quote && /\s/.test(char)) {
			pushWord();
			if (char === "\n") tokens.push({ operator: "\n" });
			continue;
		}
		if (!quote && (char === ";" || char === "|" || char === "&")) {
			pushWord();
			const pair = command.slice(i, i + 2);
			if (pair === "&&" || pair === "||") {
				tokens.push({ operator: pair });
				i += 1;
			} else {
				tokens.push({ operator: char });
			}
			continue;
		}
		value += char;
	}

	pushWord();
	return tokens;
}

function wordsInSegments(command: string): Word[][] {
	const segments: Word[][] = [[]];
	for (const token of tokenize(command)) {
		if ("operator" in token && COMMAND_SEPARATORS.has(token.operator)) {
			if (segments.at(-1)!.length > 0) segments.push([]);
		} else if (!("operator" in token)) {
			segments.at(-1)!.push(token);
		}
	}
	return segments.filter((segment) => segment.length > 0);
}

function unwrapCommand(words: Word[]): Word[] {
	let index = 0;
	while (index < words.length) {
		while (
			words[index] &&
			(SHELL_PREFIXES.has(words[index].value) ||
				/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[index].value))
		) {
			index += 1;
		}
		if (!words[index]) break;

		const command = basename(words[index].value);
		if (WRAPPERS.has(command)) {
			index += 1;
			while (words[index]?.value.startsWith("-")) index += 1;
			continue;
		}
		if (command === "env") {
			index += 1;
			while (
				words[index] &&
				(words[index]!.value.startsWith("-") ||
					/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[index]!.value))
			)
				index += 1;
			continue;
		}
		break;
	}
	return words.slice(index);
}

function operands(words: Word[]): Word[] {
	let optionsEnded = false;
	return words.filter((word) => {
		if (!optionsEnded && word.value === "--") {
			optionsEnded = true;
			return false;
		}
		return optionsEnded || !word.value.startsWith("-") || word.value === "-";
	});
}

export function collectDeleteChecks(
	command: string,
	sessionCwd: string,
): DeleteCheck[] {
	const checks: DeleteCheck[] = [];
	let cwd = sessionCwd;

	for (const rawSegment of wordsInSegments(command)) {
		const words = unwrapCommand(rawSegment);
		if (words.length === 0) continue;

		if (words[0]!.dynamic) {
			checks.push({
				command: "dynamic shell command",
				targets: [{ value: words[0]!.value, dynamic: true }],
				cwd,
			});
			continue;
		}

		const executable = basename(words[0]!.value);
		if (executable === "cd") {
			const target = words[1];
			if (!target) cwd = process.env.HOME ?? "/";
			else if (!target.dynamic) cwd = resolve(cwd, target.value);
			continue;
		}

		if (DELETE_COMMANDS.has(executable)) {
			checks.push({
				command: executable,
				targets: operands(words.slice(1)),
				cwd,
			});
			continue;
		}

		if (executable === "eval") {
			const nestedCommand = words
				.slice(1)
				.map((word) => word.value)
				.join(" ");
			if (words.slice(1).some((word) => word.dynamic)) {
				checks.push({
					command: "eval",
					targets: [{ value: nestedCommand, dynamic: true }],
					cwd,
				});
			} else {
				checks.push(...collectDeleteChecks(nestedCommand, cwd));
			}
			continue;
		}

		if (["bash", "sh", "zsh"].includes(executable)) {
			const commandIndex = words.findIndex((word) => word.value === "-c");
			const nestedCommand =
				commandIndex >= 0 ? words[commandIndex + 1] : undefined;
			if (nestedCommand) {
				if (nestedCommand.dynamic) {
					checks.push({
						command: `${executable} -c`,
						targets: [{ value: nestedCommand.value, dynamic: true }],
						cwd,
					});
				} else {
					checks.push(...collectDeleteChecks(nestedCommand.value, cwd));
				}
			}
			continue;
		}

		if (
			executable === "xargs" &&
			words.some((word) => DELETE_COMMANDS.has(basename(word.value)))
		) {
			checks.push({
				command: "xargs delete",
				targets: [{ value: "<stdin>", dynamic: true }],
				cwd,
			});
			continue;
		}

		if (
			executable === "find" &&
			(words.some((word) => word.value === "-delete") ||
				words.some((word) =>
					["-exec", "-execdir", "-ok", "-okdir"].includes(word.value),
				))
		) {
			const roots = words
				.slice(1)
				.filter(
					(word) => !word.value.startsWith("-") && !word.value.startsWith("!"),
				);
			checks.push({
				command: "find delete",
				targets: roots.length > 0 ? roots : [{ value: ".", dynamic: false }],
				cwd,
			});
			continue;
		}

		if (executable === "git" && words.some((word) => word.value === "clean")) {
			const cIndex = words.findIndex((word) => word.value === "-C");
			const repo = cIndex >= 0 ? words[cIndex + 1] : undefined;
			checks.push({
				command: "git clean",
				targets: [repo ?? { value: ".", dynamic: false }],
				cwd,
			});
		}
	}

	return checks;
}

function isWithin(root: string, target: string): boolean {
	const pathFromRoot = relative(root, target);
	return (
		pathFromRoot === "" ||
		(!pathFromRoot.startsWith("..") && !isAbsolute(pathFromRoot))
	);
}

async function canonicalTarget(path: string): Promise<string> {
	try {
		const stat = await lstat(path);
		if (stat.isSymbolicLink())
			return resolve(await realpath(dirname(path)), basename(path));
		return await realpath(path);
	} catch {
		let ancestor = dirname(path);
		while (ancestor !== dirname(ancestor)) {
			try {
				return resolve(await realpath(ancestor), relative(ancestor, path));
			} catch {
				ancestor = dirname(ancestor);
			}
		}
		return path;
	}
}

export async function findOutsideDelete(
	command: string,
	sessionCwd: string,
): Promise<string | undefined> {
	const canonicalCwd = await realpath(sessionCwd).catch(() =>
		resolve(sessionCwd),
	);
	const checks = collectDeleteChecks(command, sessionCwd);

	if (
		checks.length > 0 &&
		(/\$\(|`|[()]/.test(command) || /\bcd\s+["']?\$/.test(command))
	) {
		return "delete command context cannot be proven inside session directory";
	}

	for (const check of checks) {
		if (check.targets.length === 0) continue;
		for (const target of check.targets) {
			if (
				target.dynamic ||
				/[*?[{]/.test(target.value) ||
				target.value.startsWith("~")
			) {
				return `${check.command} target cannot be proven inside session directory: ${target.value || "<dynamic>"}`;
			}
			const absoluteTarget = resolve(check.cwd, target.value);
			if (!isWithin(canonicalCwd, await canonicalTarget(absoluteTarget))) {
				return `${check.command} target is outside session directory: ${target.value}`;
			}
		}
	}

	return undefined;
}
