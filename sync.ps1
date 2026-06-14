<#
.SYNOPSIS
    Sync dotfiles repo: optionally discard local changes/commits, fast-forward pull, update submodules.
.DESCRIPTION
    Default flow discards unstaged tracked-file changes, fast-forwards from
    origin, then inits and recursively updates submodules to parent-recorded SHAs.
    Warns when local has unpushed commits (use -DiscardCommits to drop them).
    Use -Latest to bump submodules to upstream HEAD first.
.PARAMETER Keep
    Preserve local tracked-file changes instead of discarding unstaged edits.
.PARAMETER DiscardCommits
    Drop unpushed local commits AND unstaged changes (hard-reset to upstream).
.PARAMETER NoSubmodules
    Skip submodule update.
.PARAMETER Latest
    Bump submodules to upstream HEAD (--merge) before recursive update.
.EXAMPLE
    .\sync.ps1
.EXAMPLE
    .\sync.ps1 -DiscardCommits -Latest
#>
[CmdletBinding()]
param(
    [switch]$Keep,
    [switch]$DiscardCommits,
    [switch]$NoSubmodules,
    [switch]$Latest
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $RepoRoot

function Info($m) { Write-Host "[INFO]  $m" -ForegroundColor Green }
function Warn($m) { Write-Host "[WARN]  $m" -ForegroundColor Yellow }
function Err($m)  { Write-Host "[ERROR] $m" -ForegroundColor Red }

if ($Keep -and $DiscardCommits) {
    Err "-Keep and -DiscardCommits are mutually exclusive"
    exit 1
}

Info "Repo: $RepoRoot"

Info "Fetching origin"
git fetch origin --quiet

$Branch    = git rev-parse --abbrev-ref HEAD
$Upstream  = git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null
if (-not $Upstream) { $Upstream = "origin/$Branch" }
$Ahead  = [int](git rev-list --count "$Upstream..HEAD" 2>$null)
if (-not $Ahead)  { $Ahead = 0 }
$Behind = [int](git rev-list --count "HEAD..$Upstream" 2>$null)
if (-not $Behind) { $Behind = 0 }

if ($Ahead  -gt 0) { Warn "Local is $Ahead commit(s) ahead of $Upstream" }
if ($Behind -gt 0) { Warn "Local is $Behind commit(s) behind $Upstream" }

if ($DiscardCommits) {
    $dirty = git status --porcelain
    if ($dirty -or $Ahead -gt 0) {
        Warn "Hard-resetting to $Upstream (-DiscardCommits)"
        git reset --hard $Upstream
    } else {
        Info "Nothing to discard"
    }
} else {
    if ($Ahead -gt 0 -and $Behind -gt 0) {
        Err "Diverged from $Upstream. Use -DiscardCommits or rebase manually."
        exit 1
    }
    if (-not $Keep) {
        $dirty = git status --porcelain
        if ($dirty) {
            Warn "Discarding unstaged changes (-Keep to preserve)"
            git restore .
        }
    }
    if ($Ahead -gt 0) {
        Warn "Keeping $Ahead local commit(s); --ff-only will no-op. Use -DiscardCommits to drop them."
    }
    Info "Pulling (fast-forward only)"
    git pull --ff-only
}

if (-not $NoSubmodules) {
    if ($Latest) {
        Info "Bumping submodules to upstream HEAD (--merge)"
        git submodule update --remote --merge
    }
    Info "Updating submodules (init + recursive)"
    git submodule update --init --recursive
}

Info "Done"
git status --short -b
git submodule status
