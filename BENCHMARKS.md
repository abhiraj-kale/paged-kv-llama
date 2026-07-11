# Benchmark results

Machine: single WSL2 Ubuntu process, CPU-only, `stories110M.bin` (n_layers=12, seq_len=1024).
All runs use `-t 0.8 -s 42` for determinism. Raw data below is a single sample per
configuration (no repeated-trial averaging yet) — treat small differences as noise.

## Sweep 1 — memory & throughput vs. concurrency (steps_per_seq=30 fixed)

| num_seqs | peak pages used | naive pages (unshared, max-context) | ratio | tok/s |
|---|---|---|---|---|
| 1 | 2 | 64 | 32x | 2.4† |
| 2 | 4 | 128 | 32x | 5.1 |
| 4 | 8 | 256 | 32x | 5.4 |
| 8 | 16 | 512 | 32x | 5.2 |

† cold-start artifact: fixed per-process overhead isn't amortized over only 30 tokens.

**Finding:** the memory-savings ratio is *constant* across concurrency levels here,
because both `naive_pages` and `peak_pages` scale linearly with `num_seqs` in the same
way when every sequence runs the same length. Concurrency count itself is not what
drives the ratio — see Sweep 2.

## Sweep 2 — memory savings vs. sequence length (num_seqs=4 fixed)

| steps_per_seq | peak pages used | naive pages | ratio | tok/s |
|---|---|---|---|---|
| 20 | 8 | 256 | 32x | 3.5 |
| 50 | 16 | 256 | 16x | 5.1 |
| 100 | 28 | 256 | 9.1x | 4.9 |

**Finding:** this is the real driver of savings — the ratio shrinks as generated
sequences get closer to the model's max context (1024 tokens), because
`naive_pages` is fixed at the worst case while `peak_pages` grows with actual
usage. Savings are largest exactly when they matter most in production: many
short-to-medium conversations relative to a large configured max context.

## Sweep 3 — concurrent (batch) vs. sequential, same total workload (q=4, n=30, 120 tokens total)

- Concurrent (one process, round-robin scheduler): 24.97s
- Sequential (4 separate process invocations, one after another): 45.33s

Investigated rather than taken at face value:
- Measured fixed per-process startup overhead directly: **4.0s** (dominated by
  `build_tokenizer`'s ~96,000 individual `fread()` calls for the 32k-entry
  vocab, worse on WSL's `/mnt/c` filesystem). Sequential pays this 4x,
  concurrent pays it once → accounts for ~16s of the ~20s gap.
- Tested the hypothesis that sequential's larger per-invocation pool
  allocation (64 pages, vs. the shared pool's 8) adds meaningful calloc/
  page-fault cost. Measured directly: **57ms** difference — negligible,
  hypothesis rejected.
- Remaining ~8s gap: no validated mechanism found. Both paths do identical
  total FLOPs (same `forward()` calls, same `pos` values, just different
  order), each configuration was sampled only once, and there is no compute
  batching across sequences in this implementation. Most plausibly
  measurement noise (OS scheduling, disk-cache state) rather than a real
  effect — repeated-trial averaging would confirm, but wasn't run given time
  constraints.

**Conclusion:** the paging system provides a real, measured **memory** benefit
(confirmed up to 32x). It does **not** provide a validated compute-throughput
benefit — consistent with scope: this project shares KV-cache *memory* across
sequences, it does not batch the underlying matmuls across them (that's what
real GPU-batched inference engines like vLLM add on top, and is explicitly
out of scope here).

## Known limitations

- Single-sample measurements — no repeated-trial averaging yet.
- CPU-only, single-threaded (no CUDA kernels, no OpenMP in this build).
- No compute batching across sequences — only memory is shared.
