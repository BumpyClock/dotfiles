# VibeVoice endpoints on Apple Silicon macOS

> **Sources:**
> - https://github.com/microsoft/VibeVoice/blob/main/docs/vibevoice-realtime-0.5b.md
> - https://github.com/microsoft/VibeVoice/blob/main/docs/vibevoice-vllm-asr.md
> - https://github.com/Blaizzy/mlx-audio
> **Verified:** 2026-07-20
> **read_when:** Installing, operating, or troubleshooting VibeVoice TTS/ASR on the Mac Studio or routing it through framed

## Architecture

One MLX-Audio 0.4.5 process serves both models on Apple Silicon:

| Route | LiteLLM alias | Upstream model |
|---|---|---|
| `POST /v1/audio/speech` | `vibevoice-.05b` | `mlx-community/VibeVoice-Realtime-0.5B-fp16` |
| `POST /v1/audio/transcriptions` | `vibevoice-asr` | `mlx-community/VibeVoice-ASR-bf16` |

The process binds only `127.0.0.1:7781`. Tailscale Serve publishes a tailnet-only TCP forward on the same port, so both the raw Tailscale IP and MagicDNS name work without exposing the Mac's LAN address.

```text
client -> framed:4001 audio-front-proxy -> LiteLLM :4000
       -> 100.91.175.86:7781 (Tailscale Serve)
       -> 127.0.0.1:7781 (MLX-Audio)
```

Microsoft's `vibevoice-vllm-asr.md` deployment uses the NVIDIA-oriented vLLM container and `/v1/chat/completions`. It is not the macOS path. MLX-Audio provides the conventional OpenAI transcription endpoint and native Metal execution.

## Pinned runtime

- Python: `>=3.13,<3.14`, managed by uv.
- MLX-Audio: `0.4.5`.
- TTS snapshot: `59ba546c294935410544f037a2de20b9da7ed219` (~2.14 GB).
- ASR snapshot: `12076ff8cb141fcb672abc9f8957b08aab5ecf94` (~16.66 GB).
- TTS tokenizer: `Qwen/Qwen2.5-0.5B@060db6499f32faf8b98477b0a26969ef7d8b9987`.
- ASR tokenizer: `Qwen/Qwen2.5-7B@d149729398750b98c0af14eb82c78cfe92750796`.
- Hugging Face cache: `~/.local/share/vibevoice/huggingface`.
- Logs: `~/Library/Logs/VibeVoice/`.
- LaunchAgent: `~/Library/LaunchAgents/com.bumpyclock.vibevoice.plist`.

The installer resolves each repository's `main` revision and refuses to download if it differs from the reviewed SHA. Runtime uses `HF_HUB_OFFLINE=1`.

## Install and operate

```bash
sysadmin/vibevoice/setup-macos.sh install
sysadmin/vibevoice/setup-macos.sh status
sysadmin/vibevoice/setup-macos.sh restart
```

The installer adds missing `uv`, `ffmpeg`, and `git-lfs` Homebrew formulae, syncs the locked environment, downloads both models and their Qwen tokenizers, installs the LaunchAgent, waits for the API listener, then configures:

```bash
tailscale serve --bg --yes --tcp=7781 tcp://127.0.0.1:7781
```

Never use Tailscale Funnel for these unauthenticated backends. Tailnet access is controlled by Tailscale identity and grants; `framed:4001` separately enforces the LiteLLM key.

## Local requests

TTS:

```bash
curl --fail http://127.0.0.1:7781/v1/audio/speech \
  -H 'Content-Type: application/json' \
  --data '{
    "model": "mlx-community/VibeVoice-Realtime-0.5B-fp16",
    "input": "The quick brown fox jumps over the lazy dog.",
    "voice": "en-Emma_woman",
    "response_format": "wav"
  }' \
  --output /tmp/vibevoice.wav
```

ASR:

```bash
curl --fail http://127.0.0.1:7781/v1/audio/transcriptions \
  -F file=@/tmp/vibevoice.wav \
  -F model=mlx-community/VibeVoice-ASR-bf16 \
  -F response_format=json \
  -F max_tokens=8192
```

## MLX server workaround

MLX-Audio 0.4.5 preloads models on Uvicorn's thread but runs inference on a broker thread. VibeVoice then fails with `There is no Stream(gpu, 0) in current thread`. `mlx_audio_server.py` defers model loading to the broker and creates that thread's Metal stream. Remove this bootstrap only after upstream performs model loading and generation on the same initialized MLX thread.

## Failure modes

- Models load lazily on their first inference request. `/v1/models` is initially empty, and the first TTS/ASR call has additional load latency.
- TTS inputs of three words or fewer can be unstable. Use a complete sentence for health tests.
- The realtime 0.5B model is single-speaker per request. Extra languages/voices remain experimental.
- ASR can process long recordings, but the gateway buffers uploads and has a finite timeout. Prefer compressed mono audio for long sessions.
- MLX model repositories are community conversions of Microsoft weights. Update their pinned SHAs only after a fresh TTS/ASR quality test.
- After each model has handled one request, `/v1/models` should list it. If inference fails, restart the LaunchAgent and inspect logs; do not expose the backend on `0.0.0.0` as a workaround.
