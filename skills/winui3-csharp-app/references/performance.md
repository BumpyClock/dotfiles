# Performance and Bindings

Use when diagnosing slow UI, jank, bindings, or large lists.

## Compiled bindings
- `{x:Bind}` runs faster and uses less memory than `{Binding}` because it generates compile-time code.
- `{x:Bind}` defaults to `OneTime`, while `{Binding}` defaults to `OneWay`. Use `OneWay` or `TwoWay` only when the UI must track changes.
- Use `x:DefaultBindMode` to set a consistent default for a subtree when using `{x:Bind}`.
- In `DataTemplate`, set `x:DataType` so `{x:Bind}` compiles and validates the binding path.

## Deferred UI with x:Load
- `x:Load` can reduce startup and memory; unloaded elements release memory and use a placeholder.
- Each `x:Load` element adds about 600 bytes of overhead, so apply it to heavy, infrequently shown UI.
- `x:Load` requires `x:Name` and only works on `UIElement` or `FlyoutBase`. It cannot be used on root elements, `DataTemplate`, `ResourceDictionary`, or loose `XamlReader.Load` content.
- Unloaded elements lose state; restore state via bindings or `Loaded` handlers.

## List virtualization and template cost
- UI virtualization is the most important improvement for large lists.
- Keep `ItemsPanel` as `ItemsStackPanel` or `ItemsWrapGrid`; avoid `StackPanel`, `WrapGrid`, and `VariableSizedWrapGrid` because they disable virtualization.
- Avoid unbounded panels (for example, `ScrollViewer` or auto-sized `Grid`) around virtualized lists; constrain size so virtualization can calculate the viewport.
- Minimize element count in `DataTemplate`; each element multiplies by item count.
- Use `ListViewItemPresenter` in custom templates to keep list performance stable.
- Use `x:Phase` to progressively render heavy visuals after the first pass.

## Performance fundamentals
- Optimize memory, disk footprint, power consumption, and responsiveness.
- Define key interaction scenarios and add ETW events so you can measure before and after changes.

Source pointers:
- https://learn.microsoft.com/en-us/windows/uwp/xaml-platform/x-bind-markup-extension
- https://learn.microsoft.com/en-us/windows/uwp/xaml-platform/x-load-attribute
- https://learn.microsoft.com/en-us/windows/uwp/debug-test-perf/optimize-gridview-and-listview
- https://learn.microsoft.com/en-us/windows/apps/design/best-practices
