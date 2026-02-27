# Runbook

## Read when

- Starting any peeku automation task
- You need the fastest path from zero to execution

## Bootstrap (copy/paste)

```powershell
peeku --format json doctor
peeku --daemon
```

If daemon is already running, continue.

## Baseline Target Selection

1. Focused app is stable:

```powershell
peeku --format json see --depth 2 --maxNodes 500
```

2. Focus can drift; bind target explicitly:

```powershell
peeku --format json windows list --titleContains "Notepad" --limit 5
peeku --format json uia snapshot --titleContains "Notepad" --depth 2 --maxNodes 500
```

3. Shell UI (Start/context/popup/taskbar):

```powershell
peeku --format json surfaces list
peeku --format json surfaces snapshot --kind start_menu --depth 2 --maxNodes 500
```

## Fast Action Loop

```powershell
peeku --format json find --selector "window/edit" --limit 20
peeku --format json set-value --selector "window/edit" --value "hello"
peeku --format json click --selector "window/button[name=\"OK\"]"
```

Validate each step:
- `ok=true`
- inspect `warnings`
- inspect `evidence`

## Recipe Shortcuts

Launch from Start:

```powershell
peeku --format json start run --query "notepad" --expectedTitle "Notepad" --wait-timeout-ms 8000
```

Choose context menu item:

```powershell
peeku --format json context select --item "Open"
```

## Finish

```powershell
peeku --daemon --stop
```
