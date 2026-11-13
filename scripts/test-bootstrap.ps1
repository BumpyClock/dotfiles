# Run with pwsh -NoProfile -File scripts/test-bootstrap.ps1. No installs/network.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$fixture = Join-Path ([IO.Path]::GetTempPath()) ('dotfiles-bootstrap-' + [guid]::NewGuid())
$originalHome = $HOME
$originalEnv = @{}
foreach ($name in @('USERPROFILE', 'LOCALAPPDATA', 'SystemRoot', 'PATH', 'OneDrive', 'OneDriveConsumer', 'OneDriveCommercial')) {
    $originalEnv[$name] = [Environment]::GetEnvironmentVariable($name)
}
$global:DotfilesBootstrapTestCalls = [Collections.Generic.List[string]]::new()
try {
    New-Item -ItemType Directory -Path $fixture -Force | Out-Null
    Set-Variable HOME $fixture -Force
    $env:USERPROFILE = $fixture
    $env:LOCALAPPDATA = Join-Path $fixture 'AppData'
    $env:SystemRoot = Join-Path $fixture 'Windows'
    $sessionBin = Join-Path $fixture 'session-bin'
    $env:PATH = $sessionBin
    $env:OneDrive = $env:OneDriveConsumer = $env:OneDriveCommercial = ''

    function pwsh { }
    function git { }
    function oh-my-posh {
        if ($args[0] -ne 'init') { throw 'Existing font must not be reinstalled' }
        $global:LASTEXITCODE = 0
        '$env:POSH_SESSION_ID = "setup-id"'
    }
    function go { $global:LASTEXITCODE = 0; Join-Path $fixture 'go' }
    function gh { }
    function eza { }
    function code { }
    function copilot { }
    function pnpm { }
    function bun { }
    function wt { }
    function node { }
    function fnm {
        if ($args[0] -eq 'env') { '$null = $true'; return }
        $global:DotfilesBootstrapTestCalls.Add("fnm $($args -join ' ')")
        if ($args[0] -eq 'install') { Set-Item Function:global:node { } }
    }
    function winget {
        if ($args[0] -eq 'list') {
            $global:LASTEXITCODE = 0
            'GitHub.Copilot'
        } else {
            throw "Unexpected winget install: $args"
        }
    }
    function Get-Module { param($Name, [switch]$ListAvailable) [pscustomobject]@{ Name = $Name } }
    function Install-Module { throw 'Existing modules must not be reinstalled' }
    function Unblock-File { param($Path, $ErrorAction) }
    function Get-ExecutionPolicy {
        param([switch]$List)
        if ($List) {
            [pscustomobject]@{ Scope = 'MachinePolicy'; ExecutionPolicy = 'Undefined' }
            [pscustomobject]@{ Scope = 'UserPolicy'; ExecutionPolicy = 'Undefined' }
        } else { 'RemoteSigned' }
    }
    function Invoke-RestMethod {
        param($Uri)
        if ($Uri -ne 'bun.sh/install.ps1') { throw "Unexpected download: $Uri" }
        '$global:DotfilesBootstrapTestCalls.Add("install bun")'
    }
    function Invoke-WebRequest { throw 'Existing theme must not be downloaded' }

    # Substitute native Documents and registry PATH boundaries.
    $source = Get-Content (Join-Path $root 'shell/powershell/setup.ps1') -Raw
    $source = $source.Replace(
        '[Environment]::GetFolderPath([Environment+SpecialFolder]::MyDocuments)',
        '(Join-Path $HOME "Documents")'
    )
    foreach ($scope in @('Machine', 'User')) {
        $registryBin = Join-Path $fixture "$scope-bin"
        $source = $source.Replace("[Environment]::GetEnvironmentVariable('Path', '$scope')", "'$registryBin'")
    }
    $setupScript = Join-Path $fixture 'setup.ps1'
    Set-Content $setupScript $source
    Copy-Item (Join-Path $root 'shell/powershell/prepare-startup.ps1') (Join-Path $fixture 'prepare-startup.ps1')
    $theme = Join-Path $fixture 'Documents/PowerShell/Themes/dracula.omp.json'
    New-Item -ItemType Directory -Path (Split-Path $theme) -Force | Out-Null
    Set-Content $theme '{}'
    $fonts = Join-Path $env:LOCALAPPDATA 'Microsoft/Windows/Fonts'
    New-Item -ItemType Directory -Path $fonts -Force | Out-Null
    Set-Content (Join-Path $fonts 'FiraCode-Nerd.ttf') ''

    function Run-Setup {
        & $setupScript
    }
    function Assert-Calls {
        param([string[]]$Expected = @())
        if (($global:DotfilesBootstrapTestCalls -join '|') -ne ($Expected -join '|')) {
            throw "Expected [$($Expected -join ', ')], got [$($global:DotfilesBootstrapTestCalls -join ', ')]"
        }
        $global:DotfilesBootstrapTestCalls.Clear()
    }

    Run-Setup
    Run-Setup
    Assert-Calls
    foreach ($entry in @($sessionBin, (Join-Path $fixture 'Machine-bin'), (Join-Path $fixture 'User-bin'))) {
        if (@(($env:PATH -split ';') | Where-Object { $_ -eq $entry }).Count -ne 1) {
            throw 'Setup did not preserve and deduplicate session and registry PATH entries'
        }
    }
    $startup = Join-Path $HOME '.cache/dotfiles/powershell/startup.ps1'
    if (-not (Test-Path -LiteralPath $startup)) { throw 'Setup did not prepare profile startup' }
    Remove-Item -LiteralPath $startup
    & $setupScript -DryRun
    if (Test-Path -LiteralPath $startup) { throw 'Dry run wrote profile startup files' }

    Remove-Item Function:node
    Run-Setup
    Assert-Calls @('fnm install --lts', 'fnm default lts-latest')
    Run-Setup
    Assert-Calls

    Remove-Item Function:copilot
    Run-Setup
    Assert-Calls
    function copilot { }

    Remove-Item Function:bun
    $bunDir = Join-Path $fixture '.bun/bin'
    New-Item -ItemType Directory -Path $bunDir -Force | Out-Null
    Set-Content (Join-Path $bunDir 'bun.exe') ''
    Run-Setup
    Assert-Calls

    Remove-Item (Join-Path $bunDir 'bun.exe')
    Run-Setup
    Assert-Calls @('install bun')

    Write-Output 'PASS repeat setup, PATH refresh, dry run, missing Node, registered package, Bun on PATH, Bun executable, incomplete Bun install'
} finally {
    Remove-Variable DotfilesBootstrapTestCalls -Scope Global
    Set-Variable HOME $originalHome -Force
    foreach ($name in $originalEnv.Keys) {
        [Environment]::SetEnvironmentVariable($name, $originalEnv[$name])
    }
    Remove-Item -LiteralPath $fixture -Recurse -Force
}
