---
name: winui3-csharp-app
description: Build, refactor, or troubleshoot WinUI 3 / Windows App SDK apps in C# and XAML. Use when creating pages, bindings, MVVM view models, navigation, threading fixes, system backdrops (Mica/Acrylic), or packaging guidance.
context: fork
model : claude-opus-4-5
---

# WinUI 3 C# App

## Overview
Build or refactor WinUI 3 apps with Windows App SDK. Focus: app structure, XAML, MVVM, bindings, navigation, threading, system backdrops. Keep behavior stable unless asked to change it.

## Workflow Decision Tree
1) New app? -> follow Quick Start (New)
2) Existing app? -> follow Quick Start (Existing)
3) Need details? -> open `references/index.md`, then targeted reference

## Core Rules
- Prefer Windows App SDK / WinUI APIs over custom hacks.
- Keep code-behind thin (view glue only).
- Prefer `x:Bind` for typed bindings; use `Binding` for dynamic DataContext.
- UI thread access via `DispatcherQueue`.
- System backdrops: `Window.SystemBackdrop` first; fall back if unsupported.

## Quick Start (New)
1) Create WinUI 3 Blank App, Packaged.
2) Add ViewModel, implement `INotifyPropertyChanged`.
3) Set `DataContext` and expose `ViewModel` property for `x:Bind`.
4) Build layout with `Grid`/`StackPanel`.
5) Wire commands via `RelayCommand`/`AsyncRelayCommand`.
6) Add navigation if multi-page.


## Quick Start (Existing)
1) Inspect XAML + code-behind for binding mode / DataContext mistakes.
2) Move logic to ViewModel; keep UI glue in code-behind.
3) Check threading: UI updates on UI thread only.
4) Validate system backdrop usage and fallbacks.

## References
- `project-setup.md` -> create WinUI 3 project, packaging notes
- `community-toolkit.md` -> Windows Community Toolkit + MVVM Toolkit usage
- `mvvm.md` -> ViewModel patterns, `INotifyPropertyChanged`, commands
- `binding-xbind.md` -> `x:Bind` vs `Binding`, modes, templates
- `threading.md` -> UI thread, `DispatcherQueue`, STA vs ASTA notes
- `system-backdrop.md` -> Mica/Acrylic, `Window.SystemBackdrop`, fallbacks
- `navigation.md` -> Frame + NavigationView patterns
