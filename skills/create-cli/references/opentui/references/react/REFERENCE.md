# OpenTUI React (@opentui/react)

React reconciler for terminal UIs. Write TUIs with JSX, hooks, component composition.

## Overview

OpenTUI React provides:
- **Custom reconciler**: React components → OpenTUI renderables
- **JSX intrinsics**: `<text>`, `<box>`, `<input>`, etc.
- **Hooks**: `useKeyboard`, `useRenderer`, `useTimeline`, etc.
- **Full React compatibility**: useState, useEffect, context, more

## When to Use React

Use React reconciler when:
- Familiar w/ React patterns
- Want declarative UI composition
- Need React ecosystem (context, state libs)
- Building apps w/ complex state
- Team knows React

## When NOT to Use React

| Scenario | Use Instead |
|----------|-------------|
| Maximum performance critical | `@opentui/core` (imperative) |
| Fine-grained reactivity | `@opentui/solid` |
| Smallest bundle size | `@opentui/core` |
| Building a framework/library | `@opentui/core` |

## Quick Start

```bash
bunx create-tui@latest -t react my-app
cd my-app
bun run src/index.tsx
```

CLI creates `my-app` dir — must **not already exist**.

**Agent guidance**: Always use autonomous mode w/ `-t <template>` flag. Never use interactive mode (`bunx create-tui@latest my-app` without `-t`) — requires prompts agents can't answer.

Or manual setup:

```bash
mkdir my-tui && cd my-tui
bun init
bun install @opentui/react @opentui/core react
```

```tsx
import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { useState } from "react"

function App() {
  const [count, setCount] = useState(0)
  
  return (
    <box border padding={2}>
      <text>Count: {count}</text>
      <box
        border
        onMouseDown={() => setCount(c => c + 1)}
      >
        <text>Click me!</text>
      </box>
    </box>
  )
}

const renderer = await createCliRenderer()
createRoot(renderer).render(<App />)
```

## Core Concepts

### JSX Elements

React maps JSX intrinsics → OpenTUI renderables:

```tsx
// These are not HTML elements!
<text>Hello</text>           // TextRenderable
<box border>Content</box>    // BoxRenderable
<input placeholder="..." />  // InputRenderable
<select options={[...]} />   // SelectRenderable
```

### Text Modifiers

Inside `<text>`, use modifier elements:

```tsx
<text>
  <strong>Bold</strong>, <em>italic</em>, and <u>underlined</u>
  <span fg="red">Colored text</span>
  <br />
  New line with <a href="https://example.com">link</a>
</text>
```

### Styling

Two styling approaches:

```tsx
// Direct props
<box backgroundColor="blue" padding={2} border>
  <text fg="#00FF00">Green text</text>
</box>

// Style prop
<box style={{ backgroundColor: "blue", padding: 2, border: true }}>
  <text style={{ fg: "#00FF00" }}>Green text</text>
</box>
```

## Available Components

### Layout & Display
- `<text>` - Styled text content
- `<box>` - Container w/ borders + layout
- `<scrollbox>` - Scrollable container
- `<ascii-font>` - ASCII art text

### Input
- `<input>` - Single-line text input
- `<textarea>` - Multi-line text input
- `<select>` - List selection
- `<tab-select>` - Tab-based selection

### Code & Diff
- `<code>` - Syntax-highlighted code
- `<line-number>` - Code w/ line numbers
- `<diff>` - Unified or split diff viewer

### Text Modifiers (inside `<text>`)
- `<span>` - Inline styled text
- `<strong>`, `<b>` - Bold
- `<em>`, `<i>` - Italic
- `<u>` - Underline
- `<br>` - Line break
- `<a>` - Link

## Essential Hooks

```tsx
import {
  useRenderer,
  useKeyboard,
  useOnResize,
  useTerminalDimensions,
  useTimeline,
} from "@opentui/react"
```

See [API Reference](./api.md) for hook docs.

## In This Reference

- [Configuration](./configuration.md) - Project setup, tsconfig, bundling
- [API](./api.md) - Components, hooks, createRoot
- [Patterns](./patterns.md) - State mgmt, keyboard handling, forms
- [Gotchas](./gotchas.md) - Common issues, debugging, limitations

## See Also

- [Core](../core/REFERENCE.md) - Underlying imperative API
- [Solid](../solid/REFERENCE.md) - Alternative declarative approach
- [Components](../components/REFERENCE.md) - Component reference by category
- [Layout](../layout/REFERENCE.md) - Flexbox layout system
- [Keyboard](../keyboard/REFERENCE.md) - Input handling + shortcuts
- [Testing](../testing/REFERENCE.md) - Test renderer + snapshots
