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
    $theme = Join-Path $fixture 'theme.omp.json'
    Set-Content -LiteralPath $theme '{}'
    function oh-my-posh {
        $global:LASTEXITCODE = 0
        '$env:POSH_SESSION_ID = "setup-id"; $env:DOTFILES_TEST_PROMPT = "loaded"'
    }
    function fnm { '$env:DOTFILES_TEST_FNM = "loaded"' }
    function winget { throw 'Profile must not install packages' }
    function Install-Module { throw 'Profile must not install modules' }
    function go { $global:LASTEXITCODE = 0; Join-Path $fixture 'go' }
    function eza { }
    & (Join-Path $root 'shell/powershell/prepare-startup.ps1') -ThemePath $theme
    function oh-my-posh { throw 'Profile must not regenerate prompt initialization' }
    function go { throw 'Profile must not rediscover GOPATH' }
    # Avoid redirected-console prediction errors on hosts without VT.
    function Set-PSReadLineOption { }
    . "$root/shell/powershell/shared.ps1"
    if ($env:DOTFILES_TEST_PROMPT -ne 'loaded') { throw 'Prepared prompt missing' }
    if ($env:POSH_SESSION_ID -eq 'setup-id') { throw 'Profile reused setup-time prompt session ID' }
    $firstSession = $env:POSH_SESSION_ID
    if ($env:DOTFILES_TEST_SENTINEL -ne 'loaded') { throw 'Managed environment missing' }
    if ($env:DOTFILES_TEST_FNM -ne 'loaded') { throw 'fnm initialization missing' }
    $goBin = Join-Path $fixture 'go/bin'
    if (($env:PATH -split ';') -notcontains $goBin) { throw 'Custom GOPATH missing' }
    foreach ($name in @('ctx', 'cmon', 'pnd', 'ls', 'lt')) {
        if (-not (Get-Alias $name)) { throw "Alias missing: $name" }
    }
    foreach ($name in @('gs', 'repo-view', 'claude-yolo', 'Reload-Profile')) {
        if (-not (Get-Command $name -CommandType Function)) { throw "Function missing: $name" }
    }
    . "$root/shell/powershell/shared.ps1"
    if ($env:POSH_SESSION_ID -eq $firstSession) { throw 'Prompt session ID was not refreshed' }
    if (@(($env:PATH -split ';') | Where-Object { $_ -eq $goBin }).Count -ne 1) {
        throw 'Profile reload duplicated GOPATH'
    }
    if (@(($env:PATH -split ';') | Where-Object { $_ -eq "$env:BUN_INSTALL\bin" }).Count -ne 1) {
        throw 'Profile reload duplicated Bun path'
    }
    $subscriptions = @(Get-EventSubscriber | Where-Object SourceIdentifier -eq PowerShell.OnCommandLookupFailed)
    if ($subscriptions.Count -ne 1) { throw 'Profile reload duplicated event handler' }
    function oh-my-posh { $global:LASTEXITCODE = 1; '' }
    $failed = $false
    try {
        & (Join-Path $root 'shell/powershell/prepare-startup.ps1') -ThemePath $theme
    } catch {
        $failed = $true
    }
    if (-not $failed) { throw 'Failed prompt preparation was not reported' }
    Remove-Item Env:DOTFILES_TEST_PROMPT
    . (Join-Path $HOME '.cache/dotfiles/powershell/startup.ps1')
    if ($env:DOTFILES_TEST_PROMPT -ne 'loaded') { throw 'Failed preparation damaged the existing prompt' }
    Write-Output 'PASS prepared prompt, unique sessions, environment, fnm, custom GOPATH, aliases, no startup probes, reload, preparation failure'
} finally {
    Set-Variable HOME $originalHome -Force
    Get-EventSubscriber | Where-Object SourceIdentifier -eq PowerShell.OnCommandLookupFailed | Unregister-Event
    Remove-Item -LiteralPath $fixture -Recurse -Force
}
