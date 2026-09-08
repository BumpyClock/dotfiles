import importlib.util
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

from fastapi import HTTPException
from huggingface_hub.errors import LocalEntryNotFoundError


MODULE_PATH = Path(__file__).parents[1] / "mlx_audio_server.py"
SPEC = importlib.util.spec_from_file_location("mlx_audio_server", MODULE_PATH)
mlx_audio_server = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = mlx_audio_server
SPEC.loader.exec_module(mlx_audio_server)


class ModelLoadAdapterTests(unittest.TestCase):
    def test_adapter_loads_model_and_marks_request_done(self):
        request = Mock(model_name="test/model")

        with patch.object(mlx_audio_server.server.model_provider, "load_model") as load:
            mlx_audio_server._ModelLoadAdapter().run_serial(request)

        load.assert_called_once_with("test/model")
        request.emit_done.assert_called_once_with()


class ModelPreflightTests(unittest.IsolatedAsyncioTestCase):
    async def test_missing_model_returns_404(self):
        handle = Mock()
        broker = Mock()
        broker.submit.return_value = handle
        missing = LocalEntryNotFoundError("not cached")

        with (
            patch.object(
                mlx_audio_server,
                "_inference_broker_with_loader",
                return_value=broker,
            ),
            patch.object(
                mlx_audio_server.server,
                "_next_inference_chunk",
                AsyncMock(return_value=SimpleNamespace(kind="error", error=missing)),
            ),
        ):
            with self.assertRaises(HTTPException) as raised:
                await mlx_audio_server._load_model_on_inference_thread("missing/model")

        self.assertEqual(raised.exception.status_code, 404)
        handle.cancel.assert_called_once_with()

    async def test_successful_model_load_completes(self):
        broker = Mock()
        broker.submit.return_value = Mock()

        with (
            patch.object(
                mlx_audio_server,
                "_inference_broker_with_loader",
                return_value=broker,
            ),
            patch.object(
                mlx_audio_server.server,
                "_next_inference_chunk",
                AsyncMock(return_value=SimpleNamespace(kind="done", error=None)),
            ),
        ):
            await mlx_audio_server._load_model_on_inference_thread("known/model")

        broker.submit.assert_called_once_with(
            endpoint_kind=mlx_audio_server._MODEL_LOAD_ENDPOINT,
            model_name="known/model",
            payload=None,
        )


if __name__ == "__main__":
    unittest.main()
