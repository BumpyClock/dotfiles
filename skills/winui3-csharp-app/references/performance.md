# Performance and Bindings

Use for slow UI, jank, bindings, large lists.

## Compiled bindings
- `{x:Bind}` faster + lower memory than `{Binding}` because compile-time code.
- `{x:Bind}` defaults `OneTime`; `{Binding}` defaults `OneWay`. Use `OneWay`/`TwoWay` only when UI must track changes.
- Use `x:DefaultBindMode` for subtree default with `{x:Bind}`.
- In `DataTemplate`, set `x:DataType` so `{x:Bind}` compiles + validates path.

## Deferred UI with x:Load
- `x:Load` can reduce startup/memory; unloaded elements release memory and use placeholder.
- Each `x:Load` element adds about 600 bytes overhead; use on heavy, rarely shown UI.
- `x:Load` requires `x:Name`; works only on `UIElement` or `FlyoutBase`. Not root elements, `DataTemplate`, `ResourceDictionary`, or loose `XamlReader.Load` content.
- Unloaded elements lose state; restore via bindings or `Loaded` handlers.

## List virtualization and template cost
- Large lists: UI virtualization first.
- Keep `ItemsPanel` as `ItemsStackPanel` or `ItemsWrapGrid`; avoid `StackPanel`, `WrapGrid`, `VariableSizedWrapGrid` because they disable virtualization.
- Avoid unbounded panels (`ScrollViewer`, auto-sized `Grid`) around virtualized lists; constrain size so virtualization can calculate viewport.
- Minimize `DataTemplate` elements; every element multiplies by item count.
- Use `ListViewItemPresenter` in custom templates for stable list perf.
- Use `x:Phase` to progressively render heavy visuals after first pass.

## Performance fundamentals
- Optimize memory, disk footprint, power, responsiveness.
- Define key interaction scenarios; add ETW events to measure before/after.

Source pointers:
- https://learn.microsoft.com/en-us/windows/uwp/xaml-platform/x-bind-markup-extension
- https://learn.microsoft.com/en-us/windows/uwp/xaml-platform/x-load-attribute
- https://learn.microsoft.com/en-us/windows/uwp/debug-test-perf/optimize-gridview-and-listview
- https://learn.microsoft.com/en-us/windows/apps/design/best-practices
