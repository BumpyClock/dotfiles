# gpt-oss-20b — context length vs memory (quick notes)

Fetched/derived: 2026-01-31

## Max context (model limit)

- `openai/gpt-oss-20b` supports **128k context** (HF config: `max_position_embeddings: 131072`).

## KV cache memory (rule of thumb)

From HF config:
- `num_hidden_layers=24`
- `num_key_value_heads=8`
- `head_dim=64`

Approx KV bytes per token (fp16/bf16 KV):  
`2 (K+V) * layers * kv_heads * head_dim * 2 bytes`

For gpt-oss-20b:  
`2 * 24 * 8 * 64 * 2 = 49,152 bytes/token (~48 KiB/token)`

So, KV for 128k tokens:  
`131,072 * 49,152 ~= 6.0 GiB`

Notes:
- Real usage higher: fragmentation, allocator overhead, additional buffers, concurrency, etc.
- vLLM uses block-based KV allocation; effective sizing also depends on block size and any context-parallel settings.

## Weights memory (very rough)

OpenAI cookbook (Transformers) guidance:
- MXFP4: ~16GB VRAM for `gpt-oss-20b` (NVIDIA Hopper/RTX 50xx support).
- bfloat16: ~48GB VRAM for `gpt-oss-20b`.

