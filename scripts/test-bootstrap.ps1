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
    $env:PATH = ''
    $env:OneDrive = $env:OneDriveConsumer = $env:OneDriveCommercial = ''

    function pwsh { }
    function git { }
    function oh-my-posh { throw 'Existing font must not be reinstalled' }
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

    # Substitute only the native Documents boundary so no real user files are read.
    $source = Get-Content (Join-Path $root 'shell/powershell/setup.ps1') -Raw
    $source = $source.Replace(
        '[Environment]::GetFolderPath([Environment+SpecialFolder]::MyDocuments)',
        '(Join-Path $HOME "Documents")'
    )
    $setupScript = Join-Path $fixture 'setup.ps1'
    Set-Content $setupScript $source
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

    Write-Output 'PASS repeat setup, missing Node, registered package, Bun on PATH, Bun executable, incomplete Bun install'
} finally {
    Remove-Variable DotfilesBootstrapTestCalls -Scope Global
    Set-Variable HOME $originalHome -Force
    foreach ($name in $originalEnv.Keys) {
        [Environment]::SetEnvironmentVariable($name, $originalEnv[$name])
    }
    Remove-Item -LiteralPath $fixture -Recurse -Force
}
