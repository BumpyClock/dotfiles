# Windowing

Use when handling multi-window behavior, dialogs, or file pickers.

## AppWindow basics
- Use `Window.AppWindow` (Windows App SDK 1.3+) to manage size, position, title bar, and presenters.
- For other windows, use `AppWindow.GetFromWindowId` after obtaining a `WindowId` from the HWND.
- Use `AppWindow.SetPresenter` to switch between `FullScreen`, `CompactOverlay`, and the default overlapped presenter.
- Use `AppWindow.Changed` to respond to size, position, or presenter changes.

## AppWindow APIs (1.7+)
- `SetTaskBarIcon` and `SetTitleBarIcon` set independent icons.
- `AppWindowTitleBar.PreferredTheme` sets title bar theme without changing app theme.
- `OverlappedPresenter.PreferredMinimumSize` and `PreferredMaximumSize` enforce size constraints.
- `EnablePlacementPersistence` remembers size and position across sessions.

## Multi-window patterns
- Create secondary windows with `new Window()`, set `Content` (often a `Frame`), then call `Activate()`.
- Track window instances and release content on `Closed` to avoid leaks.
- Avoid holding direct references between windows; use a messenger or DI service for cross-window state.

## Dialogs
- Use `ContentDialog` for modal dialogs.
- Always provide a `CloseButtonText`; `PrimaryButtonText` and `SecondaryButtonText` are optional.
- Built-in buttons provide consistent keyboard behavior and layout.
- Set `ContentDialog.XamlRoot` when using AppWindow or XAML Islands.

## File and folder pickers
- Use Windows App SDK pickers (`FileOpenPicker`, `FileSavePicker`, `FolderPicker`).
- Initialize pickers with the current window via the `AppWindow.Id` constructor.
- Configure `SuggestedStartLocation`, `FileTypeFilter`, `CommitButtonText`, and `ViewMode` for the task.
- Always handle a `null` result when the user cancels.
- Add chosen files/folders to the Future Access List or MRU if you need ongoing access.

Source pointers:
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/windowing/manage-app-windows
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/release-notes/windows-app-sdk-1-7
- https://learn.microsoft.com/en-us/windows/apps/develop/files/using-file-folder-pickers
- https://learn.microsoft.com/en-us/windows/apps/design/controls/dialogs-and-flyouts/dialogs
