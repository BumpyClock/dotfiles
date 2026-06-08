#!/usr/bin/env python3
"""Parallel Clawpatch finding revalidation.

Reads finding IDs from .clawpatch/findings/*.json and runs one isolated
`clawpatch revalidate --finding <id>` command per ID.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, Iterable


OUTCOME_RE = re.compile(
    r"outcome=(fixed|open|uncertain|falsePositive|false-positive|wont-fix)",
    re.IGNORECASE,
)
JSON_OUTCOME_RE = re.compile(r'"outcome"\s*:\s*"([^"]+)"')


def normalize_outcome(outcome: str) -> str:
    if outcome == "falsePositive":
        return "false-positive"
    return outcome.lower()


def iter_finding_objects(path: Path) -> Iterable[dict[str, Any]]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"failed to read {path}: {exc}") from exc

    if isinstance(data, dict):
        yield data
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                yield item


def collect_ids(repo_root: Path, status: str | None) -> list[str]:
    findings_dir = repo_root / ".clawpatch" / "findings"
    if not findings_dir.exists():
        raise RuntimeError(f"findings dir not found: {findings_dir}")

    ids: list[str] = []
    seen: set[str] = set()
    for finding_file in sorted(findings_dir.glob("*.json")):
        for finding in iter_finding_objects(finding_file):
            if status is not None and finding.get("status") != status:
                continue
            finding_id = finding.get("findingId")
            if not isinstance(finding_id, str) or not finding_id:
                continue
            if finding_id not in seen:
                seen.add(finding_id)
                ids.append(finding_id)
    return ids


def parse_outcome(text: str) -> str | None:
    match = OUTCOME_RE.search(text)
    if match:
        return normalize_outcome(match.group(1))

    match = JSON_OUTCOME_RE.search(text)
    if match:
        return normalize_outcome(match.group(1))

    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        try:
            data = json.loads(stripped)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict) and isinstance(data.get("outcome"), str):
            return normalize_outcome(data["outcome"])

    return None


def build_command(args: argparse.Namespace, finding_id: str) -> list[str]:
    command = [
        args.clawpatch_bin,
        "--root",
        str(args.repo_root),
        "revalidate",
        "--finding",
        finding_id,
    ]
    if args.provider:
        command.extend(["--provider", args.provider])
    if args.model:
        command.extend(["--model", args.model])
    if args.reasoning_effort:
        command.extend(["--reasoning-effort", args.reasoning_effort])
    if args.include_dirty:
        command.append("--include-dirty")
    if args.skip_git_repo_check:
        command.append("--skip-git-repo-check")
    if args.json:
        command.append("--json")
    return command


def run_one(args: argparse.Namespace, finding_id: str) -> dict[str, Any]:
    command = build_command(args, finding_id)
    if args.dry_run:
        return {
            "findingId": finding_id,
            "exitCode": 0,
            "outcome": "dry-run",
            "command": command,
            "output": "",
        }

    proc = subprocess.run(
        command,
        cwd=args.repo_root,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    output = proc.stdout or ""
    return {
        "findingId": finding_id,
        "exitCode": proc.returncode,
        "outcome": parse_outcome(output),
        "command": command,
        "output": output,
    }


def write_jsonl(path: Path, item: dict[str, Any]) -> None:
    with path.open("a", encoding="utf-8") as file:
        file.write(json.dumps(item, separators=(",", ":"), ensure_ascii=False))
        file.write("\n")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Revalidate Clawpatch finding IDs in parallel."
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path.cwd(),
        help="Repository root containing .clawpatch/findings.",
    )
    parser.add_argument(
        "--throttle",
        type=int,
        default=8,
        help="Maximum concurrent revalidation commands.",
    )
    parser.add_argument(
        "--status",
        default="open",
        help="Finding status to read from .clawpatch/findings. Use 'any' for all.",
    )
    parser.add_argument(
        "--finding",
        action="append",
        dest="findings",
        help="Finding ID to revalidate. Repeatable. Skips findings-dir scan.",
    )
    parser.add_argument(
        "--out",
        type=Path,
        help="JSONL result path. Defaults to temp dir with timestamp.",
    )
    parser.add_argument("--clawpatch-bin", default="clawpatch")
    parser.add_argument("--provider")
    parser.add_argument("--model", default="gpt-5.3-codex-spark")
    parser.add_argument("--reasoning-effort", default="high")
    parser.add_argument("--include-dirty", action="store_true")
    parser.add_argument("--skip-git-repo-check", action="store_true")
    parser.add_argument("--no-json", action="store_false", dest="json")
    parser.add_argument("--dry-run", action="store_true")
    parser.set_defaults(json=True)
    args = parser.parse_args(argv)

    args.repo_root = args.repo_root.expanduser().resolve()
    if args.throttle < 1:
        parser.error("--throttle must be >= 1")
    if args.status == "any":
        args.status = None
    if args.out is None:
        stamp = dt.datetime.now().strftime("%Y%m%d%H%M%S")
        args.out = Path(tempfile.gettempdir()) / f"clawpatch-revalidate-{stamp}.jsonl"
    else:
        args.out = args.out.expanduser().resolve()
    return args


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    ids = list(dict.fromkeys(args.findings or collect_ids(args.repo_root, args.status)))
    print(f"revalidate IDs: {len(ids)}")
    print(f"RESULT_FILE={args.out}")

    if not ids:
        return 0

    args.out.parent.mkdir(parents=True, exist_ok=True)
    if args.out.exists():
        args.out.unlink()

    results: list[dict[str, Any]] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.throttle) as executor:
        futures = {executor.submit(run_one, args, finding_id): finding_id for finding_id in ids}
        for future in concurrent.futures.as_completed(futures):
            finding_id = futures[future]
            try:
                result = future.result()
            except Exception as exc:  # noqa: BLE001 - keep batch alive per finding.
                result = {
                    "findingId": finding_id,
                    "exitCode": 1,
                    "outcome": None,
                    "command": build_command(args, finding_id),
                    "output": f"{type(exc).__name__}: {exc}",
                }
            results.append(result)
            write_jsonl(args.out, result)
            print(
                json.dumps(
                    {
                        "findingId": result["findingId"],
                        "outcome": result["outcome"],
                        "exitCode": result["exitCode"],
                    },
                    separators=(",", ":"),
                )
            )

    counts: dict[str, int] = {}
    for result in results:
        outcome = result["outcome"] or "unknown"
        counts[outcome] = counts.get(outcome, 0) + 1
    for outcome, count in sorted(counts.items()):
        print(f"{outcome}: {count}")

    attention = [
        {
            "findingId": result["findingId"],
            "outcome": result["outcome"],
            "exitCode": result["exitCode"],
        }
        for result in results
        if result["exitCode"] != 0 or result["outcome"] in {"open", "uncertain", None}
    ]
    if attention:
        print(json.dumps(attention, indent=2))

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
