---
name: winui3-csharp-app
description: |
  Build, refactor, or troubleshoot WinUI 3 / Windows App SDK desktop apps in C# and XAML. Use when requests mention WinUI, WinUI 3, Windows App SDK/WinAppSDK, XAML desktop apps, MVVM/ViewModels, bindings, navigation, threading, system backdrops (Mica/Acrylic), windowing/multi-window, packaging/deployment, or WinUI 3 performance.
---

# WinUI 3 C# App

## Workflow
1. Classify the task: new app, existing app, or specific issue.
2. For new app work, follow Quick Start (New).
3. For existing app work, follow Quick Start (Existing).
4. Use the Reference Index to open the right topic file.

## Core Rules
- Prefer Windows App SDK / WinUI APIs over custom interop.
- Keep code-behind as view glue; move state/logic to ViewModels.
- Prefer `x:Bind` for typed bindings; use `Binding` for dynamic DataContext.
- Marshal UI work through `DispatcherQueue`.
- Apply system backdrops via `Window.SystemBackdrop` and provide a fallback.
- Keep behavior stable unless explicitly asked to change it.
- When choosing architecture, packaging, or libraries, present 2–3 options with tradeoffs and a recommendation.

## Scope
- In scope: WinUI 3 / Windows App SDK desktop apps in C# and XAML, MVVM, navigation, windowing, packaging, and performance.
- Out of scope: WPF, UWP, WinForms, or C++/WinRT unless explicitly requested.

## Reference Index
- `references/foundations.md` -> project setup, release channels, MVVM/tooling, threading migration
- `references/ui-ux.md` -> navigation, layout, title bar, backdrops, accessibility
- `references/design-fluent.md` -> Fluent design principles and UX polish
- `references/windowing.md` -> AppWindow, multi-window, dialogs, pickers
- `references/performance.md` -> bindings, x:Load, list virtualization, perf basics

## Quick Start (New)
1. Decide packaging and target framework; document constraints.
2. Choose architecture: code-behind for small apps, MVVM Toolkit for larger apps.
3. Create a ViewModel and expose it for `x:Bind`.
4. Build layout with `Grid`/`StackPanel`.
5. Wire commands via `RelayCommand`/`AsyncRelayCommand`.
6. Add navigation if multi-page.

## Quick Start (Existing)
1. Audit binding modes and `DataContext`; fix `x:Bind` vs `Binding` mismatches.
2. Move logic to ViewModels; keep code-behind thin.
3. Fix threading: UI updates on UI thread via `DispatcherQueue`.
4. Validate system backdrop usage and fallbacks.
5. Check dialogs, pickers, and multi-window behavior in `references/windowing.md`.
