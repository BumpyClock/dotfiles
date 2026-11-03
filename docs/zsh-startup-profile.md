# Zsh startup profile

Measured on 2026-11-02 with zsh 5.9.2 on Linux. Working directory was the dotfiles repository at revision `135386f`, with its existing local changes. No plugins were removed or deferred.

## Bottlenecks and fixes

- A warm initial zprof capture attributed about 18 ms to Oh My Zsh library/plugin loading and 12 ms to `compinit`, including 7 ms of completion security auditing. Those inclusive times are not additive with their children.
- `~/.zcompdump-framed-5.9.2.lock` was an empty directory left since September. Its presence blocked Oh My Zsh's normal recompilation. The bytecode was older than the completion dump. Removed the confirmed stale empty lock and refreshed bytecode. Completion auditing and metadata invalidation remain enabled.
- Added explicit native bytecode maintenance for the shared baseline, framework libraries, highlighting/autosuggestion implementations, and Bun completions. No cache of fnm output, secrets, or dynamic tool environments was introduced.
- Left `~/.zshrc` and the Git plugin interpreted. An experimental broad compilation changed the Git plugin's alias-expanded `work_in_progress` body. The final target list excludes it, and all loaded function bodies match the interpreted baseline after normalizing highlighting's session IDs.
- fnm, Starship initialization, and fzf generation were individually small startup subprocesses. Retained all three without wrappers or lazy loading. Login shells also load `/etc/profile` through `/etc/zsh/zprofile`. That system configuration was not changed.

## Matched measurements

The original separate baseline had warm medians of 46.1 ms for `zsh -ic exit` and 61.7 ms for `zsh -lic exit`, with 20 runs each. Do not compare those directly with the later figures to claim a speedup. Host conditions changed during investigation.

After repairing the completion cache, measured raw and compiled startup sources in four blocks, ordered raw, compiled, compiled, raw. Each block used three warmups per workload and ten measured runs. Both states used the same repaired completion dump, working directory, installed tools, and environment. The table combines 20 samples per state. It isolates the bytecode benefit rather than attributing host drift to the fix.

| Workload | Raw median | Compiled median | Raw p10 to p90 | Compiled p10 to p90 |
| --- | ---: | ---: | ---: | ---: |
| No user rc | 0.94 ms | 0.94 ms | 0.82 to 1.08 ms | 0.79 to 1.05 ms |
| Interactive startup | 37.99 ms | 31.18 ms | 34.75 to 43.35 ms | 30.39 to 33.37 ms |
| Login startup | 53.94 ms | 45.24 ms | 50.85 to 59.54 ms | 44.36 to 47.36 ms |
| Terminal command ready | 62.13 ms | 55.48 ms | 60.45 to 68.70 ms | 52.07 to 57.36 ms |
| Login terminal command ready | 78.43 ms | 68.90 ms | 74.03 to 85.99 ms | 66.05 to 72.54 ms |

Interactive startup decreased 6.81 ms, about 18% of the raw median. Terminal-ready time decreased 6.65 ms, about 11%. These are warm-cache observations, not cold-boot guarantees. Terminal-ready includes prompt rendering, hooks, and ZLE initialization before executing the readiness command. The first-use work was not postponed.

A post-change zprof capture showed library/plugin loading around 12 ms and `compinit` around 9 ms, including 7 ms of security auditing. Parsing cost shrank; required completion auditing, plugin initialization, prompt rendering, and login system configuration remain. zprof perturbs execution and its function timings are not the wall-clock benchmark.

## Verification

- Compared every loaded function body between interpreted and compiled startup. Only generated highlighting session IDs differed.
- Compared startup hooks, Git/eza aliases, fpath, Git/Bun completion registrations, and fzf Ctrl-R/Ctrl-T/Alt-C bindings. No differences.
- Entered a temporary project with a `.node-version` file. The fnm directory hook selected the existing Node version correctly. Separate shells still received different fnm multishell paths.
- Confirmed Cargo still resolves through the machine's Mr. Boxington shim. Managed tool configuration and lazy conda/Boat functions remain present.
- Four isolated regression tests cover unchanged behavior, idempotent compilation, edits working before rebuild, malformed bytecode recovery, and exclusion of alias-sensitive profiles/plugins.
- Ran syntax checks and the regression suite on local zsh 5.9.2 and a clean Boat Ubuntu VM with zsh 5.9. Both passed. Only four shell/test files were copied to the CI VM. No repository secrets were uploaded.

## Maintenance

From the repository root:

```bash
zsh -f shell/zsh/compile-startup.zsh
python3 shell/zsh/profile-startup.py --runs 20
python3 shell/zsh/profile-startup.py --zprof
python3 shell/zsh/test-startup.py
```

Bytecode is optional and machine-local. Source edits keep working without a rebuild. Rerun compilation after shell/plugin updates for the speed benefit. To undo compilation, remove only the adjacent `.zwc` files for the paths listed in `compile-startup.zsh`. Do not remove source files or the Oh My Zsh completion dump.
