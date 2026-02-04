# Binding and x:Bind

Use when working with bindings.

Key rules
- `x:Bind` is compile-time, typed, faster.
- Default mode for `x:Bind` is `OneTime`; set `Mode=OneWay/TwoWay` when updates needed.
- `x:Bind` does not use `DataContext`. Expose a `ViewModel` property on the page/control.
- Use `Binding` for dynamic DataContext or runtime-typed data.
- In templates with `x:Bind`, set `x:DataType`.

Source pointers:
- https://learn.microsoft.com/en-us/windows/apps/develop/data-binding/data-binding-overview
- https://learn.microsoft.com/en-us/windows/apps/develop/platform/xaml/x-bind-markup-extension
