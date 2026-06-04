---
name: whatsapp
description: "WhatsApp router: history/search/read/send; wacrawl read, wacli live."
---

# WhatsApp

First stop for WhatsApp work. Source boundary:

- `wacrawl`: WhatsApp Desktop archive. Read-only, best local history, no network, no sending.
- `wacli`: linked-device accounts. Alt accounts, live sync, auth, sending, chat/group mutation, WhatsApp Web protocol.

If user names `wacrawl` or `wacli` repo work specifically, read that tool's own skill too.

## Routing

- Primary reads/search/history → `wacrawl`
- Unread counts (chat-level, not per-message) → `wacrawl`
- Freshness-sensitive reads → check `wacrawl status`; `wacrawl sync` when asked or when current data matters
- Alt accounts (`me`, `molty`, named stores) → `wacli --account NAME`
- Sending, reactions, presence, archive/pin/mute/mark-read, group/channel mutations → `wacli` only after explicit user intent
- Coverage comparisons → `wacrawl` = Desktop archive truth, `wacli` = linked-device/live with protocol limits

## Safety

- Never send/mutate WhatsApp state unless explicitly requested.
- Prefer read-only `wacli`: pass `--read-only` or set `WACLI_READONLY=1`.
- Don't write into WhatsApp Desktop's app container.
- Don't edit `wacli` `session.db` directly.
- Keep named `wacli` accounts isolated; don't merge stores.
- Report source freshness, account name, known gaps when answering from local stores.

## Commands

### Primary Archive

```bash
wacrawl status
wacrawl doctor
wacrawl sync
wacrawl chats --limit 20
wacrawl unread --limit 20
wacrawl --json unread --limit 100
wacrawl messages --after 2026-01-01 --limit 50
wacrawl messages --chat JID --asc --limit 100
wacrawl messages --has-media --limit 50
wacrawl --json search "query"
wacrawl search "query" --after 2026-01-01 --from-them
```

Archive media/backups only when asked:

```bash
wacrawl import --copy-media
wacrawl backup status
wacrawl --sync never backup push
```

### Alt/Live Accounts

Read-only inspection:

```bash
wacli accounts list --json
wacli --account me auth status --read-only --json
wacli --account me chats list --read-only --json
wacli --account me messages list --read-only --json --limit 50
wacli --account me messages search --read-only --json "query"
```

Background live sync (only when requested, prefer `tmux`):

```bash
wacli --account me sync --follow --events
wacli --account me sync --once --events
```

Media/sending/mutations (explicit request only):

```bash
wacli --account me media download --chat JID --id MESSAGE_ID
wacli --account me send text --to JID_OR_NAME --message "message"
wacli --account me send file --to JID_OR_NAME --file ./file.jpg --caption "caption"
wacli --account me send text --to JID --reply-to MESSAGE_ID --message "reply"
```

### Comparisons

Compare `wacrawl` vs `wacli`:

- Message counts, date spans
- Chat counts
- Newest message timestamp
- Overlap by `msg_id`, by `chat_jid + msg_id` (normalized JIDs)
- Gaps explained by linked-device history limits vs Desktop archive coverage

## Repo Pointers

- `~/Projects/wacrawl`: Desktop archive importer/search/backup.
- `~/Projects/wacli`: linked-device client/sync/send.
- Global skill copies: `~/Projects/agent-scripts/skills/wacrawl`, `~/Projects/agent-scripts/skills/wacli`.
