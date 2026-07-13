# Clawpatch CLI

Snapshot: installed `clawpatch --help` on 2026-06-07. Exact flags -> run help.

## Global

```text
clawpatch [global flags] <command> [flags]
cmds: init map status review ci report show next triage fix open-pr revalidate doctor clean-locks
global: --root <path> --state-dir <path> --config <path> --json --plain -q/--quiet -v/--verbose --debug --no-color --no-input -h/--help --version
```

## Commands

| Cmd | Use | Key Flags |
| --- | --- | --- |
| `review` | create findings from mapped features | `--feature <id>` `--project <name-or-root>` `--limit <n>` `--since <ref>` `--include-dirty` `--jobs <n>` `--mode <default|deslopify>` `--rate-limit-per-minute <n>` `--provider <name>` `--model <name>` `--reasoning-effort <none|minimal|low|medium|high|xhigh>` `--skip-git-repo-check` `--dry-run` `--prompt-file <path|- >` `--export-tribunal-ledger <path>` `--json` |
| `show` | inspect one finding | `--finding <id>` `--json` |
| `next` | next finding by status | `--status <status>` default `open`; `--project <name-or-root>` `--json` |
| `status` | ledger summary | `--json` |
| `triage` | set finding status | `--finding <id>` `--status <open|false-positive|fixed|wont-fix|uncertain>` `--note <text>` `--json` |
| `fix` | explicit finding-scoped patch | `--finding <id>` `--provider <name>` `--model <name>` `--reasoning-effort <none|minimal|low|medium|high|xhigh>` `--skip-git-repo-check` `--dry-run` `--json` |
| `revalidate` | re-check finding(s) vs current repo | `--finding <id>` or `--since <ref>`; filters: `--all` `--status <status>` `--severity <severity>` `--feature <id>` `--category <category>` `--triage <triage>` `--limit <n>` `--include-dirty` `--provider <name>` `--model <name>` `--reasoning-effort <none|minimal|low|medium|high|xhigh>` `--skip-git-repo-check` `--json` |
