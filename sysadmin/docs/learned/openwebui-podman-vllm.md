# Open WebUI + local vLLM via Podman

> **Sources:** https://docs.openwebui.com/reference/env-configuration/ , https://docs.vllm.ai/en/latest/deployment/frameworks/open-webui/
> **Fetched:** 2026-04-17
> **read_when:** Setting up or fixing local WebUI access for the machine's vLLM service

Open WebUI runs as a **user systemd service** backed by **rootless Podman**.

## Current host wiring

- Unit: `~/.config/systemd/user/openwebui.service`
- Container name: `openwebui`
- Image: `ghcr.io/open-webui/open-webui:main`
- Host URL: `http://127.0.0.1:3000`
- LAN URLs: `http://192.168.1.110:3000`, `http://192.168.1.110:8080`
- Tailnet URLs: `http://100.100.48.112:3000`, `http://100.100.48.112:8080`
- MagicDNS FQDN: `http://framed.tailbb0fa1.ts.net:3000`, `http://framed.tailbb0fa1.ts.net:8080`
- Data volume: `openwebui-data`
- vLLM upstream: `http://host.containers.internal:8000/v1`
- Default model: `google/gemma-4-26B-A4B-it`
- vLLM tool calling: `--enable-auto-tool-choice --tool-call-parser gemma4`
- Podman net: `webskill_webskill`
- SearXNG URL for Open WebUI: `http://searxng:8080/search?q=<query>`

Security:

- Bind on IPv4 only: `0.0.0.0:3000` and `0.0.0.0:8080`.
- This makes the UI reachable from current LAN and Tailscale without pinning a changing `100.x` address.
- Current assumption: no public IPv4 path to this machine because router does not forward ports.
- If threat model changes, revert to interface-specific binds or add firewall rules.
- SearXNG stays internal to the Podman bridge; Open WebUI reaches it over the shared container network instead of exposing SearXNG broadly.

## Service management

```bash
systemctl --user daemon-reload
systemctl --user enable --now openwebui.service
systemctl --user status openwebui.service --no-pager
journalctl --user -u openwebui.service -f
```

Container inspection:

```bash
podman ps --filter name=openwebui
podman logs openwebui
podman volume inspect openwebui-data
```

## Health checks

Host:

```bash
curl -sf http://127.0.0.1:3000/health
curl -sf http://192.168.1.110:3000/health
curl -sf http://192.168.1.110:8080/health
curl -sf http://100.100.48.112:3000/health
curl -sf http://100.100.48.112:8080/health
curl -sf http://127.0.0.1:8000/v1/models | jq .
```

Open WebUI web search settings:

```text
Enable Web Search = on
Web Search Engine = searxng
SearXNG Query URL = http://searxng:8080/search?q=<query>
```

From another bridge-network container, `host.containers.internal` resolves on this host and reaches the vLLM API.

## Gotchas

- `OPENAI_API_BASE_URL`, `OPENAI_API_KEY`, `DEFAULT_MODELS`, etc. are **PersistentConfig** settings in Open WebUI. After first boot, later env var edits may be ignored because values are stored in the app DB.
- `ENABLE_WEB_SEARCH`, `WEB_SEARCH_ENGINE`, `SEARXNG_QUERY_URL`, `WEB_SEARCH_RESULT_COUNT`, and `WEB_LOADER_CONCURRENT_REQUESTS` are also PersistentConfig settings.
- If env var changes appear ignored, either update them in the Open WebUI admin UI or temporarily set `ENABLE_PERSISTENT_CONFIG=False`, or reset the `openwebui-data` volume for a fresh install.
- First user created in the UI becomes admin unless headless admin env vars are supplied.
- If models do not appear, verify `vllm.service` is up and `curl http://127.0.0.1:8000/v1/models` works on host.
- Short hostname `framed` may resolve to IPv6 first on some clients. If that stalls, use `192.168.1.110`, `100.100.48.112`, or `framed.tailbb0fa1.ts.net`.
- If web search fails, confirm `podman exec openwebui getent hosts searxng` resolves and `curl http://searxng:8080/search?q=test\\&format=json` works inside the Open WebUI container.
