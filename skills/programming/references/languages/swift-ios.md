# Swift and iOS

**Load when:** repo contains Swift/Apple-platform code. Match the Swift tools version and deployment target in the project/`Package.swift`; check before using newer language modes (strict concurrency, typed throws).

## Idioms

- SwiftUI first; integrate UIKit where SwiftUI falls short, wrapped safely.
- Structured concurrency (async/await) for async flows; use GCD only for legacy interop.
- Swift Package Manager for modularization; keep modules small and focused.
- Profile with Instruments before optimizing memory or rendering.

## Design rules

- Prefer value types first. When classes are required, prefer `final` by default; implementation inheritance only when framework or design constraints require it.
- Prefer protocols and composition over class hierarchies.
- Favor immutability and narrow mutation APIs; avoid getter/setter-heavy anemic models.
- Keep one designated initialization path; convenience initializers delegate to it.
- Model absence explicitly with `Optional`, `throws`, or result types; avoid force unwraps.
- Document public protocols, types, and non-obvious APIs with doc comments in English.
- Avoid reflection on object internals unless Apple frameworks require it.
- Avoid utility types with shared mutable static state; pure helpers and factory conveniences are fine.

## Testing

- XCTest for unit/integration; XCUITest for UI flows; snapshot/performance tests when the change warrants.

## Security and privacy

- Keychain for sensitive data; encrypt local storage and caches holding user data.
- Enforce ATS/HTTPS; certificate pinning when the threat model requires.
- Validate all inputs including deep links and WebView content; lock down WebView script execution.
- Respect privacy prompts and App Tracking Transparency; keep sensitive data out of logs and analytics.

## Accessibility

- Support VoiceOver, Dynamic Type, and reduced motion; verify with Accessibility Inspector.
