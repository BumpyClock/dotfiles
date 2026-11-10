import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathExists } from "./fs-utils";
import { setupLspMcpConfig } from "./link-dotfiles";

const temporaryDirectories: string[] = [];
const expectedConfig = `{
  "semantic_search": {
    "enabled": true,
    "embedder": {
      "provider": "openai",
      "model": "text-embedding-3-small",
      "api_key_env": "OPENAI_API_KEY",
      "base_url": "https://api.openai.com/v1",
      "dimension": 1536
    }
  }
}
`;

async function fixture(): Promise<string> {
	const directory = await mkdtemp(path.join(os.tmpdir(), "lsp-mcp-test-"));
	temporaryDirectories.push(directory);
	return directory;
}

afterEach(async () => {
	await Promise.all(temporaryDirectories.map((directory) =>
		rm(directory, { recursive: true, force: true }),
	));
	temporaryDirectories.length = 0;
});

test("creates the LSP MCP directory and requested semantic search defaults", async () => {
	const homeDir = await fixture();
	await setupLspMcpConfig(homeDir);
	expect(await readFile(path.join(homeDir, ".lsp-mcp/.lsp-mcp.json"), "utf8"))
		.toBe(expectedConfig);
});

for (const existing of [expectedConfig, '{"semantic_search":{"enabled":false}}\n', ""]) {
	test(`preserves existing LSP MCP config ${JSON.stringify(existing)}`, async () => {
		const homeDir = await fixture();
		const target = path.join(homeDir, ".lsp-mcp/.lsp-mcp.json");
		await mkdir(path.dirname(target), { recursive: true });
		await writeFile(target, existing);
		const before = await stat(target);
		await setupLspMcpConfig(homeDir);
		expect(await readFile(target, "utf8")).toBe(existing);
		expect((await stat(target)).mtimeMs).toBe(before.mtimeMs);
	});
}

const onUnix = process.platform === "win32" ? test.skip : test;
onUnix("normal CLI seeds config once; status and profile removal leave it absent", async () => {
	const homeDir = await fixture();
	const dotfilesDir = await fixture();
	await mkdir(path.join(dotfilesDir, "shell"));
	await writeFile(path.join(dotfilesDir, "shell/launchers.json"), "{}");
	const args = [process.execPath, path.join(import.meta.dir, "link-dotfiles.ts"),
		"--dotfiles-dir", dotfilesDir, "--skip-submodules"];
	const env = { ...process.env, HOME: homeDir };
	const target = path.join(homeDir, ".lsp-mcp/.lsp-mcp.json");
	for (const flag of ["--show", "--remove-shell-profile"]) {
		expect(Bun.spawnSync([...args, flag], { env }).exitCode).toBe(0);
		expect(await pathExists(target)).toBe(false);
	}
	expect(Bun.spawnSync(args, { env }).exitCode).toBe(0);
	expect(await readFile(target, "utf8")).toBe(expectedConfig);
	await writeFile(target, '{"custom":true}\n');
	expect(Bun.spawnSync(args, { env }).exitCode).toBe(0);
	expect(await readFile(target, "utf8")).toBe('{"custom":true}\n');
});
