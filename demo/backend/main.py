"""
Demo server for paged-kv-llama.

Streams tokens from two real inference engines - the original flat-buffer
llama2.c (run_naive) and this project's paged KV-cache engine (run_paged) -
as NDJSON events, so the frontend can race them side by side with live
token counts, timing, and KV-cache memory accounting.
"""
import asyncio
import json
import os
import re
import struct
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE = Path(__file__).resolve().parent          # demo/backend (repo) or /app (container)
ROOT = BASE.parent.parent                        # repo root when running from the repo
PAGE_SIZE = 16                                   # must match paged_cache_c_api.h


def _first_existing(*candidates: Path) -> Path:
    for c in candidates:
        if c.exists():
            return c
    return candidates[-1]


# repo layout keeps these at the root; the Docker image keeps them next to main.py
README_PATH = _first_existing(BASE / "README.md", ROOT / "README.md")
ASSETS_DIR = _first_existing(BASE / "assets", ROOT / "assets")


def find_model() -> Path:
    env = os.environ.get("MODEL_PATH")
    if env:
        p = Path(env)
        if not p.exists():
            raise FileNotFoundError(f"MODEL_PATH={env} does not exist")
        return p
    for cand in [BASE / "stories42M.bin", ROOT / "stories42M.bin",
                 ROOT / "stories15M.bin", ROOT / "stories110M.bin"]:
        if cand.exists():
            return cand
    raise FileNotFoundError(
        "no model checkpoint found - download one, e.g.\n"
        "  wget https://huggingface.co/karpathy/tinyllamas/resolve/main/stories42M.bin"
    )


MODEL = find_model()
TOKENIZER = Path(os.environ.get("TOKENIZER_PATH")) if os.environ.get("TOKENIZER_PATH") \
    else _first_existing(BASE / "tokenizer.bin", ROOT / "tokenizer.bin")
NAIVE_BIN = Path(os.environ.get("NAIVE_BIN", BASE / "bin" / "run_naive"))
PAGED_BIN = Path(os.environ.get("PAGED_BIN", BASE / "bin" / "run_paged"))


def read_model_config() -> dict:
    """Parse the 28-byte llama2.c checkpoint header for the real dims,
    so all memory math is computed from the actual model, not hardcoded."""
    with open(MODEL, "rb") as f:
        dim, hidden_dim, n_layers, n_heads, n_kv_heads, vocab_size, seq_len = \
            struct.unpack("7i", f.read(28))
    kv_dim = dim * n_kv_heads // n_heads
    # bytes for K + V together
    page_bytes_kv = n_layers * PAGE_SIZE * kv_dim * 4 * 2
    naive_bytes_kv = n_layers * seq_len * kv_dim * 4 * 2
    return {
        "model_name": MODEL.name,
        "dim": dim,
        "n_layers": n_layers,
        "n_heads": n_heads,
        "n_kv_heads": n_kv_heads,
        "vocab_size": abs(vocab_size),
        "seq_len": seq_len,
        "kv_dim": kv_dim,
        "page_size": PAGE_SIZE,
        "page_bytes_kv": page_bytes_kv,
        "naive_bytes_kv": naive_bytes_kv,
        "naive_pages": (seq_len + PAGE_SIZE - 1) // PAGE_SIZE,
    }


CFG = read_model_config()

app = FastAPI(title="paged-kv-llama demo")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=500)
    engine: str = Field(pattern="^(naive|paged)$")
    steps: int = Field(default=80, ge=8)
    seed: int = Field(default=42, ge=1)
    temperature: float = Field(default=0.8, ge=0.0, le=1.5)


@app.get("/api/config")
def config():
    return CFG


@app.get("/api/readme", response_class=PlainTextResponse)
def readme():
    return README_PATH.read_text(encoding="utf-8")


@app.get("/api/healthz")
def healthz():
    return {"ok": True, "model": CFG["model_name"]}


@app.post("/api/generate")
async def generate(req: GenerateRequest):
    binpath = PAGED_BIN if req.engine == "paged" else NAIVE_BIN
    if not binpath.exists():
        raise HTTPException(500, f"engine binary missing: {binpath} - run build_engines.sh")
    steps = min(req.steps, CFG["seq_len"])
    args = [
        str(binpath), str(MODEL),
        "-t", f"{req.temperature}", "-p", "0.9",
        "-s", str(req.seed), "-n", str(steps),
        "-i", req.prompt, "-z", str(TOKENIZER),
        "-d", "1",
    ]

    async def stream():
        proc = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        t0 = time.perf_counter()
        t_first = None  # time of first token - separates model-load latency from decode speed
        ntok = 0
        buf = b""
        try:
            yield json.dumps({
                "type": "start", "engine": req.engine,
                "seed": req.seed, "steps": steps,
            }) + "\n"

            while True:
                chunk = await proc.stdout.read(512)
                if not chunk:
                    break
                buf += chunk
                out_lines = []
                while b"\x1f" in buf:
                    piece, buf = buf.split(b"\x1f", 1)
                    ntok += 1
                    if t_first is None:
                        t_first = time.perf_counter()
                    ms = (time.perf_counter() - t0) * 1000
                    pages = -(-ntok // PAGE_SIZE)  # ceil
                    if req.engine == "paged":
                        kv_bytes = pages * CFG["page_bytes_kv"]
                        kv_pages = pages
                    else:
                        kv_bytes = CFG["naive_bytes_kv"]
                        kv_pages = CFG["naive_pages"]
                    out_lines.append(json.dumps({
                        "type": "token",
                        "text": piece.decode("utf-8", "replace"),
                        "n": ntok,
                        "ms": round(ms, 1),
                        "kv_bytes": kv_bytes,
                        "kv_pages": kv_pages,
                    }))
                if out_lines:
                    yield "\n".join(out_lines) + "\n"

            stderr_txt = (await proc.stderr.read()).decode("utf-8", "replace")
            await proc.wait()
            ms = (time.perf_counter() - t0) * 1000
            m = re.search(r"peak_pages=(\d+)", stderr_txt)
            peak_pages = int(m.group(1)) if m else None
            if req.engine == "paged":
                pages_used = peak_pages if peak_pages is not None else -(-ntok // PAGE_SIZE)
                kv_bytes = pages_used * CFG["page_bytes_kv"]
            else:
                pages_used = CFG["naive_pages"]
                kv_bytes = CFG["naive_bytes_kv"]
            # decode throughput = tokens after the first, over time since the first -
            # excludes model-load / time-to-first-token (the standard way to report it)
            decode_s = (time.perf_counter() - t_first) if t_first is not None else 0
            tok_per_s = round((ntok - 1) / decode_s, 2) if ntok > 1 and decode_s > 0 else 0
            ttft_ms = round((t_first - t0) * 1000, 1) if t_first is not None else None
            yield json.dumps({
                "type": "done",
                "engine": req.engine,
                "tokens": ntok,
                "ms": round(ms, 1),
                "ttft_ms": ttft_ms,
                "tok_per_s": tok_per_s,
                "kv_bytes": kv_bytes,
                "pages_used": pages_used,
                "peak_pages_measured": peak_pages,
            }) + "\n"
        finally:
            # client disconnected or stream finished - never leave a stray process
            if proc.returncode is None:
                proc.kill()
                await proc.wait()

    return StreamingResponse(stream(), media_type="application/x-ndjson")


# repo images (architecture diagram etc.) referenced by README / intro dialog
app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="repo-assets")

# built frontend (vite outputs to demo/backend/static; bundle files go to /bundle)
STATIC = BASE / "static"
if STATIC.exists():
    app.mount("/", StaticFiles(directory=str(STATIC), html=True), name="frontend")
