---
name: web-skill
description: Local web search and page fetching for AI agents via SearXNG and Firecrawl. Use when you need to search the web, fetch page content as markdown, or gather information from URLs. No API keys required.
---

# Web Skill

Local web search (SearXNG) and page scraping (Firecrawl) — no external API keys needed.

**Ports**: search = `localhost:8899`, fetch = `localhost:8898`

## Search

```bash
./search.ts "query"                          # 5 results
./search.ts "query" -n 10                    # more results
./search.ts "query" --engines google,bing    # specific engines
```

## Fetch Page Content

```bash
./fetch.ts https://example.com                           # markdown output
./fetch.ts https://example.com --formats markdown,links  # include links
```

## Output Format

### Search
```
--- Result 1 ---
Title: Page Title
URL: https://example.com/page
Snippet: Description from search results
Engines: google, bing
```

### Fetch
```
# Page Title

Source: https://example.com
Status: 200

Markdown content of the page...
```

## One-Time Setup

Only needed if SearXNG/Firecrawl aren't already running on ports 8899/8898:

```bash
cd ~/Projects/dotfiles/skills/web-skill
docker compose up -d
```

Verify: `docker compose ps` — 7 containers should be running.

Teardown: `docker compose down` (add `-v` to remove data volumes).

## When to Use

- Searching for documentation, API references, or current information
- Fetching and reading content from specific URLs as clean markdown
- Gathering information from multiple sources in parallel
- Any task requiring web access without interactive browsing
