# OpenTUI Core (@opentui/core)

Foundational lib for terminal UIs. Imperative API w/ all primitives. Max control over rendering/state/behavior.

## Overview

OpenTUI Core runs on Bun w/ native Zig bindings for perf-critical ops:
- **Renderer**: Manages terminal output, input events, render loop
- **Renderables**: Hierarchical UI blocks w/ Yoga layout
- **Constructs**: Declarative wrappers composing Renderables
- **FrameBuffer**: Low-level 2D surface for custom graphics

## When to Use Core

Use imperative API when:
- Building lib/framework on OpenTUI
- Need max render/state control
- Want smallest bundle (no React/Solid runtime)
- Perf-critical apps
- Integrating w/ imperative codebases

## When NOT to Use Core

| Scenario | Use Instead |
|----------|-------------|
| Familiar w/ React patterns | `@opentui/react` |
| Want fine-grained reactivity | `@opentui/solid` |
| Typical apps | React or Solid reconciler |
| Rapid prototyping | React or Solid reconciler |

## Quick Start

### Using create-tui (Recommended)

```bash
bunx create-tui@latest -t core my-app
cd my-app
bun run src/index.ts
```

CLI creates `my-app` dir - must **not already exist**.

**Agent guidance**: Always autonomous mode w/ `-t <template>`. Never interactive (`bunx create-tui@latest my-app` w/o `-t`) → requires user prompts agents can't answer.

### Manual Setup

```bash
mkdir my-tui && cd my-tui
bun init
bun install @opentui/core
```

```typescript
import { createCliRenderer, TextRenderable, BoxRenderable } from "@opentui/core"

const renderer = await createCliRenderer()

// Create a box container
const container = new BoxRenderable(renderer, {
  id: "container",
  width: 40,
  height: 10,
  border: true,
  borderStyle: "rounded",
  padding: 1,
})

// Create text inside the box
const greeting = new TextRenderable(renderer, {
  id: "greeting",
  content: "Hello, OpenTUI!",
  fg: "#00FF00",
})

// Compose the tree
container.add(greeting)
renderer.root.add(container)
```

## Core Concepts

### Renderer

`CliRenderer` orchestrates everything:
- Manages terminal viewport + alt screen
- Handles input events (keyboard/mouse/paste)
- Runs render loop (configurable FPS)
- Provides root node for renderable tree

### Renderables vs Constructs

| Renderables (Imperative) | Constructs (Declarative) |
|--------------------------|--------------------------|
| `new TextRenderable(renderer, {...})` | `Text({...})` |
| Needs renderer at creation | Creates VNode, instantiated later |
| Direct mutation via methods | Chained calls recorded, replayed on instantiation |
| Full control | Cleaner composition |

### Storage Options

Renderables compose 2 ways:
1. **Imperative**: Create instances, call `.add()` to compose
2. **Declarative (Constructs)**: Create VNodes, pass children as args

## Essential Commands

```bash
bun install @opentui/core     # Install
bun run src/index.ts          # Run directly (no build needed)
bun test                      # Run tests
```

## Runtime Requirements

Runs on Bun. Uses Zig for native builds.

```bash
# Package management
bun install @opentui/core

# Running
bun run src/index.ts
bun test

# Building (only needed for native code changes)
bun run build
```

**Zig** required for building native components.

## In This Reference

- [Configuration](./configuration.md) - Renderer opts, env vars
- [API](./api.md) - Renderer, Renderables, types, utils
- [Patterns](./patterns.md) - Composition, events, state mgmt
- [Gotchas](./gotchas.md) - Common issues, debugging, limits

## See Also

- [React](../react/REFERENCE.md) - React reconciler for declarative TUI
- [Solid](../solid/REFERENCE.md) - Solid reconciler for declarative TUI
- [Layout](../layout/REFERENCE.md) - Yoga/Flexbox layout
- [Components](../components/REFERENCE.md) - Component reference by category
- [Keyboard](../keyboard/REFERENCE.md) - Input handling + shortcuts
- [Testing](../testing/REFERENCE.md) - Test renderer + snapshots