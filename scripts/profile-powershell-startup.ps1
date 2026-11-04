<#
.SYNOPSIS
Measures fresh PowerShell processes through the first explicitly rendered prompt.
.DESCRIPTION
Runs use redirected streams, not a terminal emulator. One warmup per case is
excluded. Case order alternates to distribute load and cache drift. Profile
output and environment values are never logged. Error records include caught
and silenced errors, so they are reported separately from process failures.
#>
[CmdletBinding()]
param(
    [ValidateRange(1, 100)][int]$Runs = 7,
    [string]$Executable = (Get-Process -Id $PID).Path,
    [string]$CompareProfile,
    [string]$OutputPath
)

$command = '$null = prompt; [Console]::WriteLine("__STARTUP_READY__"); [Console]::WriteLine("__ERROR_RECORDS__=" + $Error.Count)'
$cases = [ordered]@{
    bare = @('-NoLogo', '-NoProfile', '-NonInteractive', '-Command', $command)
    profile = @('-NoLogo', '-NonInteractive', '-Command', $command)
}
if ($CompareProfile) {
    $escaped = (Resolve-Path -LiteralPath $CompareProfile).Path.Replace("'", "''")
    $load = 'foreach ($p in @($PROFILE.AllUsersAllHosts, $PROFILE.AllUsersCurrentHost, $PROFILE.CurrentUserAllHosts)) { if (Test-Path -LiteralPath $p) { . $p } }; '
    $cases['comparison'] = @('-NoLogo', '-NoProfile', '-NonInteractive', '-Command', ($load + ". '$escaped'; " + $command))
}
$samples = @{}
foreach ($name in $cases.Keys) { $samples[$name] = [Collections.Generic.List[object]]::new() }
for ($trial = 0; $trial -le $Runs; $trial++) {
    $order = @($cases.Keys)
    if ($trial % 2) { [array]::Reverse($order) }
    foreach ($name in $order) {
        $start = [Diagnostics.ProcessStartInfo]::new()
        $start.FileName = $Executable
        # ArgumentList requires PowerShell 7/.NET Core. Run this profiler with pwsh.
        foreach ($argument in $cases[$name]) { $start.ArgumentList.Add($argument) }
        $start.UseShellExecute = $false
        $start.RedirectStandardOutput = $true
        $start.RedirectStandardError = $true
        $start.RedirectStandardInput = $true
        $process = [Diagnostics.Process]::new()
        $process.StartInfo = $start
        $timer = [Diagnostics.Stopwatch]::StartNew()
        try {
            [void]$process.Start()
            $process.StandardInput.Close()
            $stdout = $process.StandardOutput.ReadToEndAsync()
            $stderr = $process.StandardError.ReadToEndAsync()
            $finished = $process.WaitForExit(30000)
            if (-not $finished) { $process.Kill($true); $process.WaitForExit() }
            $timer.Stop()
            $text = $stdout.GetAwaiter().GetResult()
            $hasStderr = -not [string]::IsNullOrWhiteSpace($stderr.GetAwaiter().GetResult())
            $records = if ($text -match '__ERROR_RECORDS__=(\d+)') { [int]$Matches[1] } else { $null }
            if ($trial) {
                $samples[$name].Add([pscustomobject]@{
                    Milliseconds = [Math]::Round($timer.Elapsed.TotalMilliseconds, 3)
                    Failed = (-not $finished -or $process.ExitCode -ne 0 -or $hasStderr -or $text -notmatch '__STARTUP_READY__')
                    ErrorRecords = $records
                })
            }
        } finally { $process.Dispose() }
    }
}
$report = foreach ($name in $cases.Keys) {
    $values = @($samples[$name].Milliseconds | Sort-Object)
    $median = if ($Runs % 2) { $values[[int][Math]::Floor($Runs / 2)] } else { ($values[$Runs / 2 - 1] + $values[$Runs / 2]) / 2 }
    [pscustomobject]@{
        Case = $name
        Runs = $Runs
        MedianMs = [Math]::Round($median, 3)
        MinMs = $values[0]
        MaxMs = $values[-1]
        Failures = @($samples[$name] | Where-Object Failed).Count
        Samples = @($samples[$name])
    }
}
$report | Select-Object Case,Runs,MedianMs,MinMs,MaxMs,Failures | Format-Table
if ($OutputPath) { $report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $OutputPath -Encoding utf8 }
if (@($report | Where-Object Failures).Count) { exit 1 }
