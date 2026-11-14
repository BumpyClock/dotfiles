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

## Documented optimization trials, 2026-11-13

The official documentation suggests
[streaming](https://ohmyposh.dev/docs/configuration/streaming) and the Git
segment's experimental
[`native_status`](https://ohmyposh.dev/docs/segments/scm/git) engine.
Both were tested using disposable themes and profile copies. Neither was
enabled in the installed configuration.

- Native Git status preserved the completed prompt text but did not establish
  an improvement. Seven alternating fresh-process trials measured median
  profile-plus-first-prompt time of 1604 ms for the baseline (1443 to 2547 ms)
  and 1498 ms for the candidate (1438 to 2719 ms). The ranges overlap heavily.
  Oh My Posh debug confirmed the limiting mechanism: this checkout contains a
  submodule, so the native engine reports `submodule entries require exec
  fallback` and still launches Git. The documented fallback preserves behavior
  but removes the proposed source of savings here.
- Explicitly importing the same bundled PSReadLine manifest before the profile
  also failed to establish a benefit. Seven alternating trials had large,
  variable delays on both sides. Preloading was not retained.
- Streaming was tested with the documented `"streaming": 100` setting.
  The completed-output comparison failed because the redirected harness
  received placeholders rather than equivalent completed Git information.
  Those lower return times are not counted as a speedup. Streaming is beta,
  and its interactive repaint behavior could not be validated because terminal
  UI automation was unavailable. It was not retained.

The [`async` setting](https://ohmyposh.dev/docs/configuration/general#settings)
defers prompt loading; it does not eliminate initialization. No lower
profile-loading number is claimed merely by moving work into the first prompt.
No antivirus exclusions, security changes, stale Git caches, or hidden Git
information were introduced. The installed theme and profile remain unchanged.

## Plain prompt comparison and Git removal, 2026-11-13

A later comparison retained the customized profile, PSReadLine, and helper
functions in all three cases. The plain case skipped only prepared Oh My Posh
initialization. The no-Git case used an otherwise identical disposable theme.
Seven fresh processes per case followed one excluded warmup, with alternating
case order and redirected streams. CPU load sampled at 27 percent.

| Prompt | Process total median (range) | Profile median | First prompt median |
| --- | --- | --- | --- |
| Original Oh My Posh | 1861 ms (1818 to 1922) | 861 ms | 459 ms |
| Oh My Posh without Git | 1626 ms (1572 to 1741) | 865 ms | 226 ms |
| Plain PowerShell | 1106 ms (1087 to 1186) | 565 ms | 24 ms |

All 21 measured processes succeeded, rendered nonempty prompts, retained
PSReadLine and the `ctx` helper, and loaded the expected prompt implementation.
Each retained the existing silenced event-subscriber lookup error record.
The process totals include startup and exit, not terminal input readiness.
Nested profile and prompt medians must not be added to process totals.

At the user's request, the Git segment was then removed from the installed
`Documents\PowerShell\Themes\dracula.omp.json`, retaining session, path, Node,
and time segments. A timestamped original is in
`~\.cache\dotfiles\powershell\dracula.before-no-git.*.omp.json`.
A fresh-process smoke check verified the installed configuration and prompt.
A separate post-change debug sample reported 9 ms inside the rendering engine;
that excludes process launch and PowerShell integration overhead and is not
comparable to the first-prompt interval above. No Starship installation or
migration was performed, so no relative Starship speed claim is established.

The local comparison harness and raw samples are in the Windows temporary
folder, respectively `compare-posh-prompts.ps1` and
`posh-comparison-bfccc04d4ebf4cb8922ffe724193ccdd\samples.json`.
Those diagnostic artifacts are temporary, not repository dependencies.

Official guidance distinguishes separate costs:

- [`async`](https://ohmyposh.dev/docs/configuration/general#settings) allows
  default prompt/input before themed initialization finishes. It defers work
  rather than removing it. This profile uses prepared initialization, so
  regenerate with `prepare-startup.ps1` after enabling it.
- [Streaming](https://ohmyposh.dev/docs/configuration/streaming) is beta.
  Current documentation describes a persistent PowerShell 6+ background
  renderer that avoids repeated process startup and repaints pending segments.
  It needs interactive testing, especially with other terminal integration.
  It was not enabled by this change.
- [Starship diagnostics](https://starship.rs/faq/#starship-is-doing-something-unexpected-how-can-i-debug-it)
  include `starship timings`. Starship also invokes commands for module data;
  switching engines alone does not establish that startup or Git work is cheap.

## Streaming enabled, 2026-11-13

At the user's request, the installed no-Git theme now sets `"streaming": 100`,
the documented starting timeout. `prepare-startup.ps1` regenerated the cached
initialization. A fresh PowerShell process verified streaming activation,
a nonempty first prompt, and PSReadLine 2.4.5. The existing one silenced
lookup error record remained. Interactive repaint behavior and input readiness
still require a real terminal check; no additional speedup is claimed.

The pre-streaming theme and generated startup files are backed up in
`~\.cache\dotfiles\powershell\before-streaming-20261113163543`.
Open a new tab to activate the regenerated initialization. To disable streaming,
remove the theme's `streaming` property, rerun `prepare-startup.ps1`, and open
a new tab.

## Git restored with streaming, 2026-11-13

At the user's request, the original Git segment was restored from the
pre-removal theme backup while retaining `"streaming": 100`. Its stash and
upstream options are unchanged. A fresh-process smoke check verified active
streaming, a nonempty first prompt, and a separate completed render containing
the checkout's current branch. This does not validate interactive asynchronous
repainting or establish a speedup. The user can now compare new-tab behavior
with Git present. Initialization was already generated with streaming enabled;
this edit changes only segment configuration.

## Streaming rolled back after terminal failure, 2026-11-13

The user reported that the streaming prompt never updates in their terminal.
The earlier redirected smoke checks did not qualify interactive repainting.
Streaming was disabled and prepared initialization regenerated. The restored
Git segment remains enabled. A fresh-process check verified streaming is off
and the actual synchronous `prompt` output contains the current Git branch.
The installed Intelligent Terminal integration wraps both `prompt` and
`PSConsoleHostReadLine`; a conflict is a hypothesis, not an established cause.
Do not re-enable streaming based only on redirected prompt checks.

## Starship migration and Pure preset, 2026-11-13

At the user's request, WinGet installed `Starship.Starship` 1.27.0. The installed
customized PowerShell 7 profile now initializes Starship from
`$env:ProgramFiles\starship\bin\starship.exe` instead of loading the prepared
Oh My Posh startup. Other profile settings, helpers, and terminal integration
remain intact. Oh My Posh remains installed for rollback. This is a local
profile migration; the repository's shared baseline and provisioning scripts
still default to Oh My Posh.

The user tried the official Dracula configuration, then the built-in
`pastel-powerline` preset, and selected `pure-preset` as the final configuration
in `~\.config\starship.toml`. A fresh-process smoke check verified Pure's
prompt character, the current Git branch, and absence of the Oh My Posh module.
Prior Dracula and Pastel configurations are backed up as
`~\.cache\dotfiles\powershell\starship.dracula.toml` and
`starship.pastel-powerline.toml`. The original customized profile is backed up
in `~\.cache\dotfiles\powershell\before-starship-20261113164725`.

No measurable launch improvement was established for the two benchmarked
Starship configurations. Seven fresh processes per case followed one excluded
warmup, with alternating case order, redirected streams, and one completed
first prompt. Each case had zero process/stderr failures.

| Run | Starship median (range) | Oh My Posh median (range) | No profile median (range) |
| --- | --- | --- | --- |
| Dracula | 2103 ms (1927 to 2267) | 2123 ms (2034 to 2579) | 563 ms (507 to 588) |
| Pastel Powerline | 2073 ms (1896 to 2302) | 2139 ms (1940 to 2341) | 582 ms (534 to 633) |

Differences are within run variation. Themes expose different information;
these compare actual configurations, not identical rendering engines.
A separate `starship timings` diagnostic with Dracula identified Git status
at 225 ms and directory rendering at 156 ms as its largest modules. CPU load
sampled at 51 percent after the Dracula runs. Process totals include launch
and exit, not interactive terminal input readiness. Pure was smoke-tested,
not benchmarked, so these numbers must not be attributed to Pure.

Raw reports are in `~\.cache\dotfiles\powershell\starship-comparison.json`,
`starship-comparison-no-prompt.json`, and `starship-pastel-comparison.json`.
The saved Oh My Posh profile can be supplied to the existing profiler's
`-CompareProfile` parameter to repeat the comparison with the current preset.

Sources read during migration were the
[Starship guide](https://starship.rs/guide/) and
[official Dracula configuration](https://raw.githubusercontent.com/dracula/starship/master/starship.theme.toml).
The installed Starship CLI generated both built-in presets directly.

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
