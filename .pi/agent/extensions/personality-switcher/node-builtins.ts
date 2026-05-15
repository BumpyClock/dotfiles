type FsPromises = {
	mkdir(path: string, options: { recursive: boolean }): Promise<void>;
	readFile(path: string, encoding: "utf8"): Promise<string>;
	writeFile(path: string, data: string, encoding: "utf8"): Promise<void>;
};

type OsBuiltin = {
	homedir(): string;
};

type PathBuiltin = {
	dirname(path: string): string;
	join(...parts: string[]): string;
};

type BuiltinModules = {
	"node:fs/promises": FsPromises;
	"node:os": OsBuiltin;
	"node:path": PathBuiltin;
};

type ProcessLike = {
	getBuiltinModule?: <T extends keyof BuiltinModules>(
		specifier: T,
	) => BuiltinModules[T];
};

function processLike(): ProcessLike | undefined {
	return (globalThis as { process?: ProcessLike }).process;
}

export function builtin<T extends keyof BuiltinModules>(
	specifier: T,
): BuiltinModules[T] {
	const module = processLike()?.getBuiltinModule?.(specifier);
	if (!module) throw new Error(`${specifier} builtin is unavailable`);
	return module;
}

export function fsPromises(): FsPromises {
	return builtin("node:fs/promises");
}

export function configPath(): string {
	return builtin("node:path").join(
		builtin("node:os").homedir(),
		".pi",
		"agent",
		"personality.json",
	);
}

export function parentDir(path: string): string {
	return builtin("node:path").dirname(path);
}
