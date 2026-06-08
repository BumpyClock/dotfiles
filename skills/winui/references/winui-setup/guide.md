---
name: winui-setup
description: "Install/verify WinUI 3 prerequisites: .NET SDK 10, WinApp CLI, WinUI 3 .NET templates, Developer Mode. Use for new/reset machines or missing `winapp`/`dotnet`/templates/Developer Mode."
disable-model-invocation: true
---

### Purpose

Install + verify prerequisites every other `winui-*` skill assumes.

Idempotent: every step checks first, skips if satisfied, prints `[OK] already installed`, moves on. Re-run on ready machine = fast no-op.

### Steps

First: **batch all detection up front**. Run checks together, show full status before installs. Then install only missing/old items, except always upgrade WinApp CLI + templates.

#### Detect everything

Run together; collect results:

```powershell
# .NET SDK — accept any installed SDK >= 8.0
$dotnetSdks = (& dotnet --list-sdks 2>$null) -replace ' \[.*$',''
$dotnetOk   = $dotnetSdks | ForEach-Object { [version]($_ -split '-')[0] } |
              Where-Object { $_.Major -ge 8 } | Select-Object -First 1

# WinApp CLI — needs to be present AND >= 0.3
$winappVersion = $null
$winappOk      = $false
$winappCmd     = Get-Command winapp -ErrorAction SilentlyContinue
if ($winappCmd) {
    $raw = (& winapp --version 2>$null) -as [string]
    if ($raw) {
        $base = ($raw -split '-')[0]   # strip "-prerelease.N" if present
        try {
            $winappVersion = [version]$base
            $winappOk      = $winappVersion -ge [version]'0.3'
        } catch {}
    }
}

# WinUI 3 templates
$templatesOk = [bool](dotnet new list winui 2>$null | Select-String 'winui-mvvm' -Quiet)

# Developer Mode
$devModeOk = ((Get-ItemProperty `
  -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock' `
  -Name AllowDevelopmentWithoutDevLicense -ErrorAction SilentlyContinue
).AllowDevelopmentWithoutDevLicense) -eq 1
```

Print one-shot status table before changes:

```
.NET SDK ≥ 8           ✅ found 10.0.100   (or ❌ missing — will install Microsoft.DotNet.SDK.10)
WinApp CLI             ⚠ found 0.3.1 — will upgrade to latest
                       (or ❌ missing/too old — will install Microsoft.WinAppCLI)
WinUI 3 templates      ✅ found — will reinstall to make sure they're at latest
Developer Mode         ❌ disabled — needs admin to enable
```

> **Always upgrade WinApp CLI and WinUI templates**, even if present. They ship breaking changes. Other `winui-*` skills assume latest. Minimum: "WinApp CLI ≥ 0.3 and templates installed at all"; goal: "both at latest".

#### Install what's missing

Skip already-OK items from detection. Remaining steps:

##### .NET SDK (only if no SDK ≥ 8.0 was found)

```powershell
winget install --id Microsoft.DotNet.SDK.10 --exact --silent --accept-package-agreements --accept-source-agreements
```

`.NET 8.0` is floor. If user has 8.0, 9.0, or 10.0 (any patch), requirement met; do not install another SDK side-by-side.

##### WinApp CLI — install if missing/old, then always upgrade

If `$winappOk` false (missing or `< 0.3`), install. Then **always** run `winget upgrade`, so existing installs move to latest:

```powershell
# Install only if missing or too old
winget install --id Microsoft.WinAppCLI --exact --silent --accept-package-agreements --accept-source-agreements

# Always — upgrade to latest (no-op if already at latest)
winget upgrade --id Microsoft.WinAppCLI --exact --silent --accept-package-agreements --accept-source-agreements
```

##### Refresh `$env:Path`

If winget installed .NET SDK or any tool this session, **refresh PATH** so later steps find new tools. Without this, `dotnet new install` can fail with "command not found" despite SDK on disk:

```powershell
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
```

##### WinUI 3 .NET templates — always reinstall to get latest

Run every time, regardless of `$templatesOk`. `dotnet new install` upgrades installed template package in place:

```powershell
dotnet new install Microsoft.WindowsAppSDK.WinUI.CSharp.Templates
```

##### Developer Mode (ask the user first!)

Developer Mode = DWORD `AllowDevelopmentWithoutDevLicense` under `HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock`. Setting it needs admin -> UAC prompt. **Ask user before UAC**. Use language like:

> Developer Mode is currently disabled. Enabling it requires a one-time admin elevation (a UAC prompt will appear). Would you like me to enable it now? (yes / no / I'll do it later)

Only after user agrees, re-elevate **only this step** via UAC:

```powershell
Start-Process powershell -Verb RunAs -ArgumentList @(
  '-NoProfile','-Command',
  "New-Item -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock' -Force | Out-Null; " +
  "Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock' " +
  "-Name AllowDevelopmentWithoutDevLicense -Type DWord -Value 1"
) -Wait
```

If user declines or dismisses UAC, do not abort. Print literal command above for elevated PowerShell later, then continue to summary.

### Final summary — always print this

After everything, print single-table summary:

```
==== winui-setup summary ====
.NET SDK ≥ 8               ⏭ already present (9.0.313)
WinApp CLI                 ✅ upgraded to 0.4.0  (or ✅ installed, ⏭ already at latest, ❌ failed)
WinUI 3 templates          ✅ updated to latest
Developer Mode             ✅ enabled  (or ⏭ skipped — user declined, or ❌ failed: <reason>)

You're ready. Try:
  copilot --agent winui:winui-dev -p "build me a WinUI 3 markdown editor"
```

### Things to NOT do

- ❌ **Do not install Visual Studio.** Optional, multi-GB. If user wants full Visual Studio + WinUI workload (recommended for XAML-diagnostic workaround in `winui-dev-workflow`), tell them at summary end they can install it:
  ```powershell
  winget install Microsoft.VisualStudio.Community --override "--add Microsoft.VisualStudio.Workload.Universal"
  ```
- ❌ **Do not install GitHub Copilot CLI.** If this skill runs, already installed.
- ❌ **Do not elevate the entire session** — only step 5 needs admin. Earlier elevation installs winget packages into admin user's profile, wrong user.
- ❌ **Do not skip the PATH refresh** — skipping installs SDK then fails on `dotnet new install`.
- ❌ **Do not trigger UAC for Developer Mode without asking first** — prompt appears unannounced. Always confirm before elevating.
- ❌ **Do not silently retry on failure.** If `winget install` fails (network, package source, permissions), record error in summary and move on.
- ❌ **Do not install .NET 10 if machine already has any .NET SDK ≥ 8.0** — floor is 8.0; side-by-side wastes disk.
