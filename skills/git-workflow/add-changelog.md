# Add Changelog

Goal: create/update `CHANGELOG.md` with user-facing release notes.

## Use format

Prefer Keep a Changelog + SemVer unless repo has stricter convention.

Starter:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- New features.

### Changed

- Changes in existing behavior.

### Deprecated

- Soon-to-be removed features.

### Removed

- Removed features.

### Fixed

- Bug fixes.

### Security

- Security fixes.
```

## Version entry

```markdown
## [1.2.3] - YYYY-MM-DD

### Added

- User authentication.
- Dark mode toggle.

### Fixed

- Memory leak in background tasks.
- Timezone handling in reports.
```

## Entry rules

User-facing unless repo uses dev-facing changelog. Group by category. Plain language. No commit hashes unless repo wants them. Call out breaking changes. Keep Unreleased at top. Mirror into GitHub release notes when asked.

## From commits

If repo wants generated changelog, use existing tool first. If none exists, ask before adding deps.

Possible tools:

```bash
npm install -D conventional-changelog-cli
npx conventional-changelog -p angular -i CHANGELOG.md -s

npm install -D auto-changelog
npx auto-changelog
```

Need dependency health + approval before new packages.

## Commit convention support

Good changelog input:

```text
feat: add user authentication
fix: resolve task memory leak
docs: update API docs
refactor: reorganize user service
test: add auth unit tests
chore: update deps
```

## Release links

When repo uses compare links, add/update footers:

```markdown
[Unreleased]: https://github.com/org/repo/compare/v1.2.3...HEAD
[1.2.3]: https://github.com/org/repo/compare/v1.2.2...v1.2.3
```
