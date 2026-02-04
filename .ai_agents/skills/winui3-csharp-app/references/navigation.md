# Navigation

Use when adding multi-page navigation.

Common pattern
- `NavigationView` + `Frame` in MainWindow/Page.
- Navigate by `Frame.Navigate(typeof(Page))`.
- Keep page state in ViewModel; avoid heavy code-behind state.

Source pointers:
- https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/navigationview
- https://learn.microsoft.com/en-us/windows/apps/design/basics/navigate-between-two-pages
