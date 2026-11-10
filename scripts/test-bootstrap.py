"""Run Unix bootstrap against fake tools and a disposable home. No installs/network."""
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ['git', 'curl', 'wget', 'unzip', 'rg', 'fd', 'bat', 'fzf', 'zsh',
         'eza', 'starship', 'fnm', 'pnpm', 'bun', 'ast-grep', 'mcporter']


class BootstrapContract(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='bootstrap fixture ')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.home = self.root / 'home'
        self.bin = self.root / 'bin'
        self.bin.mkdir()
        for directory in ['.oh-my-zsh/custom/plugins/zsh-autosuggestions',
                          '.oh-my-zsh/custom/plugins/fast-syntax-highlighting']:
            (self.home / directory).mkdir(parents=True)
        self.repo = self.root / 'repo'
        (self.repo / 'shell/zsh').mkdir(parents=True)
        shutil.copy2(ROOT / 'bootstrap.sh', self.repo)
        source = (ROOT / 'shell/zsh/install-deps.sh').read_text()
        # Exercise each package-manager branch independently of the test host OS.
        source = source.replace('OS=$(detect_os)', 'OS="$TEST_OS"')
        (self.repo / 'shell/zsh/install-deps.sh').write_text(source)
        (self.repo / 'shell/zsh/install-deps.sh').chmod(0o755)
        self.log = self.root / 'calls'
        self.log.touch()
        self.env = dict(os.environ, HOME=str(self.home), PATH=str(self.bin),
                        SHELL='/bin/zsh', TEST_OS='ubuntu', CALLS=str(self.log),
                        BUN_INSTALL=str(self.home / '.bun'),
                        PNPM_HOME=str(self.home / '.local/share/pnpm'), XDG_DATA_HOME='',
                        FIXTURE_BIN=str(self.bin))
        for tool in TOOLS:
            self.stub(tool)
        for tool in ['dirname', 'mkdir', 'ln']:
            executable = shutil.which(tool)
            assert executable is not None, f'Required fixture tool missing: {tool}'
            (self.bin / tool).symlink_to(executable)
        self.stub('sudo', 'printf "sudo %s\\n" "$*" >> "$CALLS"\n'
                  'if [ "$*" = "apt update" ]; then exit "${UPDATE_EXIT:-0}"; fi\n'
                  'if [ "$2" = install ]; then\n'
                  '  shift 3\n'
                  'elif [ "$1" = pacman ]; then\n'
                  '  shift 4\n'
                  'else exit 99; fi\n'
                  'for package in "$@"; do\n'
                  '  case $package in ripgrep) tool=rg;; fd-find) tool=fdfind;; *) tool=$package;; esac\n'
                  '  printf "#!/bin/bash\\nexit 0\\n" > "$FIXTURE_BIN/$tool"\n'
                  '  /bin/chmod +x "$FIXTURE_BIN/$tool"\n'
                  'done\n')
        self.stub('brew', 'printf "brew %s\\n" "$*" >> "$CALLS"\n')

    def stub(self, name, body=None, directory=None):
        path = (directory or self.bin) / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text('#!/bin/bash\n' + (body or
                        f'printf "{name} %s\\n" "$*" >> "$CALLS"\nexit 0\n'))
        path.chmod(0o755)

    def run_bootstrap(self, **env):
        result = subprocess.run(['/bin/bash', str(self.repo / 'bootstrap.sh'), '--skip-submodules'],
                                env=dict(self.env, **env), cwd=self.root, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        return self.log.read_text().splitlines()

    def test_repeat_runs_only_link_without_package_managers(self):
        for os_name in ['ubuntu', 'arch', 'macos']:
            with self.subTest(os=os_name):
                self.log.write_text('')
                self.run_bootstrap(TEST_OS=os_name)
                calls = self.run_bootstrap(TEST_OS=os_name)
                self.assertEqual(len(calls), 2, calls)
                self.assertTrue(all(call.startswith('bun ') and '--skip-submodules' in call
                                    for call in calls), calls)

    def test_only_missing_package_installed_then_second_run_skips(self):
        (self.bin / 'rg').unlink()
        calls = self.run_bootstrap()
        self.assertEqual([call for call in calls if call.startswith('sudo ')],
                         ['sudo apt update', 'sudo apt install -y ripgrep'])
        self.log.write_text('')
        self.assertEqual(len(self.run_bootstrap()), 1)

    def test_apt_refresh_shared_by_multiple_missing_packages(self):
        (self.bin / 'rg').unlink()
        (self.bin / 'zsh').unlink()
        calls = self.run_bootstrap()
        self.assertEqual([call for call in calls if call.startswith('sudo ')],
                         ['sudo apt update', 'sudo apt install -y ripgrep', 'sudo apt install -y zsh'])

    def test_failed_apt_refresh_aborts_without_install_or_link(self):
        (self.bin / 'rg').unlink()
        result = subprocess.run(['/bin/bash', str(self.repo / 'bootstrap.sh')],
                                env=dict(self.env, UPDATE_EXIT='42'), cwd=self.root, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.log.read_text().splitlines(), ['sudo apt update'])

    def test_debian_command_aliases_need_no_sudo(self):
        for name, alias in [('fd', 'fdfind'), ('bat', 'batcat')]:
            (self.bin / name).rename(self.bin / alias)
        calls = self.run_bootstrap()
        self.assertEqual(len(calls), 1, calls)
        for name in ['fd', 'bat']:
            self.assertTrue((self.home / '.local/bin' / name).is_symlink())
        self.log.write_text('')
        self.assertEqual(len(self.run_bootstrap()), 1)

    def test_existing_user_installs_discovered_before_installing(self):
        for name, directory in [('bun', self.home / '.bun/bin'),
                                ('pnpm', self.home / '.local/share/pnpm'),
                                ('mcporter', self.home / '.local/share/pnpm')]:
            directory.mkdir(parents=True, exist_ok=True)
            (self.bin / name).rename(directory / name)
        self.assertEqual(len(self.run_bootstrap()), 1)

    def test_existing_fnm_install_locations(self):
        for os_name, directory, xdg in [
            ('ubuntu', '.local/share/fnm', ''),
            ('macos', 'Library/Application Support/fnm', ''),
            ('ubuntu', 'data/fnm', str(self.home / 'data')),
            ('ubuntu', '.fnm', ''),
        ]:
            with self.subTest(os=os_name, directory=directory):
                destination = self.home / directory / 'fnm'
                destination.parent.mkdir(parents=True, exist_ok=True)
                (self.bin / 'fnm').rename(destination)
                self.log.write_text('')
                self.assertEqual(len(self.run_bootstrap(TEST_OS=os_name, XDG_DATA_HOME=xdg)), 1)
                destination.rename(self.bin / 'fnm')

    def test_macos_and_arch_install_only_missing_package(self):
        (self.bin / 'rg').unlink()
        for os_name, expected in [('macos', 'brew install ripgrep'),
                                  ('arch', 'sudo pacman -S --needed --noconfirm ripgrep')]:
            with self.subTest(os=os_name):
                self.log.write_text('')
                calls = self.run_bootstrap(TEST_OS=os_name)
                self.assertEqual(calls[0], expected)
                self.assertEqual(len(calls), 2, calls)


if __name__ == '__main__':
    unittest.main()
