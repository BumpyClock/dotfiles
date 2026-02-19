# WinUI 3 reference updates (2026-02-18)

## Sources
- https://learn.microsoft.com/en-us/windows/apps/tutorials/winui-notes/intro
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/support
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/release-channels
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/release-notes/windows-app-sdk-1-8
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/release-notes/windows-app-sdk-1-7
- https://learn.microsoft.com/en-us/windows/apps/winui/winui3/
- https://learn.microsoft.com/en-us/windows/apps/design/
- https://learn.microsoft.com/en-us/windows/apps/design/design-principles
- https://learn.microsoft.com/en-us/windows/apps/design/best-practices
- https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/navigationview
- https://learn.microsoft.com/en-us/windows/apps/design/basics/navigate-between-two-pages
- https://learn.microsoft.com/en-us/windows/apps/winui/title-bar
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/system-backdrop-controller
- https://learn.microsoft.com/en-us/windows/apps/design/style/mica
- https://learn.microsoft.com/en-us/windows/apps/design/style/acrylic
- https://learn.microsoft.com/en-us/windows/apps/design/accessibility/overview
- https://learn.microsoft.com/en-us/windows/apps/design/accessibility/keyboard-accessibility
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/windowing/manage-app-windows
- https://learn.microsoft.com/en-us/windows/apps/design/controls/dialogs-and-flyouts/dialogs
- https://learn.microsoft.com/en-us/windows/apps/develop/files/using-file-folder-pickers
- https://learn.microsoft.com/en-us/windows/uwp/xaml-platform/x-bind-markup-extension
- https://learn.microsoft.com/en-us/windows/uwp/xaml-platform/x-load-attribute
- https://learn.microsoft.com/en-us/windows/uwp/debug-test-perf/optimize-gridview-and-listview
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/migrate-to-windows-app-sdk/guides/threading
- https://learn.microsoft.com/en-us/dotnet/communitytoolkit/mvvm/
- https://learn.microsoft.com/en-us/dotnet/communitytoolkit/windows/getting-started
- https://github.com/CommunityToolkit/Windows
- https://github.com/microsoft/TemplateStudio
- https://github.com/dotMorten/WinUIEx

## Findings to fold into references
- Release channels: Stable, Preview, Experimental. As of February 10, 2026, Stable is 1.8.5 and 1.7 is in Maintenance.
- Windows App SDK 1.8 uses a NuGet metapackage; default behavior is equivalent to `WindowsAppSDKSelfContained=true` unless you reference framework packages.
- MVVM Toolkit includes ObservableObject/Recipient/Validator, RelayCommand/AsyncRelayCommand, IMessenger implementations, and Ioc helpers.
- NavigationView guidance: Top for smaller top-level sets, Left for larger; adjust `CompactModeThresholdWidth` and `ExpandedModeThresholdWidth`; wire the back button to `Frame.GoBack()` manually.
- TitleBar control (1.7+) is the preferred way to customize title bars and includes built-in back/pane buttons for NavigationView integration.
- Mica is the material for long-lived windows, Acrylic is for transient surfaces; both require support checks and fall back when transparency is disabled.
- Accessibility guidance emphasizes keyboard access, focus order, F6 navigation between panes, and AutomationProperties for non-text elements.
- AppWindow guidance: use `Window.AppWindow`, `SetPresenter` for FullScreen/CompactOverlay, and new 1.7 APIs for title bar theme, icons, and size constraints.
- Pickers: use the Windows App SDK pickers with the AppWindow.Id constructor and configure start location, filters, and commit button text.
- Performance guidance: `{x:Bind}` is compiled and defaults to OneTime; `x:Load` frees memory but adds ~600 bytes per element and has usage restrictions; virtualization requires ItemsStackPanel/ItemsWrapGrid and avoiding unbounded panels; `x:Phase` supports progressive rendering.
- Best practices: focus on responsiveness, memory, and power; define key scenarios and measure using ETW events.

## Applied in repo
- Updated `references/foundations.md`, `references/ui-ux.md`, `references/design-fluent.md`, `references/windowing.md`, and `references/performance.md` with actionable guidance.
- Merged threading guidance into `references/foundations.md` and deprecated `references/runtime.md`.
- Added a Reference Index to `SKILL.md` and removed the separate references list.
