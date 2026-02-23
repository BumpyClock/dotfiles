# Metrics and Perf Gates

## Read when

- User asks for performance numbers
- You need pass/fail regression checks
- You need to refresh baseline thresholds

## Default perf check

```powershell
peeku perf gate --baseline docs\perf\agent-flow-thresholds.json --check true
```

This measures core flows and fails on regressions against baseline.

Flows covered:
- `find`
- `click`
- `set-value`
- `type`
- `watch`

## Controlled benchmark run

```powershell
peeku perf gate --iterations 200 --warmup 40 --baseline docs\perf\agent-flow-thresholds.json --check true
```

Use larger iterations for stable measurements.

## Baseline refresh workflow

```powershell
peeku perf gate --iterations 200 --warmup 40 --write-baseline --headroom 1.3 --check false
```

Then run a gate check:

```powershell
peeku perf gate --baseline docs\perf\agent-flow-thresholds.json --check true
```

## Interpreting output

Use reported `p50`, `p95`, and `p99` per flow.

Action rules:
- `check=true` and non-zero exit: regression or threshold breach.
- Update baseline only with explicit approval.
- Keep baseline in `docs/perf/agent-flow-thresholds.json`.
