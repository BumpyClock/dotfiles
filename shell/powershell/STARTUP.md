# PowerShell startup profiling

## Scope and result

Only PowerShell changes are retained. Bash and zsh configurations are unchanged.
The installed, customized PowerShell 7 profile is not linked to `shared.ps1`.
It already omits startup dependency installation and module availability scans.
No broad linker/bootstrap was run, because that would mix the shared baseline
with existing custom functions and terminal integration.

No measurable speedup is claimed for that installed profile. A trial PATH
lookup optimization was reverted after interleaved old/new measurements failed
to establish an end-to-end improvement. Its contents were verified byte-identical
to the backup afterward.

## Measurements

Local Windows host, PowerShell 7.6.9, Oh My Posh 31.9.1.
Fresh processes, existing filesystem caches, one excluded warmup, seven trials
per case with alternating case order. Workload includes one explicit prompt
render. Streams are redirected, so this is not a measurement of a terminal's
interactive input loop. CPU load was approximately 14 percent during initial
inspection. Background desktop applications remained running.

Final installed-profile measurements, without changing its contents:

| Workload | Median | Range | Failures |
| --- | ---: | ---: | ---: |
| No profile, default prompt | 428 ms | 384 to 438 ms | 0/7 |
| Installed profile, first themed prompt | 1652 ms | 1576 to 1716 ms | 0/7 |

Separate, instrumented attribution runs are not benchmark samples.
Oh My Posh initialization occupied approximately 948 ms. A separate fresh-process
PSReadLine import took approximately 520 ms; that import is part of prompt setup,
not an additional independent 520 ms to add to initialization. Prompt rendering
also invokes external Git processes. One Oh My Posh debug run attributed 218 ms
to the Git segment. These remain the main costs. Prompt features, Git information,
and synchronous first-prompt behavior were not disabled to manufacture a speedup.

Windows PowerShell 5.1 could not load profiles under its existing execution
policy. No policy was changed or bypassed.

## Retained shared-profile fixes

- Dependency installation belongs to `setup.ps1`, not terminal startup. fnm,
  GitHub CLI, eza, and Terminal-Icons are still provisioned by that installer.
- Removed the per-startup Terminal-Icons module-directory scan. Seven repeated
  scans in one process had median 35 ms, range 30 to 137 ms. This microbenchmark
  is not an end-to-end startup speedup.
- Register the existing Terminal-Icons event handler once, without printing its
  job object. Reloads no longer accumulate subscribers.
- Preserve history prediction and Windows key bindings. Fall back from ListView
  only when the host cannot support it, such as redirected output.
- Keep theme, fnm initialization, environment loading, aliases, helper functions,
  generated launcher discovery, and custom GOPATH resolution.

## Repeat checks

Run in fresh PowerShell 7 processes:

```powershell
pwsh -NoLogo -NoProfile -File scripts/profile-powershell-startup.ps1 -Runs 7
pwsh -NoLogo -NoProfile -File scripts/test-shell-profiles.ps1
```

The profiler can interleave the installed profile with a backup using
`-CompareProfile path/to/backup.ps1`. It records timings, failures, and error
record counts, never profile output or environment values. Caught or silenced
PowerShell errors remain in `$Error`, so those counts are not failure counts.

Behavior checks passed for environment loading, fnm, custom GOPATH, aliases,
helpers, no startup installs, and reload idempotence. Parser checks passed for
all changed PowerShell scripts. PowerShell LSP was unavailable; parser and runtime
checks, not an empty diagnostics result, provide verification.
