# UI and UX

Use when building navigation, layout, visual polish, or accessibility.

## Navigation
- `NavigationView` is the standard top-level navigation control and adapts to different window sizes.
- Use `PaneDisplayMode=Top` for small top-level sets (about 5 or fewer items).
- Use `PaneDisplayMode=Left` for larger sets (roughly 5-10 items).
- `PaneDisplayMode=Auto` switches based on width; adjust `CompactModeThresholdWidth` and `ExpandedModeThresholdWidth` for custom breakpoints.
- The back button does not manage navigation for you; wire it to `Frame.GoBack()` and update `IsBackEnabled` based on `Frame.CanGoBack` on every navigation.
- Use `Frame.Navigate(typeof(Page), parameter)` to move between pages and pass data.
- Override `OnNavigatedTo` to read navigation parameters and set up page state.
- Use `NavigationCacheMode` if you need to preserve page state between navigations.

## Title bar
- Prefer the Windows App SDK `TitleBar` control (1.7+) for custom title bars.
- Set `ExtendsContentIntoTitleBar=true` and call `SetTitleBar(...)` with your title bar element.
- The `TitleBar` includes built-in Back and Pane toggle buttons; integrate with `NavigationView` by hiding the nav back/toggle buttons and handling `BackRequested`.

## Layout and interaction
- Test layouts across window sizes and DPI. WinUI handles per-monitor DPI scaling, but layouts still need validation.
- Use responsive layouts and ensure small windows can scroll or pan content.
- Prefer on-object commands (context menus, swipe, keyboard shortcuts) where appropriate.
- Ensure text content supports selection and copy/paste where it makes sense.

## System backdrop and materials
- Apply backdrops via `Window.SystemBackdrop`. Use Mica for long-lived app windows; use `DesktopAcrylicBackdrop` for transient surfaces.
- Check Mica/Acrylic support at runtime and provide a fallback for unsupported environments.
- For Mica, keep root backgrounds `Transparent` so the material shows through, and use `LayerFillColorDefaultBrush` for content layers.
- Mica falls back to solid colors when transparency is off, battery saver is on, hardware is low-end, or the window is inactive.
- Acrylic is GPU-intensive and is disabled in battery saver and when transparency is off. Avoid stacking multiple acrylic surfaces.
- Use in-app acrylic via `AcrylicBrush`; use background acrylic via `DesktopAcrylicBackdrop`. Avoid accent-colored text on acrylic and ensure contrast.

## Accessibility (baseline)
- Standard WinUI controls provide keyboard and UI Automation support; use them where possible.
- Provide accessible names for non-text elements via `AutomationProperties.Name` and related properties.
- Ensure every interactive element is reachable by Tab and has a visible focus indicator.
- Use `TabIndex` to match visual order and `IsTabStop=false` to remove elements from the tab sequence.
- Implement F6 navigation between major panes; it is not automatic.
- Provide access keys and keyboard accelerators, and expose them with the appropriate automation properties.

## Typography and iconography
- Prefer Segoe UI Variable and Segoe Fluent Icons to match Windows 11 styling.
- Use `AnimatedIcon` where it improves comprehension or feedback.

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
