# Swift and iOS

**Load when:** repo contains Swift/Apple-platform code. Match the Swift tools version and deployment target in the project/`Package.swift`; check before using newer language modes (strict concurrency, typed throws).

## Testing

- Swift Testing for unit/integration tests; XCTest retained for XCUITest (UI flows) and XCTMetric (performance); snapshot tests when the change warrants.

## Security and privacy

- Keychain for sensitive data; encrypt local storage and caches holding user data.
- Enforce ATS/HTTPS; certificate pinning when the threat model requires.
- Validate all inputs including deep links and WebView content; lock down WebView script execution.
- Respect privacy prompts and App Tracking Transparency; keep sensitive data out of logs and analytics.

## Accessibility

- Support VoiceOver, Dynamic Type, and reduced motion; verify with Accessibility Inspector.
