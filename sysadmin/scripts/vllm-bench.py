#!/usr/bin/env python3
"""vLLM performance benchmark for reasoning models (e.g., openai/gpt-oss-20b).

Measures TTFT, reasoning speed, output speed, and total throughput.
Reasoning models spend tokens on chain-of-thought before producing visible output,
so we track both phases separately.
"""

import http.client
import json
import time
import sys

HOST = "localhost"
PORT = 8000
MODEL = "google/gemma-4-26B-A4B-it"

# Higher max_tokens to let the reasoning model finish thinking + produce output
TESTS = [
    ("Haiku (simple)",        "Write a haiku about the ocean.", 1000),
    ("Explain CPUs",          "Explain how a CPU works in simple terms.", 2000),
    ("Distributed systems",   "Summarize the key principles of distributed systems: "
                              "consistency, availability, partition tolerance, "
                              "consensus algorithms, replication, failure modes.", 2000),
    ("Code: LRU cache",       "Write a Python thread-safe LRU cache with TTL. "
                              "Include type hints and docstrings.", 4000),
    ("Long input → summary",  "Summarize this:\n\n" +
                              "A large-scale web application serves 10M DAU. " * 20 +
                              "\n\nBe concise.", 2000),
]


def stream_request(prompt: str, max_tokens: int) -> dict:
    """Stream a chat completion, tracking reasoning and output phases."""
    body = json.dumps({
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "stream": True,
        "temperature": 0.7,
    })

    conn = http.client.HTTPConnection(HOST, PORT, timeout=300)
    conn.request("POST", "/v1/chat/completions", body=body,
                 headers={"Content-Type": "application/json"})
    resp = conn.getresponse()

    reasoning_tokens = 0
    output_tokens = 0
    first_any_time = None       # first token of any kind
    first_output_time = None    # first visible content token
    reasoning_parts = []
    output_parts = []
    start = time.perf_counter()

    remainder = ""
    while True:
        chunk = resp.read(8192)
        if not chunk:
            break
        remainder += chunk.decode("utf-8", errors="replace")
        lines = remainder.split("\n")
        remainder = lines[-1]
        for line in lines[:-1]:
            line = line.strip()
            if not line.startswith("data: "):
                continue
            payload = line[6:]
            if payload == "[DONE]":
                continue
            try:
                obj = json.loads(payload)
                delta = obj["choices"][0].get("delta", {})

                # Reasoning tokens
                reasoning = delta.get("reasoning_content") or delta.get("reasoning") or ""
                if reasoning:
                    if first_any_time is None:
                        first_any_time = time.perf_counter()
                    reasoning_tokens += 1
                    reasoning_parts.append(reasoning)

                # Visible output tokens
                content = delta.get("content") or ""
                if content:
                    if first_any_time is None:
                        first_any_time = time.perf_counter()
                    if first_output_time is None:
                        first_output_time = time.perf_counter()
                    output_tokens += 1
                    output_parts.append(content)
            except (json.JSONDecodeError, KeyError, IndexError):
                pass

    end = time.perf_counter()
    conn.close()

    total = end - start
    ttft = (first_any_time - start) if first_any_time else total
    time_to_output = (first_output_time - start) if first_output_time else None
    reasoning_time = (first_output_time - first_any_time) if (first_any_time and first_output_time) else None
    output_time = (end - first_output_time) if first_output_time else None

    total_tokens = reasoning_tokens + output_tokens
    total_decode = total - ttft
    overall_tps = total_tokens / total_decode if total_decode > 0.001 else 0
    output_tps = output_tokens / output_time if (output_time and output_time > 0.001) else 0
    reasoning_tps = reasoning_tokens / reasoning_time if (reasoning_time and reasoning_time > 0.001) else 0

    return {
        "prompt_chars": len(prompt),
        "reasoning_tokens": reasoning_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
        "ttft_ms": round(ttft * 1000, 1),
        "time_to_output_ms": round(time_to_output * 1000, 1) if time_to_output else None,
        "reasoning_time_s": round(reasoning_time, 2) if reasoning_time else None,
        "output_time_s": round(output_time, 2) if output_time else None,
        "total_s": round(total, 2),
        "reasoning_tps": round(reasoning_tps, 1),
        "output_tps": round(output_tps, 1),
        "overall_tps": round(overall_tps, 1),
        "reasoning_preview": "".join(reasoning_parts)[:80],
        "output_preview": "".join(output_parts)[:120],
    }


def non_streaming_request(prompt: str, max_tokens: int) -> dict:
    """Non-streaming request for structure inspection."""
    body = json.dumps({
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "stream": False,
        "temperature": 0,
    })

    conn = http.client.HTTPConnection(HOST, PORT, timeout=120)
    start = time.perf_counter()
    conn.request("POST", "/v1/chat/completions", body=body,
                 headers={"Content-Type": "application/json"})
    resp = conn.getresponse()
    data = json.loads(resp.read())
    end = time.perf_counter()
    conn.close()

    usage = data.get("usage", {})
    msg = data["choices"][0]["message"]
    reasoning = (msg.get("reasoning_content") or msg.get("reasoning") or "")[:80]
    content = (msg.get("content") or "")[:100]

    return {
        "total_s": round(end - start, 2),
        "prompt_tok": usage.get("prompt_tokens"),
        "completion_tok": usage.get("completion_tokens"),
        "reasoning": reasoning,
        "content": content,
        "finish": data["choices"][0].get("finish_reason"),
    }


def main():
    print(f"\n{'=' * 65}")
    print(f"  vLLM Benchmark — {MODEL}")
    print(f"  (Reasoning model: tracks thinking + output phases)")
    print(f"{'=' * 65}\n")

    # Non-streaming sanity check
    print("── Non-streaming sanity check (1000 tok budget) ──")
    r = non_streaming_request("Write a haiku about the ocean.", 1000)
    print(f"  Total: {r['total_s']}s | Prompt: {r['prompt_tok']} tok | "
          f"Completion: {r['completion_tok']} tok | Finish: {r['finish']}")
    if r["reasoning"]:
        print(f"  Reasoning: {r['reasoning']}...")
    if r["content"]:
        print(f"  Output:    {r['content']}")
    print()

    # Streaming tests
    results = []
    for name, prompt, max_tok in TESTS:
        print(f"── {name} (max {max_tok} tok) ──")
        sys.stdout.flush()
        r = stream_request(prompt, max_tok)
        results.append((name, r))

        print(f"  TTFT (first token):    {r['ttft_ms']:,.0f} ms")
        if r["time_to_output_ms"] is not None:
            print(f"  Time to output:        {r['time_to_output_ms']:,.0f} ms")
        if r["reasoning_time_s"] is not None:
            print(f"  Reasoning phase:       {r['reasoning_time_s']}s "
                  f"({r['reasoning_tokens']} tok @ {r['reasoning_tps']} tok/s)")
        if r["output_time_s"] is not None:
            print(f"  Output phase:          {r['output_time_s']}s "
                  f"({r['output_tokens']} tok @ {r['output_tps']} tok/s)")
        print(f"  Total:                 {r['total_s']}s "
              f"({r['total_tokens']} tok @ {r['overall_tps']} tok/s)")
        if r["reasoning_preview"]:
            print(f"  Thinking:  {r['reasoning_preview']}...")
        if r["output_preview"]:
            print(f"  Output:    {r['output_preview']}...")
        print()

    # Summary table
    print(f"{'=' * 65}")
    print(f"  {'Test':<22} {'TTFT':>7} {'Think':>6} {'Out':>5} "
          f"{'R tok/s':>8} {'O tok/s':>8} {'Total':>7}")
    print(f"  {'-' * 22} {'-' * 7} {'-' * 6} {'-' * 5} "
          f"{'-' * 8} {'-' * 8} {'-' * 7}")
    for name, r in results:
        rt = r["reasoning_tokens"]
        ot = r["output_tokens"]
        print(f"  {name:<22} {r['ttft_ms']:>5.0f}ms {rt:>5}t {ot:>4}t "
              f"{r['reasoning_tps']:>7.1f} {r['output_tps']:>7.1f} {r['total_s']:>5.1f}s")

    # Averages
    valid_r = [r for _, r in results if r["reasoning_tps"] > 0]
    valid_o = [r for _, r in results if r["output_tps"] > 0]
    print()
    if valid_r:
        avg_r = sum(r["reasoning_tps"] for r in valid_r) / len(valid_r)
        print(f"  Avg reasoning speed:  {avg_r:.1f} tok/s")
    if valid_o:
        avg_o = sum(r["output_tps"] for r in valid_o) / len(valid_o)
        print(f"  Avg output speed:     {avg_o:.1f} tok/s")
    all_valid = [r for _, r in results if r["overall_tps"] > 0]
    if all_valid:
        avg_all = sum(r["overall_tps"] for r in all_valid) / len(all_valid)
        avg_ttft = sum(r["ttft_ms"] for r in all_valid) / len(all_valid)
        print(f"  Avg overall speed:    {avg_all:.1f} tok/s")
        print(f"  Avg TTFT:             {avg_ttft:,.0f} ms")

    print()


if __name__ == "__main__":
    main()
