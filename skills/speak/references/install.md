# sag 🗣️ — “Mac-style speech with ElevenLabs”

One-liner TTS that works like `say`: stream to speakers by default, list voices, or save audio files.

## Install
Homebrew (macOS):
```bash
brew install steipete/tap/sag  # auto-taps steipete/tap
```

Prebuilt binaries:
- Download Linux, macOS, and Windows archives from the [latest GitHub release](https://github.com/steipete/sag/releases/latest).
- On Linux, unpack the `linux_amd64` archive and place `sag` somewhere on your `PATH`, for example `/usr/local/bin`.

Go toolchain:
```bash
go install github.com/steipete/sag/cmd/sag@latest
```
Requires Go 1.24+.

Debian/Ubuntu source build prerequisites:
```bash
sudo apt install build-essential pkg-config libasound2-dev
```

## Configuration
- `ELEVENLABS_API_KEY` (required)
- `--api-key-file` or `ELEVENLABS_API_KEY_FILE`/`SAG_API_KEY_FILE` to load the key from a file
- Optional defaults: `ELEVENLABS_VOICE_ID` or `SAG_VOICE_ID`
