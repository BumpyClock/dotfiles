import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, symlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { collectDeleteChecks, findOutsideDelete } from "./guard";

describe("collectDeleteChecks", () => {
	test("tracks cwd across command segments", () => {
		expect(collectDeleteChecks("cd src && rm old.ts", "/repo")).toEqual([
			{
				command: "rm",
				cwd: "/repo/src",
				targets: [{ value: "old.ts", dynamic: false }],
			},
		]);
	});

	test("recognizes wrappers and delete commands", () => {
		expect(
			collectDeleteChecks("sudo env FOO=1 rm -rf -- ../other", "/repo"),
		).toEqual([
			{
				command: "rm",
				cwd: "/repo",
				targets: [{ value: "../other", dynamic: false }],
			},
		]);
		expect(
			collectDeleteChecks("find /tmp -type f -delete", "/repo")[0]?.command,
		).toBe("find delete");
		expect(
			collectDeleteChecks("git -C ../other clean -fdx", "/repo")[0]?.targets[0]
				?.value,
		).toBe("../other");
	});
});

describe("findOutsideDelete", () => {
	test("allows static delete targets inside cwd", async () => {
		const root = await mkdtemp(join(tmpdir(), "cwd-delete-guard-"));
		await mkdir(join(root, "src"));

		expect(
			await findOutsideDelete("rm -rf src/old.ts; unlink ./cache", root),
		).toBeUndefined();
	});

	test("blocks absolute and traversing targets outside cwd", async () => {
		const root = await mkdtemp(join(tmpdir(), "cwd-delete-guard-"));

		expect(await findOutsideDelete("rm -rf /tmp/outside", root)).toContain(
			"outside session directory",
		);
		expect(await findOutsideDelete("rmdir ../sibling", root)).toContain(
			"outside session directory",
		);
	});

	test("blocks destructive commands after cd outside cwd", async () => {
		const root = await mkdtemp(join(tmpdir(), "cwd-delete-guard-"));

		expect(await findOutsideDelete("cd /tmp && rm old.txt", root)).toContain(
			"outside session directory",
		);
	});

	test("blocks dynamic and globbed delete targets", async () => {
		const root = await mkdtemp(join(tmpdir(), "cwd-delete-guard-"));

		expect(await findOutsideDelete('rm "$TARGET"', root)).toContain(
			"cannot be proven",
		);
		expect(await findOutsideDelete("rm ../other/*.log", root)).toContain(
			"cannot be proven",
		);
		expect(await findOutsideDelete("rm ~/.ssh", root)).toContain(
			"cannot be proven",
		);
		expect(await findOutsideDelete("rm ~root/secret", root)).toContain(
			"cannot be proven",
		);
		expect(
			await findOutsideDelete('cd "$TARGET" && rm old.txt', root),
		).toContain("cannot be proven");
		expect(await findOutsideDelete("rm${IFS}/tmp/outside", root)).toContain(
			"cannot be proven",
		);
	});

	test("blocks nested shells, subshells, and xargs deletes", async () => {
		const root = await mkdtemp(join(tmpdir(), "cwd-delete-guard-"));

		expect(
			await findOutsideDelete("bash -c 'rm /tmp/outside'", root),
		).toContain("outside session directory");
		expect(await findOutsideDelete("FOO=1 rm /tmp/outside", root)).toContain(
			"outside session directory",
		);
		expect(
			await findOutsideDelete("if true; then rm /tmp/outside; fi", root),
		).toContain("outside session directory");
		expect(await findOutsideDelete("{ cd /tmp; rm old.txt; }", root)).toContain(
			"outside session directory",
		);
		expect(await findOutsideDelete("(cd /tmp; rm old.txt)", root)).toContain(
			"cannot be proven",
		);
		expect(await findOutsideDelete("eval 'rm /tmp/outside'", root)).toContain(
			"outside session directory",
		);
		expect(
			await findOutsideDelete("find /tmp -exec rm {} \\;", root),
		).toContain("outside session directory");
		expect(
			await findOutsideDelete("printf '%s\\n' /tmp/outside | xargs rm", root),
		).toContain("cannot be proven");
	});

	test("blocks delete after bare cd changes to home", async () => {
		const root = await mkdtemp(join(tmpdir(), "cwd-delete-guard-"));

		expect(await findOutsideDelete("cd; rm .ssh/config", root)).toContain(
			"outside session directory",
		);
	});

	test("blocks paths escaping through a directory symlink", async () => {
		const root = await mkdtemp(join(tmpdir(), "cwd-delete-guard-"));
		const outside = await mkdtemp(join(tmpdir(), "cwd-delete-outside-"));
		await symlink(outside, join(root, "linked"));

		expect(await findOutsideDelete("rm linked/file.txt", root)).toContain(
			"outside session directory",
		);
	});

	test("allows deleting a symlink without following its target", async () => {
		const root = await mkdtemp(join(tmpdir(), "cwd-delete-guard-"));
		const outside = await mkdtemp(join(tmpdir(), "cwd-delete-outside-"));
		await symlink(outside, join(root, "linked"));

		expect(await findOutsideDelete("rm linked", root)).toBeUndefined();
	});
});
