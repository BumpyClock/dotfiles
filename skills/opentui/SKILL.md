---
name: opentui
description: Comprehensive OpenTUI skill for building terminal user interfaces. Covers the core imperative API, React reconciler, and Solid reconciler. Use for any TUI development task including components, layout, keyboard handling, animations, and testing.
metadata:
   references: core, react, solid
---

# OpenTUI Platform Skill

Consolidated skill. Build TUIs w/ OpenTUI. Use decision trees -> find framework + components -> load refs.

## Critical Rules

**Follow in all OpenTUI code:**

1. **Use `create-tui` for new projects.** See framework `REFERENCE.md` quick starts.
2. **`create-tui` opts before args.** `bunx create-tui -t react my-app` works, `bunx create-tui my-app -t react` does NOT.
3. **Never `process.exit()` directly.** Use `renderer.destroy()` (see `core/gotchas.md`).
4. **Text styling needs nested tags in React/Solid.** Use modifier elements, not props (see `components/text-display.md`).

## How to Use This Skill

### Reference File Structure

Framework refs -> 5-file pattern. Cross-cutting concepts -> single-file guides.

Each framework in `./references/<framework>/`:

| File | Purpose | When to Read |
|------|---------|--------------|
| `REFERENCE.md` | Overview, when to use, quick start | **Read first** |
| `api.md` | Runtime API, components, hooks | Writing code |
| `configuration.md` | Setup, tsconfig, bundling | Configuring project |
| `patterns.md` | Common patterns, best practices | Impl guidance |
| `gotchas.md` | Pitfalls, limits, debugging | Troubleshooting |

Cross-cutting concepts in `./references/<concept>/` -> `REFERENCE.md` entry point.

### Reading Order

1. Start `REFERENCE.md` for chosen framework
2. Then read files for task:
   - Components -> `api.md` + `components/<category>.md`
   - Project setup -> `configuration.md`
   - Layout/positioning -> `layout/REFERENCE.md`
   - Keyboard/input -> `keyboard/REFERENCE.md`
   - Animations -> `animation/REFERENCE.md`
   - Troubleshooting -> `gotchas.md` + `testing/REFERENCE.md`

### Example Paths

```
./references/react/REFERENCE.md           # Start here for React
./references/react/api.md              # React components and hooks
./references/solid/configuration.md    # Solid project setup
./references/components/inputs.md      # Input, Textarea, Select docs
./references/core/gotchas.md           # Core debugging tips
```

### Runtime Notes

OpenTUI runs on Bun, uses Zig for native builds. Read `./references/core/gotchas.md` for runtime reqs + build guidance.

## Quick Decision Trees

### "Which framework should I use?"

```
Which framework?
├─ I want full control, maximum performance, no framework overhead
│  └─ core/ (imperative API)
├─ I know React, want familiar component patterns
│  └─ react/ (React reconciler)
├─ I want fine-grained reactivity, optimal re-renders
│  └─ solid/ (Solid reconciler)
└─ I'm building a library/framework on top of OpenTUI
   └─ core/ (imperative API)
```

### "I need to display content"

```
Display content?
├─ Plain or styled text -> components/text-display.md
├─ Container with borders/background -> components/containers.md
├─ Scrollable content area -> components/containers.md (scrollbox)
├─ ASCII art banner/title -> components/text-display.md (ascii-font)
├─ Code with syntax highlighting -> components/code-diff.md
├─ Diff viewer (unified/split) -> components/code-diff.md
├─ Line numbers with diagnostics -> components/code-diff.md
└─ Markdown content (streaming) -> components/code-diff.md (markdown)
```

### "I need user input"

```
User input?
├─ Single-line text field -> components/inputs.md (input)
├─ Multi-line text editor -> components/inputs.md (textarea)
├─ Select from a list (vertical) -> components/inputs.md (select)
├─ Tab-based selection (horizontal) -> components/inputs.md (tab-select)
└─ Custom keyboard shortcuts -> keyboard/REFERENCE.md
```

### "I need layout/positioning"

```
Layout?
├─ Flexbox-style layouts (row, column, wrap) -> layout/REFERENCE.md
├─ Absolute positioning -> layout/patterns.md
├─ Responsive to terminal size -> layout/patterns.md
├─ Centering content -> layout/patterns.md
└─ Complex nested layouts -> layout/patterns.md
```

### "I need animations"

```
Animations?
├─ Timeline-based animations -> animation/REFERENCE.md
├─ Easing functions -> animation/REFERENCE.md
├─ Property transitions -> animation/REFERENCE.md
└─ Looping animations -> animation/REFERENCE.md
```

### "I need to handle input"

```
Input handling?
├─ Keyboard events (keypress, release) -> keyboard/REFERENCE.md
├─ Focus management -> keyboard/REFERENCE.md
├─ Paste events -> keyboard/REFERENCE.md
├─ Mouse events -> components/containers.md
└─ Text selection -> components/text-display.md
```

### "I need to test my TUI"

```
Testing?
├─ Snapshot testing -> testing/REFERENCE.md
├─ Interaction testing -> testing/REFERENCE.md
├─ Test renderer setup -> testing/REFERENCE.md
└─ Debugging tests -> testing/REFERENCE.md
```

### "I need to debug/troubleshoot"

```
Troubleshooting?
├─ Runtime errors, crashes -> <framework>/gotchas.md
├─ Layout issues -> layout/REFERENCE.md + layout/patterns.md
├─ Input/focus issues -> keyboard/REFERENCE.md
└─ Repro + regression tests -> testing/REFERENCE.md
```

### Troubleshooting Index

- Terminal cleanup, crashes -> `core/gotchas.md`
- Text styling not applying -> `components/text-display.md`
- Input focus/shortcuts -> `keyboard/REFERENCE.md`
- Layout misalignment -> `layout/REFERENCE.md`
- Flaky snapshots -> `testing/REFERENCE.md`

Component naming diffs + text modifiers -> `components/REFERENCE.md`.

## Product Index

### Frameworks
| Framework | Entry File | Description |
|-----------|------------|-------------|
| Core | `./references/core/REFERENCE.md` | Imperative API, all primitives |
| React | `./references/react/REFERENCE.md` | React reconciler, declarative TUI |
| Solid | `./references/solid/REFERENCE.md` | SolidJS reconciler, declarative TUI |

### Cross-Cutting Concepts
| Concept | Entry File | Description |
|---------|------------|-------------|
| Layout | `./references/layout/REFERENCE.md` | Yoga/Flexbox layout |
| Components | `./references/components/REFERENCE.md` | Component ref by category |
| Keyboard | `./references/keyboard/REFERENCE.md` | Keyboard input |
| Animation | `./references/animation/REFERENCE.md` | Timeline animations |
| Testing | `./references/testing/REFERENCE.md` | Test renderer + snapshots |

### Component Categories
| Category | Entry File | Components |
|----------|------------|------------|
| Text & Display | `./references/components/text-display.md` | text, ascii-font, styled text |
| Containers | `./references/components/containers.md` | box, scrollbox, borders |
| Inputs | `./references/components/inputs.md` | input, textarea, select, tab-select |
| Code & Diff | `./references/components/code-diff.md` | code, line-number, diff, markdown |

## Resources

**Repository**: https://github.com/anomalyco/opentui
**Core Docs**: https://github.com/anomalyco/opentui/tree/main/packages/core/docs
**Examples**: https://github.com/anomalyco/opentui/tree/main/packages/core/src/examples
**Awesome List**: https://github.com/msmps/awesome-opentui
