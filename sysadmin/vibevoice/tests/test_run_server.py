import importlib.util
import signal
import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch


MODULE_PATH = Path(__file__).parents[1] / "run_server.py"
SPEC = importlib.util.spec_from_file_location("run_server", MODULE_PATH)
run_server = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = run_server
SPEC.loader.exec_module(run_server)


class ServerSupervisorTests(unittest.TestCase):
    def test_build_command_uses_patched_server_and_loopback(self):
        command = run_server.build_command("127.0.0.1", 7781)

        self.assertEqual(
            command,
            [
                sys.executable,
                str(MODULE_PATH.with_name("mlx_audio_server.py")),
                "--host",
                "127.0.0.1",
                "--port",
                "7781",
                "--allowed-origins",
                "http://127.0.0.1,http://localhost",
            ],
        )

    def test_run_waits_for_server_then_child(self):
        child = Mock()
        child.poll.return_value = None
        child.wait.return_value = 0

        with (
            patch.object(run_server.subprocess, "Popen", return_value=child),
            patch.object(run_server, "wait_until_ready") as wait_until_ready,
            patch.object(run_server.signal, "signal"),
        ):
            exit_code = run_server.run("127.0.0.1", 7781, startup_timeout=60)

        self.assertEqual(exit_code, 0)
        wait_until_ready.assert_called_once_with(
            "http://127.0.0.1:7781", child, 60
        )
        child.wait.assert_called_once_with()

    def test_run_terminates_child_when_readiness_fails(self):
        child = Mock()
        child.poll.return_value = None
        child.wait.return_value = 0

        with (
            patch.object(run_server.subprocess, "Popen", return_value=child),
            patch.object(
                run_server,
                "wait_until_ready",
                side_effect=RuntimeError("server failed"),
            ),
            patch.object(run_server.signal, "signal"),
        ):
            exit_code = run_server.run("127.0.0.1", 7781, startup_timeout=60)

        self.assertEqual(exit_code, 1)
        child.terminate.assert_called_once_with()
        child.wait.assert_called_once_with(timeout=30)

    def test_forwarded_signal_reaches_server_process(self):
        child = Mock()
        child.poll.return_value = None

        run_server.forward_signal(child, signal.SIGTERM)

        child.send_signal.assert_called_once_with(signal.SIGTERM)


if __name__ == "__main__":
    unittest.main()
