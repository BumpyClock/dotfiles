# Core Gotchas

## Runtime Environment

### Use Bun, Not Node.js

OpenTUI built for Bun. Use Bun cmds:

```bash
# CORRECT
bun install @opentui/core
bun run src/index.ts
bun test

# WRONG
npm install @opentui/core
node src/index.ts
npx jest
```

### Bun APIs to Use

Prefer Bun built-in APIs:

```typescript
// CORRECT - Bun APIs
Bun.file("path").text()           // Instead of fs.readFile
Bun.serve({ ... })                // Instead of express
Bun.$`ls -la`                     // Instead of execa
import { Database } from "bun:sqlite"  // Instead of better-sqlite3

// WRONG - Node.js patterns
import fs from "node:fs"
import express from "express"
```

### Avoid process.exit()

**Never use `process.exit()` directly** — blocks terminal cleanup, leaves terminal broken (alternate screen mode, raw input mode, etc).

```typescript
// WRONG - Terminal may be left in broken state
if (error) {
  console.error("Fatal error")
  process.exit(1)
}

// CORRECT - Use renderer.destroy() for cleanup
if (error) {
  console.error("Fatal error")
  await renderer.destroy()
  process.exit(1)  // Only after destroy
}

// BETTER - Let destroy handle exit
const renderer = await createCliRenderer({
  exitOnCtrlC: true,  // Handles Ctrl+C properly
})

// For programmatic exit
renderer.destroy()  // Cleans up and exits
```

`renderer.destroy()` restores terminal to original state before exit.

### Environment Variables

Bun auto-loads `.env`. No dotenv:

```typescript
// CORRECT
const apiKey = process.env.API_KEY

// WRONG
import dotenv from "dotenv"
dotenv.config()
```

## Debugging TUIs

### Cannot See console.log Output

OpenTUI captures console for debug overlay. Logs invisible in terminal while TUI running.

**Solutions:**

1. **Console overlay:**
   ```typescript
   const renderer = await createCliRenderer()
   renderer.console.show()
   console.log("This appears in the overlay")
   ```

2. **Keyboard toggle:**
   ```typescript
   renderer.keyInput.on("keypress", (key) => {
     if (key.name === "f12") {
       renderer.console.toggle()
     }
   })
   ```

3. **Write to file:**
   ```typescript
   import { appendFileSync } from "node:fs"
   function debugLog(msg: string) {
     appendFileSync("debug.log", `${new Date().toISOString()} ${msg}\n`)
   }
   ```

4. **Disable capture:**
   ```bash
   OTUI_USE_CONSOLE=false bun run src/index.ts
   ```

### Reproduce Issues in Tests

No guessing. Make repro test:

```typescript
import { test, expect } from "bun:test"
import { createTestRenderer } from "@opentui/core/testing"

test("reproduces the issue", async () => {
  const { renderer, snapshot } = await createTestRenderer({
    width: 40,
    height: 10,
  })
  
  // Setup that reproduces the bug
  const box = new BoxRenderable(renderer, { ... })
  renderer.root.add(box)
  
  // Verify with snapshot
  expect(snapshot()).toMatchSnapshot()
})
```

## Focus Management

### Components Must Be Focused

Input components get keys only when focused:

```typescript
const input = new InputRenderable(renderer, {
  id: "input",
  placeholder: "Type here...",
})

renderer.root.add(input)

// WRONG - input won't receive keystrokes
// (no focus call)

// CORRECT
input.focus()
```

### Focus in Nested Components

Component inside container → focus component direct:

```typescript
const container = new BoxRenderable(renderer, { id: "container" })
const input = new InputRenderable(renderer, { id: "input" })
container.add(input)
renderer.root.add(container)

// WRONG
container.focus()

// CORRECT
input.focus()

// Or use getRenderable
container.getRenderable("input")?.focus()

// Or use delegate (constructs)
const form = delegate(
  { focus: "input" },
  Box({}, Input({ id: "input" })),
)
form.focus()  // Routes to the input
```

## Build Requirements

### Zig is Required

Native compile needs Zig:

```bash
# Install Zig first
# macOS
brew install zig

# Linux
# Download from https://ziglang.org/download/

# Then build
bun run build
```

### When to Build

- **TypeScript changes**: NO build (Bun runs TS direct)
- **Native code changes**: Build required

```bash
# Only needed when changing native (Zig) code
cd packages/core
bun run build
```

## Common Errors

### "Cannot read properties of undefined"

Renderable not added to tree:

```typescript
// WRONG - not added to tree
const text = new TextRenderable(renderer, { content: "Hello" })
// text.someMethod() // May fail

// CORRECT
const text = new TextRenderable(renderer, { content: "Hello" })
renderer.root.add(text)
text.someMethod()
```

### Layout Not Updating

Yoga layout lazy. Force recalc:

```typescript
// After changing layout properties
box.setWidth(newWidth)
renderer.requestRender()
```

### Text Overflow/Clipping

Text no wrap by default. Set width:

```typescript
// May overflow
const text = new TextRenderable(renderer, {
  content: "Very long text that might overflow the terminal...",
})

// Contained within width
const text = new TextRenderable(renderer, {
  content: "Very long text that might overflow the terminal...",
  width: 40,  // Will clip or wrap based on parent
})
```

### Colors Not Showing

Check terminal capability + color format:

```typescript
// CORRECT formats
fg: "#FF0000"           // Hex
fg: "red"               // CSS color name
fg: RGBA.fromHex("#FF0000")

// WRONG
fg: "FF0000"            // Missing #
fg: 0xFF0000            // Number (not supported)
```

## Performance

### Avoid Frequent Re-renders

Batch updates:

```typescript
// WRONG - multiple render calls
item1.setContent("...")
item2.setContent("...")
item3.setContent("...")

// BETTER - single render after all updates
// (OpenTUI batches automatically, but be mindful)
items.forEach((item, i) => {
  item.setContent(data[i])
})
```

### Minimize Tree Depth

Deep nesting → slow layout:

```typescript
// Avoid unnecessary wrappers
// WRONG
Box({}, Box({}, Box({}, Text({ content: "Hello" }))))

// CORRECT
Box({}, Text({ content: "Hello" }))
```

### Use display: none

Hide, don't remove/re-add:

```typescript
// For toggling visibility
element.setDisplay("none")   // Hidden
element.setDisplay("flex")   // Visible

// Instead of
parent.remove(element)
parent.add(element)
```

## Testing

### Test Runner

Use Bun test runner:

```typescript
import { test, expect, beforeEach, afterEach } from "bun:test"

test("my test", () => {
  expect(1 + 1).toBe(2)
})
```

### Test from Package Directories

Run tests from package dir:

```bash
# CORRECT
cd packages/core
bun test

# For native tests
cd packages/core
bun run test:native
```

### Filter Tests

```bash
# Bun test filter
bun test --filter "component name"

# Native test filter
bun run test:native -Dtest-filter="test name"
```

## Keyboard Handling

### Key Names

Common key names for `KeyEvent.name`:

```typescript
// Letters/numbers
"a", "b", ..., "z"
"1", "2", ..., "0"

// Special keys
"escape", "enter", "return", "tab", "backspace", "delete"
"up", "down", "left", "right"
"home", "end", "pageup", "pagedown"
"f1", "f2", ..., "f12"
"space"

// Modifiers (check boolean properties)
key.ctrl   // Ctrl held
key.shift  // Shift held
key.meta   // Alt held
key.option // Option held (macOS)
```

### Key Event Types

```typescript
renderer.keyInput.on("keypress", (key) => {
  // eventType: "press" | "release" | "repeat"
  if (key.eventType === "repeat") {
    // Key being held down
  }
})
```
