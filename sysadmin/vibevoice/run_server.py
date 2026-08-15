#!/usr/bin/env python3

import argparse
import signal
import subprocess
import sys
import time
from collections.abc import Sequence
from urllib import error, parse, request


TTS_MODEL = "mlx-community/VibeVoice-Realtime-0.5B-fp16"
ASR_MODEL = "mlx-community/VibeVoice-ASR-bf16"
MODEL_IDS = (TTS_MODEL, ASR_MODEL)


def build_command(host: str, port: int) -> list[str]:
    return [
        sys.executable,
        "-m",
        "mlx_audio.server",
        "--host",
        host,
        "--port",
        str(port),
        "--allowed-origins",
        "http://127.0.0.1,http://localhost",
    ]


def wait_until_ready(base_url: str, child: subprocess.Popen, timeout: float) -> None:
    deadline = time.monotonic() + timeout
    last_error: Exception | None = None

    while time.monotonic() < deadline:
        return_code = child.poll()
        if return_code is not None:
            raise RuntimeError(f"MLX-Audio exited before readiness with code {return_code}")

        try:
            with request.urlopen(f"{base_url}/v1/models", timeout=5) as response:
                if response.status == 200:
                    return
        except (error.URLError, TimeoutError) as exc:
            last_error = exc

        time.sleep(0.5)

    detail = f": {last_error}" if last_error else ""
    raise TimeoutError(f"MLX-Audio did not become ready within {timeout:g}s{detail}")


def preload_model(base_url: str, model_name: str, timeout: float) -> None:
    query = parse.urlencode({"model_name": model_name})
    preload_request = request.Request(
        f"{base_url}/v1/models?{query}",
        method="POST",
    )
    with request.urlopen(preload_request, timeout=timeout) as response:
        if response.status != 200:
            raise RuntimeError(
                f"preloading {model_name} returned HTTP {response.status}"
            )


def forward_signal(child: subprocess.Popen, signum: int) -> None:
    if child.poll() is None:
        child.send_signal(signum)


def stop_child(child: subprocess.Popen) -> None:
    if child.poll() is not None:
        return

    child.terminate()
    try:
        child.wait(timeout=30)
    except subprocess.TimeoutExpired:
        child.kill()
        child.wait(timeout=10)


def run(host: str, port: int, startup_timeout: float) -> int:
    child = subprocess.Popen(build_command(host, port))

    for signum in (signal.SIGTERM, signal.SIGINT, signal.SIGHUP):
        signal.signal(signum, lambda received, _frame, process=child: forward_signal(process, received))

    base_url = f"http://{host}:{port}"
    try:
        wait_until_ready(base_url, child, startup_timeout)
        for model_name in MODEL_IDS:
            print(f"Preloading {model_name}", flush=True)
            preload_model(base_url, model_name, startup_timeout)
        print(f"VibeVoice ready on {base_url}", flush=True)
        return child.wait()
    except Exception as exc:
        print(f"VibeVoice startup failed: {exc}", file=sys.stderr, flush=True)
        stop_child(child)
        return 1


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run and warm the local VibeVoice API")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=7781)
    parser.add_argument("--startup-timeout", type=float, default=1800)
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    if args.host != "127.0.0.1":
        print("Refusing non-loopback bind; use Tailscale Serve for remote access", file=sys.stderr)
        return 2
    return run(args.host, args.port, args.startup_timeout)


if __name__ == "__main__":
    raise SystemExit(main())
