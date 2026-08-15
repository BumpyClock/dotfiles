#!/usr/bin/env python3

import argparse
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class ModelSpec:
    repo_id: str
    sha: str
    allow_patterns: tuple[str, ...] | None = None


TOKENIZER_FILES = (
    "config.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "vocab.json",
    "merges.txt",
    "special_tokens_map.json",
    "added_tokens.json",
)

MODELS = (
    ModelSpec(
        "mlx-community/VibeVoice-Realtime-0.5B-fp16",
        "59ba546c294935410544f037a2de20b9da7ed219",
    ),
    ModelSpec(
        "mlx-community/VibeVoice-ASR-bf16",
        "12076ff8cb141fcb672abc9f8957b08aab5ecf94",
    ),
    ModelSpec(
        "Qwen/Qwen2.5-0.5B",
        "060db6499f32faf8b98477b0a26969ef7d8b9987",
        TOKENIZER_FILES,
    ),
    ModelSpec(
        "Qwen/Qwen2.5-7B",
        "d149729398750b98c0af14eb82c78cfe92750796",
        TOKENIZER_FILES,
    ),
)


def prefetch(
    cache_dir: Path,
    *,
    api: Any = None,
    downloader: Callable[..., str] | None = None,
) -> None:
    if api is None or downloader is None:
        from huggingface_hub import HfApi, snapshot_download

        api = api or HfApi()
        downloader = downloader or snapshot_download

    cache_dir.mkdir(parents=True, exist_ok=True)
    for model in MODELS:
        resolved_sha = api.model_info(model.repo_id, revision="main").sha
        if resolved_sha != model.sha:
            raise RuntimeError(
                f"revision drift for {model.repo_id}: expected {model.sha}, got {resolved_sha}"
            )

        print(f"Downloading {model.repo_id}@{model.sha}", flush=True)
        download_options = {
            "revision": "main",
            "cache_dir": str(cache_dir),
        }
        if model.allow_patterns:
            download_options["allow_patterns"] = model.allow_patterns
        snapshot_path = Path(downloader(model.repo_id, **download_options))
        if snapshot_path.name != model.sha:
            raise RuntimeError(
                f"downloaded unexpected snapshot for {model.repo_id}: {snapshot_path.name}"
            )


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch reviewed VibeVoice model revisions")
    parser.add_argument("--cache-dir", type=Path, required=True)
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    prefetch(args.cache_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
