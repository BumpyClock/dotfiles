# Swift and iOS

Build native Apple platform apps with Swift 6, SwiftUI, and UIKit while meeting performance, privacy, and App Store requirements.

## Core iOS development
- Use Swift 6 language features, strict concurrency, and typed throws.
- Prefer SwiftUI first, integrate UIKit when needed.
- Use Xcode toolchain and Swift Package Manager.
- Follow app lifecycle and scene management patterns.

## SwiftUI
- Use modern state management (@State, @Binding, @ObservedObject, @StateObject).
- Build reusable view modifiers and view builders.
- Use Combine or async/await for reactive flows.
- Optimize navigation and layout performance.

## UIKit integration
- Wrap UIKit views and view controllers safely.
- Use Auto Layout, diffable data sources, and custom transitions.
- Plan migration paths for legacy UIKit code.

## Architecture
- Apply MVVM, Clean Architecture, and coordinator patterns.
- Use protocol-oriented design and dependency injection.
- Keep modules small and focused, backed by Swift Packages.

## Data and persistence
- Use Core Data or SwiftData when appropriate.
- Secure sensitive data with Keychain.
- Use CloudKit for sync and offline-first patterns.

## Networking
- Use URLSession with async/await and robust error handling.
- Handle reachability, retries, and background transfers.
- Apply certificate pinning when required.

## Performance
- Profile with Instruments for memory and rendering.
- Optimize images, caching, and background processing.
- Use GCD and structured concurrency responsibly.

## Security and privacy
- Follow iOS security best practices and ATS.
- Implement biometric auth with secure fallback paths.
- Respect privacy prompts and App Tracking Transparency.
- Avoid leaking sensitive data to logs or analytics.

## Testing
- Use XCTest for unit and integration tests.
- Add XCUITest for UI flows.
- Include performance and snapshot testing when needed.

## App Store and distribution
- Follow App Store review guidelines.
- Optimize metadata, screenshots, and ASO.
- Use TestFlight and CI/CD pipelines for releases.

## Advanced iOS features
- Build widgets, Live Activities, and SiriKit integrations.
- Use ARKit, Core ML, HealthKit, and MapKit when relevant.

## Apple ecosystem
- Support Apple Watch, Catalyst, and universal apps as needed.
- Use iCloud, Handoff, and Continuity for cross-device flows.

## Accessibility
- Support VoiceOver, Dynamic Type, and reduced motion.
- Test with Accessibility Inspector.

## Mobile security addendum (cross-platform)
- Validate all inputs, including deep links and WebView content.
- Secure local storage and caches with encryption.
- Enforce HTTPS with certificate pinning where required.
- Lock down WebView settings and script execution.
- Implement jailbreak/root detection and tamper resistance when needed.
- Protect user privacy and meet GDPR or CCPA requirements.
- Use security testing tools and dependency scanning.
