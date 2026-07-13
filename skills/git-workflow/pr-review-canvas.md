# PR Review Canvas

Interactive local HTML PR walkthrough — grouped diffs + annotations, reads like a peer explaining what matters. Explanatory artifact, not substitute for review findings.

Assets bundled in `<skill-dir>/canvas/`: `styles.css`, `renderer.js`, `template.html` (MIT, `canvas/LICENSE.txt`; source: cursor-team-kit). `<skill-dir>` = this skill's install directory, not repo-relative. Read all three before assembling.

## 1. Fetch

Resolve PR from URL/number/current branch via `gh` (metadata, per-file patches, review comments). Save patches with JSON escaping:

```bash
mkdir -p /tmp/pr-review-{number}
gh api repos/{owner}/{repo}/pulls/{number}/files --paginate \
  --jq '[.[] | {key: (.filename | gsub("[^a-zA-Z0-9]"; "_")), value: (.patch // "")}] | from_entries' \
  > /tmp/pr-review-{number}/patches.json
```

## 2. Body HTML

Write only `<body>` contents to `/tmp/pr-review-{number}/body.html`:

- Header (title, PR number, author, stats) → TL;DR → core files expanded with annotations → wiring/integration condensed → mechanical/generated/rename-only collapsed → review checklist (risks, questions, suggested review order).
- Fold fetched review comments into relevant file annotations; drop the rest.
- Useful: pseudocode summaries, before/after behavior tables, inline SVG flow diagrams, callouts for breaking changes/races/migration order/security/perf/rollback.

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

JS: `toggle(hdr)` / `toggleBP(hdr)` collapse cards, `renderDiff(target, diff)`, `esc(str)`. Prefer `<div data-diff="KEY"></div>` placeholders — renderer auto-fills from JSON. Renderer auto-filters import-only lines, collapses whitespace-only changes, detects moved/near-moved blocks.

## 3. Assemble

Never hand-embed patch text into executable JS — patches can contain `</script>`. Use:

```bash
python3 <<'PY'
import json
from pathlib import Path

number = "{number}"
skill_dir = Path("{skill-dir}")  # absolute path of this skill's directory
out_dir = Path(f"/tmp/pr-review-{number}")
patches = json.loads((out_dir / "patches.json").read_text())
body = (out_dir / "body.html").read_text()
css = (skill_dir / "canvas" / "styles.css").read_text()
js = (skill_dir / "canvas" / "renderer.js").read_text()
tmpl = (skill_dir / "canvas" / "template.html").read_text()

safe_json = json.dumps(patches).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
out = (
    tmpl.replace("/* INJECT_CSS */", css)
    .replace("/* INJECT_JS */", js)
    .replace("<!-- INJECT_BODY -->", body)
    .replace('{"__PR_DIFFS_PLACEHOLDER__":true}', safe_json)
)
(out_dir / "index.html").write_text(out)
PY
```

## 4. Serve

```bash
cd /tmp/pr-review-{number} && python3 -m http.server 8432 --bind 127.0.0.1 &
```

Serve the dedicated dir only — never all of /tmp. Port taken → 8433, 8434… Run in background, report `http://127.0.0.1:<port>/`, kill server when task done unless user wants it kept.

## Guardrails

- Keep mechanical/generated files collapsed unless risk hides there.
- No tokens, secrets, internal URLs, or unrelated PR comments in HTML.
- PR too large (~>100 files / >5k changed lines) → index page or recommend splitting.
