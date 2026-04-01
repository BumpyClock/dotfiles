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
        powershell -ExecutionPolicy Bypass -File .\setup.ps1
#>
[CmdletBinding()]
param(
    [switch]$Optional,
    [switch]$SkipModules,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ─── Helpers ────────────────────────────────────────────────────────────────

function Write-Step  { param([string]$msg) Write-Host "`n▸ $msg" -ForegroundColor Cyan }
function Write-Ok    { param([string]$msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Skip  { param([string]$msg) Write-Host "  ⏭ $msg" -ForegroundColor DarkGray }
function Write-Warn  { param([string]$msg) Write-Host "  ⚠ $msg" -ForegroundColor Yellow }

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

# ─── Pre-flight checks ─────────────────────────────────────────────────────

Write-Host "`n╔══════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║   PowerShell Profile Setup                   ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Magenta

if ($DryRun) {
    Write-Warn "DRY RUN MODE — nothing will be installed`n"
}

# Enable Developer Mode (allows symlinks without admin, sideloading, etc.)
Write-Step "Developer Mode"
$devModeKey = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock"
$devModeEnabled = (Get-ItemProperty -Path $devModeKey -Name AllowDevelopmentWithoutDevLicense -ErrorAction SilentlyContinue).AllowDevelopmentWithoutDevLicense -eq 1

if ($devModeEnabled) {
    Write-Skip "Developer Mode already enabled"
} elseif ($DryRun) {
    Write-Warn "(DRY RUN) Would enable Developer Mode via registry"
} else {
    try {
        if (-not (Test-Path $devModeKey)) {
            New-Item -Path $devModeKey -Force | Out-Null
        }
        Set-ItemProperty -Path $devModeKey -Name AllowDevelopmentWithoutDevLicense -Value 1 -Type DWord
        Write-Ok "Developer Mode enabled"
    } catch {
        Write-Warn "Could not enable Developer Mode — run this script as Administrator"
    }
}

# Verify winget is available
if (-not (Test-CommandAvailable winget)) {
    Write-Host "`n✖ winget is required but not found." -ForegroundColor Red
    Write-Host "  Install 'App Installer' from the Microsoft Store, then re-run." -ForegroundColor Red
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

# ─── Core tools (required by profile) ──────────────────────────────────────

Write-Step "Core tools"

# PowerShell 7+ (profile targets pwsh)
Install-WingetPackage -Id "Microsoft.PowerShell" -DisplayName "pwsh"

# oh-my-posh — prompt theme engine (profile line 2)
Install-WingetPackage -Id "JanDeDobbeleer.OhMyPosh" -DisplayName "oh-my-posh"

# fnm — fast Node manager (profile lines 5-13)
Install-WingetPackage -Id "Schniz.fnm" -DisplayName "fnm"

# GitHub CLI (profile lines 118-121)
Install-WingetPackage -Id "GitHub.cli" -DisplayName "gh"

# eza — modern ls replacement (profile lines 188-222)
Install-WingetPackage -Id "eza-community.eza" -DisplayName "eza"

# VS Code (used for Edit-Profile, code-here, code-diff)
Install-WingetPackage -Id "Microsoft.VisualStudioCode" -DisplayName "code"

# GitHub Copilot CLI
Install-WingetPackage -Id "GitHub.Copilot" -DisplayName "github-copilot"

# ─── Node.js via fnm ───────────────────────────────────────────────────────

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
    Write-Warn "fnm not yet in PATH — restart your shell, then run: fnm install --lts"
}

# ─── pnpm (used heavily in profile lines 92-111) ──────────────────────────

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
    Write-Warn "corepack not found — restart your shell, then run: corepack enable; corepack prepare pnpm@latest --activate"
}

# ─── Bun (profile lines 239-242) ──────────────────────────────────────────

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

# ─── PowerShell modules ────────────────────────────────────────────────────

if (-not $SkipModules) {
    Write-Step "PowerShell modules"
    # Terminal-Icons (profile lines 20-25)
    Install-PSModule -Name "Terminal-Icons"
    # PSReadLine should ship with pwsh 7+, but ensure latest
    Install-PSModule -Name "PSReadLine"
}

# ─── Optional tools ────────────────────────────────────────────────────────

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

# ─── Profile copy ─────────────────────────────────────────────────────────

Write-Step "Profile setup"
$profileDir  = Split-Path $PROFILE -Parent
$profileSrc  = Join-Path $PSScriptRoot "Microsoft.PowerShell_profile.ps1"

if (-not (Test-Path $profileDir)) {
    if ($DryRun) {
        Write-Warn "(DRY RUN) Would create directory: $profileDir"
    } else {
        New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
        Write-Ok "Created profile directory: $profileDir"
    }
}

if (Test-Path $PROFILE) {
    # Check if content already matches
    $srcHash = (Get-FileHash $profileSrc).Hash
    $dstHash = (Get-FileHash $PROFILE).Hash
    if ($srcHash -eq $dstHash) {
        Write-Skip "Profile already up to date"
    } else {
        $backupPath = "$PROFILE.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        if ($DryRun) {
            Write-Warn "(DRY RUN) Would backup existing profile to $backupPath"
            Write-Warn "(DRY RUN) Would copy profile to $PROFILE"
        } else {
            Copy-Item $PROFILE $backupPath
            Write-Ok "Backed up existing profile to $backupPath"
            Copy-Item $profileSrc $PROFILE -Force
            Write-Ok "Copied profile to $PROFILE"
        }
    }
} else {
    if ($DryRun) {
        Write-Warn "(DRY RUN) Would copy profile to $PROFILE"
    } else {
        Copy-Item $profileSrc $PROFILE -Force
        Write-Ok "Copied profile to $PROFILE"
    }
}

# ─── oh-my-posh theme ──────────────────────────────────────────────────────

Write-Step "oh-my-posh theme"
# Place theme next to the profile in the standard PowerShell config directory
$themeDir  = Join-Path $profileDir "Themes"
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

# Patch the profile to point to the correct theme location
if (-not $DryRun -and (Test-Path $PROFILE)) {
    $profileContent = Get-Content $PROFILE -Raw
    $oneDriveThemePath = '$HOME\OneDrive\Documents\PowerShell\Themes\dracula.omp.json'
    $standardThemePath = '$HOME\Documents\PowerShell\Themes\dracula.omp.json'
    if ($profileContent -match [regex]::Escape($oneDriveThemePath)) {
        $profileContent = $profileContent.Replace($oneDriveThemePath, $standardThemePath)
        Set-Content $PROFILE $profileContent -Encoding utf8
        Write-Ok "Updated profile theme path to $standardThemePath"
    }
}

# ─── Nerd Font ──────────────────────────────────────────────────────────────

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
    Write-Warn "oh-my-posh not on PATH yet — restart shell, then run: oh-my-posh font install $fontName"
}

# ─── Windows Terminal: set pwsh as default ──────────────────────────────────

Write-Step "Windows Terminal default profile"
$wtSettingsPath = "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json"
$pwshGuid = "{574e775e-4f2a-5b96-ac1e-a2962a402336}"

$nerdFontFace = "FiraCode Nerd Font"

if (Test-Path $wtSettingsPath) {
    $wtSettings = Get-Content $wtSettingsPath -Raw | ConvertFrom-Json
    $wtChanged = $false

    # Set default profile to pwsh
    if ($wtSettings.defaultProfile -eq $pwshGuid) {
        Write-Skip "PowerShell 7 is already the default profile"
    } elseif ($DryRun) {
        Write-Warn "(DRY RUN) Would set Windows Terminal default profile to PowerShell 7"
    } else {
        $wtSettings.defaultProfile = $pwshGuid
        $wtChanged = $true
        Write-Ok "Set PowerShell 7 as default Windows Terminal profile"
    }

    # Set font for all profiles via defaults
    $currentFont = if ($wtSettings.profiles.defaults.font.face) { $wtSettings.profiles.defaults.font.face } else { $null }
    if ($currentFont -eq $nerdFontFace) {
        Write-Skip "Font already set to $nerdFontFace"
    } elseif ($DryRun) {
        Write-Warn "(DRY RUN) Would set Windows Terminal font to $nerdFontFace"
    } else {
        # Ensure profiles.defaults.font object exists
        if (-not $wtSettings.profiles.defaults) {
            $wtSettings.profiles | Add-Member -NotePropertyName "defaults" -NotePropertyValue ([PSCustomObject]@{}) -Force
        }
        if (-not $wtSettings.profiles.defaults.font) {
            $wtSettings.profiles.defaults | Add-Member -NotePropertyName "font" -NotePropertyValue ([PSCustomObject]@{}) -Force
        }
        $wtSettings.profiles.defaults.font | Add-Member -NotePropertyName "face" -NotePropertyValue $nerdFontFace -Force
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
    Write-Warn "Windows Terminal settings not found — installing Windows Terminal"
    if ($DryRun) {
        Write-Warn "(DRY RUN) Would install Microsoft.WindowsTerminal"
    } else {
        Install-WingetPackage -Id "Microsoft.WindowsTerminal" -DisplayName "wt"
        # Settings file is created on first launch; prompt user
        Write-Warn "Launch Windows Terminal once, then re-run this script to set pwsh as default"
    }
}

# ─── Summary ────────────────────────────────────────────────────────────────

Write-Host "`n╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   Setup complete!                            ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host ""
Write-Host "Next steps:" -ForegroundColor DarkGray
Write-Host "  1. Restart your terminal (or run: . `$PROFILE)" -ForegroundColor DarkGray
Write-Host "" -ForegroundColor DarkGray
Write-Host "Optional (if not installed via -Optional flag):" -ForegroundColor DarkGray
Write-Host "  * Chocolatey:  irm https://community.chocolatey.org/install.ps1 | iex" -ForegroundColor DarkGray
Write-Host ""
