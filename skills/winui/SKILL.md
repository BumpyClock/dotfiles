---
name: winui
description: "WinUI 3 uber skill: setup, build/run/debug, UI/XAML design, code review, UI automation, packaging, WPF migration, and agent session reports."
---

# WinUI 3

Use for WinUI 3 / Windows App SDK apps in C# and XAML: new app setup, build/run loops, Fluent UI design, code review, UI testing, packaging, WPF migration, and WinUI-related agent session review.

## Routing

Open the guide that matches the task before acting:

| Task | Guide |
| --- | --- |
| Install or verify prerequisites: .NET SDK, WinApp CLI, templates, Developer Mode | `references/winui-setup/guide.md` |
| Create, build, run, debug, or fix WinUI app errors | `references/winui-dev-workflow/guide.md` |
| Design or review WinUI UI/XAML, Fluent styling, theme resources, accessibility, layout | `references/winui-design/guide.md` |
| Review code quality before commit: MVVM, x:Bind, security, perf, globalization | `references/winui-code-review/guide.md` |
| Automate UI tests with `winapp ui`, inspect controls, assert state, capture screenshots | `references/winui-ui-testing/guide.md` |
| Package, sign, install, release, MSIX, certs, GitHub Actions, Microsoft Store | `references/winui-packaging/guide.md` |
| Migrate WPF to WinUI 3: namespaces, controls, DispatcherQueue, resources | `references/winui-wpf-migration/guide.md` |
| Analyze Copilot CLI / Claude Code sessions and produce diagnostic report | `references/winui-session-report/guide.md` |

## Shared Rules

- Start with `references/winui-setup/guide.md` if `dotnet`, `winapp`, templates, Developer Mode, or Windows App SDK state is unknown.
- Use `references/winui-dev-workflow/BuildAndRun.ps1` for build/run unless repo provides a stronger local script.
- For UI work, search samples first with `references/winui-design/winui-search.exe`, then write XAML. Read whenever doing XAML work.
- For verification, prefer scripted `winapp ui` tests over manual click-throughs when behavior matters.
- Keep fixes scoped: root cause first, minimal change at right boundary, then rerun build/test gate.

## Reference Layout

Former standalone WinUI skills live under `references/` as nested guides. They intentionally use `guide.md`, not `SKILL.md`, so only this parent skill is live.
