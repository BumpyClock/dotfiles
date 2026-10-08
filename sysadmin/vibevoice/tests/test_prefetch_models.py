import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, call, patch


MODULE_PATH = Path(__file__).parents[1] / "prefetch_models.py"
SPEC = importlib.util.spec_from_file_location("prefetch_models", MODULE_PATH)
prefetch_models = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = prefetch_models
SPEC.loader.exec_module(prefetch_models)


class PrefetchModelsTests(unittest.TestCase):
    def test_revision_drift_stops_before_download(self):
        api = Mock()
        api.model_info.return_value = SimpleNamespace(sha="unexpected")
        downloader = Mock()

        with self.assertRaisesRegex(RuntimeError, "revision drift"):
            prefetch_models.prefetch(Path("/tmp/cache"), api=api, downloader=downloader)

        downloader.assert_not_called()

    def test_downloads_main_after_verifying_revision(self):
        models = (
            prefetch_models.ModelSpec("owner/full-model", "full-sha"),
            prefetch_models.ModelSpec(
                "owner/tokenizer",
                "tokenizer-sha",
                ("tokenizer.json",),
            ),
        )
        expected_shas = {model.repo_id: model.sha for model in models}
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
            with patch.object(prefetch_models, "MODELS", models):
                prefetch_models.prefetch(cache, api=api, downloader=downloader)

            self.assertEqual(
                downloader.call_args_list,
                [
                    call(
                        "owner/full-model",
                        revision="main",
                        cache_dir=str(cache),
                    ),
                    call(
                        "owner/tokenizer",
                        revision="main",
                        cache_dir=str(cache),
                        allow_patterns=("tokenizer.json",),
                    ),
                ],
            )


if __name__ == "__main__":
    unittest.main()
