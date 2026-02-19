---
name: app-store-connect-cli
description: Umbrella index for App Store Connect automation skills. Use this entrypoint to route requests to the most specific `asc-*` skill under this directory.
---

# App Store Connect CLI Skill Index

Use this skill as the router when a task involves App Store Connect, TestFlight, App Store submission, signing, metadata, screenshots, pricing, or `asc` commands.

## Skill routing (`read_when` hints)
- `asc-cli-usage/SKILL.md` - `read_when`: You need `asc` command discovery, flags, auth, output formats, or pagination behavior.
- `asc-id-resolver/SKILL.md` - `read_when`: You have names but need concrete App Store Connect IDs (apps, builds, versions, groups, testers).
- `asc-signing-setup/SKILL.md` - `read_when`: You are creating or updating bundle IDs, capabilities, certificates, or provisioning profiles.
- `asc-xcode-build/SKILL.md` - `read_when`: You need to archive/export iOS or macOS artifacts (`.ipa`/`.pkg`) before upload.
- `asc-build-lifecycle/SKILL.md` - `read_when`: You need latest-build lookup, processing-state tracking, or old-build cleanup.
- `asc-release-flow/SKILL.md` - `read_when`: You need end-to-end release steps for TestFlight or App Store.
- `asc-testflight-orchestration/SKILL.md` - `read_when`: You need to manage TestFlight groups, testers, rollout, or What-to-Test notes.
- `asc-submission-health/SKILL.md` - `read_when`: You need submission preflight, submission actions, or review-status troubleshooting.
- `asc-metadata-sync/SKILL.md` - `read_when`: You need metadata/localization sync, validation, or format migration.
- `asc-subscription-localization/SKILL.md` - `read_when`: You need bulk localization for subscription/IAP display names across locales.
- `asc-ppp-pricing/SKILL.md` - `read_when`: You need country-specific subscription/IAP pricing with PPP logic.
- `asc-shots-pipeline/SKILL.md` - `read_when`: You need automated screenshot capture, framing, and upload pipeline.
- `asc-notarization/SKILL.md` - `read_when`: You need macOS Developer ID signing + notarization for distribution outside the Mac App Store.
- `asc-workflow/SKILL.md` - `read_when`: You need multi-step lane-style automation with `.asc/workflow.json`.
- `asc-app-create-ui/SKILL.md` - `read_when`: You need to create a new App Store Connect app record via UI automation.

## Related prompts
- `/testflight-release` - `read_when`: You need to generate release notes from git history and push builds to external TestFlight testers. This is a slash-command prompt, not a sub-skill.

## Composition guidance
- Start with one domain skill; add `asc-cli-usage` if command syntax/flags are unclear.
- Add `asc-id-resolver` whenever downstream commands require IDs.
- For release tasks, common stack is: `asc-xcode-build` -> `asc-release-flow` -> `asc-submission-health`.
