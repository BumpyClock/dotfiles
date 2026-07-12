#!/usr/bin/env python3

import json
import os
import re
import shlex
import sys
from collections.abc import Sequence


SHELL_WRAPPERS = {
    "builtin",
    "command",
    "doas",
    "env",
    "exec",
    "nohup",
    "sudo",
    "time",
}
SHELLS = {"bash", "dash", "fish", "ksh", "sh", "zsh"}
TEMP_DELETE_COMMANDS = {
    "rmdir": "directory deletion",
    "rm": "file deletion",
    "unlink": "file deletion",
}
ALWAYS_BLOCKED = {
    "shred": "secure file deletion",
    "srm": "secure file deletion",
    "truncate": "file truncation",
}
TEMP_ROOTS = ("/tmp", "/private/tmp")
COMMAND_PREFIXES = {
    "!",
    "{",
    "do",
    "elif",
    "else",
    "if",
    "then",
    "until",
    "while",
}
REDIRECTION = re.compile(r"^\d*(?:<<<|<<|<>|>>|>&|<&|>|<)")


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

        if token in COMMAND_PREFIXES:
            index += 1
            continue

        redirection = REDIRECTION.match(token)
        if redirection:
            index += 1
            if redirection.end() == len(token):
                index += 1
            continue

        if "=" in token and not token.startswith(("-", "/")):
            index += 1
            continue

        if name not in SHELL_WRAPPERS:
            return index

        wrapper_index = index
        index += 1
        while index < len(tokens) and tokens[index].startswith("-"):
            option = tokens[index]
            if name == "env" and (
                option in {"-S", "--split-string"}
                or option.startswith("--split-string=")
            ):
                return wrapper_index
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
            if name == "env" and option in {
                "-C",
                "-P",
                "-u",
                "--chdir",
                "--path",
                "--unset",
            }:
                index += 1
            if name == "exec" and option == "-a":
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


def is_temp_path(path_value: str, cwd: str | None) -> bool:
    del cwd
    if (
        not path_value
        or not os.path.isabs(path_value)
        or any(character in path_value for character in "$`~{}")
    ):
        return False
    normalized = os.path.normpath(os.path.realpath(path_value))
    return any(
        normalized.startswith(f"{root}{os.sep}") for root in TEMP_ROOTS
    )


def deletion_targets(arguments: Sequence[str]) -> list[str]:
    targets: list[str] = []
    options_done = False
    for argument in arguments:
        if not options_done and argument == "--":
            options_done = True
            continue
        if not options_done and argument.startswith("-"):
            continue
        targets.append(argument)
    return targets


def deletion_is_temp_only(arguments: Sequence[str], cwd: str | None) -> bool:
    targets = deletion_targets(arguments)
    return bool(targets) and all(is_temp_path(target, cwd) for target in targets)


def find_roots(arguments: Sequence[str]) -> list[str]:
    index = 0
    while index < len(arguments):
        argument = arguments[index]
        if argument in {"-H", "-L", "-P"} or argument.startswith("-O"):
            index += 1
            continue
        if argument == "-D":
            index += 2
            continue
        break

    roots: list[str] = []
    for argument in arguments[index:]:
        if argument in {"!", "(", ")"} or argument.startswith("-"):
            break
        roots.append(argument)
    return roots


def git_block_reason(arguments: Sequence[str]) -> str | None:
    if "clean" in arguments and not any(
        flag in arguments for flag in ("-n", "--dry-run")
    ):
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
    if any(command in arguments for command in ("filter-branch", "filter-repo")):
        return "git history rewrite"
    return None


def command_block_reason(tokens: Sequence[str], cwd: str | None) -> str | None:
    index = executable_index(tokens)
    if index is None:
        return None

    executable = os.path.basename(tokens[index]).lower()
    arguments = list(tokens[index + 1 :])
    lowered = [argument.lower() for argument in arguments]

    if executable in TEMP_DELETE_COMMANDS:
        if deletion_is_temp_only(arguments, cwd):
            return None
        return TEMP_DELETE_COMMANDS[executable]
    if executable in ALWAYS_BLOCKED:
        return ALWAYS_BLOCKED[executable]
    if executable == "coproc":
        return "coproc can hide a destructive command"
    if executable == "env" and any(
        option in {"-S", "--split-string"} or option.startswith("--split-string=")
        for option in arguments
    ):
        return "env split-string can hide a destructive command"
    if executable == "mkfs" or executable.startswith(("mkfs.", "newfs_")):
        return "filesystem formatting"
    if executable in {"fdisk", "parted", "wipefs"}:
        return "disk partition or filesystem destruction"
    if executable == "dd":
        return "raw disk or file overwrite"
    if executable == "find" and "-delete" in arguments:
        roots = find_roots(arguments)
        follows_symlinks = "-L" in arguments or "-follow" in arguments
        if (
            not follows_symlinks
            and roots
            and all(is_temp_path(root, cwd) for root in roots)
        ):
            return None
        return "find -delete removes files"
    if executable == "find":
        index = 0
        while index < len(arguments):
            if arguments[index] not in {"-exec", "-execdir"}:
                index += 1
                continue
            nested_start = index + 1
            nested_end = nested_start
            while nested_end < len(arguments) and arguments[nested_end] not in {
                ";",
                "+",
            }:
                nested_end += 1
            nested = arguments[nested_start:nested_end]
            if any(
                os.path.basename(argument) in TEMP_DELETE_COMMANDS
                for argument in nested
            ):
                return "find executes a deletion command"
            nested_reason = command_block_reason(nested, cwd)
            if nested_reason:
                return nested_reason
            index = nested_end + 1
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
    if executable == "aws" and has_pair(lowered, "s3", "rm"):
        return "AWS S3 object deletion"
    if executable == "gsutil" and "rm" in lowered:
        return "Google Cloud Storage object deletion"
    if executable in {"mysql", "psql", "sqlite3"}:
        sql = " ".join(arguments).upper()
        if any(
            statement in sql
            for statement in (
                "DELETE FROM",
                "DROP DATABASE",
                "DROP TABLE",
                "TRUNCATE TABLE",
            )
        ):
            return "destructive database statement"
    if executable in SHELLS:
        for option_index, option in enumerate(arguments):
            if (
                option.startswith("-")
                and "c" in option[1:]
                and option_index + 1 < len(arguments)
            ):
                return destructive_reason(arguments[option_index + 1], cwd)
    if executable == "eval" and arguments:
        return destructive_reason(" ".join(arguments), cwd)
    if executable == "xargs":
        if any(
            os.path.basename(argument) in TEMP_DELETE_COMMANDS
            for argument in arguments
        ):
            return "xargs executes a deletion command with runtime targets"
        for index, argument in enumerate(arguments):
            if os.path.basename(argument) in SHELLS:
                nested_reason = command_block_reason(arguments[index:], cwd)
                if nested_reason:
                    return nested_reason
    return None


def destructive_reason(command: str, cwd: str | None = None) -> str | None:
    try:
        segments = shell_segments(command)
    except ValueError:
        return "unparseable shell command"
    for segment in segments:
        reason = command_block_reason(segment, cwd)
        if reason:
            return reason
    return None


def deny(reason: str, output_format: str) -> None:
    message = f"Destructive command blocked: {reason}."
    if output_format == "claude":
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": message,
            }
        }
    else:
        output = {
            "permissionDecision": "deny",
            "permissionDecisionReason": message,
        }
    print(json.dumps(output, separators=(",", ":")))


def run_self_test() -> int:
    safe = [
        ("echo hello", None),
        ("git status --short", None),
        ("git clean --dry-run", None),
        ("git reset --soft HEAD~1", None),
        ("git checkout feature-branch", None),
        ("git push origin feature-branch", None),
        ("kill 12345", None),
        ("mv old new", None),
        ("trash obsolete.txt", None),
        ("rm -rf /tmp/example", None),
        ("rm -f /private/tmp/example", None),
        ("find /tmp/example -type f -delete", None),
        ("bash -c 'rm -rf /tmp/example'", None),
        ("bash -lc 'rm -rf /tmp/example'", None),
    ]
    blocked = [
        ("rm -rf build", None),
        ("rm -rf /tmp/example build", None),
        ("rm -rf /tmp", None),
        ("rm -rf /tmp/../Users/example", None),
        ("rm -rf '/tmp/{cache,../../Users/example}'", None),
        ("rm -rf '$HOME/example'", "/tmp"),
        ("rm -rf example", "/tmp"),
        ("cd /tmp && rm -rf example", None),
        ("cd /tmp/missing || rm -rf example", None),
        ("(cd /tmp) && rm -rf example", None),
        ("sudo -n /bin/rm file", None),
        ("cd repo && git clean -fd", None),
        ("git reset --hard HEAD~1", None),
        ("git restore .", None),
        ("git checkout -- file", None),
        ("git push --force-with-lease", None),
        ("git commit --amend", None),
        ("find . -name '*.tmp' -delete", None),
        ("find /tmp -exec rm -rf /Users/example {} +", None),
        ("find /tmp -exec sh -c 'rm -rf /Users/example' ';'", None),
        (
            "find /tmp -exec echo {} + -exec sh -c 'rm -rf /Users/example' {} +",
            None,
        ),
        ("find -L /tmp/example -delete", None),
        ("xargs -0 rm -rf /Users/example", None),
        ("env -C /tmp rm -rf /Users/example", None),
        ("env -S 'rm -rf /Users/example'", None),
        ("exec rm -rf /Users/example", None),
        ("exec -a cleanup rm -rf /Users/example", None),
        ("if true; then rm -rf /Users/example; fi", None),
        ("{ rm -rf /Users/example; }", None),
        ("time -p rm -rf /Users/example", None),
        ("coproc rm -rf /Users/example", None),
        (">/tmp/log rm -rf /Users/example", None),
        ("shred /tmp/example", None),
        ("bash -lc 'rm -rf build'", None),
        ("echo `rm -rf build`", None),
        ("printf ok\nunlink file", None),
        ("diskutil eraseVolume APFS Empty disk4s1", None),
        ("docker rm old-container", None),
        ("docker rmi old-image", None),
        ("docker system prune", None),
        ("kubectl delete namespace production", None),
        ("terraform destroy", None),
        ("aws s3 rm s3://bucket --recursive", None),
        ("psql -c 'DROP TABLE feeds'", None),
        ("mkfs /dev/disk9", None),
        ("git filter-repo --force", None),
        ("dd if=/dev/zero > /dev/disk9", None),
    ]
    failures = [
        f"allowed destructive command: {command}"
        for command, cwd in blocked
        if destructive_reason(command, cwd) is None
    ]
    failures.extend(
        f"blocked safe command: {command} ({destructive_reason(command, cwd)})"
        for command, cwd in safe
        if destructive_reason(command, cwd) is not None
    )
    if failures:
        print("\n".join(failures), file=sys.stderr)
        return 1
    print(f"ok: {len(blocked)} blocked, {len(safe)} allowed")
    return 0


def main() -> int:
    if sys.argv[1:] == ["--self-test"]:
        return run_self_test()
    output_format = "copilot"
    if sys.argv[1:]:
        if len(sys.argv) != 3 or sys.argv[1] != "--format" or sys.argv[2] not in {
            "claude",
            "copilot",
        }:
            print(
                "usage: block_destructive_commands.py [--format claude|copilot]",
                file=sys.stderr,
            )
            return 2
        output_format = sys.argv[2]
    try:
        payload = json.load(sys.stdin)
        cwd = payload.get("cwd")
        if not isinstance(cwd, str):
            cwd = None
        commands: list[str] = []
        tool_input = payload.get("tool_input", payload.get("toolArgs"))
        if isinstance(tool_input, dict):
            command = tool_input.get("command")
            if isinstance(command, str) and command.strip():
                commands.append(command)
            if cwd is None and isinstance(tool_input.get("cwd"), str):
                cwd = tool_input["cwd"]

        tool_calls = payload.get("toolCalls")
        if isinstance(tool_calls, list):
            for tool_call in tool_calls:
                if not isinstance(tool_call, dict):
                    continue
                tool_name = tool_call.get("toolName", tool_call.get("name"))
                if not isinstance(tool_name, str) or tool_name.lower() != "bash":
                    continue
                arguments = tool_call.get(
                    "args",
                    tool_call.get("arguments", tool_call.get("toolArgs")),
                )
                if isinstance(arguments, str):
                    arguments = json.loads(arguments)
                command = arguments.get("command") if isinstance(arguments, dict) else None
                if not isinstance(command, str) or not command.strip():
                    raise ValueError("missing Bash command in toolCalls")
                commands.append(command)

        if not commands:
            raise ValueError("missing Bash command")
    except (json.JSONDecodeError, AttributeError, ValueError) as error:
        print(f"Destructive-command hook rejected invalid input: {error}", file=sys.stderr)
        return 2

    for command in commands:
        reason = destructive_reason(command, cwd)
        if reason:
            deny(reason, output_format)
            return 0
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
