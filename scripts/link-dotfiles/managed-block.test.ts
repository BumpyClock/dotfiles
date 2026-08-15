import { describe, expect, test } from "bun:test";
import {
	type ManagedBlockMarkers,
	prependManagedBlock,
	reconcileManagedBlock,
	removeManagedBlock,
} from "./managed-block";

const markers: ManagedBlockMarkers = {
	start: "# >>> start",
	end: "# <<< end",
};

function block(body: string): string {
	return `${markers.start}\n${body}\n${markers.end}\n`;
}

describe("reconcileManagedBlock", () => {
	test("returns unchanged when the exact block is already present", () => {
		const desired = block("source /a");
		const existing = `${desired}# user tail\n`;

		const result = reconcileManagedBlock(existing, desired, markers);

		expect(result.outcome).toBe("unchanged");
		expect(result.content).toBe(existing);
	});

	test("replaces only the block text when it differs", () => {
		const existing = `${block("source /old")}# pnpm append\nexport X=1\n`;
		const desired = block("source /new");

		const result = reconcileManagedBlock(existing, desired, markers);

		expect(result.outcome).toBe("replaced");
		expect(result.content).toBe(`${desired}# pnpm append\nexport X=1\n`);
		expect(result.content).toContain("source /new");
		expect(result.content).toContain("# pnpm append");
	});

	test("prepends the block when no markers are present", () => {
		const existing = "# user config\nexport Y=2\n";
		const desired = block("source /a");

		const result = reconcileManagedBlock(existing, desired, markers);

		expect(result.outcome).toBe("prepended");
		expect(result.content).toBe(`${desired}${existing}`);
	});

	test("prepends into an empty file without stray separators", () => {
		const desired = block("source /a");

		const result = reconcileManagedBlock("", desired, markers);

		expect(result.outcome).toBe("prepended");
		expect(result.content).toBe(desired);
	});

	test("reports conflict when the start marker has no end marker", () => {
		const existing = `${markers.start}\nsource /a\n# no end here\n`;

		const result = reconcileManagedBlock(existing, block("source /b"), markers);

		expect(result.outcome).toBe("conflict");
		expect(result.content).toBe(existing);
	});

	test("reports conflict when markers are duplicated", () => {
		const existing = `${block("source /a")}${block("source /b")}`;

		const result = reconcileManagedBlock(existing, block("source /c"), markers);

		expect(result.outcome).toBe("conflict");
		expect(result.content).toBe(existing);
	});

	test("reports conflict when the end marker precedes the start marker", () => {
		const existing = `${markers.end}\nsource /a\n${markers.start}\n`;

		const result = reconcileManagedBlock(existing, block("source /b"), markers);

		expect(result.outcome).toBe("conflict");
		expect(result.content).toBe(existing);
	});
});

describe("removeManagedBlock", () => {
	test("reports absent when no markers are present", () => {
		const existing = "# user config\nexport Y=2\n";

		const result = removeManagedBlock(existing, markers);

		expect(result.outcome).toBe("absent");
		expect(result.content).toBe(existing);
	});

	test("removes the block and preserves surrounding content byte-for-byte", () => {
		const existing = `# user head\n${block("source /a")}# pnpm append\nexport X=1\n`;

		const result = removeManagedBlock(existing, markers);

		expect(result.outcome).toBe("removed");
		expect(result.content).toBe("# user head\n# pnpm append\nexport X=1\n");
	});

	test("removes a block that is the only content, leaving an empty file", () => {
		const existing = block("source /a");

		const result = removeManagedBlock(existing, markers);

		expect(result.outcome).toBe("removed");
		expect(result.content).toBe("");
	});

	test("reports conflict when the start marker has no end marker, leaving content untouched", () => {
		const existing = `${markers.start}\nsource /a\n# no end here\n`;

		const result = removeManagedBlock(existing, markers);

		expect(result.outcome).toBe("conflict");
		expect(result.content).toBe(existing);
	});

	test("reports conflict when markers are duplicated, leaving content untouched", () => {
		const existing = `${block("source /a")}${block("source /b")}`;

		const result = removeManagedBlock(existing, markers);

		expect(result.outcome).toBe("conflict");
		expect(result.content).toBe(existing);
	});

	test("reports conflict when the end marker precedes the start marker, leaving content untouched", () => {
		const existing = `${markers.end}\nsource /a\n${markers.start}\n`;

		const result = removeManagedBlock(existing, markers);

		expect(result.outcome).toBe("conflict");
		expect(result.content).toBe(existing);
	});
});

describe("prependManagedBlock", () => {
	test("returns the block alone for blank content", () => {
		expect(prependManagedBlock("   \n", "BLOCK\n")).toBe("BLOCK\n");
	});

	test("preserves existing content after the block", () => {
		expect(prependManagedBlock("tail\n", "BLOCK\n")).toBe("BLOCK\ntail\n");
	});
});
