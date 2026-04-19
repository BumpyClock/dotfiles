---
name: ios-macos-development
description: Build, refactor, test, profile, automate, release, and troubleshoot native iOS and macOS apps. Use when work involves Swift, SwiftUI, UIKit, AppKit, Xcodebuild, simulators, XCTest or Swift Testing, Instruments/xctrace, App Store Connect, TestFlight, signing, notarization, screenshot automation, or native Apple app performance.
---

# iOS macOS Development

## Workflow
- Classify request first: app code, UI architecture, concurrency, perf/profiling, simulator automation, or release/distribution.
- Open only the most relevant nested guide first; pull deeper refs/scripts from that guide as needed.
- Prefer Apple-native APIs and tools over custom wrappers.
- Keep behavior stable unless user asked for behavior change.

## Core Rules
- Add availability guards and fallbacks for platform/version-specific APIs.
- Prefer SwiftUI-first for Apple UI work; use UIKit/AppKit interop only when needed.
- For performance work, fix root cause and measure with `xctrace`/Instruments when code review is not enough.
- For build/release/submission work, prefer `xcodebuild`, `simctl`, `xctrace`, and `asc` CLI flows already captured here.
- This parent skill is the only live trigger. Nested guides keep old content without loading as separate skills.

## Guide Index
- `swift-ui/guide.md` -> SwiftUI architecture, state/data flow, navigation, AppKit interop, toolbars, testing, logging.
- `swift-concurrency-expert/guide.md` -> Swift 6.2 actor isolation, `Sendable`, concurrency compiler remediation.
- `swiftui-liquid-glass/guide.md` -> iOS 26+ Liquid Glass adoption and review.
- `swiftui-view-refactor/guide.md` -> SwiftUI file structure, MV patterns, Observation, dependency injection.
- `swiftui-performance-audit/guide.md` -> SwiftUI-specific performance audit and profiling workflow.
- `native-app-performance/guide.md` -> CLI-only `xctrace` capture, sample export, hotspot analysis.
- `instruments-profiling/guide.md` -> Instruments/xctrace launch, attach, export, and binary-selection gotchas.
- `ios-simulator/guide.md` -> simulator lifecycle, UI automation, accessibility, build/test helpers, debugging snapshots.
- `app-store-connect-cli/guide.md` -> App Store Connect routing, release, signing, metadata, pricing, screenshots, notarization.

## Common Stacks
- SwiftUI feature work: `swift-ui/guide.md` + `swift-concurrency-expert/guide.md`
- Liquid Glass work: `swift-ui/guide.md` + `swiftui-liquid-glass/guide.md`
- SwiftUI perf issue: `swiftui-performance-audit/guide.md` + `native-app-performance/guide.md`
- Simulator automation: `ios-simulator/guide.md`
- Screenshot/release flow: `ios-simulator/guide.md` + `app-store-connect-cli/asc-shots-pipeline/guide.md`
- App Store/TestFlight release: `app-store-connect-cli/asc-xcode-build/guide.md` -> `app-store-connect-cli/asc-release-flow/guide.md` -> `app-store-connect-cli/asc-submission-health/guide.md`
- macOS outside-App-Store distribution: `app-store-connect-cli/asc-signing-setup/guide.md` + `app-store-connect-cli/asc-notarization/guide.md`
