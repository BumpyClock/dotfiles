#!/usr/bin/env bun

import path from "node:path";

const SEARXNG_URL = "http://localhost:8899";
const commandName = path.basename(process.argv[1] || "web_search");

const args = process.argv.slice(2);

let numResults = 5;
const nIdx = args.indexOf("-n");
if (nIdx !== -1 && args[nIdx + 1]) {
	numResults = parseInt(args[nIdx + 1], 10);
	args.splice(nIdx, 2);
}

let engines: string | undefined;
const engIdx = args.indexOf("--engines");
if (engIdx !== -1 && args[engIdx + 1]) {
	engines = args[engIdx + 1];
	args.splice(engIdx, 2);
}

const query = args.join(" ");

if (!query) {
	console.log(`Usage: ${commandName} <query> [-n <num>] [--engines <csv>]`);
	console.log("\nOptions:");
	console.log("  -n <num>          Number of results (default: 5)");
	console.log("  --engines <csv>   Comma-separated engines (e.g. google,bing,duckduckgo)");
	console.log("\nExamples:");
	console.log(`  ${commandName} "javascript async await"`);
	console.log(`  ${commandName} "rust ownership" -n 10`);
	console.log(`  ${commandName} "climate data" --engines google,wikipedia`);
	process.exit(1);
}

interface SearxResult {
	url: string;
	title: string;
	content: string;
	engine: string;
	engines: string[];
	score: number;
}

interface SearxResponse {
	results: SearxResult[];
	number_of_results: number;
}

try {
	const params = new URLSearchParams({
		q: query,
		format: "json",
		pageno: "1",
	});
	if (engines) params.set("engines", engines);

	const res = await fetch(`${SEARXNG_URL}/search?${params}`, {
		signal: AbortSignal.timeout(10_000),
	});

	if (!res.ok) {
		if (res.status === 403) {
			console.error("Error: SearXNG returned 403. JSON format may not be enabled in settings.yml.");
		} else {
			console.error(`Error: SearXNG returned HTTP ${res.status}`);
		}
		process.exit(1);
	}

	const data: SearxResponse = await res.json();
	const results = data.results.slice(0, numResults);

	if (results.length === 0) {
		console.error("No results found.");
		process.exit(0);
	}

	for (let index = 0; index < results.length; index += 1) {
		const result = results[index];
		console.log(`--- Result ${index + 1} ---`);
		console.log(`Title: ${result.title}`);
		console.log(`URL: ${result.url}`);
		console.log(`Snippet: ${result.content}`);
		console.log(`Engines: ${(result.engines || [result.engine]).join(", ")}`);
		console.log("");
	}
} catch (error: any) {
	if (
		error.code === "ConnectionRefused" ||
		error.message?.includes("fetch failed") ||
		error.name === "TimeoutError"
	) {
		console.error(`Error: Cannot connect to SearXNG at ${SEARXNG_URL}`);
		console.error("First check whether the service is already running:");
		console.error("  cd ~/Projects/dotfiles/skills/web-skill && podman compose ps");
		console.error("If not, start it with:");
		console.error("  cd ~/Projects/dotfiles/skills/web-skill && podman compose up -d");
	} else {
		console.error(`Error: ${error.message}`);
	}
	process.exit(1);
}
