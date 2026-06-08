# Foundations

Use for new app, packaging choice, MVVM/tooling setup.

## Project setup and SDK selection
- Use Visual Studio 2022 + `Blank App, Packaged (WinUI in Desktop)` template.
- WinUI Notes tutorial = toolchain smoke test + baseline pattern ref.
- Check Windows App SDK support matrix before minimum target.
- Production apps: Stable channel; preview/experimental not supported for Store submissions.
- As of February 10, 2026, the latest Stable release is 1.8.5 and 1.7 is in Maintenance. Update to the latest patch to stay supported.

## Windows App SDK packaging notes
- Windows App SDK 1.8 uses NuGet metapackage; default equals `WindowsAppSDKSelfContained=true`.
- Want framework package deployment instead of self-contained: reference `Microsoft.WindowsAppSDK.Runtime` or `Microsoft.WindowsAppSDK.Packages`.

## Architecture and MVVM
- Use `CommunityToolkit.Mvvm`: `ObservableObject`, `ObservableRecipient`, `ObservableValidator`, `RelayCommand`/`AsyncRelayCommand`, messaging (`WeakReferenceMessenger`, `StrongReferenceMessenger`).
- Toolkit modular; use only needed pieces.
- Prefer source-generated properties/commands.
- Larger apps: separate UI (WinUI project) from core logic (class library) for testability.

## Dependency injection and services
- Use `Microsoft.Extensions.DependencyInjection` for service registration + constructor injection.
- Keep services interface-based; register view models transient/scoped by lifecycle.
- App state belongs in services/view models, not view code-behind.

## Template Studio (optional scaffold)
- Template Studio = Visual Studio 2022 extension for WinUI 3 scaffold wizard.
- Install extension, create project, launch wizard, pick pages/features/patterns.

## Windows Community Toolkit
- WinUI 3: use `CommunityToolkit.WinUI.*`. WinUI 2/UWP: use `CommunityToolkit.Uwp.*`.
- Namespaces begin with `CommunityToolkit.WinUI`.
- Preview controls in Windows Community Toolkit Gallery; Labs for experimental components.

## WinUIEx (optional windowing helpers)
- WinUIEx provides `WindowEx`, window manager helpers, custom backdrops, tray icon support.
- `TitleBar` control deprecated in favor of Windows App SDK 1.7 `TitleBar`.

## Threading migration (UWP -> Windows App SDK)
- UWP uses ASTA; Windows App SDK uses standard STA and lacks ASTA reentrancy guarantees. Audit reentrancy assumptions.
- Migrate `CoreDispatcher` → `DispatcherQueue`; `CoreDispatcher.RunAsync` → `DispatcherQueue.TryEnqueue`.

Source pointers:
- https://learn.microsoft.com/en-us/windows/apps/tutorials/winui-notes/intro
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/support
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/release-channels
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/release-notes/windows-app-sdk-1-8
- https://learn.microsoft.com/en-us/windows/apps/winui/winui3/
- https://learn.microsoft.com/en-us/dotnet/communitytoolkit/mvvm/
- https://learn.microsoft.com/en-us/dotnet/communitytoolkit/windows/getting-started
- https://github.com/CommunityToolkit/Windows
- https://github.com/microsoft/TemplateStudio
- https://github.com/dotMorten/WinUIEx
- https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/migrate-to-windows-app-sdk/guides/threading
