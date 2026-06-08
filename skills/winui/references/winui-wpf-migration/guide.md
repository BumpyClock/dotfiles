---
name: winui-wpf-migration
description: "Migrate WPF→WinUI 3: System.Windows→Microsoft.UI.Xaml, DataGrid→ListView, WrapPanel→ItemsRepeater, TabControl→TabView, Dispatcher→DispatcherQueue, System.Drawing→BitmapImage, MVVM Toolkit, DynamicResource→ThemeResource. Use for WPF conversion, namespace replacement, migration build errors."
---

### Migration Process

#### Step 1: Audit the WPF Source
Before code, inventory WPF-specific APIs:
```powershell
# Find all WPF namespace usage
Select-String -Path (Get-ChildItem -Recurse -Filter "*.cs" | Where-Object { $_.FullName -notlike "*\obj\*" }) -Pattern "System\.Windows\." | Select-Object -Property Filename, LineNumber, Line
```
List WPF controls, custom MVVM, imaging APIs, threading, Win32 interop.

#### Step 2: Create WinUI 3 Project and Align Namespaces
```powershell
dotnet new winui-mvvm -n <AppName>
```
Set `<RootNamespace>` in `.csproj` to match WPF namespace. Update `x:Class` in `App.xaml`, `MainWindow.xaml`, and code-behind. Build before porting code.

#### Step 3: Replace Namespaces

| WPF | WinUI 3 |
|-----|---------|
| `System.Windows` | `Microsoft.UI.Xaml` |
| `System.Windows.Controls` | `Microsoft.UI.Xaml.Controls` |
| `System.Windows.Media` | `Microsoft.UI.Xaml.Media` |
| `System.Windows.Input` | `Microsoft.UI.Xaml.Input` |
| `System.Windows.Data` | `Microsoft.UI.Xaml.Data` |
| `System.Windows.Threading.Dispatcher` | `Microsoft.UI.Dispatching.DispatcherQueue` |
| `PresentationCore` / `PresentationFramework` | Remove entirely |

#### Step 4: Replace Controls

| WPF Control | WinUI 3 Equivalent |
|------------|-------------------|
| `DataGrid` | `ListView` with Grid column headers |
| `WrapPanel` | `ItemsRepeater` + `UniformGridLayout` |
| `TabControl` | `TabView` |
| `StatusBar` | `Grid` row at bottom with `TextBlock` elements |
| `Menu` / `MenuItem` | `MenuBar` / `MenuBarItem` / `MenuFlyoutItem` |
| `ToolBar` | `CommandBar` |
| `Expander` (custom) | `Expander` (built-in) |

#### Step 5: Replace Threading
```csharp
// WPF
Application.Current.Dispatcher.Invoke(() => { /* UI work */ });

// WinUI 3
dispatcherQueue.TryEnqueue(() => { /* UI work */ });
```
Get queue via `DispatcherQueue.GetForCurrentThread()`. WinUI 3 has no `Application.Current.Dispatcher`.

#### Step 6: Replace Imaging
**Critical:** `PresentationCore.dll` and `System.Windows.Media.Imaging` crash WinUI XAML compiler. Architectural incompatibility; no workaround.
- Remove ALL `System.Windows.Media.Imaging` refs at migration start.
- Replace with `Windows.Graphics.Imaging` (WinRT) or `Microsoft.UI.Xaml.Media.Imaging.BitmapImage`.
- Do NOT add `<UseWPF>true</UseWPF>` — silently corrupts build.
- Heavy imaging code: migrate early (step 2, not step 7).

#### Step 7: Replace MVVM Framework
Delete custom `ObservableObject`/`RelayCommand`/`DelegateCommand`. Use CommunityToolkit.Mvvm:
- `INotifyPropertyChanged` base → `ObservableObject` with `[ObservableProperty]` partial properties
- Custom `RelayCommand` → `[RelayCommand]` attribute
- `{Binding}` → `{x:Bind Mode=OneWay}`
- `DynamicResource` → `{ThemeResource}`

#### Step 8: Replace Resources
- `.resx` → `.resw` (copy + rename to `Strings\en-us\`)
- `{x:Static}` → `x:Uid` for localized strings
- `Properties.Resources.Key` → `ResourceLoader.GetString("Key")`

### Critical Rules

- ❌ NEVER reference `PresentationCore`, `PresentationFramework`, or `System.Windows.Controls` assemblies
- ❌ NEVER add `<UseWPF>true</UseWPF>` or `<WindowsPackageType>None</WindowsPackageType>`
- ❌ NEVER delete `Package.appxmanifest`
- ❌ NEVER overwrite `App.xaml` / `App.xaml.cs` — merge WPF code into the WinUI 3 boilerplate
- ✅ Always use `winapp run` to launch — never run the .exe directly
- ✅ Break migration into file-level tasks — not one massive rewrite

### Post-Migration Validation

```powershell
# Check for remaining WPF references (should return nothing)
Select-String -Path (Get-ChildItem -Recurse -Filter "*.cs" | Where-Object { $_.FullName -notlike "*\obj\*" }) -Pattern "System\.Windows\."

# Verify packaging preserved
Test-Path "Package.appxmanifest"  # should be True

# Build and run
.\BuildAndRun.ps1
```
