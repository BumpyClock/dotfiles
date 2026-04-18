# AMD Strix Halo (gfx1151) — vLLM Toolbox/Container

> **Source:** https://github.com/kyuz0/amd-strix-halo-vllm-toolboxes
> **Fetched:** 2026-04-17
> **read_when:** Setting up or troubleshooting vLLM on Strix Halo / gfx1151 iGPU

Fedora 43 Docker/Podman container, Toolbx-compatible, for serving LLMs with **vLLM** on **AMD Ryzen AI Max "Strix Halo" (gfx1151)**. Built on **TheRock nightly ROCm** builds. Upstream vLLM does not list gfx1151 as supported — this toolbox is the path.

Image: `docker.io/kyuz0/vllm-therock-gfx1151:latest`

## Current caveats (2026-04)

- **Vision models disabled.** Vision encoder profiling is patched out to avoid MIOpen exhaustive-kernel-search hangs. Multimodal (e.g. Qwen3.5 MoE vision) won't work. See issue #30.
- **Attention backend.** Default is `TRITON_ATTN` to dodge a `ROCM_ATTN` regression on gfx1151 (vllm #36702). If attention kernels error out, force `VLLM_ATTENTION_BACKEND=TRITON_ATTN`.
- **RDMA/RoCE v2 clustering** now ships: custom RCCL enables TP=2 across two Strix Halo nodes as a single 256 GB unified-memory GPU over e.g. Intel E810.

## Tested Models (Benchmarks)

Full table: https://kyuz0.github.io/amd-strix-halo-vllm-toolboxes/
Cells = `Max Context Length (GPU Memory Utilization)`.

| Model | TP | 1 Req | 4 Reqs | 8 Reqs | 16 Reqs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `meta-llama/Meta-Llama-3.1-8B-Instruct` | 1 | 128k (0.95) | 128k (0.95) | 128k (0.95) | 128k (0.95) |
| `google/gemma-3-12b-it` | 1 | 128k (0.95) | 128k (0.95) | 128k (0.95) | 128k (0.95) |
| `openai/gpt-oss-20b` | 1 | 128k (0.95) | 128k (0.95) | 128k (0.95) | 128k (0.95) |
| `Qwen/Qwen3-14B-AWQ` | 1 | 40k (0.95) | 40k (0.95) | 40k (0.95) | 40k (0.95) |
| `btbtyler09/Qwen3-Coder-30B-A3B-Instruct-gptq-4bit` | 1 | 256k (0.95) | 256k (0.95) | 256k (0.95) | 256k (0.95) |
| `btbtyler09/Qwen3-Coder-30B-A3B-Instruct-gptq-8bit` | 1 | 256k (0.95) | 256k (0.95) | 256k (0.95) | 256k (0.95) |
| `dazipe/Qwen3-Next-80B-A3B-Instruct-GPTQ-Int4A16` | 1 | 256k (0.95) | 256k (0.95) | 256k (0.95) | 256k (0.95) |
| `openai/gpt-oss-120b` | 1 | 128k (0.95) | 128k (0.95) | 128k (0.95) | 128k (0.95) |
| `zai-org/GLM-4.7-Flash` | 1 | 198k (0.95) | 198k (0.95) | 198k (0.95) | 198k (0.95) |

## Toolbx vs Docker/Podman

- **Fedora Toolbx (dev):** shares HOME + user; models/configs live on host.
- **Docker/Podman (deploy/perf):** host networking + IPC tuning. Mount host dir for model weights.

## Quickstart — Fedora Toolbx

Recommended: the repo's `refresh_toolbox.sh` auto-detects InfiniBand (`/dev/infiniband`) and exposes the right devices.

```bash
./refresh_toolbox.sh
```

Manual:

```bash
toolbox create vllm \
  --image docker.io/kyuz0/vllm-therock-gfx1151:latest \
  -- --device /dev/dri --device /dev/kfd \
  --group-add video --group-add render --security-opt seccomp=unconfined

toolbox enter vllm
```

## Quickstart — Ubuntu/Arch (Distrobox)

Ubuntu's toolbox pkg breaks GPU access — use Distrobox.

```bash
distrobox create -n vllm \
  --image docker.io/kyuz0/vllm-therock-gfx1151:latest \
  --additional-flags "--device /dev/kfd --device /dev/dri --group-add video --group-add render --security-opt seccomp=unconfined"

distrobox enter vllm
```

Verify GPU: `rocm-smi`

## Serving a Model

TUI wizard with pre-configured models + correct flags:

```bash
start-vllm
```

Paths:
- Models: `~/.cache/huggingface`
- Compiled kernels: `~/.cache/vllm/`

Cluster TUI (Ray + multi-node vLLM): `start-vllm-cluster`

## Testing the API

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"Qwen/Qwen2.5-7B-Instruct","messages":[{"role":"user","content":"Hello!"}]}'
```

Auto-detect model:

```bash
MODEL=$(curl -s http://localhost:8000/v1/models | jq -r '.data[0].id')
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d "{\"model\": \"$MODEL\", \"messages\":[{\"role\":\"user\",\"content\":\"Hello!\"}]}"
```

## Web UI (HuggingFace ChatUI)

Remote: SSH-forward port 8000 first (`ssh -L 0.0.0.0:8000:localhost:8000 ...`).

```bash
docker run -p 3000:3000 \
  --add-host=host.docker.internal:host-gateway \
  -e OPENAI_BASE_URL=http://host.docker.internal:8000/v1 \
  -e OPENAI_API_KEY=dummy \
  -v chat-ui-data:/data \
  ghcr.io/huggingface/chat-ui-db
```

## Host Configuration

### Test reference

- Framework Desktop, Ryzen AI MAX+ 395, 128 GB RAM
- BIOS GPU alloc: **512 MB** (unified memory is grown via kernel params, not BIOS)
- Fedora 43, Linux 6.18+

### Kernel Parameters (upstream recommendation)

```
iommu=pt amdgpu.gttsize=126976 ttm.pages_limit=32505856
```

| Parameter | Purpose |
|---|---|
| `iommu=pt` | IOMMU pass-through — reduces overhead for both RDMA NIC and iGPU unified memory access (preferred over `amd_iommu=off` now that RDMA clustering is in scope) |
| `amdgpu.gttsize=126976` | Cap GPU unified memory to 124 GiB (126976 MiB) |
| `ttm.pages_limit=32505856` | Cap pinned memory to 124 GiB (32505856 × 4 KiB) |

**Local deviation:** this host uses 96 GiB (`amdgpu.gttsize=98304`, `ttm.pages_limit=25165824`) to leave 32 GiB for OS.

Apply:

```bash
# Edit /etc/default/grub → GRUB_CMDLINE_LINUX
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
sudo reboot
```

## RDMA/RoCE v2 Clustering (optional)

Custom `librccl.so` enables RDMA on gfx1151 → Tensor Parallelism across two machines with ~5 µs latency. Requires e.g. Intel E810 NICs. `refresh_toolbox.sh` auto-exposes RDMA devices when present. See `rdma_cluster/setup_guide.md` in the upstream repo for hardware + config.

## Failure modes / gotchas

- **Attention kernel errors on startup** → set `VLLM_ATTENTION_BACKEND=TRITON_ATTN`.
- **Hang loading a vision/multimodal model** → vision is patched off in this image; pick a text-only variant.
- **`linux-firmware-20251125`** once broke gfx1151 ROCm init; AMD reverted. Avoid that specific build.
- **vLLM compile cache** lives at `~/.cache/vllm/` — deleting forces a full recompile; keep it on the host when using Toolbx.
