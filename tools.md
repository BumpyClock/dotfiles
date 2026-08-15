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

## website-cli
Capture sanitized network metadata from one explicitly selected existing Chrome tab, classify public reads, and run anonymously validated recipes.

**Install path**: `~/.local/bin/website-cli`

**Usage**:
```bash
website-cli list --site sports
website-cli capture --port 9222 --target <target-id> --site sports --duration 15s
website-cli infer --capture <capture-id> --capture <variant-capture-id> --site sports
website-cli inspect --draft <draft-id>
website-cli promote --draft <draft-id> --operations <candidate-id> --name scores --param league=nfl --variant-param league=nba --browser-fact original=nfl --browser-fact variant=nba
website-cli run sports scores --league nfl
website-cli clean --captures-older-than 1h --force
# Add --json to any command for machine-readable output.
```

Artifact locations:
- captures: `${XDG_STATE_HOME:-~/.local/state}/browser-to-cli/captures/<site>/`
- drafts: `${XDG_STATE_HOME:-~/.local/state}/browser-to-cli/drafts/<site>/`
- recipes: `${XDG_DATA_HOME:-~/.local/share}/browser-to-cli/sites/<site>/recipe.json`

`capture` prints only its capture ID and managed path. `infer` prints the draft ID, `promote`/`list` print operation IDs, `run` prints the bounded redacted response, and `clean` prints removal counts. Add `--json` for structured success output. `infer --capture` accepts either an ID or managed path, but paths must resolve to that site's private managed capture directory.

Safety boundaries:
- Capture attaches only to the exact `--port` and `--target`; it observes CDP network metadata and never navigates, clicks, evaluates page code, or starts Chrome.
- Artifacts contain no raw target IDs, ports, headers, bodies, cookies, authorization, signed values, query values, or raw CDP events. XDG state/data directories and JSON files use private permissions and atomic writes.
- Promotion accepts only anonymous public-network HTTPS `GET`/`HEAD`. Session/auth traffic, mutations, GraphQL POST, signed/expiring URLs, anti-bot traffic, private-network destinations, and unsafe redirects are rejected.
- Class A promotion requires one non-sensitive public browser fact. Class B requires explicit original and benign variant parameters plus a public fact for each response. Parameter values and browser facts are used for validation but are not retained.
- GET promotion currently accepts structured JSON and requires each supplied fact to match an exact primitive in its corresponding anonymous response; HEAD can match status or content type. One operation is not evidence of site-wide support.
- Recipes define the origin, path, response contract, expiry, and query allowlist. `run` accepts only the recipe's dynamic flags; it has no arbitrary URL, header, cookie, or body escape hatch.
- `clean` removes only expired captures and drafts after explicit `--force`; it never removes recipes.

Exit codes:
- `0`: success
- `1`: internal error
- `2`: invalid input or usage
- `3`: requested capture, draft, candidate, or recipe is absent
- `4`: recipe validation is stale
- `5`: browser fallback is required
- `6`: anonymous network or response-shape validation failed
- `7`: a security policy rejected the operation
- `8`: Chrome DevTools attachment or capture failed

Command output goes to stdout. Failures are one JSON object on stderr: `{"ok":false,"fallback_required":true|false,"reason_code":"...","message":"..."}`.

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

## pr-comments
Fetch open and unresolved GitHub PR feedback in one command.

**Install path**: `~/.local/bin/pr-comments`
**Source**: `tools/pr-comments.ts`

**Usage**:
```bash
pr-comments
pr-comments 123
pr-comments 123 --repo BumpyClock/dotfiles
pr-comments https://github.com/owner/repo/pull/123 --json
pr-comments 123 --all
```

**Options**:
- `--repo <owner/repo>` repository for numeric PR input
- `--json` normalized machine-readable output
- `--all` include resolved review threads

**Output**:
```text
PR #123: ...
https://github.com/owner/repo/pull/123
State: OPEN
Counts: 2 unresolved threads, 5 resolved threads, 1 PR comments, 1 review bodies

Unresolved review threads
  1. reviewer src/file.ts:42
     Please handle this edge case.
```

**Requires**: `gh` installed and authenticated.

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
# Mac fallback when Podman machine is not configured:
docker compose ps
docker compose up -d
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
# Mac fallback when Podman machine is not configured:
docker compose ps
docker compose up -d
```

# USEFUL - Auto-Allow (Development Support)

Use these tools in addition to your native tools.

**Text Processing:** grep, egrep, fgrep, sed, awk, sort, uniq, head, tail, wc, cat, less, more,
diff, diff3, patch, cut, paste, join, tr, col, expand, unexpand, fmt

**File Operations:** find, xargs, file, stat, readlink, du, df, which, whereis, locate, basename,
dirname, realpath

**Archives:** tar, zip, unzip, gzip, gunzip, bzip2, bunzip2, xz, unxz, ditto

**System Info:** ps, top, kill, killall, pgrep, pkill, lsof, netstat, ifconfig, ping, traceroute,
nslookup, dig, host, whoami, id, groups, uname, uptime, date, cal, env, printenv

**Data Processing:** jq, xmllint, sqlite3, openssl, base64, md5, sha1, sha256, shasum, cksum, tee,
yes

**macOS Specific:** hdiutil, pkgbuild, productbuild, productsign, pkgutil, profiles, defaults,
osascript, automator, say, screencapture, caffeinate

# SPECIALIZED - Context Dependent

**Editors:** vim, vi, nano, pico, ed (generally safe)

**Documentation:** man, apropos, whatis, info

**Performance:** time, timeout, dtrace, dtruss
