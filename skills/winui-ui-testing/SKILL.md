---
name: winui-ui-testing
description: "Automate WinUI 3 UI tests: batch script, one-pass run, result readback. Covers element assertions, interactions, TextBox/ComboBox/ToggleSwitch values, pickers, flyouts, dialogs, persistence, accessibility."
---

### Approach

Goal: validate UI + app behavior automatically. Exercise UI elements, verify state, assert expected behavior.

Two modes:
1. Interactive exploration — run app, use `winapp ui <command>` to inspect UI tree, find AutomationIds, verify props, test behavior. Good for discovery; slow when repeated.
2. Scripted batch testing — generate `ui-tests.ps1` that exercises UI + assertions in one pass. Repeatable, captures pass/fail, cheaper to iterate.

Prefer scripted batch testing unless user asked for interactive exploration, code/app is unfamiliar, or hidden/dynamic AutomationIds need discovery (flyouts, dialogs, lazy-loaded content).

### `winapp ui` Verbs

Verbs: `status`, `inspect`, `search`, `get-property`, `get-value`, `screenshot`, `invoke`, `click`, `set-value`, `focus`, `scroll`, `scroll-into-view`, `wait-for`, `list-windows`, `get-focused`. Run `winapp ui --cli-schema` for full JSON command shape, or `winapp ui <verb> --help` for one verb.

### Step 1: Use the Running App

If app already running, use captured PID. **Do NOT relaunch**. If not running, build/launch via `winui-dev-workflow`.

### Step 2: Write the Test Script

**If you wrote code:** Skip inspect. You know AutomationIds + control structure from XAML/code-behind. Inspect misses popups, flyouts, dialogs, lazy-loaded content.

**If verifying code you didn't write:** inspect first:
```powershell
winapp ui inspect -a <PID> --interactive
```
Then read XAML for AutomationIds not currently visible: flyouts, dialog buttons, secondary pages.

Create `ui-tests.ps1` covering all app requirements in one pass:

```powershell
# ui-tests.ps1
param([Parameter(Mandatory)][int]$AppPid)
# NOTE: Do NOT name the parameter $Pid — it's read-only in PowerShell

$ErrorActionPreference = 'Continue'
$pass = 0; $fail = 0; $results = @()

# Get main window HWND (avoids PopupHost interference with JSON parsing)
$windows = winapp ui list-windows -a $AppPid --json 2>$null | ConvertFrom-Json
$hwnd = ($windows | Where-Object { $_.title -ne "PopupHost" } | Select-Object -First 1).hwnd

function Test-UI {
    param([string]$Name, [scriptblock]$Script)
    # IMPORTANT: Inside $Script, use 'throw' to signal failure — NOT 'exit 1'
    # (exit terminates the entire script, not just the test)
    try {
        $output = & $Script 2>&1
        if ($LASTEXITCODE -eq 0) {
            $script:pass++; $script:results += @{ name = $Name; status = "PASS" }
        } else {
            $script:fail++; $script:results += @{ name = $Name; status = "FAIL"; detail = "$output" }
        }
    } catch {
        $script:fail++; $script:results += @{ name = $Name; status = "FAIL"; detail = "$_" }
    }
}

# ─── Element Existence ───
Test-UI "NavHome exists" { winapp ui wait-for "NavHome" -a $AppPid -t 3000 }
Test-UI "NavSettings exists" { winapp ui wait-for "NavSettings" -a $AppPid -t 3000 }

# ─── Navigation ───
Test-UI "Navigate to Settings" { winapp ui invoke "NavSettings" -a $AppPid }
Test-UI "Settings page loaded" { winapp ui wait-for "TxtUserName" -a $AppPid -t 3000 }

# ─── Interactions ───
Test-UI "Set username" { winapp ui set-value "TxtUserName" "TestUser" -a $AppPid }
Test-UI "Click Save" { winapp ui invoke "BtnSave" -a $AppPid }  # commits the TextBox binding
Test-UI "Username value set" {
    winapp ui wait-for "TxtUserName" -a $AppPid --value "TestUser" -t 2000
}

# ─── Value assertions for different control types ───
Test-UI "Theme is System default" {
    winapp ui wait-for "CmbTheme" -a $AppPid --value "System default" -t 2000
}
Test-UI "Logging is off" {
    winapp ui wait-for "TglLogging" -a $AppPid --value "Off" -t 2000
}

# ─── Accessibility Audit ───
# Only audit controls in the app's main window (exclude OS picker/popup controls)
$allElements = (winapp ui inspect -a $AppPid --interactive --json 2>$null | ConvertFrom-Json).elements
$appElements = @($allElements | Where-Object {
    $_.type -match 'Button|TextBox|ComboBox|CheckBox|ToggleSwitch|TabItem|Edit' -and
    $_.name -notmatch 'Minimize|Maximize|Close|System' -and          # window chrome
    $_.className -notmatch 'PickerHost|#32770|CabinetWClass'         # OS dialogs
})
$missingId = @($appElements | Where-Object { -not $_.automationId })
if ($missingId.Count -eq 0) {
    $pass++; $results += @{ name = "All app controls have AutomationId"; status = "PASS" }
} else {
    $fail++
    $names = ($missingId | ForEach-Object { "$($_.type) '$($_.name)'" }) -join ", "
    $results += @{ name = "AutomationId coverage"; status = "FAIL"; detail = "Missing: $names" }
}

# ─── State Screenshots (capture each meaningful state for visual review) ───
New-Item -ItemType Directory -Force -Path "screenshots" | Out-Null
winapp ui screenshot -a $AppPid -o "screenshots/01-initial.png" 2>$null
# ...take more screenshots after key interactions above (mode switches, dialogs opened, etc.)

# ─── Final Screenshot ───
winapp ui screenshot -a $AppPid -o "test-screenshot.png" 2>$null

# ─── Results ───
Write-Host "`nPassed: $pass | Failed: $fail"
$results | Where-Object { $_.status -eq "FAIL" } | ForEach-Object {
    Write-Host "  FAIL: $($_.name) — $($_.detail)" -ForegroundColor Red
}
$results | ConvertTo-Json | Out-File "test-results.json"
if ($fail -gt 0) { exit 1 } else { exit 0 }
```

### What to Test

Test **every requirement** from user prompt:

| Requirement type | Test approach |
|---|---|
| "Has a button that does X" | `search` to verify exists, `invoke` to click, `wait-for --value` to check result |
| "Text field shows value" | `wait-for "TxtName" --value "expected"` — works for TextBox, TextBlock, labels |
| "Status bar contains text" | `wait-for "StatusBar" --value "words" --contains` — substring match for dynamic content |
| "Dropdown is set to X" | `wait-for "CmbTheme" --value "Dark"` — reads the selected item automatically |
| "Toggle is on/off" | `wait-for "TglFeature" --value "On"` — reads the toggle state |
| "Navigation between pages" | `invoke` nav item, `wait-for` a page-specific element to appear |
| "Open file dialog" | `invoke` trigger, `list-windows` to find picker HWND, interact with `-w` |
| "Save file dialog" | Same as open — find picker with `list-windows`, `set-value` filename, `invoke` Save |
| "Right-click context menu" | `click --right` on element, `invoke` the flyout MenuItem |
| "Confirmation dialog" | `invoke` trigger, `search` for dialog buttons, `invoke` Primary/Secondary/Close |
| "Data persists" | Set values, `invoke` a button (to commit bindings), verify data file on disk (`Get-Content` + `ConvertFrom-Json`) |
| "All controls accessible" | `inspect --interactive --json` + check all have AutomationId |

### Step 3: Run and Read Results

```powershell
.\ui-tests.ps1 -AppPid <PID>
```

Read `test-results.json` for structured pass/fail. Fix code only when tests fail.

### Step 3.5: Look at the Screenshots

UIA cannot see clipping, overlap, wrong theming, or controls bleeding past container. UIA returns `PASS` while UI looks broken. **Capture screenshots with `winapp ui screenshot` and view each PNG.**

Capture initial state + states after major interactions. Script template State Screenshots block handles this.

**Visual checklist — fail the run if any item is `no`:**
- [ ] No unintended scrollbars
- [ ] No text ending in `…` that shouldn't be
- [ ] Hero elements fully visible (not sliced)
- [ ] Right-edge controls fully visible
- [ ] No overlapping rows
- [ ] Content uses the available width — no asymmetric dead zones (e.g. content pinned to one edge leaving empty space on the other)
- [ ] Spacing intentional — not cramped, not unintentionally vast
- [ ] Theming matches the user's ask (Light/Dark/HighContrast if relevant)
- [ ] Focus/hover/error states render if tested

Checklist failure = bug. Fix before done. Window too small → grow per `winui-design` Step 4.

### Step 4: Fix and Rerun (if the user asked for it)

If tests fail:
1. Read the failure details from `test-results.json`
2. Batch-fix all issues in one pass
3. Rebuild with `.\BuildAndRun.ps1` (blocking mode — shows crash info if the fix broke something)
4. Rerun `.\ui-tests.ps1 -AppPid <PID>` (parse PID from the `launched (PID: XXXXX)` output)

**Maximum 2 fix-and-rerun cycles.** If same tests fail after 2 cycles, report known issues and stop iterating.

### Assertion Reference

Use `wait-for --value` as primary assertion. It reads right value via fallback chain per control type:

| Control type | `--value` reads from | Example |
|---|---|---|
| TextBlock / Label | Name property | `wait-for "LblTitle" --value "Home"` |
| TextBox / NumberBox | ValuePattern | `wait-for "TxtName" --value "John"` |
| RichEditBox | TextPattern | `wait-for "Editor" --value "Hello"` |
| ComboBox | Selected item (SelectionPattern) | `wait-for "CmbTheme" --value "Dark"` |
| ToggleSwitch | Toggle state (On/Off) | `wait-for "TglDark" --value "On"` |
| CheckBox | Toggle state (On/Off) | `wait-for "ChkAgree" --value "On"` |

**Full assertion commands:**

| Assertion | Command |
|---|---|
| Element exists | `winapp ui wait-for "Id" -a PID -t 3000` |
| Element has exact value | `winapp ui wait-for "Id" -a PID --value "expected" -t 3000` |
| Value contains text | `winapp ui wait-for "Id" -a PID --value "words" --contains -t 3000` |
| Element gone | `winapp ui wait-for "Id" -a PID --gone -t 3000` |
| Specific property | `winapp ui wait-for "Id" -a PID -p IsEnabled --value "True" -t 3000` |
| Button clickable | `winapp ui invoke "Id" -a PID` (exit code 0) |
| Set then verify | `winapp ui set-value "Id" "text" -a PID` then `wait-for --value` |
| Screenshot | `winapp ui screenshot -a PID -o path.png` |
| Dialog appeared | `winapp ui list-windows -a PID --json` (check window count) |
| Right-click menu | `winapp ui click "Id" -a PID --right` then `wait-for` menu item |
| Read raw property | `winapp ui get-property "Id" -a PID -p IsEnabled --json` |
| Read current value (no wait) | `(winapp ui get-value "Id" -a PID --json \| ConvertFrom-Json).text` — always pass `--json` when capturing into a variable (plain stdout can include advisory text like "Auto-selected HWND … from N windows"); otherwise prefer `wait-for --value` |
| Scroll item into view | `winapp ui scroll-into-view "Id" -a PID` — call before `wait-for` on virtualized ListView/repeater items below the fold |
| Set keyboard focus | `winapp ui focus "Id" -a PID` — cleaner than clicking another control to trigger a TextBox `LostFocus` commit |

### Testing File Pickers

File/folder pickers (FileOpenPicker, FileSavePicker, FolderPicker) run in separate `PickerHost` process but remain interactable. Picker appears as owned dialog window.

```powershell
# 1. Trigger the picker
winapp ui invoke "BtnOpenFile" -a $AppPid

# 2. Find the picker window (it's a dialog owned by the app window)
Start-Sleep 1
$allWindows = winapp ui list-windows -a $AppPid --json 2>$null | ConvertFrom-Json
$picker = $allWindows | Where-Object { $_.title -match "Open|Save" }
$pickerHwnd = $picker.hwnd

# 3. Interact with the picker using -w <HWND>
#    Type a filename:
winapp ui set-value "FileNameControlHost" "test.txt" -w $pickerHwnd
#    Click Open/Save:
winapp ui invoke "Open" -w $pickerHwnd     # or "Save", "Cancel"
#    Or cancel:
winapp ui invoke "Cancel" -w $pickerHwnd

# 4. Verify the app processed the file
winapp ui wait-for "StatusBar" -a $AppPid -p Name --value "opened" -t 3000
```

**Tip:** Use `winapp ui inspect -w <pickerHwnd> --interactive` to discover picker controls: folder tree, file list, filename textbox, Open/Cancel buttons.

### Testing Context Menus and Flyouts

MenuFlyouts + ContextFlyouts are testable. They appear in UI automation tree when open.

```powershell
# 1. Right-click to open a ContextFlyout
winapp ui click "LstItems" -a $AppPid --right
Start-Sleep 0.5

# 2. The flyout MenuItems appear in the tree immediately
#    Find them with inspect or search:
winapp ui inspect -a $AppPid --interactive   # shows MnuCopy, MnuDelete, etc.

# 3. Click a flyout item
winapp ui invoke "MnuCopy" -a $AppPid

# 4. Verify the action
winapp ui wait-for "StatusText" -a $AppPid -p Name --value "Copied" -t 2000
```

**For MenuBar flyouts** (File, Edit, View menus):
```powershell
# Click the menu header to open
winapp ui invoke "FileMenu" -a $AppPid
Start-Sleep 0.5
# Click the sub-item
winapp ui invoke "MenuSaveAs" -a $AppPid
```

### Testing ContentDialogs

ContentDialogs are in-app controls in same window; they appear directly in UI tree when shown.

```powershell
# 1. Trigger the dialog
winapp ui invoke "BtnDelete" -a $AppPid
Start-Sleep 0.5

# 2. The dialog buttons appear in the tree
#    For a standard confirmation dialog:
winapp ui search "Primary" -a $AppPid --json   # finds the primary button
winapp ui invoke "Primary" -a $AppPid           # click "Yes"/"Delete"/"Save"
#    Or:
winapp ui invoke "Secondary" -a $AppPid         # click "No"/"Don't Save"
winapp ui invoke "Close" -a $AppPid             # click "Cancel"

# 3. Wait for dialog to dismiss
winapp ui wait-for "Primary" -a $AppPid --gone -t 3000
```

**Tip:** ContentDialog buttons often lack custom AutomationIds. Use `inspect` for actual selector: slug or text match.

### Key Gotchas

- **`set-value` does NOT commit default TextBox bindings** — WinUI 3 `x:Bind TwoWay` on TextBox.Text updates ViewModel on `LostFocus` by default. UIA `set-value` changes text but does not trigger focus events. **Fix:** apps should use `UpdateSourceTrigger=PropertyChanged` on TextBox bindings (see design skill). If app does not, `invoke` a button or `click` another element after `set-value` to trigger `LostFocus`.
- **Verify persistence via data file, not UI relaunch** — killing/relaunching packaged app from test script is fragile (MSIX registration timing, PID issues). Instead, check data file on disk: `Get-Content $dataFile | ConvertFrom-Json` and verify expected values.
- **Use `$AppPid` not `$Pid`** — `$Pid` is a read-only automatic variable in PowerShell
- **Use `--value` without `-p`** — it auto-detects UIA pattern (TextPattern → ValuePattern → TogglePattern → SelectionPattern → Name). Use `-p PropertyName --value` only for specific property like `IsEnabled`
- **File pickers need `-w <HWND>`** — they run in separate PickerHost process, so `-a PID` will not find them. Use `list-windows` to discover picker HWND first
- **Flyouts need short `Start-Sleep`** after triggering — menu items appear in tree asynchronously
