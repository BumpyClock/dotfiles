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

export type ManagedBlockMarkers = {
	start: string;
	end: string;
};

export type ReconcileResult = {
	content: string;
	outcome: ManagedBlockOutcome;
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
	const startCount = countOccurrences(existingContent, markers.start);
	const endCount = countOccurrences(existingContent, markers.end);

	if (startCount === 0 && endCount === 0) {
		return {
			content: prependManagedBlock(existingContent, desiredBlock),
			outcome: "prepended",
		};
	}

	if (startCount !== 1 || endCount !== 1) {
		return { content: existingContent, outcome: "conflict" };
	}

	const startIndex = existingContent.indexOf(markers.start);
	const endIndex = existingContent.indexOf(markers.end, startIndex);
	if (endIndex === -1 || endIndex < startIndex) {
		return { content: existingContent, outcome: "conflict" };
	}

	let tailStart = endIndex + markers.end.length;
	if (
		existingContent[tailStart] === "\r" &&
		existingContent[tailStart + 1] === "\n"
	) {
		tailStart += 2;
	} else if (existingContent[tailStart] === "\n") {
		tailStart += 1;
	}

	const nextContent = `${existingContent.slice(0, startIndex)}${desiredBlock}${existingContent.slice(tailStart)}`;
	if (nextContent === existingContent) {
		return { content: existingContent, outcome: "unchanged" };
	}

	return { content: nextContent, outcome: "replaced" };
}

export function formatTimestamp(date: Date): string {
	const pad = (value: number): string => String(value).padStart(2, "0");

	return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
