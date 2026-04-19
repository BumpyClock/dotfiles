---
name: swift-ui
description: |
  SwiftUI and Apple UI engineering: build/refactor views, layout, state/data flow, navigation, platform-specific UI for iOS/iPadOS/macOS/visionOS, AppKit interop, Liquid Glass, toolbars, transitions, and SwiftUI troubleshooting. Use for SwiftUI code changes, UI architecture decisions, Swift concurrency and testing guidance tied to UI, or Apple UI debugging (including log redaction).
---

# SwiftUI

## Workflow
- Identify scope: SwiftUI view/layout, AppKit interop, Liquid Glass, toolbar, navigation, concurrency, testing, logging
- Read `references/index.md` for Liquid Glass/toolbar quick nav, APIs, decision trees
- Search `references/swiftui.md` with `rg` and open only relevant sections (huge file)
- Apply architecture/state guidance from `references/modern-swift.md`
- Use `references/swift-concurrency.md` for Swift 6 strict concurrency, Sendable, actor isolation
- Use `references/swift-testing-playbook.md` for Swift Testing patterns and XCTest migration
- Use `references/logging-private-fix.md` when asked about `<private>` log redaction

## SwiftUI docs top-level
- Know overview: declarative UI; views/controls/layout; event handling; model-to-view data flow; App/Scene structure; custom views + modifiers; cross-platform reuse; UIKit/AppKit/WatchKit interop; accessibility + localization
- Know topic buckets: Essentials; App structure; Data and storage; Views; View layout; Event handling; Accessibility; Framework integration; Tool support

## Key findings + guidance (from full swiftui.md)
- App structure: App/Scene entry, windows/immersive spaces, document-based flows, navigation + presentation, commands/search/widgets
- Data + storage: model data, environment, preferences, persistence across launches
- Views: composition, modifiers, animations; text/input; images/symbols; selections/controls; shapes/drawing/graphics effects
- Layout: stacks/grids, alignment/spacing/padding; custom layouts + transitions; lists/tables; forms/control groups; scroll views
- Events: gestures, hardware input, copy/paste, drag/drop, focus/selection, URL/system events
- Accessibility: readability, actions, labeling/description, rotors
- Integration + tooling: UIKit/AppKit/WatchKit interop; framework-provided SwiftUI views; previews, Xcode library exposure, responsiveness tooling
- Guidance: treat `references/swiftui.md` as canonical API index; use `rg` for symbol/task; open only needed sections

## Reference map
- Liquid Glass: `references/liquid-glass/overview.md`, `references/liquid-glass/swiftui.md`, `references/liquid-glass/appkit.md`, `references/liquid-glass/patterns.md`
- Toolbars: `references/toolbar/swiftui-features.md`
- Core SwiftUI API: `references/swiftui.md`
- Modern Swift patterns: `references/modern-swift.md`
- Concurrency: `references/swift-concurrency.md`
- Testing: `references/swift-testing-playbook.md`
- Logging: `references/logging-private-fix.md`

## Output expectations
- Provide platform mins and availability guards when needed
- Prefer SwiftUI-first; mention AppKit only when required
- Keep snippets minimal; point to reference files for deep dives
