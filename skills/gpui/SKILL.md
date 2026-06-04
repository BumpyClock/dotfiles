---
name: gpui
description: "GPUI components: styling, actions/shortcuts, async, contexts, entities, events, focus, global state, testing, stories/docs, PR descriptions."
---

# GPUI Unified Skill

## Summary

- Build GPUI components following existing `crates/ui` patterns + style guide. Keep APIs consistent, builder-style.
- Stateless vs stateful: deliberate choice. Use `Entity<T>` for stateful patterns, notify on updates.
- Styling: `StyleRefinement`, `Styled`, fluent builders, theme tokens.
- Actions/focus: wire explicitly with `key_context`, `actions!`, `FocusHandle`.
- Stories/docs: mirror `crates/story` and `docs` patterns.
- Tests: `TestAppContext` for non-visual logic, `VisualTestContext` for window/rendering.

## Component Build Steps

1. **Decide type**: stateless element for pure presentation; stateful element + `Entity<State>` when UI state persists.
2. **Struct layout**: `id: ElementId`, `base: Div`, `style: StyleRefinement`. Field order: identity → config → content/children → callbacks. Callbacks as `Option<Rc<dyn Fn(...)>>`.
3. **Builder API**: return `Self` from setters (`label`, `on_click`, `disabled`). Keep naming consistent with existing components.
4. **Traits**: `InteractiveElement`, `StatefulInteractiveElement` (when stateful), `Styled`, `RenderOnce`. Add `Sizable`/`Selectable`/`Disableable` when appropriate.
5. **Render**: `cx.theme()` for colors/tokens. Compose with fluent builders (`flex`, `gap`, `items_center`, `rounded`). `RenderOnce` focused, no side effects.
6. **State/async**: `WeakEntity` in closures to avoid retain cycles. `cx.spawn` foreground, `cx.background_spawn` heavy work. Sequence entity updates, don't nest.
7. **Actions/focus/events**: `actions!` or `#[derive(Action)]`. `cx.bind_keys()`, `key_context()` on root. `FocusHandle` + `track_focus()`. `cx.emit`/`cx.subscribe`/`cx.observe`.
8. **Stories/docs/tests**: stories follow `crates/story/src/stories` with `section!`. Docs follow `docs/*.md`. Tests: `TestAppContext` logic, `VisualTestContext` window/rendering.

## Task Routing

- New components/refactors → `references/style-guide.md` + `references/new-component.md` (+ `references/layout-and-style.md` as needed)
- Component stories → `references/generate-component-story.md`
- Component docs → `references/generate-component-documentation.md`
- Actions/key bindings → `references/actions.md`
- Async/background work → `references/async.md`
- Context/window/entity → `references/context.md`
- Entity state → `references/entity.md`
- Events/subscriptions/observers → `references/event.md`
- Focus/keyboard nav → `references/focus-handle.md`
- Global state → `references/global.md`
- Tests → `references/test.md`, `references/test-reference.md`, `references/test-examples.md`, `references/component-test-rules.md`
- PR descriptions → `references/github-pull-request-description.md`

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
