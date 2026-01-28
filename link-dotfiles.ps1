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

# Set DOTFILES_DIR to script location (root)
$script:DOTFILES_DIR = $PSScriptRoot

# Function to initialize git submodules
function Initialize-Submodules {
    Write-Status "Initializing git submodules..."
    
    Push-Location $DOTFILES_DIR
    try {
        git submodule update --init --recursive 2>&1 | Out-Null
        Write-Status "Git submodules initialized"
    }
    catch {
        Write-Warning "Failed to initialize git submodules: $_"
    }
    finally {
        Pop-Location
    }
}

function Get-SymlinkItem {
    param(
        [string]$Path
    )

    try {
        $item = Get-Item -LiteralPath $Path -Force -ErrorAction Stop
    }
    catch {
        return $null
    }

    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        return $item
    }

    return $null
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
            Write-Status "Already linked correctly: $Source -> $Target"
            return $true
        } else {
            Write-Warning "Removing incorrect symlink: $Target -> $currentTarget"
            Remove-Item $Target -Force
        }
    }
    
    # If target exists and is not a symlink, back it up
    if ((Test-Path $Target) -and -not ((Get-Item $Target -Force -ErrorAction SilentlyContinue).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        $backup = "${Target}.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Write-Warning "Backing up existing file: $Target -> $backup"
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
        Write-Action "Linked: $Source -> $Target"
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
    
    # Create ~/.claude and ~/.codex directories if they don't exist
    $claudeDir = "$env:USERPROFILE\.claude"
    if (-not (Test-Path $claudeDir)) {
        New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
    }
    
    $codexDir = "$env:USERPROFILE\.codex"
    if (-not (Test-Path $codexDir)) {
        New-Item -ItemType Directory -Path $codexDir -Force | Out-Null
    }

    $opencodeDir = "$env:USERPROFILE\.config\opencode"
    if (-not (Test-Path $opencodeDir)) {
        New-Item -ItemType Directory -Path $opencodeDir -Force | Out-Null
    }
    
    # Items that remain stored under .claude in the repo
    $claudeItems = @(
        "agents",
        "settings.json"
    )
    
    foreach ($item in $claudeItems) {
        $source = Join-Path $DOTFILES_DIR ".claude\$item"
        $target = Join-Path $claudeDir $item
        
        if (Test-Path $source) {
            New-Symlink -Source $source -Target $target | Out-Null
        }
    }
    
    $aiDir = Join-Path $DOTFILES_DIR ".ai_agents"
    
    $aiLinks = @(
        @{ Source = Join-Path $aiDir "prompts"; Targets = @((Join-Path $claudeDir "commands"), (Join-Path $codexDir "prompts")) },
        @{ Source = Join-Path $aiDir "AGENTS.md"; Targets = @((Join-Path $claudeDir "CLAUDE.md"), (Join-Path $codexDir "AGENTS.md")) },
        @{ Source = Join-Path $aiDir "docs"; Targets = @((Join-Path $claudeDir "docs"), (Join-Path $codexDir "docs")) },
        @{ Source = Join-Path $aiDir "skills"; Targets = @((Join-Path $claudeDir "skills"), (Join-Path $codexDir "skills"), (Join-Path $opencodeDir "skill")) }
    )
    
    foreach ($link in $aiLinks) {
        $source = $link.Source
        if (Test-Path $source) {
            foreach ($target in $link.Targets) {
                New-Symlink -Source $source -Target $target | Out-Null
            }
        }
    }
}

# Function to link GitHub Copilot configuration
function Invoke-LinkCopilotConfig {
    Write-Status "Linking GitHub Copilot configuration..."
    
    # Create ~/.copilot directory if it doesn't exist
    $copilotDir = "$env:USERPROFILE\.copilot"
    if (-not (Test-Path $copilotDir)) {
        New-Item -ItemType Directory -Path $copilotDir -Force | Out-Null
    }
    
    $aiDir = Join-Path $DOTFILES_DIR ".ai_agents"
    
    $copilotLinks = @(
        @{ Source = Join-Path $aiDir "prompts"; Target = Join-Path $copilotDir "prompts" },
        @{ Source = Join-Path $aiDir "AGENTS.md"; Target = Join-Path $copilotDir "instructions.md" },
        @{ Source = Join-Path $aiDir "docs"; Target = Join-Path $copilotDir "docs" },
        @{ Source = Join-Path $aiDir "skills"; Target = Join-Path $copilotDir "skills" }
    )
    
    foreach ($link in $copilotLinks) {
        if (Test-Path $link.Source) {
            New-Symlink -Source $link.Source -Target $link.Target | Out-Null
        }
    }
}

# Function to link GitHub configuration
function Invoke-LinkGitHubConfig {
    Write-Status "Linking GitHub configuration..."
    
    # Create ~/.github directory if it doesn't exist
    $githubDir = "$env:USERPROFILE\.github"
    if (-not (Test-Path $githubDir)) {
        New-Item -ItemType Directory -Path $githubDir -Force | Out-Null
    }
    
    $repoGithubDir = Join-Path $DOTFILES_DIR ".github"
    
    $githubLinks = @(
        @{ Source = Join-Path $repoGithubDir "copilot-instructions.md"; Target = Join-Path $githubDir "copilot-instructions.md" },
        @{ Source = Join-Path $repoGithubDir "prompts"; Target = Join-Path $githubDir "prompts" }
    )
    
    foreach ($link in $githubLinks) {
        if (Test-Path $link.Source) {
            New-Symlink -Source $link.Source -Target $link.Target | Out-Null
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

# Function to install bin scripts to ~/.local/bin (dynamically generated with API keys)
function Install-BinScripts {
    Write-Status "Installing bin scripts to ~/.local/bin..."

    $binDir = "$env:USERPROFILE\.local\bin"
    if (-not (Test-Path $binDir)) {
        New-Item -ItemType Directory -Path $binDir -Force -ErrorAction SilentlyContinue | Out-Null
    }
    # Ensure the directory actually exists before proceeding
    if (-not (Test-Path $binDir)) {
        Write-Error "Failed to create bin directory: $binDir"
        return
    }

    # Check for GLM secrets submodule
    $glmSecretsFile = Join-Path $DOTFILES_DIR "secrets\claude-code\glm\glm.ps1"
    $glmApiKey = $null

    if (Test-Path $glmSecretsFile) {
        # Source secrets file to get API key
        Write-Status "Loading GLM API key from secrets submodule..."
        . $glmSecretsFile
        $glmApiKey = $env:ANTHROPIC_AUTH_TOKEN
    }
    else {
        Write-Warning "GLM secrets not found at: $glmSecretsFile"
        $response = Read-Host "Do you want to install the cz script anyway? (y/n)"
        
        if ($response -eq 'y' -or $response -eq 'Y') {
            $glmApiKey = Read-Host "Enter your Z.ai GLM API key"
            if ([string]::IsNullOrWhiteSpace($glmApiKey)) {
                Write-Warning "No API key provided, skipping cz script generation"
                $glmApiKey = $null
            }
        }
        else {
            Write-Status "Skipping cz script generation"
        }
    }

    # Generate cz.ps1 with GLM API key if available
    if ($glmApiKey) {
        $czTemplate = Join-Path $DOTFILES_DIR "shell\bin\powershell\cz.ps1"
        $czTarget = Join-Path $binDir "cz.ps1"
        
        if (Test-Path $czTemplate) {
            $content = Get-Content -Path $czTemplate -Raw
            $content = $content -replace '__ANTHROPIC_AUTH_TOKEN__', $glmApiKey
            Set-Content -Path $czTarget -Value $content -Force
            Write-Action "Generated: $czTarget"
        }
    }

    # Check for Kimi secrets submodule
    $kimiSecretsFile = Join-Path $DOTFILES_DIR "secrets\claude-code\kimi\kimi.ps1"
    $kimiApiKey = $null
    $kimiBaseUrl = $null
    $kimiModel = $null

    if (Test-Path $kimiSecretsFile) {
        # Source secrets file to get Kimi config
        Write-Status "Loading Kimi API key from secrets submodule..."
        . $kimiSecretsFile
        $kimiApiKey = $env:ANTHROPIC_AUTH_TOKEN
        $kimiBaseUrl = $env:ANTHROPIC_BASE_URL
        $kimiModel = $env:ANTHROPIC_DEFAULT_SONNET_MODEL
    }
    else {
        Write-Warning "Kimi secrets not found at: $kimiSecretsFile"
        Write-Status "Skipping ck script generation (configure kimi.ps1 first)"
    }

    # Generate ck.ps1 with Kimi config if available and not placeholder
    if ($kimiApiKey -and $kimiApiKey -ne "__KIMI_AUTH_TOKEN__") {
        $ckTemplate = Join-Path $DOTFILES_DIR "shell\bin\powershell\ck.ps1"
        $ckTarget = Join-Path $binDir "ck.ps1"
        
        if (Test-Path $ckTemplate) {
            $content = Get-Content -Path $ckTemplate -Raw
            $content = $content -replace '__KIMI_AUTH_TOKEN__', $kimiApiKey
            $content = $content -replace '__KIMI_BASE_URL__', $kimiBaseUrl
            $content = $content -replace '__KIMI_MODEL__', $kimiModel
            Set-Content -Path $ckTarget -Value $content -Force
            Write-Action "Generated: $ckTarget"
        }
    }
    else {
        Write-Warning "Kimi not configured (placeholders detected), skipping ck script generation"
    }

    # Copy ccy.ps1 directly (no secrets needed)
    $ccySource = Join-Path $DOTFILES_DIR "shell\bin\powershell\ccy.ps1"
    $ccyTarget = Join-Path $binDir "ccy.ps1"
    
    if (Test-Path $ccySource) {
        Copy-Item -Path $ccySource -Destination $ccyTarget -Force
        Write-Action "Copied: $ccyTarget"
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

    $dotfiles = @(
        @{ Label = ".gitconfig"; Path = "$env:USERPROFILE\.gitconfig" }
        @{ Label = ".gitignore_global"; Path = "$env:USERPROFILE\.gitignore_global" }
    )

    foreach ($entry in $dotfiles) {
        $item = Get-SymlinkItem -Path $entry.Path
        if ($item) {
            Write-Host "  $($entry.Label)" -ForegroundColor $colors.Blue -NoNewline
            Write-Host " -> $($item.Target)"
        }
    }

    $claudeDir = "$env:USERPROFILE\.claude"
    $claudeLinks = @()
    if (Test-Path $claudeDir) {
        $claudeLinks = Get-ChildItem $claudeDir -Force | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }
    }

    if ($claudeLinks.Count -gt 0) {
        Write-Host "`n  Claude configuration:" -ForegroundColor $colors.Green
        foreach ($link in $claudeLinks) {
            Write-Host "  $($link.Name)" -ForegroundColor $colors.Blue -NoNewline
            Write-Host " -> $($link.Target)"
        }
    }

    $codexDir = "$env:USERPROFILE\.codex"
    $codexLinks = @()
    if (Test-Path $codexDir) {
        $codexLinks = Get-ChildItem $codexDir -Force | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }
    }

    if ($codexLinks.Count -gt 0) {
        Write-Host "`n  Codex configuration:" -ForegroundColor $colors.Green
        foreach ($link in $codexLinks) {
            Write-Host "  $($link.Name)" -ForegroundColor $colors.Blue -NoNewline
            Write-Host " -> $($link.Target)"
        }
    }

    $opencodeSkill = Get-SymlinkItem -Path (Join-Path "$env:USERPROFILE\.config\opencode" "skill")
    if ($opencodeSkill) {
        Write-Host "`n  OpenCode configuration:" -ForegroundColor $colors.Green
        Write-Host "  skill" -ForegroundColor $colors.Blue -NoNewline
        Write-Host " -> $($opencodeSkill.Target)"
    }

    $copilotDir = "$env:USERPROFILE\.copilot"
    $copilotLinks = @()
    if (Test-Path $copilotDir) {
        $copilotLinks = Get-ChildItem $copilotDir -Force | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }
    }

    if ($copilotLinks.Count -gt 0) {
        Write-Host "`n  GitHub Copilot configuration:" -ForegroundColor $colors.Green
        foreach ($link in $copilotLinks) {
            Write-Host "  $($link.Name)" -ForegroundColor $colors.Blue -NoNewline
            Write-Host " -> $($link.Target)"
        }
    }

    $githubDir = "$env:USERPROFILE\.github"
    $githubLinks = @()
    if (Test-Path $githubDir) {
        $githubLinks = Get-ChildItem $githubDir -Force | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }
    }

    if ($githubLinks.Count -gt 0) {
        Write-Host "`n  GitHub configuration:" -ForegroundColor $colors.Green
        foreach ($link in $githubLinks) {
            Write-Host "  $($link.Name)" -ForegroundColor $colors.Blue -NoNewline
            Write-Host " -> $($link.Target)"
        }
    }

    $configDir = "$env:USERPROFILE\.config"
    if (Test-Path $configDir) {
        $configItems = @("starship.toml", "nvim", "alacritty", "wezterm")
        $configPrinted = $false

        foreach ($itemName in $configItems) {
            $path = Join-Path $configDir $itemName
            $item = Get-SymlinkItem -Path $path
            if ($item) {
                if (-not $configPrinted) {
                    Write-Host "`n  Config directories:" -ForegroundColor $colors.Green
                    $configPrinted = $true
                }

                Write-Host "  $itemName" -ForegroundColor $colors.Blue -NoNewline
                Write-Host " -> $($item.Target)"
            }
        }
    }

    $terminalEntries = @(
        @{ Label = "WindowsTerminal LocalState settings.json"; Path = (Join-Path "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState" "settings.json") }
        @{ Label = "WindowsTerminalPreview LocalState settings.json"; Path = (Join-Path "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe\LocalState" "settings.json") }
    )
    $terminalPrinted = $false

    foreach ($entry in $terminalEntries) {
        $item = Get-SymlinkItem -Path $entry.Path
        if ($item) {
            if (-not $terminalPrinted) {
                Write-Host "`n  Windows Terminal:" -ForegroundColor $colors.Green
                $terminalPrinted = $true
            }

            Write-Host "  $($entry.Label)" -ForegroundColor $colors.Blue -NoNewline
            Write-Host " -> $($item.Target)"
        }
    }

    $profilePaths = @($PROFILE, "$env:USERPROFILE\Documents\PowerShell\Microsoft.PowerShell_profile.ps1") | Sort-Object -Unique
    $profilePrinted = $false

    foreach ($profilePath in $profilePaths) {
        $item = Get-SymlinkItem -Path $profilePath
        if ($item) {
            if (-not $profilePrinted) {
                Write-Host "`n  PowerShell profile:" -ForegroundColor $colors.Green
                $profilePrinted = $true
            }

            Write-Host "  $(Split-Path -Leaf $profilePath)" -ForegroundColor $colors.Blue -NoNewline
            Write-Host " -> $($item.Target)"
        }
    }

    $binDir = "$env:USERPROFILE\.local\bin"
    if (Test-Path $binDir) {
        $binScripts = @("cz.ps1", "ck.ps1", "ccy.ps1")
        $binPrinted = $false

        foreach ($script in $binScripts) {
            $path = Join-Path $binDir $script
            $item = Get-SymlinkItem -Path $path
            if ($item) {
                if (-not $binPrinted) {
                    Write-Host "`n  Bin scripts:" -ForegroundColor $colors.Green
                    $binPrinted = $true
                }

                Write-Host "  $script" -ForegroundColor $colors.Blue -NoNewline
                Write-Host " -> $($item.Target)"
            }
        }
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
        Write-Status "OK Agents folder linked successfully to project!" -Color Green
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
    
    # Initialize submodules first
    Initialize-Submodules
    
    Write-Status "Creating dotfile symlinks..."
    Invoke-LinkDotfiles
    Invoke-LinkClaudeConfig
    Invoke-LinkCopilotConfig
    Invoke-LinkGitHubConfig
    Invoke-LinkConfigDirs
    Invoke-LinkWindowsTerminal
    Invoke-LinkPowerShellProfiles
    Install-BinScripts

    Write-Host ""
    Write-Status "OK All symlinks created successfully!" -Color Green
    Write-Host ""
    Write-Status "Run '.\link-dotfiles.ps1 -Show' to see all active symlinks"
}