# Code & Diff Components

Components for displaying code w/ syntax highlighting + diffs in OpenTUI.

## Code Component

Display syntax-highlighted code blocks.

### Basic Usage

```tsx
// React
<code
  code={`function hello() {
  console.log("Hello, World!");
}`}
  language="typescript"
/>

// Solid
<code
  code={sourceCode}
  language="javascript"
/>

// Core
const codeBlock = new CodeRenderable(renderer, {
  id: "code",
  code: sourceCode,
  language: "typescript",
})
```

### Supported Languages

OpenTUI uses Tree-sitter for highlighting. Common langs:
- `typescript`, `javascript`
- `python`
- `rust`
- `go`
- `json`
- `html`, `css`
- `markdown`
- `bash`, `shell`

### Styling

```tsx
<code
  code={sourceCode}
  language="typescript"
  backgroundColor="#1a1a2e"
  showLineNumbers
/>
```

### onHighlight Callback

Intercept + modify highlights pre-render:

```tsx
// Core
const codeBlock = new CodeRenderable(renderer, {
  id: "code",
  code: sourceCode,
  language: "typescript",
  onHighlight: (highlights, context) => {
    // Add custom highlights
    highlights.push([10, 20, "custom.error", {}])
    return highlights
  },
})

// React/Solid
<code
  code={sourceCode}
  language="typescript"
  onHighlight={(highlights, context) => {
    // context: { content, filetype, syntaxStyle }
    // Modify and return highlights array
    return highlights.filter(h => h[2] !== "comment")
  }}
/>
```

**Callback signature:**
- `highlights: SimpleHighlight[]` - array of `[start, end, scope, metadata]`
- `context: { content, filetype, syntaxStyle }` - highlight context
- Return modified highlights or `undefined` → use original

Supports async callbacks for fetching extra highlight data.

## Line Number Component

Code display w/ line numbers, highlighting, diagnostics.

### Basic Usage

```tsx
// React
<line-number
  code={sourceCode}
  language="typescript"
/>

// Solid (note underscore)
<line_number
  code={sourceCode}
  language="typescript"
/>

// Core
const codeView = new LineNumberRenderable(renderer, {
  id: "code-view",
  code: sourceCode,
  language: "typescript",
})
```

### Line Number Options

```tsx
// React
<line-number
  code={sourceCode}
  language="typescript"
  startLine={1}              // Starting line number
  showLineNumbers={true}     // Display line numbers
/>

// Solid
<line_number
  code={sourceCode}
  language="typescript"
  startLine={1}
  showLineNumbers={true}
/>
```

### Line Highlighting

Highlight specific lines:

```tsx
// React
<line-number
  code={sourceCode}
  language="typescript"
  highlightedLines={[5, 10, 15]}  // Highlight these lines
/>

// Solid
<line_number
  code={sourceCode}
  language="typescript"
  highlightedLines={[5, 10, 15]}
/>
```

### Diagnostics

Show errors/warnings/info per line:

```tsx
// React
<line-number
  code={sourceCode}
  language="typescript"
  diagnostics={[
    { line: 3, severity: "error", message: "Unexpected token" },
    { line: 7, severity: "warning", message: "Unused variable" },
    { line: 12, severity: "info", message: "Consider using const" },
  ]}
/>

// Solid
<line_number
  code={sourceCode}
  language="typescript"
  diagnostics={[
    { line: 3, severity: "error", message: "Unexpected token" },
  ]}
/>
```

**Severity levels:**
- `error` - red
- `warning` - yellow
- `info` - blue
- `hint` - gray

### Diff Highlighting

Show added/removed lines:

```tsx
<line-number
  code={sourceCode}
  language="typescript"
  addedLines={[5, 6, 7]}      // Green background
  removedLines={[10, 11]}     // Red background
/>
```

## Diff Component

Unified/split diff viewer w/ syntax highlighting.

### Basic Usage

```tsx
// React
<diff
  oldCode={originalCode}
  newCode={modifiedCode}
  language="typescript"
/>

// Solid
<diff
  oldCode={originalCode}
  newCode={modifiedCode}
  language="typescript"
/>

// Core
const diffView = new DiffRenderable(renderer, {
  id: "diff",
  oldCode: originalCode,
  newCode: modifiedCode,
  language: "typescript",
})
```

### Display Modes

```tsx
// Unified diff (default)
<diff
  oldCode={old}
  newCode={new}
  mode="unified"
/>

// Split/side-by-side diff
<diff
  oldCode={old}
  newCode={new}
  mode="split"
/>
```

### Options

```tsx
<diff
  oldCode={originalCode}
  newCode={modifiedCode}
  language="typescript"
  mode="unified"
  showLineNumbers
  context={3}                // Lines of context around changes
/>
```

### Styling

```tsx
<diff
  oldCode={old}
  newCode={new}
  addedLineColor="#2d4f2d"   // Background for added lines
  removedLineColor="#4f2d2d" // Background for removed lines
  unchangedLineColor="transparent"
/>
```

## Markdown Component

Render markdown w/ syntax-highlighted code blocks.

### Basic Usage

```tsx
// React
<markdown
  content={markdownText}
  syntaxStyle={mySyntaxStyle}
/>

// Solid
<markdown
  content={markdownText}
  syntaxStyle={mySyntaxStyle}
/>

// Core
import { MarkdownRenderable } from "@opentui/core"

const md = new MarkdownRenderable(renderer, {
  id: "markdown",
  content: "# Hello\n\nThis is **markdown**.",
  syntaxStyle: mySyntaxStyle,
})
```

### Options

```tsx
<markdown
  content={markdownText}
  syntaxStyle={syntaxStyle}
  treeSitterClient={client}  // Optional: custom tree-sitter client
  conceal={true}             // Hide markdown syntax characters
  streaming={true}           // Enable streaming mode for incremental updates
/>
```

### Custom Node Rendering

```tsx
// Core
const md = new MarkdownRenderable(renderer, {
  id: "markdown",
  content: "# Custom Heading",
  syntaxStyle,
  renderNode: (node, ctx, defaultRender) => {
    if (node.type === "heading") {
      // Return custom renderable for headings
      return new TextRenderable(ctx, {
        content: `>> ${node.content} <<`,
      })
    }
    return null // Use default rendering
  },
})
```

### Streaming Mode

For realtime content (e.g. LLM output):

```tsx
const [content, setContent] = useState("")

// Append text as it arrives
useEffect(() => {
  llmStream.on("token", (token) => {
    setContent(c => c + token)
  })
}, [])

<markdown
  content={content}
  syntaxStyle={syntaxStyle}
  streaming={true}  // Optimizes for incremental updates
/>
```

## Use Cases

### Code Editor

```tsx
function CodeEditor() {
  const [code, setCode] = useState(`function hello() {
  console.log("Hello!");
}`)
  
  return (
    <box flexDirection="column" height="100%">
      <box height={1}>
        <text>editor.ts</text>
      </box>
      <textarea
        value={code}
        onChange={setCode}
        language="typescript"
        showLineNumbers
        flexGrow={1}
        focused
      />
    </box>
  )
}
```

### Code Review

```tsx
function CodeReview({ oldCode, newCode }) {
  return (
    <box flexDirection="column" height="100%">
      <box height={1} backgroundColor="#333">
        <text>Changes in src/utils.ts</text>
      </box>
      <diff
        oldCode={oldCode}
        newCode={newCode}
        language="typescript"
        mode="split"
        showLineNumbers
      />
    </box>
  )
}
```

### Syntax-Highlighted Preview

```tsx
function MarkdownPreview({ content }) {
  // Extract code blocks from markdown
  const codeBlocks = extractCodeBlocks(content)
  
  return (
    <scrollbox height={20}>
      {codeBlocks.map((block, i) => (
        <box key={i} marginBottom={1}>
          <code
            code={block.code}
            language={block.language}
          />
        </box>
      ))}
    </scrollbox>
  )
}
```

### Error Display

```tsx
function ErrorView({ errors, code }) {
  const diagnostics = errors.map(err => ({
    line: err.line,
    severity: "error",
    message: err.message,
  }))
  
  return (
    <line-number
      code={code}
      language="typescript"
      diagnostics={diagnostics}
      highlightedLines={errors.map(e => e.line)}
    />
  )
}
```

## Gotchas

### Solid Uses Underscores

```tsx
// React
<line-number />

// Solid
<line_number />
```

### Language Required for Highlighting

```tsx
// No highlighting (plain text)
<code code={text} />

// With highlighting
<code code={text} language="typescript" />
```

### Large Files

For very large files:
- Pagination or virtual scrolling
- Load only visible portion
- Wrap w/ `scrollbox`

```tsx
<scrollbox height={30}>
  <line-number
    code={largeFile}
    language="typescript"
  />
</scrollbox>
```

### Tree-sitter Loading

Highlighting requires Tree-sitter grammars. If broken:

1. Check lang supported
2. Verify grammars installed
3. Check `OTUI_TREE_SITTER_WORKER_PATH` if custom path
