---
name: winui-dev-workflow
description: "Build/run/fix WinUI 3 apps: project creation, BuildAndRun.ps1, winapp run, errors, prerequisites."
---

### Create or Open a Project

**New app** — scaffold:
```powershell
dotnet new winui-mvvm -n <AppName>
cd <AppName>
```
Creates MVVM app with CommunityToolkit.Mvvm, TitleBar, MicaBackdrop, Frame navigation. Do NOT `mkdir` first; `-n` creates folder.

**Existing app** — read `.csproj` for:
- `<TargetFramework>` (e.g., `net10.0-windows10.0.26100.0`)
- `<PackageReference>` versions (WindowsAppSDK, CommunityToolkit)
- Project structure and established patterns

### Install Packages

```powershell
dotnet add package <Name>
```
Never specify `--version`; omitted version gets latest stable and avoids stale API mismatch.

### Build & Run

Use included `BuildAndRun.ps1`; it handles build + run:

```powershell
.\BuildAndRun.ps1
```

Invoke with `mode: "async"`. Script stays attached to running app; `mode: "sync"` blocks turn until app exits. Output includes running PID:
```
✅ <pkg> launched (PID: 12345)
```

Script does:
1. Checks Developer Mode is enabled (fails fast if not)
2. Finds the `.csproj` in the current directory
3. Auto-detects platform (x64 or ARM64)
4. Builds with MSBuild (or falls back to `dotnet build`)
5. Finds the build output folder
6. Launches with `winapp run --debug-output`

**Options:**
```powershell
.\BuildAndRun.ps1                          # auto-find csproj, build, run (should use async invocation)
.\BuildAndRun.ps1 MyApp.csproj             # explicit project
.\BuildAndRun.ps1 -Detach                  # run in detached mode, no debug output or exceptions (safe to use mode: "sync")
.\BuildAndRun.ps1 -SkipRun                 # build only (safe to use mode: "sync")
.\BuildAndRun.ps1 /p:Configuration=Release # override defaults
```

**If build fails:** Read ALL errors, batch-fix once, rerun `BuildAndRun.ps1`.

**If app crashes on launch:** `read_powershell` shell; first-chance exceptions appear in output.

### Common Errors

| Error | Fix |
|-------|-----|
| Developer Mode not enabled | Settings → System → For developers → On |
| CS0234/CS0246 missing type | Add `using` or `dotnet add package` |
| NETSDK1136 platform required | BuildAndRun.ps1 handles this automatically |
| XLS0414 XAML type not found | Add `xmlns` declaration |
| XDG0062 binding path missing | Check `x:Bind` property exists on ViewModel |
| Blank window after launch | `x:Bind` defaults to `OneTime` — add `Mode=OneWay` |
| App silently exits | Use `winapp run`, never run the .exe directly |
| XAML compiler crashes silently | Remove any `PresentationCore.dll` / `System.Windows` references |
| 0x80073CF6 package install failed | Run `winapp init`, check manifest publisher matches cert |
| 0x8007000B bad image format | Wrong platform target — use x64 or ARM64, not AnyCPU |

### Prerequisites

| Requirement | Minimum | Recommended (fresh installs) | Install command |
|-------------|---------|------------------------------|-----------------|
| Windows 10 v1903+ | — | — | — |
| Developer Mode | enabled | enabled | Settings → Advanced → Developer Mode → On |
| .NET SDK | 8.0 | 10.0 | `winget install Microsoft.DotNet.SDK.10` |
| winapp CLI | 0.3 | latest | `winget install Microsoft.WinAppCLI` |
| WinUI templates | any | latest | `dotnet new install Microsoft.WindowsAppSDK.WinUI.CSharp.Templates` |

If missing (`winapp`/`dotnet` not recognized, templates missing, Developer Mode off), **do not install yourself or work around it**. Stop, tell user prerequisite missing, ask them to run `/winui-setup`. After user finishes, retry failed cmd.

### Critical Rules

- ❌ NEVER run the packaged .exe directly — always use `winapp run` or `BuildAndRun.ps1`
- ❌ NEVER add `<WindowsPackageType>None` to work around launch issues
- ❌ NEVER delete `Package.appxmanifest`
- ❌ NEVER use `AnyCPU` — always x64 or ARM64

### References

- `BuildAndRun.ps1` — included, handles build + run
