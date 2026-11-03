#!/usr/bin/env python3
"""Isolated regression checks for the optional native bytecode maintenance."""

import os
import pathlib
import shutil
import subprocess
import tempfile
import unittest


class StartupCompilationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = pathlib.Path(self.temp.name)
        self.home = self.root / "home"
        self.omz = self.home / ".oh-my-zsh"
        self.custom = self.omz / "custom"
        self.custom.mkdir(parents=True)
        self.compiler = self.root / "compile-startup.zsh"
        shutil.copyfile(
            pathlib.Path(__file__).with_name(self.compiler.name), self.compiler
        )
        self.source = self.root / "shared.zsh"
        self.source.write_text("startup_value() { print -r -- original; }\n")
        self.env = {
            **os.environ,
            "HOME": str(self.home),
            "ZSH": str(self.omz),
            "ZSH_CUSTOM": str(self.custom),
        }

    def compile(self):
        return subprocess.check_output(
            ["zsh", "-f", str(self.compiler)], env=self.env, text=True
        )

    def value(self):
        return subprocess.check_output(
            ["zsh", "-fc", 'source "$1"; startup_value', "test", str(self.source)],
            env=self.env,
            text=True,
        )

    def test_compiles_without_changing_behavior_and_is_idempotent(self):
        self.assertEqual(self.value(), "original\n")
        self.assertIn("Compiled 1 startup files", self.compile())
        bytecode = pathlib.Path(str(self.source) + ".zwc")
        before = bytecode.stat().st_mtime_ns
        self.assertEqual(self.value(), "original\n")
        self.assertIn("Compiled 0 startup files; 1 already current", self.compile())
        self.assertEqual(bytecode.stat().st_mtime_ns, before)

    def test_source_edit_works_before_rebuild(self):
        self.compile()
        bytecode = pathlib.Path(str(self.source) + ".zwc")
        self.source.write_text("startup_value() { print -r -- edited; }\n")
        older = self.source.stat().st_mtime - 10
        os.utime(bytecode, (older, older))
        self.assertEqual(self.value(), "edited\n")
        self.assertIn("Compiled 1 startup files", self.compile())
        self.assertEqual(self.value(), "edited\n")

    def test_profiles_and_alias_dependent_git_plugin_are_not_compiled(self):
        plugin = self.omz / "plugins/git/git.plugin.zsh"
        plugin.parent.mkdir(parents=True)
        plugin.write_text("alias example='print original'\nexample_fn() { example; }\n")
        profile = self.home / ".zshrc"
        profile.write_text("exit 42\n")
        self.compile()
        self.assertFalse(pathlib.Path(str(profile) + ".zwc").exists())
        self.assertFalse(pathlib.Path(str(plugin) + ".zwc").exists())

    def test_invalid_bytecode_is_rebuilt(self):
        self.compile()
        bytecode = pathlib.Path(str(self.source) + ".zwc")
        bytecode.chmod(0o600)
        bytecode.write_bytes(b"not zsh bytecode")
        self.assertIn("Compiled 1 startup files", self.compile())
        self.assertEqual(self.value(), "original\n")


if __name__ == "__main__":
    unittest.main()
