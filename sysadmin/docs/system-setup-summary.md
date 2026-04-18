# System Setup Summary

> Machine: AMD Ryzen AI MAX+ 395 / 128GB RAM / Arch Linux
> Date: 2026-01-30

## Hardware

- **CPU:** AMD Ryzen AI MAX+ 395 w/ Radeon 8060S (16C/32T, up to 5.19 GHz)
- **GPU:** Integrated gfx1151 (Strix Halo) — shares system RAM as VRAM
- **RAM:** 128 GiB DDR5
- **OS:** Arch Linux (rolling), kernel 6.18.7-arch1-1
- **Boot:** systemd-boot (UEFI, Secure Boot off)

## GPU / AI Configuration

### Kernel Parameters (systemd-boot)

File: `/boot/loader/entries/2026-01-31_04-44-46_linux.conf`

```
options root=/dev/ArchinstallVg/root zswap.enabled=0 rw rootfstype=ext4 amd_iommu=off amdgpu.gttsize=98304 ttm.pages_limit=25165824
```

| Parameter | Value | Purpose |
|---|---|---|
| `amd_iommu=off` | — | Lower latency for GPU |
| `amdgpu.gttsize=98304` | 96 GiB in MiB | GPU accessible unified memory |
| `ttm.pages_limit=25165824` | 96 GiB in 4K pages | Pinned memory cap |

This leaves ~32 GiB for OS + apps.

### User Groups

Added `bumpyclock` to `video` and `render` groups for GPU device access (`/dev/kfd`, `/dev/dri/renderD128`).

### BIOS

GPU memory should be set to 512 MB in BIOS (recommended by upstream guide).

## Packages Installed

| Package | Purpose |
|---|---|
| `tmux 3.6a` | Terminal multiplexer for shared sessions |
| `distrobox 1.8.2` | Run Fedora-based containers on Arch with GPU passthrough |

Both `docker` and `podman` were already present.

## vLLM Container (distrobox)

Image: `docker.io/kyuz0/vllm-therock-gfx1151:latest`

```bash
distrobox create -n vllm \
  --image docker.io/kyuz0/vllm-therock-gfx1151:latest \
  --additional-flags "--device /dev/kfd --device /dev/dri --group-add video --group-add render --security-opt seccomp=unconfined"
```

- Enter: `distrobox enter vllm`
- Verify GPU: `rocm-smi`
- Serve model: `start-vllm` (TUI wizard)
- API: `http://localhost:8000/v1/` (OpenAI-compatible)
- Model cache: `~/.cache/huggingface`
- Kernel cache: `~/.cache/vllm/`

## tmux Sessions

| Session | Purpose | Alias |
|---|---|---|
| `shared` | General collaboration | `tcs` |
| `dev` | Dev / testing | `tcd` |

CLI tool: `bun ~/sysadmin/scripts/tmux-connect.ts <session|ls>`

### Shell Aliases (in `~/.zshrc`)

```bash
alias tcs='bun ~/sysadmin/scripts/tmux-connect.ts shared'
alias tcd='bun ~/sysadmin/scripts/tmux-connect.ts dev'
```

## Docs

- `docs/learned/amd-strix-halo-vllm-setup.md` — Full vLLM + Strix Halo guide (re-fetch if >24h old)
- Source: https://github.com/kyuz0/amd-strix-halo-vllm-toolboxes
