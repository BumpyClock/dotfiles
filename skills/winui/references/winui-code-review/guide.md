---
name: winui-code-review
description: "Review WinUI 3 code quality: MVVM, x:Bind, accessibility, theming, security, performance. Use before commit to catch compiler/UI-test misses."
---

### When to Use

Run **after app builds, before commit**. Goal: catch issues compiler/UI tests miss: code that runs but is wrong, fragile, slow, inaccessible, or hard to maintain.

### How to Review

Read project XAML + C#. Check every section below.

`Microsoft.WindowsAppSDK.Analyzers` ships with `references/winui-dev-workflow/guide.md`. `BuildAndRun.ps1` injects it during build by writing temporary `Directory.Build.props` with analyzer DLL + `.targets`, then cleans up. Plain `dotnet build` or VS does **not** load it. For diagnostics outside script, add `<Analyzer Include="..." />` + `<Import Project="..." />` to project `Directory.Build.props` or wait for planned NuGet package.

Analyzer catches WinUI 3 / Windows App SDK issues by 4-digit ID:

* **WUI0xxx** — UWP → WinUI 3 API compatibility (`UwpXamlNamespace`, `Window.Current`, `CoreDispatcher`, `GetForCurrentView`)
* **WUI1xxx** — Migration-table data-driven hints (UWP API has WinAppSDK equivalent, no equivalent, feature-area hint)
* **WUI2xxx** — Runtime / layout / XAML pitfalls (raw `TabView` content, nested `x:Bind` without fallback, `x:Bind` without `Mode`, null `Converter`, missing `AutomationId`, attached-property syntax)
* **WUI3xxx** — MVVM patterns (old `[ObservableProperty]` field syntax)
* **WUI4xxx** — Interop (`WebView2` not initialized, removed ONNX Runtime GenAI APIs `WUI4101`-`WUI4103`)

All diagnostics are `Warning`, none `Error`, each with `helpLinkUri`. Suppress via `#pragma warning disable WUIxxxx` or `<NoWarn>`; analyzer `SuppressionTests` verify pragma suppression round-trips.

### MVVM Compliance

- [ ] ViewModels extend `ObservableObject`, use `[ObservableProperty]` partial properties (not fields)
- [ ] Commands use `[RelayCommand]` attribute, not manual `ICommand` implementations
- [ ] No UI types in ViewModels (`SolidColorBrush`, `Visibility`, `BitmapImage`) — these belong in converters or XAML
- [ ] No business logic in code-behind — only navigation, dialog coordination, and event wiring
- [ ] `async Task` for async methods, `async void` only for event handlers
- [ ] Never replace `ObservableCollection<T>` — use `.Clear()` + re-add

### x:Bind and Data Binding

- [ ] All bindings use `{x:Bind}`, not `{Binding}`
- [ ] `Mode=OneWay` or `TwoWay` set explicitly — `OneTime` default causes blank UI for dynamic data
- [ ] `x:DataType` set on every `DataTemplate` — required for compiled x:Bind
- [ ] No nested nullable paths (e.g., `ViewModel.Selected.Name`) without `FallbackValue`
- [ ] Command bindings can use OneTime (commands don't change) — don't add `Mode=OneWay` to `Command="{x:Bind}"`

### Accessibility

- [ ] `AutomationProperties.AutomationId` on every interactive control (Button, TextBox, ComboBox, ToggleSwitch, ListView, NavigationViewItem)
- [ ] `AutomationProperties.Name` on icon-only buttons and controls without visible text
- [ ] Semantic controls (`Button`, `HyperlinkButton`) — not clickable `Border`/`TextBlock`
- [ ] No information conveyed by color alone

### Theming

- [ ] All colors use `{ThemeResource}` brushes — no hardcoded `#FF0000` or `Color="Blue"`
- [ ] Typography uses built-in styles (`TitleTextBlockStyle`, `SubtitleTextBlockStyle`, `BodyTextBlockStyle`, `CaptionTextBlockStyle`) — no raw `FontSize`
- [ ] Spacing uses 4px grid multiples (4, 8, 12, 16, 24, 32, 48)
- [ ] Corner radius uses `ControlCornerRadius` / `OverlayCornerRadius` — not hardcoded values
- [ ] Styles referenced with `{StaticResource}` not `{ThemeResource}` (except for brush usage sites)

### Security

- [ ] No secrets, API keys, or tokens in source code
- [ ] No `Process.Start` with unsanitized user input
- [ ] External input validated and sanitized before use
- [ ] File paths from user input not used directly in `File.Delete` / `File.WriteAllText` without validation

### Performance

- [ ] Long or dynamic lists use `ListView`/`GridView` (virtualized), not `StackPanel` with `foreach`
- [ ] `x:Load` for content that's not always visible (e.g., dialogs, secondary panels)
- [ ] Heavy work off UI thread via `Task.Run` or `async/await` — never block UI
- [ ] No `.Result` / `.Wait()` / `.GetAwaiter().GetResult()` — these deadlock the UI thread
- [ ] `using` statements on all disposable objects (`Model`, `Tokenizer`, `InferenceSession`, `Generator`)

### Globalization

- [ ] User-facing strings use `x:Uid` in XAML and `ResourceLoader` in C# — not hardcoded
- [ ] String resources in `Strings/en-us/Resources.resw` (not `.resx`)
- [ ] Date/number formatting uses `CultureInfo.CurrentCulture` — not hardcoded formats
- [ ] Layout supports RTL (`FlowDirection` inherited from root, no absolute positioning that breaks in RTL)
- [ ] No string concatenation for user-facing messages — use `string.Format` or interpolation with resource strings

### Review Report

After review, report:
1. **Issues found:** file, line, problem
2. **Severity:** Error (must fix), Warning (should fix), Note (could improve)
3. **Suggested fixes:** exact code changes

### References

Detailed rules + examples: `references/quality-rules.md` for x:Phase, layout optimization, PasswordVault, DPAPI, WebView2 hardening, keyboard nav, screen readers, `.editorconfig`, naming, x:Uid, RTL, pluralization.
