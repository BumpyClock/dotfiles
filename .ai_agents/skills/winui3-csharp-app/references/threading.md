# Threading

Use when fixing UI thread access, deadlocks, or async patterns.

Key rules
- Windows App SDK uses STA (not ASTA). Reentrancy assumptions can break.
- UI access must happen on UI thread.
- Use `DispatcherQueue.HasThreadAccess` + `TryEnqueue`.
- Avoid `.Result` / `.Wait()` on UI thread; use async/await end-to-end.
- `CoreDispatcher` -> `DispatcherQueue`, `RunAsync` -> `TryEnqueue` (migration).

Source pointers:
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/migrate-to-windows-app-sdk/guides/threading
- https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.dispatching.dispatcherqueue
