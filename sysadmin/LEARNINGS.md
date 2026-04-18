# LEARNINGS

- Strix Halo iGPU "GPU memory" = unified system RAM cap via kernel params: `amdgpu.gttsize` (MiB) + `ttm.pages_limit` (4K pages). See `docs/learned/amd-strix-halo-vllm-setup.md`.

