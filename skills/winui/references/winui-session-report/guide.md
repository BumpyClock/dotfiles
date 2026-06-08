---
name: winui-session-report
description: "Analyze agent sessions (GitHub Copilot CLI, Claude Code) and produce diagnostic report. Use for session feedback, agent-behavior debug, build-session review."
disable-model-invocation: true
---

### Session Analysis Report

Generate agent-session diagnostic report with `Analyze-Session.ps1`. Script detects GitHub Copilot CLI vs Claude Code from env vars + on-disk format, then dispatches parser. If neither harness detected, exits with clear error.

### Privacy and Sensitivity

`Analyze-Session.ps1` always:

1. **Embeds a "Privacy and sensitivity" section at the top of the generated `session-report.md`** (right above the Overview table), and
2. **Prints a yellow PRIVACY NOTICE banner to the console** when it finishes writing the file.

Agent must surface this guidance in reply, not bury it in script output. After findings, include short second-person privacy reminder. Template, adapt if needed:

> ⚠️ **Heads-up before you share `session-report.md`** — this file contains your unredacted session transcript: file contents and paths the agent read or edited, your prompts verbatim (including any secrets you may have pasted), tool output, environment values, and local paths under `C:\Users\<you>\…`. You're responsible for what you share — please open the file in your editor and read it end-to-end before attaching it to a public issue, posting it in chat, or sending it outside your organization. Redact anything sensitive. If you only need to share the high-level metrics, ask me to summarize the file instead of attaching it.

If user wants high-level metrics only (turn counts, skill usage, build success rate), summarize report instead of sharing file. Tell user summary-only path.

### Steps

1. **Run script**:

```powershell
# Analyze the most recent session (auto-detects harness) and save report
.\Analyze-Session.ps1 -OutputFile session-report.md

# Or analyze a specific session by ID (searched in both harness locations)
.\Analyze-Session.ps1 -SessionId "<session-id>" -OutputFile session-report.md

# Or analyze a transcript file directly (format sniffed from content)
.\Analyze-Session.ps1 -EventsFile <path-to-transcript.jsonl> -OutputFile session-report.md

# Force a specific format if auto-detection picks the wrong harness
.\Analyze-Session.ps1 -Format ClaudeCode -OutputFile session-report.md

# Skip subagent transcripts (Claude Code only) for a parent-only view
.\Analyze-Session.ps1 -SkipSubagents -OutputFile session-report.md
```

Detection:
- Current session wins when explicit ID exists: `COPILOT_AGENT_SESSION_ID` or `CLAUDE_SESSION_ID` beats "most recently modified", so parallel terminal cannot shadow invoked session.
- Env first: `CLAUDECODE=1` or `CLAUDE_CODE_ENTRYPOINT` -> Claude Code; `COPILOT_*` env vars -> Copilot.
- Claude Code: prefer most-recent JSONL whose `cwd` matches current working dir.
- Explicit `-EventsFile`: sniff format from first events.
- Neither harness: non-zero exit + message naming both supported locations.

2. **Review `session-report.md`** — summarize:
   - How many turns, how long, token usage
   - What skills were loaded and when
   - Build success/failure pattern
   - Any stuck patterns or tooling issues detected

3. **Append observations**:
   - Was the final app working? What's missing?
   - Quality assessment of the generated code
   - Suggestions specific to what went wrong

4. **Recommend tooling improvements**:
   - Are there rules that need to be added to the Roslyn analyzer to prevent common mistakes detected during the session?
   - Were there bugs or issues with winapp run or the BuildAndRun.ps1 script?
   - Are there features that could be added to lower the number of turns required to complete a task?

### What the Report Covers

| Section | Details |
|---------|---------|
| Overview | Harness, session ID, model, duration, turns, tokens (incl. cache tokens for Claude Code) |
| Prompt | The original user request |
| Turn Breakdown | Turns and tokens by category (building, coding, exploring, subagent dispatch, etc.) |
| Skills | Which were invoked and when, including from inside subagent transcripts |
| Subagents | (Claude Code only) Per-agent breakdown of dispatched subagents and their work |
| Build Analysis | Build attempts, failures, errors, whether BuildAndRun.ps1 was used |
| Stuck Patterns | Build loops, repeated file reads, obj/ clean cycles |
| Tooling Issues | Auto-detected improvement opportunities |
| Turn Detail | Every turn with tools used and errors flagged, parent and subagent transcripts shown separately |

### When to Use

- User asks for session report, session feedback, build-session review, or agent-behavior diagnosis.
