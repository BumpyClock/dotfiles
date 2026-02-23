# Recovery

## Read when

- Commands fail
- Actions succeed with warnings
- Automation becomes flaky

## Failure playbook

1. `Selector expr required` or parse error:
- Fix expression syntax.
- Ensure filters use `key=value` or `key~="value"`.

2. No matches:
- Re-inspect with `see` or `uia snapshot`.
- Relax filters (`~=` before `=`).
- Increase depth/nodes only as needed.
- Bind target via `--hwnd` or window query to avoid focus drift.

3. Stale/unknown ref (`h:*`/`a:*`):
- Re-run `find` by selector.
- Retry once with fresh selection.

4. Action returns warning:
- Read warning text and `evidence`.
- Accept only if outcome is still valid for task goal.

5. `set-value`/`type` mismatch:
- Treat `verificationMatched=false` as failure.
- Retry with `--append false` or switch method.

6. Method mismatch:
- Try `--method uia` first for standard controls.
- Use `--method input` when pattern invoke/value is ineffective.

7. Surface misses (`start_menu`, `context_menu`, `active_popup`):
- Refresh with `surfaces list`.
- Re-run command with fresh `surfaceId` immediately.

8. Daemon/capability errors:
- Restart daemon.
- If capability-gated, use read-only tools or run with required privileges.

## Debug commands

```powershell
peeku --server --daemon-debug --daemon-debug-verbose
peeku --daemon --daemon-debug --daemon-debug-log-file C:\temp\peeku-daemon.log
```

Log format is JSONL with fields like `timestamp`, `eventName`, and `data`.
