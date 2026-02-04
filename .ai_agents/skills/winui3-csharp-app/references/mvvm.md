# MVVM

Use when structuring ViewModels and commands.

- Implement `INotifyPropertyChanged` for mutable properties.
- Use `ObservableCollection<T>` for collections that change at runtime.
- For static lists, `List<T>` is ok (WinUI .NET 8 Release note: ObservableCollection can be problematic for static lists).
- Prefer commands over click handlers; keep code-behind for view glue only.

CommunityToolkit MVVM
- `RelayCommand` / `AsyncRelayCommand` for `ICommand`.
- `ObservableObject` base class if using toolkit.
- See `community-toolkit.md` for package and repo pointers.

Source pointers:
- https://learn.microsoft.com/en-us/windows/apps/develop/data-binding/data-binding-overview
- https://learn.microsoft.com/en-us/dotnet/communitytoolkit/mvvm/relaycommand
