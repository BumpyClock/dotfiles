# Foundations

Use when creating a new app, deciding packaging, or setting up MVVM/tooling.

## Project setup and SDK selection
- Use Visual Studio 2022 and the `Blank App, Packaged (WinUI in Desktop)` template for WinUI 3 projects.
- The WinUI Notes tutorial is a good smoke test for your toolchain and a reference for baseline WinUI 3 patterns.
- Check the Windows App SDK support matrix for the specific OS versions supported by your chosen SDK release before setting a minimum target.
- Prefer the Stable release channel for production apps; preview and experimental channels are not supported for Store submissions.
- As of February 10, 2026, the latest Stable release is 1.8.5 and 1.7 is in Maintenance. Update to the latest patch to stay supported.

## Windows App SDK packaging notes
- Windows App SDK 1.8 uses a NuGet metapackage. The default behavior is equivalent to `WindowsAppSDKSelfContained=true`.
- Reference `Microsoft.WindowsAppSDK.Runtime` or `Microsoft.WindowsAppSDK.Packages` if you want framework package deployment instead of self-contained.

## Architecture and MVVM
- Use `CommunityToolkit.Mvvm` for MVVM building blocks; it provides `ObservableObject`, `ObservableRecipient`, `ObservableValidator`, `RelayCommand`/`AsyncRelayCommand`, and messaging (`WeakReferenceMessenger`, `StrongReferenceMessenger`).
- The toolkit is modular; use only the components you need instead of adopting a monolithic framework.
- Prefer source-generated properties and commands to reduce boilerplate.
- For larger apps, separate UI (WinUI project) from core logic (class library) to improve testability.

## Dependency injection and services
- Use `Microsoft.Extensions.DependencyInjection` for service registration and constructor injection.
- Keep services interface-based and register view models as transient or scoped based on lifecycle.
- Avoid putting app state in view code-behind; keep it in services or view models.

## Template Studio (optional scaffold)
- Template Studio is a Visual Studio 2022 extension that scaffolds WinUI 3 apps via a wizard.
- Install the extension, create a new project, and launch the Template Studio wizard to pick pages, features, and patterns.

## Windows Community Toolkit
- For WinUI 3, use `CommunityToolkit.WinUI.*` packages. For WinUI 2/UWP use `CommunityToolkit.Uwp.*`.
- Namespaces begin with `CommunityToolkit.WinUI`.
- Use the Windows Community Toolkit Gallery app to preview controls, and Labs for experimental components.

## WinUIEx (optional windowing helpers)
- WinUIEx provides `WindowEx`, window manager helpers, custom backdrops, and tray icon support.
- Its `TitleBar` control is deprecated in favor of the Windows App SDK 1.7 `TitleBar`.

## Threading migration (UWP -> Windows App SDK)
- UWP uses ASTA; Windows App SDK uses standard STA and lacks ASTA reentrancy guarantees. Audit for reentrancy assumptions.
- Migrate `CoreDispatcher` to `DispatcherQueue`, and `CoreDispatcher.RunAsync` to `DispatcherQueue.TryEnqueue`.

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
