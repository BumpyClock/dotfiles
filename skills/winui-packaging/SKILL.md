---
name: winui-packaging
description: "Package/sign/release WinUI 3 apps: Release builds, MSIX, cert generate/install/sign, self-contained deployment, GitHub Actions CI/CD, Microsoft Store."
---

### Quick Reference

| Task | Command |
|------|---------|
| Build for release | `.\BuildAndRun.ps1 /p:Configuration=Release` |
| Package + sign | `winapp package <dir> --cert devcert.pfx` |
| Generate + sign + package | `winapp package <dir> --generate-cert --install-cert` |
| Generate dev certificate | `winapp cert generate` |
| Trust certificate (admin) | `winapp cert install ./devcert.pfx` |
| Sign existing file | `winapp sign ./app.msix ./devcert.pfx` |
| Self-contained deployment | `winapp package <dir> --cert devcert.pfx --self-contained` |

### End-to-End Workflow

#### Step 1: Build for Release
Build Release without launch using `BuildAndRun.ps1` from `winui-dev-workflow`:

```powershell
.\BuildAndRun.ps1 /p:Configuration=Release -SkipRun
```

#### Step 2: Generate Certificate (one-time)
```powershell
winapp cert generate --manifest .
```
Creates `devcert.pfx`; default password: `password`. `--manifest` auto-matches `Publisher` in `Package.appxmanifest`.

#### Step 3: Trust Certificate (one-time, requires admin)
```powershell
winapp cert install ./devcert.pfx
```
Adds cert to machine Trusted Root store; persists across reboots.

#### Step 4: Package and Sign
```powershell
winapp package <build-output-dir> --cert ./devcert.pfx
```
Finds `appxmanifest.xml`, stages layout, generates `resources.pri`, creates `.msix`, signs it.

#### Step 5: Install or Distribute
```powershell
# Local install
Add-AppxPackage ./MyApp.msix

# Or double-click the .msix file
```

### Key Rules

- **Publisher must match** cert and manifest `Identity.Publisher` — use `winapp cert generate --manifest`.
- **Prefer `winapp package --cert`** over separate `winapp sign`.
- **`cert install` requires admin** — run terminal as Administrator.
- **Default PFX password** is `password` — override with `--password`.
- **`--timestamp`** matters for production — without it, signatures expire with cert:
  ```powershell
  winapp package <dir> --cert prod.pfx --timestamp http://timestamp.digicert.com
  ```
- **`--self-contained`** bundles Windows App SDK runtime — larger, no runtime dependency.

### CI/CD with GitHub Actions

```yaml
name: Build and Package
on: [push]
jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: microsoft/setup-WinAppCli@v0.1

      - name: Build
        run: dotnet build -c Release -p:Platform=x64

      - name: Package
        run: |
          winapp cert generate --if-exists skip --quiet
          winapp package ./bin/x64/Release/ --cert ./devcert.pfx --quiet

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: msix-package
          path: "*.msix"
```

**CI/CD tips:** use `--quiet`; use `--if-exists skip` with `cert generate`; store production PFX as repo secret.

### Store Submission

1. **Partner Center account** — register at [partner.microsoft.com](https://partner.microsoft.com).
2. **Age ratings** — complete Partner Center questionnaire.
3. **Screenshots** — capture at 1366x768 minimum.
4. **Privacy policy** — required for internet or user-data access.
5. **Submit** — upload signed `.msix` / `.msixbundle` from `winapp package` via [Microsoft Partner Center](https://partner.microsoft.com/dashboard) → Apps and games → your app → Packages. Store submission is browser-based; no first-party CLI submit command yet.

### Troubleshooting

| Error | Solution |
|-------|----------|
| "Publisher mismatch" | Run `winapp cert generate --manifest` to re-generate |
| "Certificate not trusted" | Run `winapp cert install ./devcert.pfx` as admin |
| "Access denied" | `cert install` needs admin elevation |
| "Certificate file already exists" | Use `--if-exists overwrite` or `--if-exists skip` |
| "appxmanifest.xml not found" | Run `winapp init` or pass `--manifest <path>` |
| "Package installation failed" | Trust cert first; remove stale: `Get-AppxPackage <name> \| Remove-AppxPackage` |
| Signature invalid after time | Re-sign with `--timestamp` |

### References

| File | Read when... |
|------|-------------|
| `references/sourcegen-patterns.md` | Setting up AOT/trimming, JSON source generators, NativeAOT readiness, CsWin32 |
