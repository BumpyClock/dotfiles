# Visual Companion Guide

Use only after user accepts visual companion offer from `SKILL.md`.

Purpose: show mockups, diagrams, comparisons, and visual options in browser while terminal remains source of truth.

## Decide per question

Use browser when seeing beats reading:

- UI mockups, layouts, navigation, components
- Visual hierarchy, spacing, look/feel
- Architecture/data-flow diagrams
- Flowcharts, state machines, entity relationships
- Side-by-side visual design options

Use terminal for:

- Requirements/scope questions
- Conceptual tradeoffs
- Technical decisions
- Text/table comparisons
- Clarifying questions answered in words

UI topic does not automatically mean browser. `What should wizard do?` = terminal. `Which wizard layout feels right?` = browser.

## How it works

Server watches `screen_dir` and serves newest HTML file. User clicks options in browser. Events are written to `state_dir/events`. On next turn, read events and merge with terminal reply.

Terminal text is primary feedback. Browser events are supporting evidence.

## Start session

From `skills/brainstorming/`:

```bash
scripts/start-server.sh --project-dir /path/to/project
```

Output:

```json
{
  "type": "server-started",
  "port": 52341,
  "url": "http://localhost:52341",
  "screen_dir": "/path/to/project/.superpowers/brainstorm/<id>/content",
  "state_dir": "/path/to/project/.superpowers/brainstorm/<id>/state"
}
```

Save `url`, `screen_dir`, `state_dir`. Derive session dir from `state_dir/..`. Tell user to open URL.

If stdout missed, recover latest project session:

```bash
ls -td /path/to/project/.superpowers/brainstorm/*/state/server-info | head -1
```

Then read that `server-info` file and set `state_dir` to its parent dir; `screen_dir` is sibling `content` dir.

Use `--project-dir` so files persist under `.superpowers/brainstorm/`. Remind user to ignore `.superpowers/` if needed.

Remote/container URL issue:

```bash
scripts/start-server.sh \
  --project-dir /path/to/project \
  --host 0.0.0.0 \
  --url-host localhost
```

## Runtime notes

- macOS/Linux Claude Code: default background mode usually works.
- Windows/Git Bash: script auto-foregrounds and can block. If Bash tool supports it, set `run_in_background: true`.
- Codex: script auto-foregrounds when `CODEX_CI`; use runtime background support if needed.
- Gemini CLI: use `--foreground` with background tool setting such as `is_background: true`.
- If detached processes die, use `--foreground` with persistent/background tool mode.

## Browser loop

Before each screen:

- Check `$STATE_DIR/server-info` exists.
- If `$STATE_DIR/server-stopped` exists or server info missing, restart.
- Server auto-exits after 30 min idle.

Write new HTML file to `screen_dir`:

- Use semantic filename: `layout.html`, `visual-style.html`, `flow-v2.html`.
- Never reuse filenames.
- Use write/edit tool, not terminal heredoc/cat.
- Prefer content fragments, not full HTML docs.

Then tell user:

- URL.
- What is on screen.
- Ask them to inspect/click and respond in terminal.
- End turn.

Next turn:

- Read `$STATE_DIR/events` if present.
- Merge events with terminal text.
- Iterate current screen if feedback changes it.
- Advance only after current visual choice is validated.

When returning to terminal-only work, push waiting screen:

```html
<div
  style="display:flex;align-items:center;justify-content:center;min-height:60vh"
>
  <p class="subtitle">Continuing in terminal...</p>
</div>
```

## Content fragments

Default: write only body fragment. Server wraps with frame, CSS, helper script.

Use full HTML only when you need complete page control.

Minimal option screen:

```html
<h2>Which layout works better?</h2>
<p class="subtitle">Consider readability and visual hierarchy.</p>

<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Single Column</h3>
      <p>Focused reading experience.</p>
    </div>
  </div>
  <div class="option" data-choice="b" onclick="toggleSelect(this)">
    <div class="letter">B</div>
    <div class="content">
      <h3>Two Column</h3>
      <p>Sidebar nav with main content.</p>
    </div>
  </div>
</div>
```

## Available classes

Options:

```html
<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Title</h3>
      <p>Description</p>
    </div>
  </div>
</div>
```

Multi-select:

```html
<div class="options" data-multiselect>
  <!-- option items -->
</div>
```

Cards:

```html
<div class="cards">
  <div class="card" data-choice="design1" onclick="toggleSelect(this)">
    <div class="card-image"><!-- mockup --></div>
    <div class="card-body">
      <h3>Name</h3>
      <p>Description</p>
    </div>
  </div>
</div>
```

Mockup/split:

```html
<div class="mockup">
  <div class="mockup-header">Preview</div>
  <div class="mockup-body"><!-- mockup --></div>
</div>

<div class="split">
  <div class="mockup"><!-- left --></div>
  <div class="mockup"><!-- right --></div>
</div>
```

Pros/cons:

```html
<div class="pros-cons">
  <div class="pros">
    <h4>Pros</h4>
    <ul>
      <li>Benefit</li>
    </ul>
  </div>
  <div class="cons">
    <h4>Cons</h4>
    <ul>
      <li>Drawback</li>
    </ul>
  </div>
</div>
```

Wireframe helpers:

```html
<div class="mock-nav">Logo | Home | About</div>
<div class="mock-sidebar">Navigation</div>
<div class="mock-content">Main content</div>
<button class="mock-button">Action</button>
<input class="mock-input" placeholder="Input field" />
<div class="placeholder">Placeholder area</div>
```

Typography: `h2`, `h3`, `.subtitle`, `.section`, `.label`.

## Events format

`$STATE_DIR/events` contains JSONL:

```jsonl
{"type":"click","choice":"a","text":"Option A - Simple Layout","timestamp":1706000101}
{"type":"click","choice":"b","text":"Option B - Hybrid","timestamp":1706000115}
```

Last click is often final choice, but click path may show hesitation.

If events file missing, user did not interact; use terminal text.

## Design tips

- 2-4 options max per screen.
- Scale fidelity to question: wireframe for layout, polish for visual taste.
- Use real content when placeholder content would hide design problems.
- Put question on screen.
- Keep mockups focused, not pixel-perfect unless polish is question.
- Iterate before advancing.

## Cleanup

```bash
# SESSION_DIR is state_dir/..
scripts/stop-server.sh $SESSION_DIR
```

Persistent project sessions stay under `.superpowers/brainstorm/`. `/tmp` sessions are deleted on stop.

Reference files:

- `scripts/frame-template.html` — CSS/frame
- `scripts/helper.js` — client events
