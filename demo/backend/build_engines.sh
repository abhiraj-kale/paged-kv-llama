#!/usr/bin/env bash
# Builds both demo engines into demo/backend/bin/
#   run_paged - this project's engine (paged KV-cache), from repo root sources
#   run_naive - the original upstream flat-buffer engine (demo/engines/run_naive.c)
set -e
cd "$(dirname "$0")"
ROOT=../..
mkdir -p bin

g++ -std=c++17 -O3 -c "$ROOT/paged_cache.cpp" -o bin/paged_cache.o
gcc  -O3 -c "$ROOT/run.c" -o bin/run_paged.o
g++  bin/run_paged.o bin/paged_cache.o -lm -o bin/run_paged

gcc  -O3 ../engines/run_naive.c -lm -o bin/run_naive

echo "engines built: demo/backend/bin/run_paged, demo/backend/bin/run_naive"
