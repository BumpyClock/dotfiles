<#
.SYNOPSIS
    Setup script for the PowerShell profile environment.

.DESCRIPTION
    Installs all required and optional tools referenced by
    Microsoft.PowerShell_profile.ps1. Works on both PowerShell 5.1 and 7+.
    Will install PowerShell 7 if not already present.

.PARAMETER Optional
    Install optional/soft-dependency tools in addition to the core set.

.PARAMETER SkipModules
    Skip PowerShell module installation.

.PARAMETER DryRun
    Show what would be installed without actually installing anything.

.EXAMPLE
    .\setup.ps1              # core tools only
    .\setup.ps1 -Optional    # core + optional tools
    .\setup.ps1 -DryRun      # preview what would happen

.NOTES
    If you get an execution policy error, run this first:
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    Or bypass for a single run:
        powershell -NoProfile -ExecutionPolicy Bypass -File .\setup.ps1
#>
[CmdletBinding()]
param(
    [switch]$Optional,
    [switch]$SkipModules,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# --- Helpers ----------------------------------------------------------------

function Write-Step  { param([string]$msg) Write-Host ("`n> " + $msg) -ForegroundColor Cyan }
function Write-Ok    { param([string]$msg) Write-Host ("  [OK]   " + $msg) -ForegroundColor Green }
function Write-Skip  { param([string]$msg) Write-Host ("  [SKIP] " + $msg) -ForegroundColor DarkGray }
function Write-Warn  { param([string]$msg) Write-Host ("  [WARN] " + $msg) -ForegroundColor Yellow }

function Test-CommandAvailable {
    param([string]$Name)
    [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Install-WingetPackage {
    param(
        [string]$Id,
        [string]$DisplayName
    )
    # First check: is the command already on PATH?
    $cmdName = if ($DisplayName) { $DisplayName } else { ($Id -split '\.' | Select-Object -Last 1) }
    if (Test-CommandAvailable $cmdName) {
        Write-Skip "$Id already installed (found '$cmdName' on PATH)"
        return
    }
    # Second check: is the package registered with winget?
    $listed = winget list --id $Id --accept-source-agreements 2>$null
    if ($LASTEXITCODE -eq 0 -and $listed -match [regex]::Escape($Id)) {
        Write-Skip "$Id already installed (found in winget list)"
        return
    }
    if ($DryRun) {
        Write-Warn "(DRY RUN) Would install: $Id"
        return
    }
    Write-Host "  Installing $Id ..." -ForegroundColor Yellow
    winget install --id $Id --accept-source-agreements --accept-package-agreements -h
    if ($LASTEXITCODE -eq 0) { Write-Ok "$Id installed" }
    else { Write-Warn "$Id install returned exit code $LASTEXITCODE" }
}

function Install-PSModule {
    param([string]$Name)
    if (Get-Module -ListAvailable -Name $Name) {
        Write-Skip "Module $Name already installed"
        return
    }
    if ($DryRun) {
        Write-Warn "(DRY RUN) Would install module: $Name"
        return
    }
    Write-Host "  Installing module $Name ..." -ForegroundColor Yellow
    Install-Module -Name $Name -Scope CurrentUser -Force -SkipPublisherCheck
    Write-Ok "Module $Name installed"
}

function Unblock-ManagedFile {
    param(
        [string]$Path,
        [string]$Label
    )

    if (-not (Test-Path $Path)) {
        return
    }

    if ($DryRun) {
        Write-Warn "(DRY RUN) Would unblock $Label at $Path"
        return
    }

    if (-not (Get-Command Unblock-File -ErrorAction SilentlyContinue)) {
        Write-Skip "Unblock-File not available for $Label"
        return
    }

    try {
        Unblock-File -Path $Path -ErrorAction Stop
        Write-Ok "Unblocked $Label at $Path"
    } catch {
        Write-Warn "Could not unblock $Label at $Path"
    }
}

function Test-ObjectProperty {
    param(
        [psobject]$Object,
        [string]$Name
    )

    $null -ne $Object -and $Object.PSObject.Properties.Name -contains $Name
}

function Set-ObjectPropertyValue {
    param(
        [psobject]$Object,
        [string]$Name,
        $Value
    )

    if (Test-ObjectProperty -Object $Object -Name $Name) {
        $Object.$Name = $Value
    } else {
        $Object | Add-Member -NotePropertyName $Name -NotePropertyValue $Value -Force
    }
}

function Get-DocumentsDirectory {
    $documentsDir = [Environment]::GetFolderPath([Environment+SpecialFolder]::MyDocuments)
    if ([string]::IsNullOrWhiteSpace($documentsDir)) {
        throw "Could not resolve the current user's Documents directory"
    }
    $documentsDir
}

function Get-DocumentsDirectoryCandidates {
    $documentsDir = Get-DocumentsDirectory
    $candidates = @($documentsDir)

    foreach ($oneDriveRoot in @($env:OneDrive, $env:OneDriveConsumer, $env:OneDriveCommercial)) {
        if (-not [string]::IsNullOrWhiteSpace($oneDriveRoot)) {
            $candidates += (Join-Path $oneDriveRoot "Documents")
        }
    }

    $existingCandidates = $candidates | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    $existingCandidates | Select-Object -Unique
}

function Sync-ManagedFile {
    param(
        [string]$SourcePath,
        [string]$DestinationPath,
        [string]$Label
    )

    $sourceContent = Get-Content $SourcePath -Raw
    $destinationExists = Test-Path $DestinationPath

    $destinationDir = Split-Path $DestinationPath -Parent
    if (-not (Test-Path $destinationDir)) {
        if ($DryRun) {
            Write-Warn "(DRY RUN) Would create directory: $destinationDir"
        } else {
            New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
            Write-Ok "Created directory: $destinationDir"
        }
    }

    if ($destinationExists) {
        $destinationContent = Get-Content $DestinationPath -Raw
        if ($sourceContent -ceq $destinationContent) {
            Unblock-ManagedFile -Path $DestinationPath -Label $Label
            Write-Skip "$Label already up to date"
            return
        }

        $backupPath = "$DestinationPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        if ($DryRun) {
            Write-Warn "(DRY RUN) Would backup existing $Label to $backupPath"
            Write-Warn "(DRY RUN) Would update $Label at $DestinationPath"
        } else {
            Copy-Item $DestinationPath $backupPath
            Write-Ok "Backed up $Label to $backupPath"
            Set-Content -Path $DestinationPath -Value $sourceContent -Encoding utf8
            Write-Ok "Updated $Label at $DestinationPath"
        }
        Unblock-ManagedFile -Path $DestinationPath -Label $Label
        return
    }

    if ($DryRun) {
        Write-Warn "(DRY RUN) Would create $Label at $DestinationPath"
    } else {
        Set-Content -Path $DestinationPath -Value $sourceContent -Encoding utf8
        Write-Ok "Created $Label at $DestinationPath"
    }

    Unblock-ManagedFile -Path $DestinationPath -Label $Label
}

function Write-ExecutionPolicyGuidance {
    $policies = Get-ExecutionPolicy -List
    $machinePolicy = ($policies | Where-Object { $_.Scope -eq "MachinePolicy" } | Select-Object -First 1).ExecutionPolicy
    $userPolicy = ($policies | Where-Object { $_.Scope -eq "UserPolicy" } | Select-Object -First 1).ExecutionPolicy
    $effectivePolicy = Get-ExecutionPolicy

    if ($machinePolicy -eq "AllSigned" -or $userPolicy -eq "AllSigned") {
        Write-Warn "Execution policy is enforced as AllSigned by policy; unblocking is not enough"
        Write-Warn "Use a signed profile or change policy centrally"
        return
    }

    if ($effectivePolicy -eq "AllSigned") {
        Write-Warn "Execution policy is AllSigned; unsigned profiles will still fail after unblock"
        Write-Warn "Run: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force"
        return
    }

    if ($effectivePolicy -eq "Restricted") {
        Write-Warn "Execution policy is Restricted; profile scripts will not run"
        Write-Warn "Run: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force"
    }
}

function Get-WindowsTerminalSettingsPath {
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA "Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json"),
        (Join-Path $env:LOCALAPPDATA "Packages\Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe\LocalState\settings.json"),
        (Join-Path $env:LOCALAPPDATA "Packages\Microsoft.WindowsTerminalCanary_8wekyb3d8bbwe\LocalState\settings.json"),
        (Join-Path $env:LOCALAPPDATA "Microsoft\Windows Terminal\settings.json")
    )

    $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}

function Get-WindowsTerminalPwshProfileId {
    param([psobject]$Settings)

    $profiles = @()
    if (Test-ObjectProperty -Object $Settings -Name "profiles") {
        if (Test-ObjectProperty -Object $Settings.profiles -Name "list") {
            $profiles = @($Settings.profiles.list)
        } elseif ($Settings.profiles -is [System.Array]) {
            $profiles = @($Settings.profiles)
        }
    }

    $pwshProfile = $profiles | Where-Object {
        ((Test-ObjectProperty -Object $_ -Name "source") -and $_.source -eq "Windows.Terminal.PowershellCore") -or
        ((Test-ObjectProperty -Object $_ -Name "commandline") -and $_.commandline -match '(?i)(^|[\\/])pwsh(\.exe)?(\s|$)') -or
        ((Test-ObjectProperty -Object $_ -Name "name") -and $_.name -match '^PowerShell(?:\s+7)?$')
    } | Select-Object -First 1

    if ($pwshProfile -and (Test-ObjectProperty -Object $pwshProfile -Name "guid") -and $pwshProfile.guid) {
        return $pwshProfile.guid
    }

    "{574e775e-4f2a-5b96-ac1e-a2962a402336}"
}

# --- Pre-flight checks ------------------------------------------------------

Write-Host ""
Write-Host "+=============================================+" -ForegroundColor Magenta
Write-Host "|   PowerShell Profile Setup                  |" -ForegroundColor Magenta
Write-Host "+=============================================+" -ForegroundColor Magenta

if ($DryRun) {
    Write-Warn "DRY RUN MODE -- nothing will be installed"
}

# Verify winget is available
if (-not (Test-CommandAvailable winget)) {
    Write-Host "`n[X] winget is required but not found." -ForegroundColor Red
    Write-Host "    Install 'App Installer' from the Microsoft Store, then re-run." -ForegroundColor Red
    exit 1
}

# Verify git is available
if (-not (Test-CommandAvailable git)) {
    Write-Step "Git (prerequisite)"
    Install-WingetPackage -Id "Git.Git" -DisplayName "git"
    # Refresh PATH so git is available for the rest of the script
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("Path", "User")
}

# --- Core tools (required by profile) ---------------------------------------

Write-Step "Core tools"

# PowerShell 7+ (profile targets pwsh)
Install-WingetPackage -Id "Microsoft.PowerShell" -DisplayName "pwsh"

# oh-my-posh -- prompt theme engine (profile line 2)
Install-WingetPackage -Id "JanDeDobbeleer.OhMyPosh" -DisplayName "oh-my-posh"

# fnm -- fast Node manager (profile lines 5-13)
Install-WingetPackage -Id "Schniz.fnm" -DisplayName "fnm"

# GitHub CLI (profile lines 118-121)
Install-WingetPackage -Id "GitHub.cli" -DisplayName "gh"

# eza -- modern ls replacement (profile lines 188-222)
Install-WingetPackage -Id "eza-community.eza" -DisplayName "eza"

# VS Code (used for Edit-Profile, code-here, code-diff)
Install-WingetPackage -Id "Microsoft.VisualStudioCode" -DisplayName "code"

# GitHub Copilot CLI
Install-WingetPackage -Id "GitHub.Copilot" -DisplayName "github-copilot"

# --- Node.js via fnm --------------------------------------------------------

Write-Step "Node.js (via fnm)"
if (Test-CommandAvailable fnm) {
    # Load fnm environment into current session so node/corepack are on PATH
    fnm env --shell powershell | Out-String | Invoke-Expression

    if ($DryRun) {
        Write-Warn "(DRY RUN) Would install Node.js LTS via fnm"
    } else {
        fnm install --lts
        fnm default lts-latest
        # Re-load fnm env to pick up the newly installed/default version
        fnm env --shell powershell | Out-String | Invoke-Expression
        Write-Ok "Node.js LTS installed via fnm"
    }
} else {
    Write-Warn "fnm not yet in PATH -- restart your shell, then run: fnm install --lts"
}

# --- pnpm (used heavily in profile lines 92-111) ----------------------------

Write-Step "pnpm"
if (Test-CommandAvailable pnpm) {
    Write-Skip "pnpm already installed"
} elseif (Test-CommandAvailable corepack) {
    if ($DryRun) {
        Write-Warn "(DRY RUN) Would install pnpm via corepack"
    } else {
        corepack enable
        corepack prepare pnpm@latest --activate
        Write-Ok "pnpm activated via corepack"
    }
} else {
    Write-Warn "corepack not found -- restart your shell, then run: corepack enable; corepack prepare pnpm@latest --activate"
}

# --- Bun (profile lines 239-242) --------------------------------------------

Write-Step "Bun"
if (-not (Test-Path "$env:USERPROFILE\.bun")) {
    if ($DryRun) {
        Write-Warn "(DRY RUN) Would install Bun"
    } else {
        Write-Host "  Installing Bun ..." -ForegroundColor Yellow
        irm bun.sh/install.ps1 | iex
        Write-Ok "Bun installed"
    }
} else {
    Write-Skip "Bun already installed"
}

# --- PowerShell modules -----------------------------------------------------

if (-not $SkipModules) {
    Write-Step "PowerShell modules"
    # Terminal-Icons (profile lines 20-25)
    Install-PSModule -Name "Terminal-Icons"
    # PSReadLine should ship with pwsh 7+, but ensure latest
    Install-PSModule -Name "PSReadLine"
}

# --- Optional tools ----------------------------------------------------------

if ($Optional) {
    Write-Step "Optional tools"

    # Chocolatey (profile lines 16-17, completions only)
    if (-not (Test-CommandAvailable choco)) {
        if ($DryRun) {
            Write-Warn "(DRY RUN) Would install Chocolatey"
        } else {
            Write-Host "  Installing Chocolatey ..." -ForegroundColor Yellow
            Set-ExecutionPolicy Bypass -Scope Process -Force
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
            irm https://community.chocolatey.org/install.ps1 | iex
            Write-Ok "Chocolatey installed"
        }
    } else {
        Write-Skip "Chocolatey already installed"
    }
}

# --- Profile copy ------------------------------------------------------------

Write-Step "Profile setup"
$profileSrc = Join-Path $PSScriptRoot "Microsoft.PowerShell_profile.ps1"
$documentsDirs = Get-DocumentsDirectoryCandidates
$documentsDir = $documentsDirs[0]
$profileTargets = @(
    @{
        Label = "Windows PowerShell profile"
        Path  = Join-Path $documentsDir "WindowsPowerShell\Microsoft.PowerShell_profile.ps1"
    },
    @{
        Label = "PowerShell 7 profile"
        Path  = Join-Path $documentsDir "PowerShell\Microsoft.PowerShell_profile.ps1"
    }
)

foreach ($profileTarget in $profileTargets) {
    Sync-ManagedFile -SourcePath $profileSrc -DestinationPath $profileTarget.Path -Label $profileTarget.Label
}

foreach ($candidateDocumentsDir in $documentsDirs) {
    foreach ($profileSubDir in @("WindowsPowerShell", "PowerShell")) {
        $candidateProfilePath = Join-Path $candidateDocumentsDir "$profileSubDir\Microsoft.PowerShell_profile.ps1"
        Unblock-ManagedFile -Path $candidateProfilePath -Label "$profileSubDir profile"
    }
}

Write-ExecutionPolicyGuidance

# --- oh-my-posh theme -------------------------------------------------------

Write-Step "oh-my-posh theme"
# Place theme in the shared PowerShell documents directory used by the profile
$themeDir  = Join-Path $documentsDir "PowerShell\Themes"
$themeFile = Join-Path $themeDir "dracula.omp.json"

if (Test-Path $themeFile) {
    Write-Skip "Dracula theme already exists at $themeFile"
} else {
    if ($DryRun) {
        Write-Warn "(DRY RUN) Would download Dracula theme to $themeFile"
    } else {
        if (-not (Test-Path $themeDir)) {
            New-Item -ItemType Directory -Path $themeDir -Force | Out-Null
        }
        $draculaUrl = "https://raw.githubusercontent.com/JanDeDobbeleer/oh-my-posh/main/themes/dracula.omp.json"
        Invoke-WebRequest -Uri $draculaUrl -OutFile $themeFile
        Write-Ok "Downloaded Dracula theme to $themeFile"
    }
}

foreach ($candidateDocumentsDir in $documentsDirs) {
    $candidateThemePath = Join-Path $candidateDocumentsDir "PowerShell\Themes\dracula.omp.json"
    Unblock-ManagedFile -Path $candidateThemePath -Label "Dracula theme"
}

# --- Nerd Font ---------------------------------------------------------------

Write-Step "FiraCode Nerd Font"
$fontName = "FiraCode"
# Check if already installed by looking in the user fonts folder
$userFontsDir = "$env:LOCALAPPDATA\Microsoft\Windows\Fonts"
$firaInstalled = (Test-Path $userFontsDir) -and
    (Get-ChildItem $userFontsDir -Filter "*FiraCode*Nerd*" -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0

if (-not $firaInstalled) {
    # Also check system fonts
    $sysFontsDir = "$env:SystemRoot\Fonts"
    $firaInstalled = (Get-ChildItem $sysFontsDir -Filter "*FiraCode*Nerd*" -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0
}

if ($firaInstalled) {
    Write-Skip "FiraCode Nerd Font already installed"
} elseif ($DryRun) {
    Write-Warn "(DRY RUN) Would install FiraCode Nerd Font via oh-my-posh"
} elseif (Test-CommandAvailable oh-my-posh) {
    oh-my-posh font install $fontName
    Write-Ok "FiraCode Nerd Font installed"
} else {
    Write-Warn "oh-my-posh not on PATH yet -- restart shell, then run: oh-my-posh font install $fontName"
}

# --- Windows Terminal: set pwsh as default -----------------------------------

Write-Step "Windows Terminal default profile"
$wtSettingsPath = Get-WindowsTerminalSettingsPath
$nerdFontFace = "FiraCode Nerd Font"

if ($wtSettingsPath) {
    $wtSettings = Get-Content $wtSettingsPath -Raw | ConvertFrom-Json
    $wtChanged = $false
    $pwshGuid = Get-WindowsTerminalPwshProfileId -Settings $wtSettings
    $currentDefaultProfile = $null
    if (Test-ObjectProperty -Object $wtSettings -Name "defaultProfile") {
        $currentDefaultProfile = $wtSettings.defaultProfile
    }

    # Set default profile to pwsh
    if ($currentDefaultProfile -eq $pwshGuid) {
        Write-Skip "PowerShell 7 is already the default profile"
    } elseif ($DryRun) {
        Write-Warn "(DRY RUN) Would set Windows Terminal default profile to PowerShell 7"
    } else {
        Set-ObjectPropertyValue -Object $wtSettings -Name "defaultProfile" -Value $pwshGuid
        $wtChanged = $true
        Write-Ok "Set PowerShell 7 as default Windows Terminal profile"
    }

    # Set font for all profiles via defaults
    $currentFont = $null
    if ((Test-ObjectProperty -Object $wtSettings -Name "profiles") -and
        (Test-ObjectProperty -Object $wtSettings.profiles -Name "defaults") -and
        (Test-ObjectProperty -Object $wtSettings.profiles.defaults -Name "font") -and
        (Test-ObjectProperty -Object $wtSettings.profiles.defaults.font -Name "face")) {
        $currentFont = $wtSettings.profiles.defaults.font.face
    }
    if ($currentFont -eq $nerdFontFace) {
        Write-Skip "Font already set to $nerdFontFace"
    } elseif ($DryRun) {
        Write-Warn "(DRY RUN) Would set Windows Terminal font to $nerdFontFace"
    } else {
        if (-not (Test-ObjectProperty -Object $wtSettings -Name "profiles")) {
            $wtSettings | Add-Member -NotePropertyName "profiles" -NotePropertyValue ([PSCustomObject]@{}) -Force
        }
        # Ensure profiles.defaults.font object exists
        if (-not (Test-ObjectProperty -Object $wtSettings.profiles -Name "defaults")) {
            $wtSettings.profiles | Add-Member -NotePropertyName "defaults" -NotePropertyValue ([PSCustomObject]@{}) -Force
        }
        if (-not (Test-ObjectProperty -Object $wtSettings.profiles.defaults -Name "font")) {
            $wtSettings.profiles.defaults | Add-Member -NotePropertyName "font" -NotePropertyValue ([PSCustomObject]@{}) -Force
        }
        Set-ObjectPropertyValue -Object $wtSettings.profiles.defaults.font -Name "face" -Value $nerdFontFace
        $wtChanged = $true
        Write-Ok "Set Windows Terminal font to $nerdFontFace"
    }

    # Write settings if changed
    if ($wtChanged -and -not $DryRun) {
        $wtBackup = "$wtSettingsPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $wtSettingsPath $wtBackup
        Write-Ok "Backed up Windows Terminal settings to $wtBackup"
        $wtSettings | ConvertTo-Json -Depth 100 | Set-Content $wtSettingsPath -Encoding utf8
    }
} else {
    Write-Warn "Windows Terminal settings not found -- installing Windows Terminal"
    if ($DryRun) {
        Write-Warn "(DRY RUN) Would install Microsoft.WindowsTerminal"
    } else {
        Install-WingetPackage -Id "Microsoft.WindowsTerminal" -DisplayName "wt"
        # Settings file is created on first launch; prompt user
        Write-Warn "Launch Windows Terminal once, then re-run this script to set pwsh as default"
    }
}

# --- Summary -----------------------------------------------------------------

Write-Host ""
Write-Host "+=============================================+" -ForegroundColor Green
Write-Host "|   Setup complete!                           |" -ForegroundColor Green
Write-Host "+=============================================+" -ForegroundColor Green

Write-Host ""
Write-Host "Next steps:" -ForegroundColor DarkGray
Write-Host ('  1. Restart your terminal (or run: . $PROFILE)') -ForegroundColor DarkGray
Write-Host ""
Write-Host "Optional (if not installed via -Optional flag):" -ForegroundColor DarkGray
Write-Host ('  * Chocolatey:  irm https://community.chocolatey.org/install.ps1 | iex') -ForegroundColor DarkGray
Write-Host ""
