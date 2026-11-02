"""Exercise executable hooks and installer in disposable Git repositories. No push."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
HOOK_DIR = '.vite-hooks' if (ROOT / '.vite-hooks/pre-push').exists() else '.githooks'


class HookContract(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='hook fixture ')
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name) / 'repo with spaces'
        self.repo.mkdir()
        self.env = dict(os.environ, GIT_CONFIG_GLOBAL=os.devnull, GIT_CONFIG_NOSYSTEM='1')
        self.git('init', '-q')
        for name in [f'{HOOK_DIR}/pre-push', 'scripts/install-hooks.sh', 'scripts/check-push.sh', 'scripts/check-push.cjs']:
            source = ROOT / name
            if source.exists():
                target = self.repo / name
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, target)
        (self.repo / '.gitignore').write_text('node_modules/\n**/node_modules/\n')
        # The project checker is stubbed, not the range/cleanliness/installer logic.
        (self.repo / 'scripts/check-push.sh').write_text('#!/bin/sh\nprintf "%s\\n" "$@" >> .git/checked\nexit "${CHECK_EXIT:-0}"\n')
        self.git('add', '.')
        self.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture')
        self.head = self.git('rev-parse', 'HEAD').stdout.strip()
        self.zero = '0' * 40

    def git(self, *args):
        return subprocess.run(['git', *args], cwd=self.repo, env=self.env, text=True, capture_output=True, check=True)

    def hook(self, records, **env):
        return subprocess.run([str(self.repo / HOOK_DIR / 'pre-push'), 'origin', 'unused'], input=records, cwd=self.repo, env=dict(self.env, **env), text=True, capture_output=True)

    def record(self, local=None, remote=None):
        return f'refs/heads/topic {local or self.head} refs/heads/topic {remote or self.head}\n'

    def test_existing_new_unknown_and_multiple_refs(self):
        for remote in [self.head, self.zero, 'f' * 40]:
            self.assertEqual(self.hook(self.record(remote=remote)).returncode, 0)
        self.assertEqual(self.hook(self.record() + self.record(remote=self.zero)).returncode, 0)

    def test_deletion_only_and_mixed_updates(self):
        self.assertEqual(self.hook(self.record(local=self.zero)).returncode, 0)
        self.assertFalse((self.repo / '.git/checked').exists())
        self.assertEqual(self.hook(self.record(local=self.zero) + self.record()).returncode, 0)
        self.assertTrue((self.repo / '.git/checked').exists())

    def test_nonzero_propagation(self):
        self.assertEqual(self.hook(self.record(), CHECK_EXIT='37').returncode, 37)

    def test_empty_malformed_and_other_commit_refuse(self):
        for records in ['', 'broken\n', self.record(local='f' * 40), self.record() + self.record(local='a' * 40)]:
            self.assertNotEqual(self.hook(records).returncode, 0)
        self.assertFalse((self.repo / '.git/checked').exists())

    def test_dirty_and_untracked_checkout_refuse(self):
        (self.repo / 'scripts/check-push.sh').write_text('changed')
        self.assertNotEqual(self.hook(self.record()).returncode, 0)
        self.git('checkout', '--', 'scripts/check-push.sh')
        (self.repo / 'untracked file.ts').write_text('changed')
        self.assertNotEqual(self.hook(self.record()).returncode, 0)

    def test_committed_rename_and_deletion_are_checked(self):
        self.git('mv', 'scripts/check-push.sh', 'scripts/old checker with spaces.sh')
        shutil.copy2(self.repo / 'scripts/old checker with spaces.sh', self.repo / 'scripts/check-push.sh')
        self.git('add', '.')
        self.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'rename')
        old, self.head = self.head, self.git('rev-parse', 'HEAD').stdout.strip()
        self.assertEqual(self.hook(self.record(remote=old)).returncode, 0)

    def test_git_status_and_config_failures_refuse(self):
        bins = self.repo / '.git/git-failure-bin'
        bins.mkdir()
        wrapper = bins / 'git'
        wrapper.write_text('#!/bin/sh\nif [ "$1" = "$FAIL_GIT_COMMAND" ]; then exit 42; fi\nexec "$REAL_GIT" "$@"\n')
        wrapper.chmod(0o755)
        env = dict(PATH=str(bins) + os.pathsep + self.env['PATH'], REAL_GIT=shutil.which('git'))
        self.assertNotEqual(self.hook(self.record(), FAIL_GIT_COMMAND='status', **env).returncode, 0)
        self.assertFalse((self.repo / '.git/checked').exists())
        result = subprocess.run(['sh', 'scripts/install-hooks.sh'], cwd=self.repo, env=dict(self.env, FAIL_GIT_COMMAND='config', **env), capture_output=True)
        self.assertNotEqual(result.returncode, 0)

    def test_real_checker_commands_and_nonzero_propagation(self):
        shutil.copy2(ROOT / 'scripts/check-push.sh', self.repo / 'scripts/check-push.sh')
        self.git('add', '.')
        self.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'real checker')
        self.head = self.git('rev-parse', 'HEAD').stdout.strip()
        bins = self.repo / '.git/tool-bin'
        bins.mkdir()
        log = self.repo / '.git/commands'
        node = shutil.which('node')
        stub = '''#!/bin/sh
name=$(basename "$0")
case "$*" in
  --version) case "$name" in node) echo v26.12.1;; npm) echo 11.12.0;; bun) echo 1.3.14;; esac; exit 0;;
  -p*) echo 1.4.0; exit 0;;
  scripts/check-push.cjs*) exec "$REAL_NODE" "$@";;
  'run 1.97.1 rustc --version') exit 0;;
esac
printf '%s %s\\n' "$name" "$*" >> "$COMMAND_LOG"
case "$*" in
  'run typecheck'|'run lint:ci'|'run check:changed '*|'run 1.97.1 cargo fmt '*) exit "${TOOL_EXIT:-0}";;
esac
exit 0
'''
        for tool in ['node', 'npm', 'bun', 'rustup', 'protoc', 'vp', 'prettier', 'eslint']:
            target = bins / tool
            target.write_text(stub)
            target.chmod(0o755)
        modules = self.repo / 'node_modules/.bin'
        modules.mkdir(parents=True)
        for tool in ['vp', 'prettier', 'eslint', 'biome', 'tsc', 'vitest']:
            (modules / tool).symlink_to(bins / (tool if tool in ['vp', 'prettier', 'eslint'] else 'node'))
        for project in ['scripts/link-dotfiles', 'tools']:
            dest = self.repo / project / 'node_modules/.bin'
            dest.mkdir(parents=True)
            (dest / 'tsc').symlink_to(bins / 'node')
        base = self.zero if (ROOT / 'scripts/check-push.cjs').exists() else self.head
        env = dict(PATH=str(bins) + os.pathsep + self.env['PATH'], COMMAND_LOG=str(log), REAL_NODE=node or 'node')
        passing = self.hook(self.record(remote=base), **env)
        self.assertEqual(passing.returncode, 0, passing.stderr)
        commands = log.read_text()
        self.assertNotIn('install', commands)
        self.assertNotIn('doctor', commands)
        self.assertTrue('typecheck' in commands or 'lint:ci' in commands or 'cargo check' in commands or 'check:changed' in commands, commands)
        failing = self.hook(self.record(remote=base), TOOL_EXIT='37', **env)
        self.assertEqual(failing.returncode, 37, failing.stderr)

    def install(self):
        return subprocess.run(['sh', 'scripts/install-hooks.sh'], cwd=self.repo, env=self.env, text=True, capture_output=True)

    def test_installer_idempotent_and_preserves_existing_config(self):
        if HOOK_DIR == '.vite-hooks':
            self.skipTest('Vite+ registration requires its prepared pinned dispatcher; separately qualified.')
        self.assertEqual(self.install().returncode, 0)
        before = (self.repo / '.git/config').read_bytes()
        self.assertEqual(self.install().returncode, 0)
        self.assertEqual((self.repo / '.git/config').read_bytes(), before)
        self.git('config', 'core.hooksPath', 'unrelated hooks')
        self.assertNotEqual(self.install().returncode, 0)
        self.assertEqual(self.git('config', '--get', 'core.hooksPath').stdout.strip(), 'unrelated hooks')

    def test_installer_preserves_active_default_hook(self):
        hook = self.repo / '.git/hooks/pre-commit'
        hook.write_text('#!/bin/sh\nexit 7\n')
        hook.chmod(0o755)
        self.assertNotEqual(self.install().returncode, 0)
        self.assertEqual(hook.read_text(), '#!/bin/sh\nexit 7\n')


if __name__ == '__main__':
    unittest.main()
