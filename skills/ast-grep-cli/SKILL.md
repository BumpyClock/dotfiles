---
name: ast-grep-cli
description: Write ast-grep rules for structural code search/analysis with AST patterns. Use when user asks to find code patterns, language constructs, or structural characteristics beyond text search.
---

# ast-grep Code Search

## Overview

NL query -> ast-grep rule. Matches AST structure, not raw text. Better precision on big repos.

## When to Use

User wants:
- Structural match (ex: "async fns without error handling")
- Specific language construct (ex: "call sites with specific params")
- Query needing code structure, not text grep
- AST-shape-specific search
- Complex query text search cannot do

## Workflow

### 1) Understand Query

Get exact target. Ask if needed: pattern/structure? language? edge cases/variants? include/exclude?

### 2) Create Example Code

Write small snippet of wanted match. Save temp file for tests.

**Example:** searching "async functions that use await":

```javascript
// test_example.js
async function example() {
  const result = await fetchData();
  return result;
}
```

### 3) Write ast-grep Rule

Map target -> rule. Start simple. Add complexity only when needed.

**Key rules:**
- Always use `stopBy: end` in relational rules (`inside`, `has`) so traversal reaches direction end
- Use `pattern` for simple structures
- Use `kind` with `has`/`inside` for complex structures
- Split complex queries with `all`, `any`, `not`

**Example rule file (test_rule.yml):**
```yaml
id: async-with-await
language: javascript
rule:
  kind: function_declaration
  has:
    pattern: await $EXPR
    stopBy: end
```

See `references/rule_reference.md` for full rule docs.

### 4) Test Rule

Verify rule matches example.

**Option A: inline rules (fast iterate)**
```bash
echo "async function test() { await fetch(); }" | ast-grep scan --inline-rules "id: test
language: javascript
rule:
  kind: function_declaration
  has:
    pattern: await \$EXPR
    stopBy: end" --stdin
```

**Option B: rule file (better for complex rules)**
```bash
ast-grep scan --rule test_rule.yml test_example.js
```

**If no match, debug order:**
1. Simplify rule (remove sub-rules)
2. Add `stopBy: end` to relational rules if missing
3. Use `--debug-query` to inspect AST (below)
4. Check `kind` values for language

### 5) Search Codebase

After test passes, run on real repo.

**Simple pattern search:**
```bash
ast-grep run --pattern 'console.log($ARG)' --lang javascript /path/to/project
```

**Complex rule search:**
```bash
ast-grep scan --rule my_rule.yml /path/to/project
```

**Inline rules (no file):**
```bash
ast-grep scan --inline-rules "id: my-rule
language: javascript
rule:
  pattern: \$PATTERN" /path/to/project
```

## CLI Commands

### Inspect Structure (`--debug-query`)

Dump parse structure. See how code/pattern parses.

```bash
ast-grep run --pattern 'async function example() { await fetch(); }' \
  --lang javascript \
  --debug-query=cst
```

**Formats:**
- `cst`: Concrete Syntax Tree (includes punctuation)
- `ast`: Abstract Syntax Tree (named nodes only)
- `pattern`: ast-grep interpretation of pattern

**Use for:**
- Find right node `kind`
- Understand target code shape
- Debug non-matching patterns

**Examples:**
```bash
# See target code structure
ast-grep run --pattern 'class User { constructor() {} }' \
  --lang javascript \
  --debug-query=cst

# See pattern interpretation
ast-grep run --pattern 'class $NAME { $$$BODY }' \
  --lang javascript \
  --debug-query=pattern
```

### Test Rules (`scan --stdin`)

Test rule on snippet, no files.

```bash
echo "const x = await fetch();" | ast-grep scan --inline-rules "id: test
language: javascript
rule:
  pattern: await \$EXPR" --stdin
```

**Structured output:**
```bash
echo "const x = await fetch();" | ast-grep scan --inline-rules "..." --stdin --json
```

### Search with Patterns (`run`)

Simple pattern search, single AST-node matches.

```bash
# Basic pattern search
ast-grep run --pattern 'console.log($ARG)' --lang javascript .

# Search specific files
ast-grep run --pattern 'class $NAME' --lang python /path/to/project

# JSON output for tooling
ast-grep run --pattern 'function $NAME($$$)' --lang javascript --json .
```

**Use when:**
- Simple single-node matches
- Quick search without complex logic
- No relational rules needed (`inside`/`has`)

### Search with Rules (`scan`)

YAML rule search, complex structural queries.

```bash
# With rule file
ast-grep scan --rule my_rule.yml /path/to/project

# With inline rules
ast-grep scan --inline-rules "id: find-async
language: javascript
rule:
  kind: function_declaration
  has:
    pattern: await \$EXPR
    stopBy: end" /path/to/project

# JSON output
ast-grep scan --rule my_rule.yml --json /path/to/project
```

**Use when:**
- Complex structural search
- Relational rules (`inside`, `has`, `precedes`, `follows`)
- Composite logic (`all`, `any`, `not`)
- Full YAML rule power needed

**Tip:** For relational rules (`inside`/`has`), always add `stopBy: end` for full traversal.

## Rule Writing Tips

### Always Use `stopBy: end`

In relational rules, use `stopBy: end` unless strong reason not.

```yaml
has:
  pattern: await $EXPR
  stopBy: end
```

Reason: traverse whole subtree, not stop at first non-match.

### Start Simple, Then Add

1. Try `pattern`
2. If needed, use `kind`
3. Add relational rules (`has`, `inside`)
4. Add composite logic (`all`, `any`, `not`)

### Pick Right Rule Type

- **Pattern**: direct simple match (ex `console.log($ARG)`)
- **Kind + Relational**: complex structure (ex "function containing await")
- **Composite**: logic combos (ex "function with await but no try-catch")

### Debug with AST Inspection

If no match:
1. `--debug-query=cst` for real structure
2. Check metavariable detection
3. Verify node `kind`
4. Verify relational direction/search scope

### Escaping Inline Rules

Shell expands `$` in `--inline-rules`. Escape it.
- `\$VAR` instead of `$VAR`
- Or single quotes where possible: `'$VAR'`

**Example:**
```bash
# Correct: escaped $
ast-grep scan --inline-rules "rule: {pattern: 'console.log(\$ARG)'}" .

# Or use single quotes
ast-grep scan --inline-rules 'rule: {pattern: "console.log($ARG)"}' .
```

## Common Use Cases

### Find Functions with Specific Content

Async fns using await:
```bash
ast-grep scan --inline-rules "id: async-await
language: javascript
rule:
  all:
    - kind: function_declaration
    - has:
        pattern: await \$EXPR
        stopBy: end" /path/to/project
```

### Find Code Inside Specific Context

`console.log` inside class methods:
```bash
ast-grep scan --inline-rules "id: console-in-class
language: javascript
rule:
  pattern: console.log(\$\$\$)
  inside:
    kind: method_definition
    stopBy: end" /path/to/project
```

### Find Missing Expected Pattern

Async fns without try-catch:
```bash
ast-grep scan --inline-rules "id: async-no-trycatch
language: javascript
rule:
  all:
    - kind: function_declaration
    - has:
        pattern: await \$EXPR
        stopBy: end
    - not:
        has:
          pattern: try { \$\$\$ } catch (\$E) { \$\$\$ }
          stopBy: end" /path/to/project
```

## Resources

### `references/`

- `rule_reference.md`: atomic, relational, composite rules + metavariables

Load when detailed syntax needed.
