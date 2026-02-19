---
name: testflight-release
description: Generate user-friendly TestFlight release notes from git history, confirm with user, and push builds to external testers via App Store Connect API.
arguments:
  - name: ARGUMENT
    type: string
    description: "Optional: build number, version filter, or custom instructions"
context: fork
---

Push the latest builds to external TestFlight testers with auto-generated release notes.

If $ARGUMENT is provided, use it as context (e.g., specific build number or version).

## Workflow

### Step 1: Determine baseline

Find the last build that was distributed to external testers (state `IN_BETA_TESTING` or `APPROVED`):

```bash
export APPSTORE_CONNECT_API_KEY_ID="$APPSTORE_CONNECT_API_KEY_ID"
export APPSTORE_CONNECT_ISSUER_ID="$APPSTORE_CONNECT_ISSUER_ID"
asc testflight builds list --filter-bundle-ids Digests.Digests --filter-processing-states VALID --no-include-expired --filter-beta-review-states APPROVED
```

Note the upload date of the most recent `APPROVED` / `IN_BETA_TESTING` build. This is the baseline for git log.

### Step 2: Gather git history

Get commits since the baseline date:

```bash
git log --oneline --since="<baseline-date>" --no-merges
```

If no baseline found, use the last 2 weeks of history.

### Step 3: Generate release notes

Summarize the git log into user-friendly "What to Test" notes:

- Group changes by category: **New Features**, **Improvements**, **Bug Fixes**
- Write from a tester's perspective ("Try the new X feature", "Check that Y works correctly")
- Keep it concise — 3-8 bullet points max
- Drop internal/refactor commits that don't affect user experience
- Use plain language, no commit hashes or technical jargon

### Step 4: Confirm with user

Present the generated notes and ask the user to confirm or edit before proceeding. Show:
- Which build number will be distributed
- Which platforms (iOS / macOS)
- The draft "What to Test" notes
- The target external group name

Wait for explicit user approval before continuing.

### Step 5: Distribute builds

**CRITICAL**: The `asc testflight builds addbetagroup` command has a bug — it fails with "More than 1 build returned" for multi-platform apps sharing the same build number. You MUST use the App Store Connect REST API directly.

#### 5a: Ensure PyJWT is available

```bash
python3 -c "import jwt" 2>/dev/null || (python3 -m venv /tmp/asc-venv && /tmp/asc-venv/bin/pip install PyJWT cryptography -q)
```

Use `/tmp/asc-venv/bin/python3` if system python lacks jwt.

#### 5b: Resolve build IDs and add to group

Use this Python pattern to resolve platform-specific build IDs and add them to the external group:

```python
import jwt, time, json, urllib.request, ssl

KEY_ID = os.environ.get("APPSTORE_CONNECT_API_KEY_ID")
ISSUER_ID = os.environ.get("APPSTORE_CONNECT_ISSUER_ID")
KEY_PATH = f"{os.environ['HOME']}/.appstoreconnect/private_keys/AuthKey_{KEY_ID}.p8"

# Generate JWT
with open(KEY_PATH) as f:
    private_key = f.read()
now = int(time.time())
token = jwt.encode(
    {"iss": ISSUER_ID, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
    private_key, algorithm="ES256", headers={"kid": KEY_ID}
)
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
ctx = ssl.create_default_context()

# 1. Resolve build IDs with platform info
#    GET /v1/builds?filter[app]=<APP_ID>&filter[version]=<BUILD_NUM>&include=preReleaseVersion
# 2. Add each build to the external beta group
#    POST /v1/betaGroups/<GROUP_ID>/relationships/builds  {"data": [{"type": "builds", "id": "<BUILD_ID>"}]}
# 3. Submit each build for beta review
#    POST /v1/betaAppReviewSubmissions  {"data": {"type": "betaAppReviewSubmissions", "relationships": {"build": {"data": {"type": "builds", "id": "<BUILD_ID>"}}}}}
# 4. Set What-to-Test localization
#    POST /v1/betaBuildLocalizations  {"data": {"type": "betaBuildLocalizations", "attributes": {"whatsNew": "<NOTES>", "locale": "en-US"}, "relationships": {"build": {"data": {"type": "builds", "id": "<BUILD_ID>"}}}}}
```

#### 5c: Set What-to-Test notes

For each build, create a `betaBuildLocalization` with the confirmed notes (locale `en-US`).

### Step 6: Verify

```bash
asc testflight builds list --filter-bundle-ids Digests.Digests --filter-build-numbers <BUILD_NUM>
```

Confirm both platforms show `WAITING_FOR_BETA_REVIEW` or `IN_BETA_TESTING`.

Report final status to user.

## App defaults

- **Bundle ID**: `Digests.Digests`
- **App ID**: `6747268970`
- **External group**: `v.1 release` (ID: `b96381d1-4555-4870-a2ed-1687ab84625a`)
- **Platforms**: IOS, MAC_OS
- **Locale**: en-US

## Known issues

- `asc testflight builds addbetagroup` cannot disambiguate multi-platform builds sharing a build number. Always use the REST API directly for write operations.
- The `asc` CLI JSON output for builds does not include the build resource `id` field. Use the REST API (`/v1/builds`) with `include=preReleaseVersion` to get both IDs and platform info.
- Adding a build to an external group does NOT auto-submit for beta review. You must separately create a `betaAppReviewSubmission`.
