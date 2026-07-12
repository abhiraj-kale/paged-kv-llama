# paged-kv-llama demo — single-container full-stack build.
# Build from the REPO ROOT (the engine sources live there):
#   docker build -f demo/Dockerfile -t paged-kv-llama-demo .
#   docker run -p 8000:8000 paged-kv-llama-demo

# ---- stage 1: frontend ----
FROM node:20-slim AS frontend
WORKDIR /fe
COPY demo/frontend/package.json demo/frontend/package-lock.json* ./
RUN npm install --no-fund --no-audit
COPY demo/frontend .
# vite.config outDir points outside /fe; override to a local dist for the container
RUN npx vite build --outDir dist --emptyOutDir

# ---- stage 2: engines ----
FROM debian:bookworm-slim AS engines
RUN apt-get update && apt-get install -y --no-install-recommends gcc g++ libc6-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY run.c paged_cache.cpp paged_cache.hpp paged_cache_c_api.h ./
COPY demo/engines/run_naive.c ./
RUN g++ -std=c++17 -O3 -c paged_cache.cpp -o paged_cache.o \
 && gcc -O3 -c run.c -o run_paged.o \
 && g++ run_paged.o paged_cache.o -lm -o run_paged \
 && gcc -O3 run_naive.c -lm -o run_naive

# ---- stage 3: runtime ----
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*
COPY demo/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY --from=engines /src/run_paged /src/run_naive ./bin/
COPY tokenizer.bin README.md ./
COPY assets ./assets
COPY demo/backend/main.py .
COPY --from=frontend /fe/dist ./static
# demo model (~167MB). Swap via MODEL_PATH + a mounted volume for other checkpoints.
RUN wget -q https://huggingface.co/karpathy/tinyllamas/resolve/main/stories42M.bin
ENV MODEL_PATH=/app/stories42M.bin \
    TOKENIZER_PATH=/app/tokenizer.bin \
    NAIVE_BIN=/app/bin/run_naive \
    PAGED_BIN=/app/bin/run_paged
EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
