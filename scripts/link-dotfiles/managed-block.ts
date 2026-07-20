// =============================================================================
// Generic managed-block reconciliation for machine-owned config files.
//
// A "managed block" is a marker-delimited section that this repo owns inside a
// file the machine otherwise owns (e.g. ~/.zshrc, the PowerShell profile).
// Everything outside the markers is left untouched, so installers that append
// to the same file (pnpm, fnm, ...) survive re-runs.
// =============================================================================

export type ManagedBlockOutcome =
	| "unchanged"
	| "replaced"
	| "prepended"
	| "conflict";

export type ManagedBlockRemovalOutcome = "absent" | "removed" | "conflict";

export type ManagedBlockMarkers = {
	start: string;
	end: string;
};

export type ReconcileResult = {
	content: string;
	outcome: ManagedBlockOutcome;
};

export type RemovalResult = {
	content: string;
	outcome: ManagedBlockRemovalOutcome;
};

function countOccurrences(haystack: string, needle: string): number {
	if (needle === "") {
		return 0;
	}

	let count = 0;
	let index = haystack.indexOf(needle);
	while (index !== -1) {
		count += 1;
		index = haystack.indexOf(needle, index + needle.length);
	}

	return count;
}

type BlockSpan = {
	startIndex: number;
	tailStart: number;
};

/**
 * Locate the single well-formed managed block in `content`, if any.
 *
 * - No markers at all -> `null` (block is absent).
 * - Exactly one start and one end marker, start before end -> the span.
 * - Anything else (missing counterpart, duplicated markers, end before
 *   start) -> `"conflict"`; caller must leave the content untouched.
 */
function findManagedBlockSpan(
	content: string,
	markers: ManagedBlockMarkers,
): BlockSpan | "conflict" | null {
	const startCount = countOccurrences(content, markers.start);
	const endCount = countOccurrences(content, markers.end);

	if (startCount === 0 && endCount === 0) {
		return null;
	}

	if (startCount !== 1 || endCount !== 1) {
		return "conflict";
	}

	const startIndex = content.indexOf(markers.start);
	const endIndex = content.indexOf(markers.end, startIndex);
	if (endIndex === -1 || endIndex < startIndex) {
		return "conflict";
	}

	let tailStart = endIndex + markers.end.length;
	if (content[tailStart] === "\r" && content[tailStart + 1] === "\n") {
		tailStart += 2;
	} else if (content[tailStart] === "\n") {
		tailStart += 1;
	}

	return { startIndex, tailStart };
}

export function prependManagedBlock(content: string, block: string): string {
	if (!content.trim()) {
		return block;
	}

	const separator =
		block.endsWith("\n") || content.startsWith("\n") ? "" : "\n";
	return `${block}${separator}${content}`;
}

/**
 * Reconcile the desired managed block against existing file content.
 *
 * - Exact block already present -> `unchanged` (caller must not write).
 * - Both markers present but block text differs -> `replaced`; only the text
 *   between and including the markers changes.
 * - No markers present -> `prepended`; existing content is preserved after
 *   the block.
 * - Malformed markers (start without end, end without start, duplicated, or
 *   end before start) -> `conflict`; content is returned unchanged and the
 *   caller must not modify the file.
 */
export function reconcileManagedBlock(
	existingContent: string,
	desiredBlock: string,
	markers: ManagedBlockMarkers,
): ReconcileResult {
	const span = findManagedBlockSpan(existingContent, markers);

	if (span === null) {
		return {
			content: prependManagedBlock(existingContent, desiredBlock),
			outcome: "prepended",
		};
	}

	if (span === "conflict") {
		return { content: existingContent, outcome: "conflict" };
	}

	const nextContent = `${existingContent.slice(0, span.startIndex)}${desiredBlock}${existingContent.slice(span.tailStart)}`;
	if (nextContent === existingContent) {
		return { content: existingContent, outcome: "unchanged" };
	}

	return { content: nextContent, outcome: "replaced" };
}

/**
 * Remove a single well-formed managed block from `existingContent`, leaving
 * everything else untouched.
 *
 * - No markers present -> `absent`; content is returned unchanged.
 * - Malformed markers (start without end, end without start, duplicated, or
 *   end before start) -> `conflict`; content is returned unchanged and the
 *   caller must not modify the file.
 * - Exactly one well-formed block -> `removed`; the block (including
 *   markers and its trailing newline) is cut out, preserving everything
 *   before and after it byte-for-byte.
 */
export function removeManagedBlock(
	existingContent: string,
	markers: ManagedBlockMarkers,
): RemovalResult {
	const span = findManagedBlockSpan(existingContent, markers);

	if (span === null) {
		return { content: existingContent, outcome: "absent" };
	}

	if (span === "conflict") {
		return { content: existingContent, outcome: "conflict" };
	}

	const nextContent = `${existingContent.slice(0, span.startIndex)}${existingContent.slice(span.tailStart)}`;
	return { content: nextContent, outcome: "removed" };
}

export function formatTimestamp(date: Date): string {
	const pad = (value: number): string => String(value).padStart(2, "0");

	return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
