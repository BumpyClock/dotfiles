# Tools Reference

CLI tools available on Aditya's machines. Use these for agentic tasks.

## gh
GitHub CLI for PRs, issues, CI, releases.

**Usage**: `gh help`

When someone shares a GitHub URL, use `gh` to read it:
```bash
gh issue view <url> --comments
gh pr view <url> --comments --files
gh run list / gh run view <id>
```

---

## browser-tools
Lightweight Chrome DevTools helpers for the active Chrome session.

**Install path**: `~/.local/bin/browser-tools`

**Usage**: `browser-tools --help`

Common commands:
```bash
browser-tools start --port 9222
browser-tools start --real-profile --kill-existing --profile-directory "Profile 1"
browser-tools nav https://example.com
browser-tools eval 'document.title'
browser-tools screenshot
browser-tools console --follow
```

Use `--real-profile` when a site needs your actual signed-in Chrome session. Pair it with `--kill-existing` so Chrome is not already holding the live profile lock.

---

## committer
Safe git commit helper for committing only explicit paths.

**Install path**: `~/.local/bin/committer`

**Usage**:
```bash
committer "feat: update docs" README.md tools.md
committer --force "fix: retry after stale lock" path/to/file
```

Notes:
- Stages only the listed paths
- Rejects `.` as an argument
- `--force` removes a stale `index.lock` and retries once

---

## docs-list
Lists markdown files in the dotfiles `docs/` tree with summary metadata.

**Usage**:
```bash
docs-list
docs-list --dotfiles-dir ~/Projects/dotfiles
```

---

## nanobanana
Gemini-powered image editing CLI.

**Install path**: `~/.local/bin/nanobanana`

**Usage**:
```bash
nanobanana photo.jpg "remove the people in the background"
nanobanana selfie.png "add a sunset background" sunset-selfie.png
nanobanana room.png --ref chair.png "place this chair next to the window"
```

**Requires**: `GEMINI_API_KEY` (can be managed via `secrets/api-keys/env.json` + `scripts/link-dotfiles/setup-dotfiles.ts`)

---

## gpt-image
OpenAI GPT Image generation CLI with optional reference images.

**Install path**: `~/.local/bin/gpt-image`

**Usage**:
```bash
gpt-image "an isometric miniature ramen shop at dusk"
gpt-image --ref mug.png "place this mug on a wooden desk in morning light" mug-scene.png
gpt-image --ref portrait.png --ref logo.png "create a conference badge using these references" badge.png
gpt-image --transparent "a flat pixel-art cat sticker"
```

**Requires**: `OPENAI_API_KEY`

---

## mcporter
MCP server launcher for browser automation, web scraping.

**Usage**: `npx mcporter --help`

Common servers: `iterm`, `firecrawl`, `XcodeBuildMCP`

---

## web_search

Local SearXNG search CLI.

**Install path**: `~/.local/bin/web_search`
**Source**: `tools/search.ts`

**Usage**:
```bash
web_search "javascript async await"
web_search "rust ownership" -n 10
web_search "climate data" --engines google,wikipedia
```

**Options**:
- `-n <num>` number of results to print, default `5`
- `--engines <csv>` restrict engines, e.g. `google,bing,wikipedia`

**Output**:
```text
--- Result 1 ---
Title: ...
URL: ...
Snippet: ...
Engines: ...
```

**Requires**: local SearXNG on `http://localhost:8899`

If service not up:
```bash
cd ~/Projects/dotfiles/skills/web-skill
podman compose ps
podman compose up -d
```

---

## web_fetch

Local Firecrawl page fetch CLI.

**Install path**: `~/.local/bin/web_fetch`
**Source**: `tools/fetch.ts`

**Usage**:
```bash
web_fetch https://example.com
web_fetch https://docs.python.org/3/tutorial/ --formats markdown,links
```

**Options**:
- `--formats <csv>` output parts to include: `markdown`, `html`, `links`

**Output**:
```text
# Page Title

Source: https://example.com
Status: 200

Markdown content...
```

If `html` requested, tool appends `--- HTML ---`.
If `links` requested, tool appends `--- Links ---`.

**Requires**: local Firecrawl on `http://localhost:8898`

If service not up:
```bash
cd ~/Projects/dotfiles/skills/web-skill
podman compose ps
podman compose up -d
```
