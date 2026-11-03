#!/usr/bin/env python3
"""Measure real zsh startup, including first command after a terminal prompt."""

import argparse
import json
import os
import pathlib
import pty
import select
import shlex
import statistics
import subprocess
import tempfile
import time


def command_ready(login):
    # Keep real history loading costs, but never append probes to user history.
    with tempfile.NamedTemporaryFile(prefix="zsh-profile-history-") as history:
        source = pathlib.Path(
            os.environ.get("HISTFILE") or pathlib.Path.home() / ".zsh_history"
        )
        if source.is_file():
            history.write(source.read_bytes())
            history.flush()
        master, slave = pty.openpty()
        started = time.perf_counter()
        proc = subprocess.Popen(
            ["zsh", *(["-l"] if login else []), "-i"],
            stdin=slave,
            stdout=slave,
            stderr=slave,
            env={
                **os.environ,
                "HISTFILE": history.name,
                "TERM": os.environ.get("TERM") or "xterm-256color",
            },
        )
        os.close(slave)
        marker = f"__DOTFILES_READY_{proc.pid}__"
        try:
            os.write(master, f" print -r -- {marker}; exit\n".encode())
            output = b""
            while time.perf_counter() - started < 30:
                if not select.select([master], [], [], 1)[0]:
                    continue
                try:
                    output += os.read(master, 65536)
                except OSError:
                    break
                if f"{marker}\r\n".encode() in output:
                    return (time.perf_counter() - started) * 1000
            raise RuntimeError("zsh did not execute terminal readiness command")
        finally:
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait()
            os.close(master)


def startup(mode):
    started = time.perf_counter()
    subprocess.run(
        ["zsh", mode, "exit"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        check=True,
        timeout=30,
    )
    return (time.perf_counter() - started) * 1000


def profile(login):
    # Load zprof BEFORE the real startup, not by sourcing .zshrc a second time.
    original = os.environ.get("ZDOTDIR")
    source = pathlib.Path(original or pathlib.Path.home()) / ".zshenv"
    restore = f"export ZDOTDIR={shlex.quote(original)}" if original else "unset ZDOTDIR"
    with tempfile.TemporaryDirectory(prefix="zsh-profile-") as directory:
        pathlib.Path(directory, ".zshenv").write_text(
            f"zmodload zsh/zprof\n{restore}\n"
            f"[[ ! -r {shlex.quote(str(source))} ]] || source {shlex.quote(str(source))}\n"
        )
        subprocess.run(
            ["zsh", "-lic" if login else "-ic", "zprof"],
            env={**os.environ, "ZDOTDIR": directory},
            check=True,
            timeout=30,
        )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--runs", type=int, default=20)
    parser.add_argument(
        "--zprof",
        action="store_true",
        help="Print warm startup function profiles instead of timings",
    )
    args = parser.parse_args()
    if args.runs < 2:
        parser.error("--runs must be at least 2")
    if args.zprof:
        for login in (False, True):
            print("Login shell" if login else "Interactive shell", flush=True)
            profile(login)
        return
    workloads = {
        "no_rc": lambda: startup("-fic"),
        "interactive": lambda: startup("-ic"),
        "login": lambda: startup("-lic"),
        "terminal_ready": lambda: command_ready(False),
        "login_terminal_ready": lambda: command_ready(True),
    }
    for measure in workloads.values():
        for _ in range(3):
            measure()
    samples = {name: [] for name in workloads}
    for _ in range(args.runs):
        for name, measure in workloads.items():
            samples[name].append(measure())
    results = {}
    for name, values in samples.items():
        deciles = statistics.quantiles(values, n=10, method="inclusive")
        results[name] = {
            "median_ms": round(statistics.median(values), 2),
            "p10_ms": round(deciles[0], 2),
            "p90_ms": round(deciles[8], 2),
            "samples_ms": [round(value, 3) for value in values],
        }
    print(
        json.dumps(
            {
                "zsh": subprocess.check_output(["zsh", "--version"], text=True).strip(),
                "cwd": os.getcwd(),
                "runs": args.runs,
                "warmups": 3,
                "results": results,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
