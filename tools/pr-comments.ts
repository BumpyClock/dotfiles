#!/usr/bin/env bun

import { spawnSync } from "node:child_process";
import { Command } from "commander";

const QUERY = `query(
  $owner: String!
  $repo: String!
  $number: Int!
  $commentsCursor: String
  $reviewsCursor: String
  $threadsCursor: String
) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      number
      title
      url
      state
      comments(first: 100, after: $commentsCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          url
          body
          createdAt
          updatedAt
          author { login }
        }
      }
      reviews(first: 100, after: $reviewsCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          url
          state
          body
          submittedAt
          author { login }
        }
      }
      reviewThreads(first: 100, after: $threadsCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          startLine
          diffSide
          startDiffSide
          comments(first: 100) {
            nodes {
              id
              url
              body
              createdAt
              updatedAt
              author { login }
            }
          }
        }
      }
    }
  }
}`;

type PageInfo = {
	hasNextPage: boolean;
	endCursor: string | null;
};

type GhJsonResult = {
	exitCode: number | null;
	stdout: string;
	stderr: string;
};

type PullRequestRef = {
	owner: string;
	repo: string;
	number: number;
};

type PullRequestMeta = PullRequestRef & {
	title: string;
	url: string;
	state: string;
};

type ReviewThreadComment = {
	id: string;
	url?: string;
	body: string;
	createdAt: string;
	updatedAt?: string;
	author?: { login?: string };
};

type ReviewThread = {
	id: string;
	isResolved: boolean;
	isOutdated: boolean;
	path?: string;
	line?: number | null;
	startLine?: number | null;
	diffSide?: string | null;
	startDiffSide?: string | null;
	comments: { nodes: ReviewThreadComment[] };
};

type ConversationComment = ReviewThreadComment;

type PullRequestReview = {
	id: string;
	url?: string;
	state: string;
	body?: string | null;
	submittedAt?: string | null;
	author?: { login?: string };
};

type GraphqlPullRequest = {
	number: number;
	title: string;
	url: string;
	state: string;
	comments: { pageInfo: PageInfo; nodes: ConversationComment[] };
	reviews: { pageInfo: PageInfo; nodes: PullRequestReview[] };
	reviewThreads: { pageInfo: PageInfo; nodes: ReviewThread[] };
};

type GraphqlResponse = {
	data?: {
		repository?: {
			pullRequest?: GraphqlPullRequest | null;
		} | null;
	};
	errors?: unknown[];
};

type FetchResult = {
	pullRequest: PullRequestMeta;
	conversationComments: ConversationComment[];
	reviews: PullRequestReview[];
	reviewThreads: ReviewThread[];
};

export type OutputItem =
	| {
			kind: "review_thread";
			id: string;
			threadId: string;
			author: string;
			createdAt: string;
			updatedAt?: string;
			path?: string;
			line?: number | null;
			startLine?: number | null;
			isResolved: boolean;
			isOutdated: boolean;
			comments: NormalizedThreadComment[];
			body: string;
			url?: string;
	  }
	| {
			kind: "conversation_comment";
			id: string;
			author: string;
			createdAt: string;
			updatedAt?: string;
			body: string;
			url?: string;
	  }
	| {
			kind: "review";
			id: string;
			author: string;
			createdAt?: string | null;
			state: string;
			body: string;
			url?: string;
	  };

export type NormalizedOutput = {
	pullRequest: PullRequestMeta;
	counts: {
		unresolvedThreads: number;
		resolvedThreads: number;
		conversationComments: number;
		reviewsWithBody: number;
		totalItems: number;
	};
	items: OutputItem[];
};

type CliOptions = {
	repo?: string;
	json?: boolean;
	all?: boolean;
};

type NormalizedThreadComment = {
	id: string;
	author: string;
	createdAt: string;
	updatedAt?: string;
	body: string;
	url?: string;
};

function runGh(args: string[], input?: string): GhJsonResult {
	const result = spawnSync("gh", args, {
		encoding: "utf8",
		input,
		maxBuffer: 1024 * 1024 * 50,
	});

	if (result.error) {
		throw new Error(`failed to run gh: ${result.error.message}`);
	}

	return {
		exitCode: result.status,
		stdout: result.stdout ?? "",
		stderr: result.stderr ?? "",
	};
}

function runGhJson<T>(args: string[], input?: string): T {
	const result = runGh(args, input);
	if (result.exitCode !== 0) {
		const message = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
		throw new Error(message || `gh ${args.join(" ")} failed`);
	}

	try {
		return JSON.parse(result.stdout) as T;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`failed to parse gh JSON: ${message}`);
	}
}

function ensureGhAuthenticated(): void {
	const result = runGh(["auth", "status"]);
	if (result.exitCode === 0) {
		return;
	}

	const message = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
	throw new Error(message || "gh auth status failed; run `gh auth login`");
}

function parseRepoSlug(value: string): { owner: string; repo: string } {
	const trimmed = value.trim();
	const match = trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
	if (!match) {
		throw new Error(`invalid repo "${value}"; expected owner/repo`);
	}

	return { owner: match[1], repo: match[2] };
}

function parsePrUrl(value: string): PullRequestRef | null {
	const match = value.match(/^https?:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/pull\/(\d+)/);
	if (!match) {
		return null;
	}

	return {
		owner: match[1],
		repo: match[2],
		number: Number(match[3]),
	};
}

function parsePrNumber(value: string): number {
	if (!/^\d+$/.test(value)) {
		throw new Error(`invalid PR "${value}"; expected number or GitHub pull request URL`);
	}

	const number = Number(value);
	if (!Number.isSafeInteger(number) || number <= 0) {
		throw new Error(`invalid PR number "${value}"`);
	}

	return number;
}

function getCurrentRepo(): { owner: string; repo: string } {
	const response = runGhJson<{ nameWithOwner?: string }>(["repo", "view", "--json", "nameWithOwner"]);
	if (!response.nameWithOwner) {
		throw new Error("unable to resolve current GitHub repository");
	}

	return parseRepoSlug(response.nameWithOwner);
}

function getCurrentBranchPr(): PullRequestRef {
	const response = runGhJson<{ number?: number; url?: string }>(["pr", "view", "--json", "number,url"]);
	if (!response.url && !response.number) {
		throw new Error("unable to resolve current branch PR; pass a PR number or URL");
	}

	if (response.url) {
		const urlRef = parsePrUrl(response.url);
		if (!urlRef) {
			throw new Error(`unable to parse current branch PR URL: ${response.url}`);
		}
		return urlRef;
	}

	return {
		...getCurrentRepo(),
		number: Number(response.number),
	};
}

export function resolvePullRequestRef(prArg: string | undefined, repoArg: string | undefined): PullRequestRef {
	if (!prArg) {
		if (repoArg) {
			throw new Error("--repo requires a PR number or URL");
		}
		return getCurrentBranchPr();
	}

	const urlRef = parsePrUrl(prArg);
	if (urlRef) {
		if (repoArg) {
			throw new Error("--repo cannot be combined with a PR URL");
		}
		return urlRef;
	}

	return {
		...(repoArg ? parseRepoSlug(repoArg) : getCurrentRepo()),
		number: parsePrNumber(prArg),
	};
}

function fetchPage(
	ref: PullRequestRef,
	cursors: {
		commentsCursor?: string | null;
		reviewsCursor?: string | null;
		threadsCursor?: string | null;
	},
): GraphqlPullRequest {
	const args = [
		"api",
		"graphql",
		"-F",
		"query=@-",
		"-F",
		`owner=${ref.owner}`,
		"-F",
		`repo=${ref.repo}`,
		"-F",
		`number=${ref.number}`,
	];

	if (cursors.commentsCursor) {
		args.push("-F", `commentsCursor=${cursors.commentsCursor}`);
	}
	if (cursors.reviewsCursor) {
		args.push("-F", `reviewsCursor=${cursors.reviewsCursor}`);
	}
	if (cursors.threadsCursor) {
		args.push("-F", `threadsCursor=${cursors.threadsCursor}`);
	}

	const response = runGhJson<GraphqlResponse>(args, QUERY);
	if (response.errors?.length) {
		throw new Error(`GitHub GraphQL errors: ${JSON.stringify(response.errors)}`);
	}

	const pullRequest = response.data?.repository?.pullRequest;
	if (!pullRequest) {
		throw new Error(`PR #${ref.number} not found in ${ref.owner}/${ref.repo}`);
	}

	return pullRequest;
}

function fetchPullRequest(ref: PullRequestRef): FetchResult {
	const conversationComments: ConversationComment[] = [];
	const reviews: PullRequestReview[] = [];
	const reviewThreads: ReviewThread[] = [];

	let commentsCursor: string | null | undefined;
	let reviewsCursor: string | null | undefined;
	let threadsCursor: string | null | undefined;
	let meta: PullRequestMeta | null = null;

	let isFirstPage = true;

	do {
		const shouldAppendComments = isFirstPage || Boolean(commentsCursor);
		const shouldAppendReviews = isFirstPage || Boolean(reviewsCursor);
		const shouldAppendThreads = isFirstPage || Boolean(threadsCursor);
		const pullRequest = fetchPage(ref, {
			commentsCursor,
			reviewsCursor,
			threadsCursor,
		});

		meta ??= {
			owner: ref.owner,
			repo: ref.repo,
			number: pullRequest.number,
			title: pullRequest.title,
			url: pullRequest.url,
			state: pullRequest.state,
		};

		if (shouldAppendComments) {
			conversationComments.push(...(pullRequest.comments.nodes ?? []));
		}
		if (shouldAppendReviews) {
			reviews.push(...(pullRequest.reviews.nodes ?? []));
		}
		if (shouldAppendThreads) {
			reviewThreads.push(...(pullRequest.reviewThreads.nodes ?? []));
		}

		if (shouldAppendComments) {
			commentsCursor = pullRequest.comments.pageInfo.hasNextPage
				? pullRequest.comments.pageInfo.endCursor
				: null;
		}
		if (shouldAppendReviews) {
			reviewsCursor = pullRequest.reviews.pageInfo.hasNextPage
				? pullRequest.reviews.pageInfo.endCursor
				: null;
		}
		if (shouldAppendThreads) {
			threadsCursor = pullRequest.reviewThreads.pageInfo.hasNextPage
				? pullRequest.reviewThreads.pageInfo.endCursor
				: null;
		}
		isFirstPage = false;
	} while (commentsCursor || reviewsCursor || threadsCursor);

	if (!meta) {
		throw new Error(`PR #${ref.number} not found in ${ref.owner}/${ref.repo}`);
	}

	return {
		pullRequest: meta,
		conversationComments,
		reviews,
		reviewThreads,
	};
}

function authorLogin(value: { author?: { login?: string } }): string {
	return value.author?.login || "unknown";
}

function locationFor(item: OutputItem): string {
	if (item.kind !== "review_thread") {
		return "";
	}

	if (!item.path) {
		return "";
	}

	if (item.line) {
		return `${item.path}:${item.line}`;
	}

	if (item.startLine) {
		return `${item.path}:${item.startLine}`;
	}

	return item.path;
}

export function normalizeOutput(result: FetchResult, includeAllThreads: boolean): NormalizedOutput {
	const unresolvedThreads = result.reviewThreads.filter((thread) => !thread.isResolved);
	const selectedThreads = includeAllThreads ? result.reviewThreads : unresolvedThreads;
	const reviewsWithBody = result.reviews.filter((review) => review.body?.trim());

	const threadItems: OutputItem[] = selectedThreads.map((thread) => {
		const firstComment = thread.comments.nodes[0];
		const comments = thread.comments.nodes.map((comment) => ({
			id: comment.id,
			author: authorLogin(comment),
			createdAt: comment.createdAt,
			updatedAt: comment.updatedAt,
			body: comment.body,
			url: comment.url,
		}));
		return {
			kind: "review_thread",
			id: firstComment?.id ?? thread.id,
			threadId: thread.id,
			author: firstComment ? authorLogin(firstComment) : "unknown",
			createdAt: firstComment?.createdAt ?? "",
			updatedAt: firstComment?.updatedAt,
			path: thread.path,
			line: thread.line,
			startLine: thread.startLine,
			isResolved: thread.isResolved,
			isOutdated: thread.isOutdated,
			comments,
			body: fullThreadBody(comments),
			url: firstComment?.url,
		};
	});

	const conversationItems: OutputItem[] = result.conversationComments.map((comment) => ({
		kind: "conversation_comment",
		id: comment.id,
		author: authorLogin(comment),
		createdAt: comment.createdAt,
		updatedAt: comment.updatedAt,
		body: comment.body,
		url: comment.url,
	}));

	const reviewItems: OutputItem[] = reviewsWithBody.map((review) => ({
		kind: "review",
		id: review.id,
		author: authorLogin(review),
		createdAt: review.submittedAt,
		state: review.state,
		body: review.body?.trim() ?? "",
		url: review.url,
	}));

	const items = [...threadItems, ...conversationItems, ...reviewItems];

	return {
		pullRequest: result.pullRequest,
		counts: {
			unresolvedThreads: unresolvedThreads.length,
			resolvedThreads: result.reviewThreads.length - unresolvedThreads.length,
			conversationComments: result.conversationComments.length,
			reviewsWithBody: reviewsWithBody.length,
			totalItems: items.length,
		},
		items,
	};
}

function fullThreadBody(comments: NormalizedThreadComment[]): string {
	if (comments.length === 0) {
		return "";
	}

	if (comments.length === 1) {
		return comments[0].body.trim();
	}

	return comments
		.map((comment) => `@${comment.author} ${comment.createdAt}\n${comment.body.trim()}`)
		.join("\n\n---\n\n");
}

function renderBody(body: string): string[] {
	const trimmed = body.trim();
	if (!trimmed) {
		return ["     (empty)"];
	}

	return trimmed.split(/\r?\n/).map((line) => `     ${line}`);
}

function renderSection(title: string, items: OutputItem[]): string[] {
	const lines: string[] = [];
	lines.push("");
	lines.push(title);

	if (items.length === 0) {
		lines.push("  none");
		return lines;
	}

	items.forEach((item, index) => {
		const location = locationFor(item);
		const locationPart = location ? ` ${location}` : "";
		const resolvedPart =
			item.kind === "review_thread" && item.isResolved ? " [resolved]" : "";
		const outdatedPart =
			item.kind === "review_thread" && item.isOutdated ? " [outdated]" : "";
		const statePart = item.kind === "review" ? ` ${item.state}` : "";
		lines.push(
			`  ${index + 1}. ${item.author}${statePart}${locationPart}${resolvedPart}${outdatedPart}`,
		);
		lines.push(...renderBody(item.body));
		if (item.url) {
			lines.push(`     ${item.url}`);
		}
	});

	return lines;
}

export function renderText(output: NormalizedOutput): string {
	const threadItems = output.items.filter((item) => item.kind === "review_thread");
	const conversationItems = output.items.filter((item) => item.kind === "conversation_comment");
	const reviewItems = output.items.filter((item) => item.kind === "review");
	const threadTitle = threadItems.some((item) => item.kind === "review_thread" && item.isResolved)
		? "Review threads"
		: "Unresolved review threads";
	const lines = [
		`PR #${output.pullRequest.number}: ${output.pullRequest.title}`,
		output.pullRequest.url,
		`State: ${output.pullRequest.state}`,
		`Counts: ${output.counts.unresolvedThreads} unresolved threads, ${output.counts.resolvedThreads} resolved threads, ${output.counts.conversationComments} PR comments, ${output.counts.reviewsWithBody} review bodies`,
		...renderSection(threadTitle, threadItems),
		...renderSection("Open PR conversation comments", conversationItems),
		...renderSection("Review bodies", reviewItems),
	];

	return `${lines.join("\n")}\n`;
}

function createProgram(): Command {
	return new Command()
		.name("pr-comments")
		.description("Fetch open and unresolved GitHub PR feedback with gh.")
		.argument("[pr]", "PR number or GitHub pull request URL; defaults to current branch PR")
		.option("--repo <owner/repo>", "Repository for numeric PR input")
		.option("--json", "Emit normalized JSON")
		.option("--all", "Include resolved review threads")
		.addHelpText(
			"after",
			`

Examples:
  pr-comments
  pr-comments 123
  pr-comments 123 --repo BumpyClock/dotfiles
  pr-comments https://github.com/owner/repo/pull/123 --json
  pr-comments 123 --all`,
		)
		.showSuggestionAfterError();
}

async function main(): Promise<void> {
	const program = createProgram();
	program.parse(process.argv);
	const options = program.opts<CliOptions>();
	const prArg = program.args[0];

	ensureGhAuthenticated();
	const ref = resolvePullRequestRef(prArg, options.repo);
	const result = fetchPullRequest(ref);
	const output = normalizeOutput(result, Boolean(options.all));

	if (options.json) {
		console.log(JSON.stringify(output, null, 2));
		return;
	}

	process.stdout.write(renderText(output));
}

if (import.meta.main) {
	main().catch((error: unknown) => {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Error: ${message}`);
		process.exit(1);
	});
}
