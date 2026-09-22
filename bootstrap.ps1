<#
.SYNOPSIS
    One-shot first-run bootstrap for Windows: provision tools, then run the Bun linker.

.DESCRIPTION
    Calls shell/powershell/setup.ps1 to install the tools the PowerShell profile
    relies on, then invokes the Bun linker (scripts/link-dotfiles/link-dotfiles.ts)
    to write the managed profile block. The linker is the sole
    owner of links/generated config/profile content; this script only provisions
    dependencies and calls it exactly once.

.PARAMETER Optional
    Install optional/soft-dependency tools in addition to the core set. Forwarded
    to shell/powershell/setup.ps1.

.PARAMETER SkipModules
    Skip PowerShell module installation. Forwarded to shell/powershell/setup.ps1.

.PARAMETER DryRun
    Show what would happen without installing anything or running the linker.

.PARAMETER SkipSubmodules
    Skip git submodule initialization in the Bun linker.

.EXAMPLE
    .\bootstrap.ps1                    # core tools + link dotfiles
    .\bootstrap.ps1 -Optional          # core + optional tools, then link
    .\bootstrap.ps1 -DryRun            # preview what would happen

.NOTES
    If you get an execution policy error, run this first:
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
#>
[CmdletBinding()]
param(
    [switch]$Optional,
    [switch]$SkipModules,
    [switch]$DryRun,
    [switch]$SkipSubmodules
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step { param([string]$msg) Write-Host ("`n> " + $msg) -ForegroundColor Cyan }
function Write-Ok   { param([string]$msg) Write-Host ("  [OK]   " + $msg) -ForegroundColor Green }
function Write-Skip { param([string]$msg) Write-Host ("  [SKIP] " + $msg) -ForegroundColor DarkGray }
function Write-Warn { param([string]$msg) Write-Host ("  [WARN] " + $msg) -ForegroundColor Yellow }

function Test-PathEntry {
    param(
        [AllowNull()]
        [string]$PathValue,
        [string]$Entry
    )

    $normalizedEntry = [System.IO.Path]::GetFullPath($Entry).TrimEnd('\')
    foreach ($candidate in @($PathValue -split ';')) {
        if ([string]::IsNullOrWhiteSpace($candidate)) {
            continue
        }

        $expandedCandidate = [Environment]::ExpandEnvironmentVariables($candidate.Trim().Trim('"'))
        try {
            $normalizedCandidate = [System.IO.Path]::GetFullPath($expandedCandidate).TrimEnd('\')
        } catch {
            continue
        }

        if ([string]::Equals($normalizedCandidate, $normalizedEntry, [StringComparison]::OrdinalIgnoreCase)) {
            return $true
        }
    }

    return $false
}

# Resolve the repo root from this script's location, not the caller's cwd.
$DotfilesDir = $PSScriptRoot

# --- Dependency provisioning -------------------------------------------------

Write-Step "Provisioning tools (shell/powershell/setup.ps1)"
$setupArgs = @{}
if ($Optional) { $setupArgs.Optional = $true }
if ($SkipModules) { $setupArgs.SkipModules = $true }
if ($DryRun) { $setupArgs.DryRun = $true }

& (Join-Path $DotfilesDir "shell\powershell\setup.ps1") @setupArgs

# --- Bun linker ---------------------------------------------------------------

$linkerArgs = @("--dotfiles-dir", $DotfilesDir)
if ($SkipSubmodules) {
    $linkerArgs += "--skip-submodules"
}

# --- User PATH ---------------------------------------------------------------

Write-Step "User PATH"
$localBin = Join-Path $env:USERPROFILE ".local\bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)

if (Test-PathEntry -PathValue $userPath -Entry $localBin) {
    Write-Skip "$localBin is already on the user PATH"
} elseif ($DryRun) {
    Write-Warn "(DRY RUN) Would append $localBin to the user PATH"
} else {
    $newUserPath = if ([string]::IsNullOrWhiteSpace($userPath)) {
        $localBin
    } else {
        "$($userPath.TrimEnd(';'));$localBin"
    }
    [Environment]::SetEnvironmentVariable("Path", $newUserPath, [EnvironmentVariableTarget]::User)
    Write-Ok "Appended $localBin to the user PATH"
}

if (-not $DryRun -and -not (Test-PathEntry -PathValue $env:PATH -Entry $localBin)) {
    $env:PATH = "$($env:PATH.TrimEnd(';'));$localBin"
}

Write-Step "Bun linker"

if ($DryRun) {
    Write-Warn "(DRY RUN) Would run: bun scripts\link-dotfiles\link-dotfiles.ts $($linkerArgs -join ' ')"
    exit 0
}

# Refresh the current session's Bun path in case setup.ps1 just installed it.
if (Test-Path "$env:USERPROFILE\.bun") {
    $env:BUN_INSTALL = "$env:USERPROFILE\.bun"
    if ($env:PATH -notlike "*$env:BUN_INSTALL\bin*") {
        $env:PATH += ";$env:BUN_INSTALL\bin"
    }
}

if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Error "bun is still not available on PATH after dependency install. Install it manually (irm bun.sh/install.ps1 | iex) and re-run bootstrap.ps1."
}

& bun (Join-Path $DotfilesDir "scripts\link-dotfiles\link-dotfiles.ts") @linkerArgs
if ($LASTEXITCODE) {
    exit $LASTEXITCODE
}

Write-Ok "Done."
