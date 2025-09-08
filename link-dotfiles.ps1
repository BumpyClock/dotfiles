#Requires -RunAsAdministrator

param(
    [Parameter()]
    [switch]$Show,
    
    [Parameter()]
    [Alias("h")]
    [switch]$Help,
    
    [Parameter()]
    [string]$ProjectAgents
)

# Enable strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Colors for output
$colors = @{
    Green  = "Green"
    Red    = "Red"
    Yellow = "Yellow"
    Blue   = "Cyan"
    Reset  = "Gray"
}

# Function to print colored output
function Write-Status {
    param($Message, $Color = "Green")
    Write-Host "[INFO] $Message" -ForegroundColor $colors[$Color]
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $colors.Red
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $colors.Yellow
}

function Write-Action {
    param($Message)
    Write-Host "[ACTION] $Message" -ForegroundColor $colors.Blue
}

# Get dotfiles directory (where this script is located)
$DOTFILES_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

# Function to create a symlink with backup
function New-Symlink {
    param(
        [string]$Source,
        [string]$Target
    )
    
    # Check if source exists
    if (-not (Test-Path $Source)) {
        Write-Warning "Source does not exist: $Source"
        return $false
    }
    
    # Ensure parent directory exists
    $parentDir = Split-Path -Parent $Target
    if ($parentDir -and -not (Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }
    
    # If target is already a symlink, check if it points to the correct source
    if ((Test-Path $Target) -and ((Get-Item $Target -Force -ErrorAction SilentlyContinue).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        $currentTarget = (Get-Item $Target -Force).Target
        if ($currentTarget -eq $Source) {
            Write-Status "Already linked correctly: $Source → $Target"
            return $true
        } else {
            Write-Warning "Removing incorrect symlink: $Target → $currentTarget"
            Remove-Item $Target -Force
        }
    }
    
    # If target exists and is not a symlink, back it up
    if ((Test-Path $Target) -and -not ((Get-Item $Target -Force -ErrorAction SilentlyContinue).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        $backup = "${Target}.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Write-Warning "Backing up existing file: $Target → $backup"
        Move-Item -Path $Target -Destination $backup -Force
    }
    
    # Determine if source is a directory or file
    $isDirectory = (Get-Item $Source).PSIsContainer
    
    try {
        if ($isDirectory) {
            New-Item -ItemType SymbolicLink -Path $Target -Target $Source -Force | Out-Null
        } else {
            New-Item -ItemType SymbolicLink -Path $Target -Target $Source -Force | Out-Null
        }
        Write-Action "Linked: $Source → $Target"
        return $true
    }
    catch {
        Write-Error "Failed to create symlink: $_"
        return $false
    }
}

# Function to link all dotfiles
function Invoke-LinkDotfiles {
    Write-Status "Dotfiles directory: $DOTFILES_DIR"
    
    # Define dotfiles to link
    # Format: @{source="relative_path"; target="absolute_path"}
    $dotfiles = @(
        @{source=".gitconfig"; target="$env:USERPROFILE\.gitconfig"}
        @{source=".gitignore_global"; target="$env:USERPROFILE\.gitignore_global"}
    )
    
    # Link each dotfile
    foreach ($entry in $dotfiles) {
        $source = Join-Path $DOTFILES_DIR $entry.source
        
        if (Test-Path $source) {
            New-Symlink -Source $source -Target $entry.target | Out-Null
        }
    }
}

# Function to link Claude configuration
function Invoke-LinkClaudeConfig {
    Write-Status "Linking Claude configuration..."
    
    # Create ~/.claude directory if it doesn't exist
    $claudeDir = "$env:USERPROFILE\.claude"
    if (-not (Test-Path $claudeDir)) {
        New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
    }
    
    # Claude configuration files and directories
    $claudeItems = @(
        "commands",
        "CLAUDE.md",
        "agents",
        "docs",
        "settings.json"
    )
    
    foreach ($item in $claudeItems) {
        $source = Join-Path $DOTFILES_DIR ".claude\$item"
        $target = Join-Path $claudeDir $item
        
        if (Test-Path $source) {
            New-Symlink -Source $source -Target $target | Out-Null
        }
    }
}

# Function to link config directories
function Invoke-LinkConfigDirs {
    Write-Status "Linking configuration directories..."
    
    # Create ~/.config directory if it doesn't exist
    $configDir = "$env:USERPROFILE\.config"
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    }
    
    # Config directories to link
    # Format: @{source="relative_path"; target="absolute_path"}
    $configDirs = @(
        @{source=".config\starship.toml"; target="$configDir\starship.toml"}
        @{source=".config\nvim"; target="$configDir\nvim"}
        @{source=".config\alacritty"; target="$configDir\alacritty"}
        @{source=".config\wezterm"; target="$configDir\wezterm"}
    )
    
    foreach ($entry in $configDirs) {
        $source = Join-Path $DOTFILES_DIR $entry.source
        
        if (Test-Path $source) {
            New-Symlink -Source $source -Target $entry.target | Out-Null
        }
    }
}

# Function to link Windows Terminal settings
function Invoke-LinkWindowsTerminal {
    Write-Status "Linking Windows Terminal configuration..."
    
    # Windows Terminal settings locations (both stable and preview)
    $terminalPaths = @(
        "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState",
        "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe\LocalState"
    )
    
    $settingsFile = ".config\windows-terminal\settings.json"
    $source = Join-Path $DOTFILES_DIR $settingsFile
    
    if (Test-Path $source) {
        foreach ($terminalPath in $terminalPaths) {
            if (Test-Path $terminalPath) {
                $target = Join-Path $terminalPath "settings.json"
                New-Symlink -Source $source -Target $target | Out-Null
            }
        }
    }
}

# Function to link PowerShell profiles
function Invoke-LinkPowerShellProfiles {
    Write-Status "Linking PowerShell profiles..."
    
    # PowerShell profile locations
    $profilePaths = @(
        @{source=".config\powershell\profile.ps1"; target=$PROFILE}
        @{source=".config\powershell\profile.ps1"; target="$env:USERPROFILE\Documents\PowerShell\Microsoft.PowerShell_profile.ps1"}
    )
    
    foreach ($entry in $profilePaths) {
        $source = Join-Path $DOTFILES_DIR $entry.source
        
        if (Test-Path $source) {
            New-Symlink -Source $source -Target $entry.target | Out-Null
        }
    }
}

# Function to link agents folder to project directory
function Invoke-LinkProjectAgents {
    param([string]$ProjectPath)
    
    Write-Status "Linking agents folder to project directory..."
    
    # Validate project path
    if (-not (Test-Path $ProjectPath)) {
        Write-Error "Project directory does not exist: $ProjectPath"
        return $false
    }
    
    # Check if it's a valid directory
    if (-not (Get-Item $ProjectPath).PSIsContainer) {
        Write-Error "Project path is not a directory: $ProjectPath"
        return $false
    }
    
    # Source agents folder
    $agentsSource = Join-Path $DOTFILES_DIR ".claude\agents"
    if (-not (Test-Path $agentsSource)) {
        Write-Error "Agents folder not found in dotfiles: $agentsSource"
        return $false
    }
    
    # Target path in project directory
    $claudeProjectDir = Join-Path $ProjectPath ".claude"
    $agentsTarget = Join-Path $claudeProjectDir "agents"
    
    # Create .claude directory in project if it doesn't exist
    if (-not (Test-Path $claudeProjectDir)) {
        New-Item -ItemType Directory -Path $claudeProjectDir -Force | Out-Null
        Write-Status "Created .claude directory in project: $claudeProjectDir"
    }
    
    # Create the symlink
    if (New-Symlink -Source $agentsSource -Target $agentsTarget) {
        Write-Status "Successfully linked agents folder to project: $ProjectPath"
        return $true
    } else {
        return $false
    }
}

# Function to show current symlinks
function Show-Symlinks {
    Write-Status "Current dotfile symlinks:"
    Write-Host ""
    
    # Check common dotfiles
    $files = @(
        "$env:USERPROFILE\.gitconfig",
        "$env:USERPROFILE\.gitignore_global"
    )
    
    foreach ($file in $files) {
        if ((Test-Path $file) -and ((Get-Item $file -Force -ErrorAction SilentlyContinue).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
            $target = (Get-Item $file).Target
            Write-Host "  $(Split-Path -Leaf $file)" -ForegroundColor $colors.Blue -NoNewline
            Write-Host " → $target"
        }
    }
    
    # Check Claude config
    $claudeDir = "$env:USERPROFILE\.claude"
    if (Test-Path $claudeDir) {
        Write-Host "`n  Claude configuration:" -ForegroundColor $colors.Green
        Get-ChildItem $claudeDir | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint } | ForEach-Object {
            Write-Host "  $($_.Name)" -ForegroundColor $colors.Blue -NoNewline
            Write-Host " → $($_.Target)"
        }
    }
    
    # Check .config directory
    $configDir = "$env:USERPROFILE\.config"
    if (Test-Path $configDir) {
        Write-Host "`n  Config directories:" -ForegroundColor $colors.Green
        $configItems = @("starship.toml", "nvim", "alacritty", "wezterm")
        foreach ($item in $configItems) {
            $path = Join-Path $configDir $item
            if ((Test-Path $path) -and ((Get-Item $path -Force -ErrorAction SilentlyContinue).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
                $target = (Get-Item $path).Target
                Write-Host "  $item" -ForegroundColor $colors.Blue -NoNewline
                Write-Host " → $target"
            }
        }
    }
    
    # Check PowerShell profile
    if ((Test-Path $PROFILE) -and ((Get-Item $PROFILE -Force -ErrorAction SilentlyContinue).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        Write-Host "`n  PowerShell profile:" -ForegroundColor $colors.Green
        Write-Host "  Microsoft.PowerShell_profile.ps1" -ForegroundColor $colors.Blue -NoNewline
        Write-Host " → $((Get-Item $PROFILE).Target)"
    }
}

# Function to show help
function Show-Help {
    Write-Host "Usage: .\link-dotfiles.ps1 [OPTION]"
    Write-Host "Create symlinks for dotfiles from $DOTFILES_DIR to home directory"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Show                  Show current symlinks"
    Write-Host "  -Help, -h             Show this help message"
    Write-Host "  -ProjectAgents PATH   Link .claude/agents folder to specified project directory"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\link-dotfiles.ps1                           # Create all standard symlinks"
    Write-Host "  .\link-dotfiles.ps1 -ProjectAgents C:\myapp   # Link agents to C:\myapp\.claude\agents"
    Write-Host "  .\link-dotfiles.ps1 -Show                     # Show current symlinks"
    Write-Host ""
    Write-Host "Note: This script requires Administrator privileges to create symbolic links"
}

# Main execution
if ($Help) {
    Show-Help
}
elseif ($Show) {
    Show-Symlinks
}
elseif ($ProjectAgents) {
    # Check if running as administrator
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Error "This script must be run as Administrator to create symbolic links"
        Write-Host ""
        Write-Host "Please run PowerShell as Administrator and try again"
        exit 1
    }
    
    # Link agents folder to project directory
    if (Invoke-LinkProjectAgents -ProjectPath $ProjectAgents) {
        Write-Host ""
        Write-Status "✓ Agents folder linked successfully to project!" -Color Green
    } else {
        Write-Host ""
        Write-Error "Failed to link agents folder to project"
        exit 1
    }
}
else {
    # Check if running as administrator
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Error "This script must be run as Administrator to create symbolic links"
        Write-Host ""
        Write-Host "Please run PowerShell as Administrator and try again"
        exit 1
    }
    
    Write-Status "Creating dotfile symlinks..."
    Invoke-LinkDotfiles
    Invoke-LinkClaudeConfig
    Invoke-LinkConfigDirs
    Invoke-LinkWindowsTerminal
    Invoke-LinkPowerShellProfiles
    
    Write-Host ""
    Write-Status "✓ All symlinks created successfully!" -Color Green
    Write-Host ""
    Write-Status "Run '.\link-dotfiles.ps1 -Show' to see all active symlinks"
}