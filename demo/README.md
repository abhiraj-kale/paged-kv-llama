# Interactive demo — race the paged engine against the original

A full-stack web demo for [paged-kv-llama](../README.md). Type a story prompt and
watch two real C inference engines complete it **simultaneously with the same
random seed** — the original flat-buffer llama2.c on the left, this project's
paged KV-cache engine on the right. Live per-token streaming, timing, and a
memory meter that shows the paged cache growing one 16-token page at a time
against the naive engine's fixed worst-case reservation.

**Stack:** FastAPI backend (streams engine stdout as NDJSON) · React + Vite +
Material UI frontend · the two compiled C/C++ engines doing the actual inference.

## Run locally (Linux / WSL / macOS)

```bash
# 1. engines
cd demo/backend
bash build_engines.sh

# 2. model (~167MB, from the repo root)
cd ../..
wget https://huggingface.co/karpathy/tinyllamas/resolve/main/stories42M.bin

# 3. backend deps + server
cd demo/backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
```

Then either build the frontend once and let the backend serve it:

```bash
cd demo/frontend
npm install
npm run build          # outputs to demo/backend/static — refresh :8000
```

…or run the Vite dev server with hot reload (proxies /api to :8000):

```bash
npm run dev            # http://localhost:5173
```

> **WSL tip:** keep the model and binaries on the Linux filesystem (e.g. `~/demo/`)
> and point `MODEL_PATH` / `NAIVE_BIN` / `PAGED_BIN` at them — reading the model
> through `/mnt/c` costs ~10x on time-to-first-token.

## Docker (one container, frontend included)

```bash
# from the repo root
docker build -f demo/Dockerfile -t paged-kv-llama-demo .
docker run -p 8000:8000 paged-kv-llama-demo
```

## Configuration (env vars)

| Variable | Default | Purpose |
|---|---|---|
| `MODEL_PATH` | first of `stories42M/15M/110M.bin` found | llama2.c checkpoint to serve |
| `TOKENIZER_PATH` | repo `tokenizer.bin` | tokenizer file |
| `NAIVE_BIN` / `PAGED_BIN` | `demo/backend/bin/…` | engine binaries |
| `PORT` (Docker) | 8000 | listen port |

## API

- `POST /api/generate` `{prompt, engine: "naive"|"paged", steps, seed}` →
  NDJSON stream of `start` / `token` (text, count, elapsed ms, kv bytes+pages) /
  `done` (totals, decode tok/s, ttft, measured peak pages) events
- `GET /api/config` — model dims + memory math parsed from the checkpoint header
- `GET /api/readme` — the project README (rendered in the About dialog)
