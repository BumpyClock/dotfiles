#!/usr/bin/env python3

from functools import wraps

import mlx.core as mx
from huggingface_hub.errors import LocalEntryNotFoundError, RepositoryNotFoundError
from mlx_audio import server_inference


_original_broker_run = server_inference.InferenceBroker._run


@wraps(_original_broker_run)
def _run_with_metal_stream(broker) -> None:
    mx.set_default_stream(mx.new_stream(mx.gpu))
    _original_broker_run(broker)


server_inference.InferenceBroker._run = _run_with_metal_stream

from mlx_audio import server  # noqa: E402


_MODEL_LOAD_ENDPOINT = "vibevoice-model-load"


class _ModelLoadAdapter(server.BaseModelExecutionAdapter):
    def run_serial(self, request: server.InferenceRequest) -> None:
        server.model_provider.load_model(request.model_name)
        request.emit_done()


def _inference_broker_with_loader() -> server.InferenceBroker:
    broker = server.get_inference_broker()
    if _MODEL_LOAD_ENDPOINT not in broker._adapters:
        broker.register_adapter(_MODEL_LOAD_ENDPOINT, _ModelLoadAdapter())
    return broker


async def _load_model_on_inference_thread(model_name: str) -> None:
    # ponytail: remove when MLX-Audio loads models on its Metal worker thread.
    handle = _inference_broker_with_loader().submit(
        endpoint_kind=_MODEL_LOAD_ENDPOINT,
        model_name=model_name,
        payload=None,
    )

    while True:
        chunk = await server._next_inference_chunk(handle)
        if chunk.kind == "done":
            return
        if chunk.kind != "error":
            continue

        handle.cancel()
        if isinstance(chunk.error, (LocalEntryNotFoundError, RepositoryNotFoundError)):
            raise server.HTTPException(
                status_code=404,
                detail=f"Model not found: {model_name!r}",
            ) from chunk.error
        raise server.HTTPException(
            status_code=500,
            detail=f"Failed to load model {model_name!r}: {chunk.error}",
        ) from chunk.error


server._preflight_model_load = _load_model_on_inference_thread


if __name__ == "__main__":
    server.main()
