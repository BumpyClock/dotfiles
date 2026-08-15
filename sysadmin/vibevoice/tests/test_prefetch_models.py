import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock


MODULE_PATH = Path(__file__).parents[1] / "prefetch_models.py"
SPEC = importlib.util.spec_from_file_location("prefetch_models", MODULE_PATH)
prefetch_models = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = prefetch_models
SPEC.loader.exec_module(prefetch_models)


class PrefetchModelsTests(unittest.TestCase):
    def test_model_revisions_are_pinned(self):
        self.assertEqual(
            [(model.repo_id, model.sha) for model in prefetch_models.MODELS],
            [
                (
                    "mlx-community/VibeVoice-Realtime-0.5B-fp16",
                    "59ba546c294935410544f037a2de20b9da7ed219",
                ),
                (
                    "mlx-community/VibeVoice-ASR-bf16",
                    "12076ff8cb141fcb672abc9f8957b08aab5ecf94",
                ),
                (
                    "Qwen/Qwen2.5-0.5B",
                    "060db6499f32faf8b98477b0a26969ef7d8b9987",
                ),
                (
                    "Qwen/Qwen2.5-7B",
                    "d149729398750b98c0af14eb82c78cfe92750796",
                ),
            ],
        )

    def test_revision_drift_stops_before_download(self):
        api = Mock()
        api.model_info.return_value = SimpleNamespace(sha="unexpected")
        downloader = Mock()

        with self.assertRaisesRegex(RuntimeError, "revision drift"):
            prefetch_models.prefetch(Path("/tmp/cache"), api=api, downloader=downloader)

        downloader.assert_not_called()

    def test_downloads_main_after_verifying_revision(self):
        expected_shas = {model.repo_id: model.sha for model in prefetch_models.MODELS}
        api = Mock()
        api.model_info.side_effect = lambda repo_id, revision: SimpleNamespace(
            sha=expected_shas[repo_id]
        )

        with tempfile.TemporaryDirectory() as temp_dir:
            cache = Path(temp_dir)
            downloader = Mock(
                side_effect=lambda repo_id, revision, cache_dir, **_kwargs: str(
                    cache / f"models--{repo_id.replace('/', '--')}" / "snapshots" / expected_shas[repo_id]
                )
            )
            prefetch_models.prefetch(cache, api=api, downloader=downloader)

        self.assertEqual(downloader.call_count, 4)
        for call in downloader.call_args_list:
            self.assertEqual(call.kwargs["revision"], "main")
        tokenizer_call = downloader.call_args_list[-1]
        self.assertIn("tokenizer.json", tokenizer_call.kwargs["allow_patterns"])


if __name__ == "__main__":
    unittest.main()
