# Changelog

Goal: create/update `CHANGELOG.md` with user-facing release notes.

Format: Keep a Changelog + SemVer unless repo convention stricter. `## [Unreleased]` at top; version sections `## [x.y.z] - YYYY-MM-DD`; categories Added/Changed/Deprecated/Removed/Fixed/Security; compare-link footers (`[x.y.z]: .../compare/vA...vB`) when repo uses them.

Entries: user-facing plain language (unless repo runs dev-facing log), grouped by category, breaking changes called out, no commit hashes unless repo wants them. Mirror into GitHub release notes when asked.

Generated changelogs: use repo's existing tool first (`conventional-changelog-cli`, `auto-changelog`, …). None → ask before adding deps; dependency health check + approval required.
