# Run in a fresh pwsh -NoProfile process. Never installs tools or reads real secrets.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$fixture = Join-Path ([IO.Path]::GetTempPath()) ('dotfiles-shell-' + [guid]::NewGuid())
$originalHome = $HOME
try {
    New-Item -ItemType Directory -Path "$fixture/go/bin", "$fixture/.config/dotfiles" -Force | Out-Null
    Set-Variable HOME $fixture -Force
    $env:USERPROFILE = $fixture
    Set-Content "$fixture/.config/dotfiles/env.ps1" '$env:DOTFILES_TEST_SENTINEL = "loaded"'
    function oh-my-posh { '$null = $true' }
    function fnm { '$env:DOTFILES_TEST_FNM = "loaded"' }
    function winget { throw 'Profile must not install packages' }
    function Install-Module { throw 'Profile must not install modules' }
    function go { "$fixture/go" }
    # Avoid redirected-console prediction errors on hosts without VT.
    function Set-PSReadLineOption { }
    . "$root/shell/powershell/shared.ps1"
    if ($env:DOTFILES_TEST_SENTINEL -ne 'loaded') { throw 'Managed environment missing' }
    if ($env:DOTFILES_TEST_FNM -ne 'loaded') { throw 'fnm initialization missing' }
    if (($env:PATH -split ';') -notcontains "$fixture/go\bin") { throw 'Custom GOPATH missing' }
    foreach ($name in @('ctx', 'cmon', 'pnd')) {
        if (-not (Get-Alias $name)) { throw "Alias missing: $name" }
    }
    foreach ($name in @('gs', 'repo-view', 'claude-yolo', 'Reload-Profile')) {
        if (-not (Get-Command $name -CommandType Function)) { throw "Function missing: $name" }
    }
    . "$root/shell/powershell/shared.ps1"
    $subscriptions = @(Get-EventSubscriber | Where-Object SourceIdentifier -eq PowerShell.OnCommandLookupFailed)
    if ($subscriptions.Count -ne 1) { throw 'Profile reload duplicated event handler' }
    Write-Output 'PASS environment, fnm, custom GOPATH, aliases, helpers, no installs, reload'
} finally {
    Set-Variable HOME $originalHome -Force
    Get-EventSubscriber | Where-Object SourceIdentifier -eq PowerShell.OnCommandLookupFailed | Unregister-Event
    Remove-Item -LiteralPath $fixture -Recurse -Force
}
