---
name: ios-macos-development
description: "iOS/macOS dev: Swift, SwiftUI, UIKit/AppKit, xcodebuild, XCTest, signing."
---

# iOS and macOS Development

## Workflow
- Classify request: app code, SwiftUI patterns, Swift Concurrency, Liquid Glass, App Intents, perf/profiling, simulator automation, live simulator debugging, or release/distribution.
- Open most relevant nested guide first; pull deeper refs from that guide.
- Prefer Apple-native APIs/tools over custom wrappers.
- Keep behavior stable unless user asked for behavior change.

## Core Rules
- Add availability guards/fallbacks only for supported deployment targets.
- Prefer SwiftUI-first; UIKit/AppKit interop only when needed.
- Perf work: fix root cause, measure with `xctrace`/Instruments when code review insufficient.
- Live iOS simulator debugging: prefer XcodeBuildMCP tools when available; bundled CLI scripts for repeatable automation.
- Build/release/submission: prefer `xcodebuild`, `simctl`, `xctrace`, `asc` CLI flows.
- This parent skill is the broad Apple-platform trigger. Use nested guides for depth; don't paste whole nested guides here.

## Specialized Swift Routing
- Swift 6.2 compiler errors, `Sendable`, actor isolation, data-race warnings → `swift-concurrency-expert/guide.md`
- SwiftUI architecture, navigation, state, component structure → `swift-ui/guide.md` + `swiftui-ui-patterns/guide.md`
- Liquid Glass design/adoption/review → `swiftui-liquid-glass/guide.md`; verify iOS 26+ availability + fallback before shipping
- SwiftUI performance symptoms → `swiftui-performance-audit/guide.md`; combine with `native-app-performance/guide.md` or `instruments-profiling/guide.md` for trace evidence

## Guide Index
- `swift-ui/guide.md` → SwiftUI architecture, state/data flow, AppKit interop, toolbars, testing, logging
- `swiftui-ui-patterns/guide.md` → SwiftUI UI patterns, navigation stacks, tabs, sheets, forms, async state, previews
- `swift-concurrency-expert/guide.md` → Swift 6.2 actor isolation, `Sendable`, concurrency remediation
- `ios-app-intents/guide.md` → App Intents, entities, Shortcuts/Siri/Spotlight/widgets
- `swiftui-liquid-glass/guide.md` → iOS 26+ Liquid Glass adoption
- `swiftui-view-refactor/guide.md` → SwiftUI file structure, MV patterns, Observation, DI, stable view trees
- `swiftui-performance-audit/guide.md` → SwiftUI-specific perf audit
- `native-app-performance/guide.md` → CLI-only `xctrace` capture, sample export, hotspot analysis
- `instruments-profiling/guide.md` → Instruments/xctrace launch, attach, export, binary-selection gotchas
- `ios-debugger-agent/guide.md` → XcodeBuildMCP build/run, UI inspection, logs, screenshots, simulator interaction
- `ios-simulator/guide.md` → simulator lifecycle, UI automation, accessibility, build/test helpers
- `app-store-connect-cli/guide.md` → App Store Connect routing, release, signing, metadata, pricing, screenshots, notarization

## Common Stacks
- SwiftUI feature: `swift-ui/` + `swiftui-ui-patterns/` + `swift-concurrency-expert/`
- SwiftUI view cleanup: `swiftui-view-refactor/` + `swiftui-ui-patterns/`
- Liquid Glass: `swift-ui/` + `swiftui-liquid-glass/`
- SwiftUI perf: `swiftui-performance-audit/` + `native-app-performance/`
- App Intents: `ios-app-intents/` + `swift-ui/`
- Run/debug iOS Simulator: `ios-debugger-agent/` + `ios-simulator/`
- Repeatable simulator automation: `ios-simulator/`
- Screenshot/release: `ios-simulator/` + `app-store-connect-cli/asc-shots-pipeline/guide.md`
- App Store/TestFlight: `app-store-connect-cli/asc-xcode-build/guide.md` → `app-store-connect-cli/asc-release-flow/guide.md` → `app-store-connect-cli/asc-submission-health/guide.md`
- macOS outside-App-Store: `app-store-connect-cli/asc-signing-setup/guide.md` + `app-store-connect-cli/asc-notarization/guide.md`

## macOS Permissions / Signing
- Never re-sign, ad-hoc sign, or change bundle ID as debug fix without explicit OK.
