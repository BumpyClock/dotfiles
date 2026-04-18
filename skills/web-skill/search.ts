#!/usr/bin/env bun

const SEARXNG_URL = "http://localhost:8899";

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
	console.log("Usage: search.ts <query> [-n <num>] [--engines <csv>]");
	console.log("\nOptions:");
	console.log("  -n <num>          Number of results (default: 5)");
	console.log("  --engines <csv>   Comma-separated engines (e.g. google,bing,duckduckgo)");
	console.log("\nExamples:");
	console.log('  ./search.ts "javascript async await"');
	console.log('  ./search.ts "rust ownership" -n 10');
	console.log('  ./search.ts "climate data" --engines google,wikipedia');
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

	for (let i = 0; i < results.length; i++) {
		const r = results[i];
		console.log(`--- Result ${i + 1} ---`);
		console.log(`Title: ${r.title}`);
		console.log(`URL: ${r.url}`);
		console.log(`Snippet: ${r.content}`);
		console.log(`Engines: ${(r.engines || [r.engine]).join(", ")}`);
		console.log("");
	}
} catch (e: any) {
	if (e.code === "ConnectionRefused" || e.message?.includes("fetch failed") || e.name === "TimeoutError") {
		console.error(`Error: Cannot connect to SearXNG at ${SEARXNG_URL}`);
		console.error("First check whether the service is already running:");
		console.error("  cd ~/Projects/dotfiles/skills/web-skill && podman compose ps");
		console.error("If not, start it with:");
		console.error("  cd ~/Projects/dotfiles/skills/web-skill && podman compose up -d");
	} else {
		console.error(`Error: ${e.message}`);
	}
	process.exit(1);
}
