---
name: video-transcript-downloader
description: "yt-dlp downloads: video, audio, subtitles, transcripts, clips, playlists."
---

# Video Transcript Downloader

`./scripts/vtd.js`: print transcript (clean paragraph, timestamps optional), download video/audio/subtitles.

Transcript behavior:
- YouTube: `youtube-transcript-plus` when possible.
- Fallback: subtitles via `yt-dlp`, cleaned into paragraph.

## Setup

```bash
cd ~/Projects/agent-scripts/skills/video-transcript-downloader && npm ci
```

CLI help:

```bash
./scripts/vtd.js --help
./scripts/vtd.js transcript --help
```

Subcommands support focused help without `--url`.

## Transcript (default: clean paragraph)

```bash
./scripts/vtd.js transcript --url 'https://…'
./scripts/vtd.js transcript --url 'https://…' --lang en
./scripts/vtd.js transcript --url 'https://…' --timestamps
./scripts/vtd.js transcript --url 'https://…' --keep-brackets
```

## Download video / audio / subtitles

```bash
./scripts/vtd.js download --url 'https://…' --output-dir ~/Downloads
./scripts/vtd.js audio --url 'https://…' --output-dir ~/Downloads
./scripts/vtd.js subs --url 'https://…' --output-dir ~/Downloads --lang en
```

## Formats

List available (format ids, resolution, container, audio-only):

```bash
./scripts/vtd.js formats --url 'https://…'
```

Download specific format id:

```bash
./scripts/vtd.js download --url 'https://…' --output-dir ~/Downloads -- --format 137+140
```

Prefer MP4 without re-encoding (remux):

```bash
./scripts/vtd.js download --url 'https://…' --output-dir ~/Downloads -- --remux-video mp4
```

## Notes

- Default transcript: single paragraph. `--timestamps` only when asked.
- Bracketed cues `[Music]` stripped by default; `--keep-brackets` to preserve.
- Extra `yt-dlp` args after `--` for `transcript` fallback, `download`, `audio`, `subs`, `formats`:

```bash
./scripts/vtd.js formats --url 'https://…' -- -v
```

## Troubleshooting

Missing `yt-dlp` / `ffmpeg`:

```bash
brew install yt-dlp ffmpeg
```

Verify:

```bash
yt-dlp --version
ffmpeg -version | head -n 1
```
