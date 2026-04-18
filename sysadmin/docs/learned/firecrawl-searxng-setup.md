# Firecrawl + SearXNG Self-Hosted Setup

## Firecrawl
- **Location:** `/home/bumpyclock/Projects/oss/firecrawl`
- **API:** `http://localhost:3002`
- **Bull Admin:** `http://localhost:3002/admin/<BULL_AUTH_KEY>/queues`
- **tmux session:** `firecrawl`
- **Config:** `.env` in repo root

### Key findings
- BuildKit required: install `docker-buildx` and set `{"features":{"buildkit":true}}` in `/etc/docker/daemon.json`
- `POSTGRES_DB` must stay `postgres` — pg_cron is hardcoded to that DB name in the nuq-postgres Dockerfile
- Supabase auth (`USE_DB_AUTHENTICATION=true`) is NOT supported for self-hosted — requires 33+ cloud-only tables and custom RPC functions
- Set `MAX_RAM=0.95` and `MAX_CPU=0.95` to prevent worker stall warnings in constrained containers
- AI features point to local vLLM: `OPENAI_BASE_URL=http://host.docker.internal:8000/v1`, model `openai/gpt-oss-20b`
- API keys are optional for self-hosted SDK usage

### Start/stop
```bash
cd /home/bumpyclock/Projects/oss/firecrawl
docker compose up -d    # or in tmux for log visibility
docker compose down
```

## SearXNG
- **Location:** `/home/bumpyclock/Projects/oss/searxng`
- **UI/API:** `http://localhost:8888`
- **JSON API:** `http://localhost:8888/search?q=QUERY&format=json`
- Settings: `searxng/settings.yml` (JSON format enabled, limiter off)

## WebSkill SearXNG
- **Compose:** `/home/bumpyclock/Projects/dotfiles/skills/web-skill/docker-compose.yml`
- **LAN URL:** `http://192.168.1.110:8899`
- **JSON API:** `http://192.168.1.110:8899/search?q=QUERY&format=json`
- **Container name:** `webskill-searxng`
- **Port binding:** `127.0.0.1:8899:8080` and `192.168.1.110:8899:8080`
- **Base URL env:** `SEARXNG_BASE_URL=http://192.168.1.110:8899/`

### Notes
- Open WebUI uses the internal Podman DNS name `searxng:8080` on network `webskill_webskill`.
- vLLM already listens on `0.0.0.0:8000`, so LAN access already works at `http://192.168.1.110:8000/v1/models`.
- If LAN IP changes, update `SEARXNG_BASE_URL` accordingly.
- Explicit host-IP binds avoid wildcard IPv6 exposure from rootless Podman.

### Integration with Firecrawl
- `SEARXNG_ENDPOINT=http://host.docker.internal:8888` in Firecrawl `.env`

### Start/stop
```bash
cd /home/bumpyclock/Projects/oss/searxng
docker compose up -d
docker compose down
```
