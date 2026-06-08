# Windowing

Use for multi-window behavior, dialogs, file pickers.

## AppWindow basics
- Use `Window.AppWindow` (Windows App SDK 1.3+) for size, position, title bar, presenters.
- Other windows: get `WindowId` from HWND, then `AppWindow.GetFromWindowId`.
- Use `AppWindow.SetPresenter` for `FullScreen`, `CompactOverlay`, default overlapped presenter.
- Use `AppWindow.Changed` for size, position, presenter changes.

## AppWindow APIs (1.7+)
- `SetTaskBarIcon` and `SetTitleBarIcon` set independent icons.
- `AppWindowTitleBar.PreferredTheme` sets title bar theme without changing app theme.
- `OverlappedPresenter.PreferredMinimumSize` and `PreferredMaximumSize` enforce size constraints.
- `EnablePlacementPersistence` remembers size and position across sessions.

## Multi-window patterns
- Create secondary windows with `new Window()`, set `Content` (often `Frame`), call `Activate()`.
- Track window instances; release content on `Closed` to avoid leaks.
- Avoid direct refs between windows; use messenger or DI service for cross-window state.

## Dialogs
- Use `ContentDialog` for modal dialogs.
- Always provide `CloseButtonText`; `PrimaryButtonText` and `SecondaryButtonText` optional.
- Built-in buttons provide consistent keyboard behavior/layout.
- Set `ContentDialog.XamlRoot` with AppWindow or XAML Islands.

## File and folder pickers
- Use Windows App SDK pickers (`FileOpenPicker`, `FileSavePicker`, `FolderPicker`).
- Initialize pickers with current window via `AppWindow.Id` constructor.
- Configure `SuggestedStartLocation`, `FileTypeFilter`, `CommitButtonText`, `ViewMode` for task.
- Always handle `null` result on cancel.
- Need ongoing access: add chosen files/folders to Future Access List or MRU.

Source pointers:
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/windowing/manage-app-windows
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/release-notes/windows-app-sdk-1-7
- https://learn.microsoft.com/en-us/windows/apps/develop/files/using-file-folder-pickers
- https://learn.microsoft.com/en-us/windows/apps/design/controls/dialogs-and-flyouts/dialogs
