# WinUI 3 skill research (2026-02-18)

## Sources
- https://learn.microsoft.com/windows/apps/winui/
- https://learn.microsoft.com/windows/apps/design/
- https://learn.microsoft.com/windows/apps/design/signature-experiences/design-principles
- https://learn.microsoft.com/windows/apps/design/ux/accessibility/
- https://learn.microsoft.com/windows/apps/design/ux/accessibility/keyboard-accessibility
- https://learn.microsoft.com/windows/apps/develop/platform/xaml/x-bind-markup-extension
- https://learn.microsoft.com/windows/apps/develop/xaml/x-load-attribute
- https://learn.microsoft.com/windows/apps/develop/controls/items-repeater
- https://learn.microsoft.com/windows/apps/develop/controls/items-view
- https://learn.microsoft.com/windows/apps/develop/controls/listview-and-gridview
- https://devblogs.microsoft.com/ifdef-windows/windows-app-sdk-1-5-performance-improvements/
- https://github.com/microsoft/WindowsAppSDK-Samples
- https://learn.microsoft.com/dotnet/communitytoolkit/windows/

## Findings to fold into winui3-csharp-app
- WinUI 3 runs on Windows 10 version 1809+ and Windows 11; link this in project-setup.
- `x:Bind` uses less time/memory than `Binding` and does not use `DataContext`; templates require `x:DataType` for `x:Bind`.
- `x:Load` can reduce load-time and memory; use it to defer heavy UI, but it has restrictions and per-element overhead.
- `ItemsRepeater` supports virtualization but does not include default UI or built-in focus/selection/accessibility.
- `ItemsView` is built on ItemsRepeater and adds selection/interaction with built-in accessibility.
- `ListView`/`GridView` include UI virtualization and container recycling; avoid disabling virtualization when customizing panels.
- Accessibility guidance: ensure keyboard access, meaningful focus order, access keys, and proper automation properties.
- WinUI design hub and design principles emphasize Fluent design and Windows-native UI cohesion.

## Potential skill updates
- Expand binding guidance with `x:Bind` constraints and performance notes.
- Expand performance guidance with `x:Load` caveats, ItemsRepeater tradeoffs, and virtualization warnings.
- Add accessibility guidance for keyboard/focus/automation properties.
- Add Fluent design guidance referencing design principles and WinUI usage.

## Applied in repo
- Consolidated references into `references/foundations.md`, `references/ui-ux.md`, `references/runtime.md`, and `references/performance.md`.
- Removed `references/index.md` and embedded the reference list in `SKILL.md`.
