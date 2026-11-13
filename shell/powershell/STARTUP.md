# PowerShell startup

## Setup versus session work

`setup.ps1` provisions dependencies and calls `prepare-startup.ps1`. Preparation
generates machine-local files in `~\.cache\dotfiles\powershell`:

- `prompt.ps1` contains Oh My Posh's full generated initialization.
- `startup.ps1` loads that initialization, assigns a fresh prompt session ID,
  and adds discovered eza/custom GOPATH directories without duplicating PATH.

Neither file copies managed environment values. Regenerate after an Oh My Posh
upgrade, theme edit, installation-location change, or GOPATH change:

```powershell
pwsh -NoProfile -File shell\powershell\prepare-startup.ps1
```

Use `-ThemePath` for another theme. Preparation reports missing themes, failed
commands, and invalid generated scripts. A generation failure leaves the
existing startup files untouched. `setup.ps1 -DryRun` does not prepare files.

Profiles no longer search theme/eza installation candidates, query Go, or test
whether Bun is installed. There is no startup installation or cache-generation
fallback. Missing preparation produces a warning. Profiles still load optional
managed environment files and configure per-session helpers and terminal state.
ListView is enabled only with VT support and non-redirected output, without
catching and suppressing arbitrary PSReadLine failures.

The shared baseline still runs `fnm env` once per session. Its multishell state
is session-specific and must not be cached during setup.

## Installed profile

The customized PowerShell 7 profile is separate from `shared.ps1`. It already
avoided most setup work, used cached Oh My Posh initialization, and made fnm
activation explicit through `Enable-Fnm`.

It now consumes the same prepared startup files instead of hardcoding a
Store-package cache path and falling back to `oh-my-posh init`. Its helper
functions, aliases, managed environment loading, and Intelligent Terminal /
AgentTerm integration were retained. No broad bootstrap or linker was run.

## Native measurement, 2026-11-13

PowerShell 7.7.0 on Windows. The decision criterion was an end-to-end reduction
larger than run-to-run variation, not simply fewer lines or filesystem calls.

Seven fresh processes per case, one excluded warmup, alternating case order,
existing filesystem caches, and one explicit first prompt render. Streams were
redirected. These are not measurements of interactive terminal input readiness.
The host reported 78 percent CPU load over 28 logical processors; other users'
or desktop workloads were not stopped.

| Workload | Median | Range | Failures |
| --- | ---: | ---: | ---: |
| No profile, default prompt | 879 ms | 569 to 965 ms | 0/7 |
| Original customized profile | 2933 ms | 2345 to 5902 ms | 0/7 |
| Prepared customized profile | 3133 ms | 2365 to 4715 ms | 0/7 |

No measurable installed-profile speedup or regression is established. The
variation is larger than the median difference. A separate statement-level
diagnostic identified Oh My Posh module initialization, which also loads
PSReadLine, as the largest startup block. Its instrumentation overhead is not
included in the comparison. The retained changes move static discovery out of
the shared baseline and remove the customized profile's brittle cache path;
they do not remove themed rendering, PSReadLine, Git information, or integration.

## Hotspot follow-up, 2026-11-13

The reported roughly one-second profile load was reproduced separately from
process startup and the first prompt. PowerShell 7.7.0 loaded PSReadLine 2.4.5;
Oh My Posh reported version 32.0.0.

Seven fresh processes per isolation case, one excluded warmup, alternating
case order, redirected streams, no profile edits, and explicit module/alias
checks. Median time inside profile loading was 1074 ms, range 858 to 1637 ms.
An explicit first prompt added median 627 ms, range 549 to 822 ms. All cases
completed without stderr or process failures. Each full-profile run retained
one silenced error record from the existing event-subscriber lookup.

The lean, uninstrumented profiler with `-SkipPrompt` separately measured
process startup through command completion at median 565 ms without profiles
(542 to 822 ms) and 1672 ms with profiles (1512 to 2348 ms), seven runs each
with zero failures. These process totals include PowerShell startup and exit;
they are not the profile-only interval.

Separate source-instrumented diagnostic copies, five runs after a warmup,
attributed the largest blocks:

| Block | Median | Range | Relationship |
| --- | ---: | ---: | --- |
| Prepared prompt initialization | 737 ms | 723 to 1420 ms | Inclusive of the following module work |
| Oh My Posh module creation/import | 678 ms | 666 to 1334 ms | Nested inside prompt initialization |
| First `Get-PSReadLineOption`, triggering module autoload | 378 ms | 366 to 537 ms | Nested inside module initialization |
| `Invoke-Utf8Posh print secondary`, setting the continuation prompt | 245 ms | 237 to 268 ms | Nested inside module initialization |
| Intelligent Terminal integration | 28 ms | 26 to 35 ms | Separate profile block |
| Managed environment loading | 23 ms | 19 to 24 ms | Separate profile block |

These are nested measurements, not additive rows. Instrumented values are
attribution evidence, not end-to-end benchmark samples. Independent PSReadLine
imports had median 341 ms. Preloading it before the profile moved the cost
outside the profile interval without removing it. Theme initialization is
cached, but running the cached script still imports PSReadLine and launches
the synchronous `print secondary` subprocess every fresh shell.

First-prompt rendering is another cost, especially inside a Git checkout.
One separate Oh My Posh debug sample attributed 419 of 432 ms to the Git
segment, including `git status` at 243 ms and `git remote get-url` at 171 ms.
A five-run alternating directory check measured first-prompt medians of 810 ms
in the checkout and 304 ms at home. Those directory-specific values are not a
before/after speedup.

The evidence points to synchronous prompt/line-editor initialization and Git
prompt rendering, not aliases, helper function bodies, fnm, or setup checks.
The customized profile does not call `Enable-Fnm` during startup.
The shared baseline still initializes fnm and was not the profiled target.
The host was busy and variable, with an initial 95 percent CPU-load sample.
No antivirus, OneDrive, or scheduler cause is established by these captures.
Real interactive input readiness was not measured.

## Repeat checks

```powershell
pwsh -NoLogo -NoProfile -File scripts\profile-powershell-startup.ps1 -Runs 7
pwsh -NoLogo -NoProfile -File scripts\profile-powershell-startup.ps1 -Runs 7 -SkipPrompt
pwsh -NoLogo -NoProfile -File scripts\test-shell-profiles.ps1
pwsh -NoLogo -NoProfile -File scripts\test-bootstrap.ps1
```

Use `-CompareProfile <backup.ps1>` to interleave a saved profile. The profiler
records timings, failures, and error-record counts, never profile output or
environment values. Caught or silenced errors remain in `$Error`, so those
counts are separate from process failures.

Fixture checks cover setup and dry-run behavior, prepared prompt loading,
fresh session IDs, environment loading, fnm, custom GOPATH, aliases, no startup
discovery or installation, reload idempotence, and failed preparation. Native
smoke checks also load the actual customized profile and render its first prompt.
The installed reload check also verifies helper retention, PSReadLine options,
and event-handler idempotence. It excludes only the existing reload helper's
silenced missing-global-alias lookups, not prompt failures.
Parser checks passed in PowerShell 7.7 and Windows PowerShell 5.1. Windows
PowerShell 5.1 runtime behavior and a real interactive terminal remain unqualified.
The profile and setup fixture scripts also passed under PowerShell 7.7 on a
disposable Ubuntu Boat sandbox, with package managers and downloads mocked.
