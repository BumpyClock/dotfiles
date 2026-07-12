#!/usr/bin/env python3

import json
import os
import shlex
import sys
from collections.abc import Sequence


SHELL_WRAPPERS = {"builtin", "command", "doas", "env", "nohup", "sudo"}
SHELLS = {"bash", "dash", "fish", "ksh", "sh", "zsh"}
ALWAYS_BLOCKED = {
    "rmdir": "directory deletion",
    "rm": "file deletion",
    "shred": "secure file deletion",
    "truncate": "file truncation",
    "unlink": "file deletion",
}


def separate_unquoted_newlines(command: str) -> str:
    output: list[str] = []
    quote: str | None = None
    escaped = False
    for character in command:
        if escaped:
            output.append(character)
            escaped = False
            continue
        if character == "\\" and quote != "'":
            output.append(character)
            escaped = True
            continue
        if character in {"'", '"'}:
            if quote is None:
                quote = character
            elif quote == character:
                quote = None
        if character in "\r\n" and quote is None:
            output.append(" ; ")
        else:
            output.append(character)
    return "".join(output)


def shell_segments(command: str) -> list[list[str]]:
    lexer = shlex.shlex(
        separate_unquoted_newlines(command),
        posix=True,
        punctuation_chars=";&|()`",
    )
    lexer.commenters = ""
    lexer.whitespace_split = True

    segments: list[list[str]] = []
    current: list[str] = []
    for token in lexer:
        if token == "\n" or (token and all(char in ";&|()`" for char in token)):
            if current:
                segments.append(current)
                current = []
        else:
            current.append(token)
    if current:
        segments.append(current)
    return segments


def executable_index(tokens: Sequence[str]) -> int | None:
    index = 0
    while index < len(tokens):
        token = tokens[index]
        name = os.path.basename(token)

        if "=" in token and not token.startswith(("-", "/")):
            index += 1
            continue

        if name not in SHELL_WRAPPERS:
            return index

        index += 1
        while index < len(tokens) and tokens[index].startswith("-"):
            option = tokens[index]
            index += 1
            if name in {"sudo", "doas"} and option in {
                "-C",
                "-D",
                "-g",
                "-h",
                "-p",
                "-R",
                "-T",
                "-u",
            }:
                index += 1
        if name == "env":
            while index < len(tokens) and "=" in tokens[index]:
                index += 1
    return None


def has_pair(arguments: Sequence[str], first: str, second: str) -> bool:
    try:
        index = arguments.index(first)
    except ValueError:
        return False
    return second in arguments[index + 1 :]


def git_block_reason(arguments: Sequence[str]) -> str | None:
    if "clean" in arguments:
        return "git clean deletes untracked files"
    if "restore" in arguments:
        return "git restore discards worktree or index changes"
    if "reset" in arguments and any(
        flag in arguments for flag in ("--hard", "--keep", "--merge")
    ):
        return "destructive git reset"
    if "checkout" in arguments and any(
        flag in arguments for flag in ("--", "-f", "--force")
    ):
        return "git checkout can discard worktree changes"
    if "switch" in arguments and "--discard-changes" in arguments:
        return "git switch discards worktree changes"
    if "branch" in arguments and any(
        flag in arguments for flag in ("-D", "--delete", "--force")
    ):
        return "forced git branch deletion"
    if "push" in arguments and (
        any(flag == "-f" or flag.startswith("--force") for flag in arguments)
        or "--delete" in arguments
        or any(arg.startswith(":") and len(arg) > 1 for arg in arguments)
    ):
        return "destructive git push"
    if has_pair(arguments, "commit", "--amend"):
        return "git commit --amend rewrites history"
    if any(
        has_pair(arguments, "stash", action) for action in ("clear", "drop")
    ):
        return "git stash deletion"
    if any(
        has_pair(arguments, "reflog", action) for action in ("delete", "expire")
    ):
        return "git reflog deletion"
    if any(
        has_pair(arguments, "worktree", action) for action in ("remove", "prune")
    ):
        return "git worktree deletion"
    if "tag" in arguments and any(
        flag in arguments for flag in ("-d", "--delete")
    ):
        return "git tag deletion"
    if "gc" in arguments and any(
        arg == "--prune=now" or arg == "--prune" for arg in arguments
    ):
        return "immediate git object pruning"
    return None


def command_block_reason(tokens: Sequence[str]) -> str | None:
    index = executable_index(tokens)
    if index is None:
        return None

    executable = os.path.basename(tokens[index]).lower()
    arguments = list(tokens[index + 1 :])
    lowered = [argument.lower() for argument in arguments]

    if executable in ALWAYS_BLOCKED:
        return ALWAYS_BLOCKED[executable]
    if executable.startswith(("mkfs.", "newfs_")):
        return "filesystem formatting"
    if executable == "dd" and any(argument.startswith("of=") for argument in arguments):
        return "raw disk or file overwrite"
    if executable == "find" and "-delete" in arguments:
        return "find -delete removes files"
    if executable == "find" and any(
        os.path.basename(argument) in {"rm", "rmdir", "shred", "unlink"}
        for argument in arguments
    ):
        return "find executes a deletion command"
    if executable == "git":
        return git_block_reason(arguments)
    if executable == "diskutil" and lowered and lowered[0] in {
        "apfs",
        "erasedisk",
        "erasevolume",
        "partitiondisk",
        "zerodisk",
    }:
        if lowered[0] != "apfs" or any(
            action.startswith(("delete", "erase", "remove")) for action in lowered[1:]
        ):
            return "diskutil destructive operation"
    if executable in {"docker", "podman"}:
        if lowered and lowered[0] in {"rm", "rmi"}:
            return f"{executable} resource deletion"
        destructive_pairs = {
            ("container", "prune"),
            ("container", "rm"),
            ("container", "remove"),
            ("image", "prune"),
            ("image", "rm"),
            ("image", "remove"),
            ("network", "prune"),
            ("network", "rm"),
            ("network", "remove"),
            ("system", "prune"),
            ("volume", "prune"),
            ("volume", "rm"),
            ("volume", "remove"),
        }
        if any(has_pair(lowered, first, second) for first, second in destructive_pairs):
            return f"{executable} resource deletion"
        if has_pair(lowered, "compose", "down"):
            return f"{executable} compose teardown"
    if executable in {"kubectl", "oc"} and "delete" in lowered:
        return f"{executable} resource deletion"
    if executable == "helm" and any(
        action in lowered for action in ("delete", "uninstall")
    ):
        return "Helm release deletion"
    if executable in {"terraform", "tofu"}:
        if "destroy" in lowered or has_pair(lowered, "state", "rm"):
            return f"{executable} infrastructure deletion"
        if has_pair(lowered, "workspace", "delete"):
            return f"{executable} workspace deletion"
    if executable in SHELLS:
        for option_index, option in enumerate(arguments):
            if option == "-c" and option_index + 1 < len(arguments):
                return destructive_reason(arguments[option_index + 1])
    if executable == "eval" and arguments:
        return destructive_reason(" ".join(arguments))
    if executable == "xargs":
        nested_index = executable_index(arguments)
        if nested_index is not None:
            return command_block_reason(arguments[nested_index:])
    return None


def destructive_reason(command: str) -> str | None:
    try:
        segments = shell_segments(command)
    except ValueError:
        return "unparseable shell command"
    for segment in segments:
        reason = command_block_reason(segment)
        if reason:
            return reason
    return None


def deny(reason: str) -> None:
    message = f"Destructive command blocked: {reason}."
    output = {
        "permissionDecision": "deny",
        "permissionDecisionReason": message,
    }
    print(json.dumps(output, separators=(",", ":")))


def run_self_test() -> int:
    safe = [
        "echo hello",
        "git status --short",
        "git reset --soft HEAD~1",
        "git checkout feature-branch",
        "git push origin feature-branch",
        "kill 12345",
        "mv old new",
        "trash obsolete.txt",
    ]
    blocked = [
        "rm -rf build",
        "sudo -n /bin/rm file",
        "cd repo && git clean -fd",
        "git reset --hard HEAD~1",
        "git restore .",
        "git checkout -- file",
        "git push --force-with-lease",
        "git commit --amend",
        "find . -name '*.tmp' -delete",
        "bash -c 'rm -rf /tmp/example'",
        "echo `rm -rf /tmp/example`",
        "printf ok\nunlink file",
        "diskutil eraseVolume APFS Empty disk4s1",
        "docker rm old-container",
        "docker rmi old-image",
        "docker system prune",
        "kubectl delete namespace production",
        "terraform destroy",
    ]
    failures = [
        f"allowed destructive command: {command}"
        for command in blocked
        if destructive_reason(command) is None
    ]
    failures.extend(
        f"blocked safe command: {command} ({destructive_reason(command)})"
        for command in safe
        if destructive_reason(command) is not None
    )
    if failures:
        print("\n".join(failures), file=sys.stderr)
        return 1
    print(f"ok: {len(blocked)} blocked, {len(safe)} allowed")
    return 0


def main() -> int:
    if sys.argv[1:] == ["--self-test"]:
        return run_self_test()
    try:
        payload = json.load(sys.stdin)
        tool_input = payload.get("tool_input", payload.get("toolArgs"))
        command = tool_input.get("command") if isinstance(tool_input, dict) else None
        if not isinstance(command, str) or not command.strip():
            raise ValueError("missing Bash command")
    except (json.JSONDecodeError, AttributeError, ValueError) as error:
        print(f"Destructive-command hook rejected invalid input: {error}", file=sys.stderr)
        return 2

    reason = destructive_reason(command)
    if reason:
        deny(reason)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
