# Theme – lazy load on first prompt
oh-my-posh init pwsh --config "C:\Users\adity\OneDrive\Documents\PowerShell\Themes\dracula.omp.json" | iex

# Node (only once per session)
if (-not $global:FNM_DONE) {
    if (Get-Command fnm -ErrorAction SilentlyContinue) {
        fnm env --shell powershell | Out-String | iex
        $global:FNM_DONE = $true
    } else {
        Write-Host "fnm not found. Installing..." -ForegroundColor Yellow
        winget install Schniz.fnm -h
    }
}

# Chocolatey completions
$chocoProfile = "$env:ChocolateyInstall\helpers\chocolateyProfile.psm1"
if (Test-Path $chocoProfile) { Import-Module $chocoProfile }

# Terminal Icons auto-install and lazy-load
if (-not (Get-Module -ListAvailable -Name Terminal-Icons)) {
    Write-Host "Installing Terminal-Icons..." -ForegroundColor Yellow
    Install-Module -Name Terminal-Icons -Scope CurrentUser -Force -SkipPublisherCheck
}
Register-EngineEvent -SourceIdentifier PowerShell.OnCommandLookupFailed `
    -Action { Import-Module Terminal-Icons -ErrorAction SilentlyContinue }

# Enhanced PSReadLine settings
Set-PSReadLineOption -PredictionSource History -PredictionViewStyle ListView -EditMode Windows
$PSReadLineOptions = @{
    MaximumHistoryCount = 10000
    HistoryNoDuplicates = $true
    BellStyle = "None"
}
Set-PSReadLineOption @PSReadLineOptions

# UTF-8 encoding for better compatibility
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'

# Conda only when explicitly requested
function Use-Conda {
    & "$HOME\miniconda3\Scripts\conda.exe" shell.powershell hook | Out-String | iex
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Context function for LLMs
function Get-Context {
    $currentPath = Get-Location
    $currentDateTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "Working Directory: $currentPath"
    Write-Host "Current Date/Time: $currentDateTime"
}
Set-Alias ctx Get-Context

# Profile Management
function Edit-Profile { code $PROFILE }
function Reload-Profile { & $PROFILE }

# System utilities
function Get-PubIP { (Invoke-WebRequest -Uri "http://ifconfig.me/ip").Content.Trim() }
function uptime { 
    $bootTime = (Get-CimInstance -ClassName Win32_OperatingSystem).LastBootUpTime
    $uptime = (Get-Date) - $bootTime
    Write-Host "Uptime: $($uptime.Days) days, $($uptime.Hours) hours, $($uptime.Minutes) minutes" -ForegroundColor Green
}

# File operations
function touch($file) { "" | Out-File $file -Encoding UTF8 }
function nf($name) { New-Item -ItemType "file" -Path . -Name $name }
function mkcd($dir) { New-Item -ItemType Directory -Name $dir -Force | Set-Location }

# Unix-like commands
function which($name) { Get-Command $name -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Definition }
function grep($regex, $dir) { 
    if ($dir) { Get-ChildItem $dir | Select-String $regex }
    else { $input | Select-String $regex }
}
function df { Get-Volume }
function sudo($command) { Start-Process pwsh -Verb runAs -ArgumentList "-Command $command" }

# Process management
function pstree { Get-Process | Format-Table -AutoSize }
function pkill($name) { Get-Process $name -ErrorAction SilentlyContinue | Stop-Process }

# =============================================================================
# PNPM & WEB DEVELOPMENT SHORTCUTS
# =============================================================================

# Package manager aliases
Set-Alias pn pnpm
Set-Alias pnx "pnpm dlx"

# Development workflow shortcuts (pnpm-focused)
function dev { pnpm dev }
function build { pnpm build }
function preview { pnpm preview }
function test { pnpm test }
function lint { pnpm lint }
function format { pnpm format }

# Package management shortcuts
function pi($package) { pnpm install $package }
function pid($package) { pnpm install --save-dev $package }
function pu($package) { if ($package) { pnpm update $package } else { pnpm update } }
function pr($package) { pnpm remove $package }

# Project shortcuts
function clean-deps { Remove-Item node_modules -Recurse -Force; pnpm install }
function fresh-start { Remove-Item node_modules, pnpm-lock.yaml -Recurse -Force; pnpm install }

# =============================================================================
# GIT & GITHUB CLI SHORTCUTS
# =============================================================================

# GitHub CLI auto-install
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "GitHub CLI not found. Installing..." -ForegroundColor Yellow
    winget install GitHub.cli -h
}

# Basic Git shortcuts
function gs { git status }
function ga($file) { if ($file) { git add $file } else { git add . } }
function gc($message) { git commit -m $message }
function gp { git push }
function gpl { git pull }
function gb { git branch }
function gco($branch) { git checkout $branch }
function gcom($message) { git add .; git commit -m $message }
function lazyg($message) { git add .; git commit -m $message; git push }

# GitHub CLI shortcuts
function repo-view { gh repo view --web }
function repo-clone($repo) { gh repo clone $repo }
function repo-create($name) { gh repo create $name --public }
function repo-fork { gh repo fork --clone }

# Issues
function issues { gh issue list }
function issue-view($number) { gh issue view $number }
function issue-create($title, $body) { gh issue create --title $title --body $body }
function issue-close($number) { gh issue close $number }

# Pull Requests
function prs { gh pr list }
function pr-view($number) { if ($number) { gh pr view $number } else { gh pr view } }
function pr-create { gh pr create }
function pr-checkout($number) { gh pr checkout $number }
function pr-merge($number) { if ($number) { gh pr merge $number } else { gh pr merge } }
function pr-diff($number) { if ($number) { gh pr diff $number } else { gh pr diff } }

# Releases
function releases { gh release list }
function release-view($tag) { gh release view $tag }
function release-create($tag) { gh release create $tag }

# Workflow shortcuts
function workflows { gh workflow list }
function workflow-run($workflow) { gh workflow run $workflow }
function runs { gh run list }
function run-view($id) { gh run view $id }

# =============================================================================
# DEVELOPMENT TOOLS
# =============================================================================

# VS Code shortcuts
function code-here { code . }
function code-diff($file1, $file2) { code --diff $file1 $file2 }

# Docker shortcuts
function docker-clean { docker system prune -f }
function docker-logs($container) { docker logs -f $container }

# Navigation shortcuts
function docs { Set-Location ~\Documents }
function desktop { Set-Location ~\Desktop }
function downloads { Set-Location ~\Downloads }

# =============================================================================
# EXISTING ALIASES
# =============================================================================

# eza aliases
# Try to find eza in various locations
$ezaCommand = Get-Command eza -ErrorAction SilentlyContinue
if (-not $ezaCommand) {
    # Check common winget install locations
    $possiblePaths = @(
        "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\eza-community.eza_Microsoft.Winget.Source_8wekyb3d8bbwe\eza.exe",
        "$env:LOCALAPPDATA\Microsoft\WinGet\Links\eza.exe",
        "$env:ProgramFiles\eza\eza.exe",
        "$env:ProgramFiles(x86)\eza\eza.exe"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $ezaDir = Split-Path $path -Parent
            if ($env:Path -notlike "*$ezaDir*") {
                $env:Path = "$ezaDir;$env:Path"
            }
            break
        }
    }
    $ezaCommand = Get-Command eza -ErrorAction SilentlyContinue
}

if ($ezaCommand) {
    function ls-eza { eza --long --group-directories-first --icons --color }
    Set-Alias ls ls-eza

    function ll { eza -l --all --group-directories-first --icons }
    function la { eza -la --group-directories-first --icons }

    function ls-tree-eza { eza --tree --git-ignore --show-symlinks --icons --hyperlink}
    Set-Alias lt ls-tree-eza
} else {
    Write-Host "eza not found. Installing..." -ForegroundColor Yellow
    winget install eza-community.eza -h
}

# Go environment setup
if (Get-Command go -ErrorAction SilentlyContinue) {
    $goPath = go env GOPATH
    if ($goPath -and (Test-Path "$goPath\bin")) {
        $env:PATH += ";$goPath\bin"
    }
}

# Task Master aliases
if (Get-Command task-master -ErrorAction SilentlyContinue) {
    Set-Alias tm task-master
    Set-Alias taskmaster task-master
}

# Bun environment (if installed)
if (Test-Path "$env:USERPROFILE\.bun") {
    $env:BUN_INSTALL = "$env:USERPROFILE\.bun"
    $env:PATH += ";$env:BUN_INSTALL\bin"
}

function Start-PnpmDev { pnpm dev }
Set-Alias pnd Start-PnpmDev
function claude-yolo { claude --dangerously-skip-permissions @args }
function claude-monitor-plan-max-20 { claude-monitor --plan max20 @args }
Set-Alias cmon claude-monitor-plan-max-20

# Z.AI Claude function
function claude-zai {
    $env:ANTHROPIC_AUTH_TOKEN = "REDACTED_API_KEY"
    $env:ANTHROPIC_BASE_URL = "https://api.z.ai/api/anthropic"
    $env:API_TIMEOUT_MS = "3000000"
    $env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "glm-4.5-air"
    $env:ANTHROPIC_DEFAULT_SONNET_MODEL = "glm-4.6"
    $env:ANTHROPIC_DEFAULT_OPUS_MODEL = "glm-4.6"
    claude @args
}
Set-Alias cz claude-zai

function ccy {
    Remove-Item Env:ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue
    Remove-Item Env:ANTHROPIC_BASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:API_TIMEOUT_MS -ErrorAction SilentlyContinue
    Remove-Item Env:ANTHROPIC_DEFAULT_HAIKU_MODEL -ErrorAction SilentlyContinue
    Remove-Item Env:ANTHROPIC_DEFAULT_SONNET_MODEL -ErrorAction SilentlyContinue
    Remove-Item Env:ANTHROPIC_DEFAULT_OPUS_MODEL -ErrorAction SilentlyContinue
    claude --dangerously-skip-permissions @args
}
