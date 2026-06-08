# UI and UX

Use for navigation, layout, visual polish, accessibility.

## Navigation
- `NavigationView` = standard top-level nav; adapts to window sizes.
- `PaneDisplayMode=Top`: small top-level sets (about 5 or fewer items).
- `PaneDisplayMode=Left`: larger sets (roughly 5-10 items).
- `PaneDisplayMode=Auto` switches based on width; adjust `CompactModeThresholdWidth` and `ExpandedModeThresholdWidth` for custom breakpoints.
- Back button does not manage nav; wire to `Frame.GoBack()` and update `IsBackEnabled` from `Frame.CanGoBack` on every nav.
- Use `Frame.Navigate(typeof(Page), parameter)` to move pages + pass data.
- Override `OnNavigatedTo` for navigation params + page state.
- Use `NavigationCacheMode` to preserve page state between navs.

## Title bar
- Prefer Windows App SDK `TitleBar` (1.7+) for custom title bars.
- Set `ExtendsContentIntoTitleBar=true`; call `SetTitleBar(...)` with title bar element.
- `TitleBar` has built-in Back + Pane toggle buttons; integrate with `NavigationView` by hiding nav back/toggle buttons and handling `BackRequested`.

## Layout and interaction
- Test layouts across window sizes + DPI. WinUI handles per-monitor DPI; layout still needs validation.
- Use responsive layouts; small windows must scroll/pan content.
- Prefer on-object commands (context menus, swipe, keyboard shortcuts) where appropriate.
- Text content should support selection/copy/paste where useful.

## System backdrop and materials
- Apply backdrops via `Window.SystemBackdrop`. Mica for long-lived windows; `DesktopAcrylicBackdrop` for transient surfaces.
- Check Mica/Acrylic support at runtime; provide fallback.
- Mica: root backgrounds `Transparent`; content layers use `LayerFillColorDefaultBrush`.
- Mica falls back to solid colors when transparency off, battery saver on, hardware low-end, or window inactive.
- Acrylic is GPU-intensive; disabled in battery saver and when transparency off. Avoid stacking acrylic.
- In-app acrylic: `AcrylicBrush`; background acrylic: `DesktopAcrylicBackdrop`. Avoid accent-colored text on acrylic; ensure contrast.

## Accessibility (baseline)
- Standard WinUI controls provide keyboard + UI Automation; use them where possible.
- Non-text elements need accessible names via `AutomationProperties.Name` and related properties.
- Every interactive element: Tab reachable + visible focus indicator.
- Use `TabIndex` for visual order; `IsTabStop=false` removes from tab sequence.
- Implement F6 navigation between major panes; not automatic.
- Provide access keys + keyboard accelerators; expose with appropriate automation properties.

## Typography and iconography
- Prefer Segoe UI Variable + Segoe Fluent Icons for Windows 11 styling.
- Use `AnimatedIcon` where it improves comprehension/feedback.

Source pointers:
- https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/navigationview
- https://learn.microsoft.com/en-us/windows/apps/design/basics/navigate-between-two-pages
- https://learn.microsoft.com/en-us/windows/apps/winui/title-bar
- https://learn.microsoft.com/en-us/windows/apps/design/best-practices
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/system-backdrop-controller
- https://learn.microsoft.com/en-us/windows/apps/design/style/mica
- https://learn.microsoft.com/en-us/windows/apps/design/style/acrylic
- https://learn.microsoft.com/en-us/windows/apps/design/accessibility/overview
- https://learn.microsoft.com/en-us/windows/apps/design/accessibility/keyboard-accessibility
