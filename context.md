# Context: pi RPC/remote surface investigation

## Scope
Read-only investigation focused on remote-relevant surfaces: RPC transport/session control, extension command/context exposure, and nearby code/docs boundaries. Non-remote package-manager operations included only for contrast.

## Evidence map (line-level anchors)

### 1) Entry/dispatch boundary: who can enter RPC mode
- `dist/cli/args.js`
  - mode parsing accepts `text|json|rpc` only (`args.js:25-28`).
  - help strings show `--mode <mode>` values `text (default), json, or rpc` (`args.js:225`).
- `dist/main.js`
  - `resolveAppMode()` maps `parsed.mode === "rpc"` to `appMode === "rpc"` (`main.js:76-79`).
  - `handlePackageCommand(args)` runs before mode/dispatch (`main.js:373-379`), confirming package operations bypass rpc-mode parser.
  - `runRpcMode(runtime)` used only when appMode resolves to `rpc` (`main.js:585-587`).
  - Piped stdin read happens only if not rpc (`main.js:554-557`).
  - RPC + `@file` path args are rejected with exact text:
    - `Error: @file arguments are not supported in RPC mode` (`main.js:414`).

### 2) Transport framing / protocol I/O
- `dist/modes/rpc/jsonl.js`
  - strict newline delimiters only (`\n`) and optional trailing `\r` handling (`jsonl.js:5-19,27-32`).
  - comment/evidence explicitly avoids generic readline (`jsonl.js:12-18`) due UTF-16 separators.
- `dist/modes/rpc/rpc-mode.js`
  - calls `takeOverStdout` / raw jsonl output flow at start (`rpc-mode.js:22-23`).
  - response envelope uses `type: "response"`, `success` and command data fields (`rpc-mode.js:30-36`).
  - unknown command path in dispatcher (`rpc-mode.js:293-530+`).
  - parse failure uses exact `Failed to parse command: ...` message (`rpc-mode.js:565-568`).
  - extension UI bridge uses `extension_ui_request` / `extension_ui_response` (`rpc-mode.js:562-589`).
- `dist/modes/rpc/rpc-types.d.ts`
  - command surface includes session, steering, model, tool, navigation, export, messaging commands including `get_state`, `get_commands`, `get_fork_messages`.
  - `RpcSessionState` fields include `model`, `thinkingLevel`, `isStreaming`, `sessionFile`, `sessionName`, `autoCompactionEnabled`, `pendingMessageCount`.
  - explicit RPC UI request/response types are part of wire model.

### 3) Client-side command coverage
- `dist/modes/rpc/rpc-client.js`
  - starts child as `node <cliPath>` where default `cliPath` is `dist/cli.js`.
  - wraps command API calls for prompt/steer/follow_up/abort/session/model/tool/export/browse/get_commands style methods (`rpc-client.js:136-325`).
  - response correlation by `{id, type: "response"}` (`rpc-client.js:381-386`).
  - send loop emits explicit stream/ready-state errors on write failure (`rpc-client.js:409-438`).

### 4) Session replacement/session-tree mutability in remote flow
- `dist/core/agent-session-runtime.js`
  - `newSession`, `switchSession`, `fork`, `importFromJsonl`, `navigateTree`, `reload` are explicit replacement paths (`agent-session-runtime.js:78-124,125-140,143-239,249-276`).
  - replacement chain emits `session_before_*` extension hooks and applies shutdown/rebind logic.
  - `finishSessionReplacement` invokes optional `withSession` callback (`agent-session-runtime.js:117-123`).
- `dist/core/agent-session.js`
  - `_throwIfExtensionCommand()` throws exact text:
    - `Extension command "/${commandName}" cannot be queued. Use prompt() or execute the command when not streaming.` (`agent-session.js:955-961`).
  - `getUserMessagesForForking()` feeds fork selectors (`agent-session.js:2308-2318`).
  - `exportToJsonl()` and session serialization points include header, version, and IDs (`agent-session.js:2444-2464`).
  - `createReplacedSessionContext()` supports post-replacement callbacks (`agent-session.js:2503-2507`).
- `dist/core/session-manager.js`
  - `CURRENT_SESSION_VERSION = 3` (`session-manager.js:9`).
  - migration + branching/fork APIs (`branch`, `branchWithSummary`, `createBranchedSession`, `forkFrom`) are explicitly implemented.
  - forked sessions persist `parentSession` in header (`session-manager.js:~1120`).
- `dist/core/session-cwd.js`
  - `MissingSessionCwdError` + `formatMissingSessionCwdError` for stale cwd restore path (`session-cwd.js:1-23,28-33`).

### 5) Output safety around remote transport
- `dist/core/output-guard.js`
  - `takeOverStdout()` reroutes output in non-interactive execution contexts.
  - low-level write helper retries ENOBUFS/EAGAIN/EWOULDBLOCK and delays 10ms (`writeRawStdoutChunk`, `waitForRawStdoutBackpressure`).

### 6) Extension runtime controls (critical remote risk amplifier)
- `dist/core/extensions/types.d.ts`
  - `ExtensionCommandContext` exposes `newSession`, `fork`, `navigateTree`, `switchSession`, `reload`, `getCommands`, `waitForIdle`, etc.
  - includes `hasUI` flag for context capability.
- `dist/core/extensions/runner.js`
  - command binding and UI context handling (`noOpUIContext`, `hasUI()` semantics) (`runner.js:59,205-213`).
  - reserved keybinding conflicts (`runner.js:6-8,35-45`).
  - namespace collision behavior (`command`, `command:2` etc.) (`runner.js:327-347`).
  - invalidate/rebind around replacement (`runner.js:289-293,356-364`).
- `dist/core/agent-session.js`
  - `_bindExtensionCore()` merges commands from extension/prompt/skill and exposes `getCommands`.
  - `_applyExtensionBindings()` + `bindExtensions()` rewire command/UI contexts after session replacement.
  - `setSessionName`, `setModel`, `setThinkingLevel`, `setActiveTools`, etc. in extension context.
- `dist/core/extensions/loader.js`
  - Jiti-based loader for extension files and inline factory loading; local path-based resolution with aliases/virtual modules (`loader.js:264-326,316-333`).
  - no RPC/network import path in loader.

### 7) Extension UI protocol in RPC
- `docs/rpc.md`
  - documents extension UI methods as `extension_ui_request` with `extension_ui_response` on dialog methods (`select`, `confirm`, `input`, `editor`), fire-and-forget methods for non-blocking notify/status/widget/title/editor text updates.
  - explicitly marks `ctx.hasUI` true in RPC with this protocol.
- `dist/modes/rpc/rpc-mode.js`
  - runtime listens/reads extension UI responses and completes pending UI promises (`rpc-mode.js:562-589`).
- `docs/rpc.md:739` notes built-in TUI commands (`/settings`, `/hotkeys`) are not part of `get_commands` or prompt-driven RPC execution.

### 8) Local-only surfaces (non-remote)
- `dist/package-manager-cli.js` + `dist/core/package-manager.js`
  - `install/remove/list/update` flow is a CLI command path, not an `rpc-mode` command.
- `docs/packages.md`:
  - documents package commands and security caveat: extensions have full system access.

### 9) Docs/code parity evidence
- `docs/usage.md` aligns modes (`print/json/rpc`) and interactive TUI slash commands `/new /resume /tree /fork /clone`.
- `docs/rpc.md` aligns major commands (`prompt`, `steer`, `follow_up`, `abort`, `get_state`, `set_model`, `fork`, `clone`, `get_fork_messages`, `get_commands`, `extension_ui_*`).
- `docs/session-format.md` confirms session versioning and parentSession semantics (`version 3`, `parentSession`).

## Explicit mismatch to capture in final report
- `dist/core/extensions/types.d.ts` includes `hasUI` documentation that implies false in print/RPC, but `docs/rpc.md` + runtime command handling (`rpc-mode.js`) implement active RPC extension UI request/response. Treat as concrete implementation-vs-contract mismatch.

## Constraints / risks / assumptions
- No source edits.
- Remote exposure is intentionally process-bound via stdio/RPC mode; evidence of non-stdio network listeners was not found in inspected transport path.
- Main risk is extension privilege: extensions and skills can execute arbitrary local code and influence session mutation.
- Canonical path for local evidence should be normalized to:
  - `/Users/adityasharma/Library/pnpm/global/v11-4430-19e795c1460/node_modules/@earendil-works/pi-coding-agent`
- Variants like `~/.bun/install/global/node_modules/...` or `.../v4430-19e795c1460/...` appear in environment path artifacts; treat as lookup variants only.
- Interactive command/steering queueing semantics are not identical: session layer explicitly blocks queued extension commands with exact error message (see anchor above).
