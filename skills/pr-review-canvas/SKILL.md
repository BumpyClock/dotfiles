---
name: pr-review-canvas
description: "Interactive local HTML PR review walkthrough with grouped diffs and annotations."
disable-model-invocation: true
source: https://github.com/shaneholloman/cursor-plugins/tree/main/cursor-team-kit/skills/pr-review-canvas
license: MIT
---

# PR Review Canvas

Generate interactive HTML review of a GitHub PR — reads like a peer walking through what matters. Local-browser adaptation of Cursor's canvas workflow.

Use when: PR review canvas, walkthrough, interactive review, reviewer-friendly diff map. For normal PR comments/CI/merge conflicts/PR body edits → `git-workflow`.

## Workflow

### 1. Fetch PR Data

Resolve PR from URL, number, or current branch. Use `gh`; no browser URLs.

```bash
gh pr view <pr> --json number,title,body,author,state,additions,deletions,changedFiles,baseRefName,headRefName,url
gh pr diff <pr> --patch
gh api repos/{owner}/{repo}/pulls/{number}/files --paginate --jq '.[] | {filename, status, additions, deletions, patch}'
gh api repos/{owner}/{repo}/pulls/{number}/comments --paginate --jq '.[] | {user: .user.login, body, path, line}'
```

Save patches safely (JSON escaping):

```bash
gh api repos/{owner}/{repo}/pulls/{number}/files --paginate \
  --jq '[.[] | {key: (.filename | gsub("[^a-zA-Z0-9]"; "_")), value: (.patch // "")}] | from_entries' \
  > /tmp/pr-patches-{number}.json
```

### 2. Write Body HTML

Write only `<body>` contents to `/tmp/pr-review-{number}-body.html`. Structure:

- Header: title, PR number, author, stats
- TL;DR summary
- Core files expanded with annotations
- Wiring/integration condensed
- Mechanical/generated/import-only/formatting/rename-only files collapsed
- Review checklist: risks, questions, suggested review order

Useful representations: pseudocode summaries, before/after behavior tables, flow diagrams/inline SVG, callouts for breaking changes/race conditions/migration order/security/perf/rollback.

### 3. Use Bundled Renderer

Read from skill directory before assembling: `styles.css`, `renderer.js`, `template.html`

CSS classes:

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

JS functions:

| Function | Usage |
| --- | --- |
| `toggle(hdrElement)` | Toggle a `.file-body` |
| `toggleBP(hdrElement)` | Toggle a `.bp-body` |
| `renderDiff(target, diffInput)` | Render unified diff |
| `esc(string)` | HTML-escape a string |

Prefer `<div data-diff="KEY"></div>` placeholders. Renderer auto-fills from JSON in `template.html`.

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

```bash
cd /tmp && python3 -m http.server 8432 --bind 127.0.0.1
```

Port 8432 taken → try 8433, 8434, etc. Don't leave long-running servers open after task unless user wants.

## Diff Features

Renderer auto-filters import-only lines, collapses whitespace-only changes into context, detects moved code blocks, highlights near-moved blocks separately.

## Guardrails

- Explanatory artifact, not substitute for review findings
- Keep generated/mechanical files collapsed unless risk hides there
- No private tokens, internal URLs, secrets, or unrelated PR comments in HTML
- PR too large → produce index page or recommend splitting
