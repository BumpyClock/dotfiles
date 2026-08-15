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
    def test_build_command_binds_loopback_and_one_port(self):
        command = run_server.build_command("127.0.0.1", 7781)

        self.assertEqual(command[:3], [sys.executable, "-m", "mlx_audio.server"])
        self.assertEqual(command[command.index("--host") + 1], "127.0.0.1")
        self.assertEqual(command[command.index("--port") + 1], "7781")
        self.assertNotIn("0.0.0.0", command)

    def test_preload_uses_post_and_url_encodes_model_name(self):
        response = Mock(status=200)
        response.__enter__ = Mock(return_value=response)
        response.__exit__ = Mock(return_value=False)

        with patch.object(run_server.request, "urlopen", return_value=response) as urlopen:
            run_server.preload_model(
                "http://127.0.0.1:7781",
                "mlx-community/VibeVoice Realtime/0.5B",
                timeout=30,
            )

        sent_request = urlopen.call_args.args[0]
        self.assertEqual(sent_request.method, "POST")
        self.assertEqual(
            sent_request.full_url,
            "http://127.0.0.1:7781/v1/models?model_name="
            "mlx-community%2FVibeVoice+Realtime%2F0.5B",
        )
        self.assertEqual(urlopen.call_args.kwargs["timeout"], 30)

    def test_run_preloads_both_models_then_waits_for_child(self):
        child = Mock()
        child.poll.return_value = None
        child.wait.return_value = 0

        with (
            patch.object(run_server.subprocess, "Popen", return_value=child),
            patch.object(run_server, "wait_until_ready"),
            patch.object(run_server, "preload_model") as preload,
            patch.object(run_server.signal, "signal"),
        ):
            exit_code = run_server.run("127.0.0.1", 7781, startup_timeout=60)

        self.assertEqual(exit_code, 0)
        self.assertEqual(
            [call.args[1] for call in preload.call_args_list],
            list(run_server.MODEL_IDS),
        )
        child.wait.assert_called_once_with()

    def test_run_terminates_child_when_preload_fails(self):
        child = Mock()
        child.poll.return_value = None
        child.wait.return_value = 0

        with (
            patch.object(run_server.subprocess, "Popen", return_value=child),
            patch.object(run_server, "wait_until_ready"),
            patch.object(run_server, "preload_model", side_effect=RuntimeError("load failed")),
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
