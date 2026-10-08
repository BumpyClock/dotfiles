import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderText, type NormalizedOutput } from "./pr-comments";

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const prCommentsPath = path.join(toolsDir, "pr-comments.ts");

describe("pr-comments CLI", () => {
	test("prints help without requiring GitHub auth", () => {
		const {
			GH_ENTERPRISE_TOKEN: _ghEnterpriseToken,
			GH_TOKEN: _ghToken,
			GITHUB_ENTERPRISE_TOKEN: _githubEnterpriseToken,
			GITHUB_TOKEN: _githubToken,
			...unauthenticatedEnv
		} = process.env;
		const result = spawnSync(process.execPath, [prCommentsPath, "--help"], {
			cwd: toolsDir,
			encoding: "utf8",
			env: unauthenticatedEnv,
		});

		expect({ status: result.status, stderr: result.stderr }).toEqual({
			status: 0,
			stderr: "",
		});
	});

	test("renders grouped text output", () => {
		const output: NormalizedOutput = {
			pullRequest: {
				owner: "owner",
				repo: "repo",
				number: 42,
				title: "Fix review feedback",
				url: "https://github.com/owner/repo/pull/42",
				state: "OPEN",
			},
			counts: {
				unresolvedThreads: 1,
				resolvedThreads: 2,
				conversationComments: 1,
				reviewsWithBody: 1,
				totalItems: 3,
			},
			items: [
				{
					kind: "review_thread",
					id: "comment-1",
					threadId: "thread-1",
					author: "reviewer",
					createdAt: "2026-01-01T00:00:00Z",
					path: "src/file.ts",
					line: 12,
					isResolved: false,
					isOutdated: false,
					comments: [
						{
							id: "comment-1",
							author: "reviewer",
							createdAt: "2026-01-01T00:00:00Z",
							body: "Please fix this.\nMore detail",
							url: "https://github.com/owner/repo/pull/42#discussion_r1",
						},
					],
					body: "Please fix this.\nMore detail",
					url: "https://github.com/owner/repo/pull/42#discussion_r1",
				},
				{
					kind: "conversation_comment",
					id: "comment-2",
					author: "teammate",
					createdAt: "2026-01-01T00:00:00Z",
					body: "Top-level note",
				},
				{
					kind: "review",
					id: "review-1",
					author: "reviewer",
					createdAt: "2026-01-01T00:00:00Z",
					state: "COMMENTED",
					body: "Review summary",
				},
			],
		};

		const text = renderText(output);

		expect(text).toBe(`PR #42: Fix review feedback
https://github.com/owner/repo/pull/42
State: OPEN
Counts: 1 unresolved threads, 2 resolved threads, 1 PR comments, 1 review bodies

Unresolved review threads
  1. reviewer src/file.ts:12
     Please fix this.
     More detail
     https://github.com/owner/repo/pull/42#discussion_r1

Open PR conversation comments
  1. teammate
     Top-level note

Review bodies
  1. reviewer COMMENTED
     Review summary
`);
	});
});
