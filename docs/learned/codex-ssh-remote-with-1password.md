---
summary: "How to make a 1Password-backed SSH host discoverable and usable by the Codex app."
read_when:
  - Adding an SSH host to Codex remote connections.
  - Exporting a 1Password SSH identity for OpenSSH.
  - Debugging Codex SSH discovery or remote startup.
---

# Codex SSH remote with 1Password

## Requirements

- Codex discovers concrete aliases from `~/.ssh/config`; pattern-only hosts do not count.
- Local `ssh <alias>` must work non-interactively.
- Remote user's login shell must expose an installed and authenticated `codex` command.

## Pattern

Export the selected 1Password SSH key in OpenSSH format to a dedicated file:

```bash
umask 077
op read \
  --out-file ~/.ssh/id_<host> \
  "op://<vault>/<ssh-key-item>/private key?ssh-format=openssh"
chmod 600 ~/.ssh/id_<host>
```

Run every `op` command inside the required fresh authenticated tmux session.
Never print private key material. Verify the exported key's fingerprint against
the SSH key item before use.

Add a concrete host block:

```sshconfig
Host <alias>
  HostName <tailscale-ip-or-magicdns-name>
  HostKeyAlias <existing-known-host-alias>
  User <remote-user>
  IdentityFile ~/.ssh/id_<host>
  IdentitiesOnly yes
```

`HostKeyAlias` reuses an existing trusted `known_hosts` entry when `HostName`
changes from a LAN name to a Tailscale address. Confirm the presented server
fingerprint matches before adding this option.

## Verification

```bash
ssh -G <alias>
ssh -o BatchMode=yes -o ConnectTimeout=10 <alias> true
ssh <alias> '$SHELL -lc "command -v codex && codex --version"'
```

Then add the exact alias in Codex:

```text
codex://settings/connections/ssh/add?name=<alias>
```

The deep link adds a Codex-managed connection but leaves automatic connection
disabled. Enable it separately in **Settings > Connections** if desired.

## Pitfalls

- A configured 1Password `IdentityAgent` may expose no identities. Codex still
  needs an `IdentityFile` that OpenSSH can resolve reliably.
- Changing `HostName` can cause `Host key verification failed.` even when the
  server key is already trusted under another alias. Compare fingerprints;
  never bypass host-key checks.
- Successful SSH auth is insufficient when `codex` is absent from the remote
  login shell's `PATH`.
- Exporting a key weakens 1Password's at-rest isolation. Keep the file mode
  `0600`, never commit it, and remove it when the connection is retired.

## References

- [Remote connections](https://learn.chatgpt.com/docs/remote-connections#connect-to-an-ssh-host)
- [Codex settings deep links](https://learn.chatgpt.com/docs/reference/commands#settings)
