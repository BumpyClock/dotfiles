---
name: pr-review-canvas
description: "Interactive local HTML PR review walkthrough with grouped diffs and annotations."
disable-model-invocation: true
source: https://github.com/shaneholloman/cursor-plugins/tree/main/cursor-team-kit/skills/pr-review-canvas
license: MIT
---

# PR Review Canvas

Generate an interactive HTML review of a GitHub PR that reads like a peer walking through what matters. This is a local-browser adaptation of Cursor's canvas workflow.

Use when the user asks for a PR review canvas, walkthrough, interactive review, or reviewer-friendly diff map. For normal PR comments, CI, merge conflicts, or PR body edits, use `git-workflow`.

## Workflow

### 1. Fetch PR Data

Resolve the PR from URL, number, or current branch. Use `gh`; do not open browser URLs for PR data.

```bash
gh pr view <pr> --json number,title,body,author,state,additions,deletions,changedFiles,baseRefName,headRefName,url
gh pr diff <pr> --patch
gh api repos/{owner}/{repo}/pulls/{number}/files --paginate --jq '.[] | {filename, status, additions, deletions, patch}'
gh api repos/{owner}/{repo}/pulls/{number}/comments --paginate --jq '.[] | {user: .user.login, body, path, line}'
```

Save patches safely with JSON escaping:

```bash
gh api repos/{owner}/{repo}/pulls/{number}/files --paginate \
  --jq '[.[] | {key: (.filename | gsub("[^a-zA-Z0-9]"; "_")), value: (.patch // "")}] | from_entries' \
  > /tmp/pr-patches-{number}.json
```

### 2. Write Body HTML

Write only the HTML that belongs inside `<body>` to `/tmp/pr-review-{number}-body.html`. Use whatever structure best explains the PR:

- Header with title, PR number, author, stats.
- TL;DR summary.
- Core files expanded by default with annotations.
- Wiring/integration condensed.
- Mechanical, generated, import-only, formatting, or rename-only files collapsed.
- Review checklist with risks, questions, and suggested review order.

Useful representations:

- Pseudocode summaries for verbose algorithms.
- Before/after behavior tables.
- Flow diagrams or inline SVG when they clarify control flow.
- Callouts for breaking changes, race conditions, migration order, security, perf, or rollback concerns.

### 3. Use Bundled Renderer

Read these files from this skill directory before assembling:

- `styles.css`
- `renderer.js`
- `template.html`

Available CSS classes include:

| Class | Purpose |
| --- | --- |
| `.header`, `.header h1`, `.header-meta` | Page header |
| `.pill.add`, `.pill.del`, `.pill.files` | Stat badges |
| `.content` | Centered content wrapper |
| `.summary` | Summary box |
| `.section-title` | Section heading |
| `.ic` | Inline code reference |
| `.file-card`, `.file-hdr`, `.file-body` | Collapsible file card |
| `.file-note` | Reviewer annotation |
| `.bp-section`, `.bp-hdr`, `.bp-body` | Collapsed boilerplate card |
| `.verdict` | Review checklist box |

Available JS functions:

| Function | Usage |
| --- | --- |
| `toggle(hdrElement)` | Toggle a `.file-body` |
| `toggleBP(hdrElement)` | Toggle a `.bp-body` |
| `renderDiff(target, diffInput)` | Render unified diff |
| `esc(string)` | HTML-escape a string |

Prefer `<div data-diff="KEY"></div>` placeholders. The renderer auto-fills them from the JSON stored in `template.html`.

### 4. Assemble Safely

Never manually embed patch strings into executable JavaScript. Patch text can contain `</script>`.

```bash
python3 <<'PY'
import json
from pathlib import Path

number = "{number}"
skill_dir = Path("skills/pr-review-canvas")
patches = json.loads(Path(f"/tmp/pr-patches-{number}.json").read_text())
body = Path(f"/tmp/pr-review-{number}-body.html").read_text()
css = (skill_dir / "styles.css").read_text()
js = (skill_dir / "renderer.js").read_text()
tmpl = (skill_dir / "template.html").read_text()

safe_json = json.dumps(patches).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
out = (
    tmpl.replace("/* INJECT_CSS */", css)
    .replace("/* INJECT_JS */", js)
    .replace("<!-- INJECT_BODY -->", body)
    .replace('{"__PR_DIFFS_PLACEHOLDER__":true}', safe_json)
)
Path(f"/tmp/pr-review-{number}.html").write_text(out)
PY
```

### 5. Serve Locally

Start a local server and give the user the URL:

```bash
cd /tmp && python3 -m http.server 8432 --bind 127.0.0.1
```

If port 8432 is taken, try 8433, 8434, and so on. Do not leave long-running servers open after the task is done unless the user wants to keep viewing the page.

## Diff Features

The bundled renderer automatically:

- filters import-only lines,
- collapses whitespace-only changes into context,
- detects moved code blocks,
- highlights near-moved blocks separately.

## Guardrails

- This is an explanatory artifact, not a substitute for review findings.
- Keep generated or mechanical files collapsed unless risk hides there.
- Do not expose private tokens, internal URLs, secrets, or unrelated PR comments in the HTML.
- If the PR is too large, produce an index page or recommend splitting instead of pretending the whole diff is easy.
