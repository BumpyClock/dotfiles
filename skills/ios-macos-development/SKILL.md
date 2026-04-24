---
name: ios-macos-development
description: Build, refactor, test, profile, automate, release, and troubleshoot native iOS and macOS apps. Use when work involves Swift, SwiftUI, UIKit, AppKit, App Intents, XcodeBuildMCP, Xcodebuild, simulators, XCTest or Swift Testing, Instruments/xctrace, App Store Connect, TestFlight, signing, notarization, screenshot automation, or native Apple app performance.
---

# iOS and macOS Development

## Workflow
- Classify request first: app code, UI patterns, App Intents, concurrency, perf/profiling, simulator automation, live simulator debugging, or release/distribution.
- Open only the most relevant nested guide first; pull deeper refs/scripts from that guide as needed.
- Prefer Apple-native APIs and tools over custom wrappers.
- Keep behavior stable unless user asked for behavior change.

## Core Rules
- Add availability guards and fallbacks only for deployment targets the app supports.
- Prefer SwiftUI-first for Apple UI work; use UIKit/AppKit interop only when needed.
- For performance work, fix root cause and measure with `xctrace`/Instruments when code review is not enough.
- For live iOS simulator debugging, prefer XcodeBuildMCP tools when available; use bundled CLI scripts for repeatable automation and reports.
- For build/release/submission work, prefer `xcodebuild`, `simctl`, `xctrace`, and `asc` CLI flows captured here.
- This parent skill is the only live trigger. Nested guides keep old content without loading as separate skills.

## Guide Index
- `swift-ui/guide.md` -> SwiftUI architecture, state/data flow, AppKit interop, toolbars, testing, logging.
- `swiftui-ui-patterns/guide.md` -> SwiftUI UI patterns, navigation stacks, tabs, sheets, forms, async state, previews, component references.
- `swift-concurrency-expert/guide.md` -> Swift 6.2 actor isolation, `Sendable`, concurrency compiler remediation.
- `ios-app-intents/guide.md` -> App Intents, app entities, App Shortcuts, Shortcuts/Siri/Spotlight/widgets integration.
- `swiftui-liquid-glass/guide.md` -> iOS 26+ Liquid Glass adoption and review.
- `swiftui-view-refactor/guide.md` -> SwiftUI file structure, MV patterns, Observation, dependency injection, stable view trees.
- `swiftui-performance-audit/guide.md` -> SwiftUI-specific performance audit and profiling workflow.
- `native-app-performance/guide.md` -> CLI-only `xctrace` capture, sample export, hotspot analysis.
- `instruments-profiling/guide.md` -> Instruments/xctrace launch, attach, export, and binary-selection gotchas.
- `ios-debugger-agent/guide.md` -> XcodeBuildMCP build/run, UI inspection, logs, screenshots, simulator interaction.
- `ios-simulator/guide.md` -> simulator lifecycle, UI automation, accessibility, build/test helpers, debugging snapshots.
- `app-store-connect-cli/guide.md` -> App Store Connect routing, release, signing, metadata, pricing, screenshots, notarization.

## Common Stacks
- SwiftUI feature work: `swift-ui/guide.md` + `swiftui-ui-patterns/guide.md` + `swift-concurrency-expert/guide.md`
- SwiftUI view cleanup: `swiftui-view-refactor/guide.md` + `swiftui-ui-patterns/guide.md`
- Liquid Glass work: `swift-ui/guide.md` + `swiftui-liquid-glass/guide.md`
- SwiftUI perf issue: `swiftui-performance-audit/guide.md` + `native-app-performance/guide.md`
- App Intents work: `ios-app-intents/guide.md` + `swift-ui/guide.md`
- Run/debug iOS app on Simulator: `ios-debugger-agent/guide.md` + `ios-simulator/guide.md`
- Repeatable simulator automation: `ios-simulator/guide.md`
- Screenshot/release flow: `ios-simulator/guide.md` + `app-store-connect-cli/asc-shots-pipeline/guide.md`
- App Store/TestFlight release: `app-store-connect-cli/asc-xcode-build/guide.md` -> `app-store-connect-cli/asc-release-flow/guide.md` -> `app-store-connect-cli/asc-submission-health/guide.md`
- macOS outside-App-Store distribution: `app-store-connect-cli/asc-signing-setup/guide.md` + `app-store-connect-cli/asc-notarization/guide.md`

## macOS permissions / signing
- Never re-sign, ad-hoc sign, or change bundle ID as debug fix without explicit OK.
