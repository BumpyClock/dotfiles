---
name: gpui
description: GPUI component development, styling, actions/shortcuts, async/background work, contexts, entities, events, focus handling, global state, testing, component stories/docs, and GPUI PR descriptions. Use when implementing or reviewing GPUI UI components, writing stories/docs, adding actions/keybindings, coordinating async/UI state, or producing GPUI-specific guidance.
---

# GPUI Unified Skill

## Consolidated Summary

- Build GPUI components by following existing `crates/ui` patterns and the style guide; keep APIs consistent and builder-style.
- Choose stateless vs stateful components deliberately; use `Entity<T>` for stateful patterns and notify on updates.
- Use GPUI styling primitives (`StyleRefinement`, `Styled`, fluent builders) and theme tokens for visual consistency.
- Wire actions and focus explicitly with `key_context`, `actions!`, and `FocusHandle` patterns.
- Write stories and docs that mirror existing story/doc patterns in `crates/story` and `docs`.
- Test with `TestAppContext` for non-visual logic and `VisualTestContext` for window/rendering behavior.

## Component Build Guidance

### 1) Decide component type

- Use a stateless element for pure presentation.
- Use a stateful element when UI state must persist or be shared; store an `Entity<State>`.

### 2) Use the standard struct layout

- Include identity and styling fields: `id: ElementId`, `base: Div`, `style: StyleRefinement`.
- Group fields in this order: identity → configuration → content/children → callbacks.
- Store callbacks as `Option<Rc<dyn Fn(...)>>` for cheap cloning.

### 3) Provide builder-style API

- Return `Self` from setters (e.g., `label`, `on_click`, `disabled`).
- Keep naming and API surface consistent with existing components.

### 4) Implement required traits

- `InteractiveElement` for interactivity
- `StatefulInteractiveElement` when stateful
- `Styled` for `style()` access
- `RenderOnce` for rendering
- Add `Sizable`, `Selectable`, `Disableable` when appropriate

### 5) Render with theme + layout primitives

- Use `cx.theme()` for colors and tokens.
- Compose layout with fluent builders (`flex`, `gap`, `items_center`, `rounded`, etc.).
- Keep `RenderOnce` focused and avoid side effects.

### 6) Handle state and async safely

- Use `WeakEntity` in closures to avoid retain cycles.
- Use `cx.spawn` for foreground async and `cx.background_spawn` for heavy work.
- Avoid nested entity updates; sequence updates instead.

### 7) Wire actions, focus, and events

- Define actions with `actions!` or `#[derive(Action)]`.
- Bind keys with `cx.bind_keys()` and set `key_context()` on the root element.
- Track focus with `FocusHandle` and `track_focus()` where needed.
- Use `cx.emit`, `cx.subscribe`, and `cx.observe` for event-driven patterns.

### 8) Add stories, docs, and tests

- Stories: follow `crates/story/src/stories` structure with `section!` groups.
- Docs: follow `docs/*.md` patterns and link API references when appropriate.
- Tests: use `TestAppContext` for logic, `VisualTestContext` for window/rendering; follow component test rules.

## Task Routing

- For new components or component refactors, read `references/style-guide.md` and `references/new-component.md`; pull in `references/layout-and-style.md` as needed.
- For component stories, read `references/generate-component-story.md`.
- For component documentation, read `references/generate-component-documentation.md`.
- For actions and key bindings, read `references/actions.md`.
- For async/background work, read `references/async.md`.
- For context usage and window/entity operations, read `references/context.md`.
- For entity state patterns, read `references/entity.md`.
- For events, subscriptions, and observers, read `references/event.md`.
- For focus management and keyboard navigation, read `references/focus-handle.md`.
- For global state, read `references/global.md`.
- For tests, read `references/test.md`, `references/test-reference.md`, `references/test-examples.md`, and `references/component-test-rules.md`.
- For PR descriptions, read `references/github-pull-request-description.md`.

## Workflow

1. Identify the task category and load the matching reference files.
2. Prefer existing patterns in the GPUI codebase (`crates/ui`, `crates/story`) before introducing new patterns.
3. Keep changes minimal and consistent with the style guide.
4. For tests, choose `TestAppContext` vs `VisualTestContext` based on whether windows/rendering are required.

## Reference Index

- `references/actions.md` — actions, key bindings, key contexts
- `references/async.md` — async tasks, background work, task lifetimes
- `references/context.md` — App/Window/Context/AsyncApp usage
- `references/entity.md` — entity state, weak refs, update patterns
- `references/event.md` — events, subscriptions, observers
- `references/focus-handle.md` — focus handles, keyboard navigation
- `references/global.md` — global state and shared services
- `references/layout-and-style.md` — layout, styling, theming
- `references/style-guide.md` — component structure and API conventions
- `references/new-component.md` — component creation checklist
- `references/generate-component-story.md` — story patterns
- `references/generate-component-documentation.md` — documentation patterns
- `references/test.md` — GPUI test framework overview
- `references/test-reference.md` — detailed test patterns
- `references/test-examples.md` — testing best practices and commands
- `references/component-test-rules.md` — component-specific test rules
- `references/github-pull-request-description.md` — PR description format
