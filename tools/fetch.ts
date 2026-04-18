#!/usr/bin/env bun

import path from "node:path";

const FIRECRAWL_URL = "http://localhost:8898";
const commandName = path.basename(process.argv[1] || "web_fetch");

const args = process.argv.slice(2);

let formats = ["markdown"];
const fmtIdx = args.indexOf("--formats");
if (fmtIdx !== -1 && args[fmtIdx + 1]) {
	formats = args[fmtIdx + 1].split(",").map((value) => value.trim());
	args.splice(fmtIdx, 2);
}

const url = args[0];

if (!url) {
	console.log(`Usage: ${commandName} <url> [--formats <csv>]`);
	console.log("\nOptions:");
	console.log("  --formats <csv>   Output formats: markdown, html, links (default: markdown)");
	console.log("\nExamples:");
	console.log(`  ${commandName} https://example.com`);
	console.log(`  ${commandName} https://docs.python.org/3/tutorial/ --formats markdown,links`);
	process.exit(1);
}

interface ScrapeResponse {
	success: boolean;
	data?: {
		markdown?: string;
		html?: string;
		links?: string[];
		metadata?: {
			title?: string;
			description?: string;
			statusCode?: number;
			url?: string;
		};
	};
	error?: string;
}

try {
	const res = await fetch(`${FIRECRAWL_URL}/v1/scrape`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ url, formats }),
		signal: AbortSignal.timeout(30_000),
	});

	if (!res.ok) {
		const text = await res.text().catch(() => "");
		console.error(`Error: Firecrawl returned HTTP ${res.status}`);
		if (text) console.error(text);
		process.exit(1);
	}

	const data: ScrapeResponse = await res.json();

	if (!data.success) {
		console.error(`Error: ${data.error || "Scrape failed"}`);
		process.exit(1);
	}

	const meta = data.data?.metadata;
	if (meta?.title) {
		console.log(`# ${meta.title}\n`);
	}
	if (meta?.url) {
		console.log(`Source: ${meta.url}`);
		console.log(`Status: ${meta.statusCode || "unknown"}\n`);
	}

	if (data.data?.markdown) {
		console.log(data.data.markdown);
	}

	if (data.data?.html && formats.includes("html")) {
		console.log("\n--- HTML ---");
		console.log(data.data.html);
	}

	if (data.data?.links && formats.includes("links")) {
		console.log("\n--- Links ---");
		for (const link of data.data.links) {
			console.log(`  ${link}`);
		}
	}
} catch (error: any) {
	if (
		error.code === "ConnectionRefused" ||
		error.message?.includes("fetch failed") ||
		error.name === "TimeoutError"
	) {
		console.error(`Error: Cannot connect to Firecrawl at ${FIRECRAWL_URL}`);
		console.error("First check whether the service is already running:");
		console.error("  cd ~/Projects/dotfiles/skills/web-skill && podman compose ps");
		console.error("If not, start it with:");
		console.error("  cd ~/Projects/dotfiles/skills/web-skill && podman compose up -d");
	} else {
		console.error(`Error: ${error.message}`);
	}
	process.exit(1);
}
