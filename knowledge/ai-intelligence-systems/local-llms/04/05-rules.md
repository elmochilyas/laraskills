---
id: ku-04
title: "Quantization & Optimization - Rules"
subdomain: "local-llms"
ku-type: "optimization"
date-created: "2026-06-02"
---

## Rules for Quantization & Optimization

### R1: Never run a model at the highest available quantization without benchmarking quality degradation
- **Category:** Performance
- **Rule:** Always benchmark the quality difference between FP16/BF16 and at least two lower quantization levels (Q4_K_M, Q5_K_M for GGUF; FP8, INT4 for other formats) on your task-specific dataset before selecting a quantization level.
- **Reason:** Quantization degrades output quality, but the degradation varies dramatically by task. A model may score 95% of FP16 quality at Q4_K_M (great trade-off) or 80% (unacceptable). Without task-specific benchmarking, you don't know.
- **Bad Example:** Choosing Q2_K quantization because it uses the least RAM — quality drops 40% on the entity extraction task, making the model unusable for the specific application.
- **Good Example:** Benchmarked Q4_K_M at 97% of FP16 quality with 50% less RAM usage → selected as the best trade-off.
- **Exceptions:** Applications where even small quality degradation is unacceptable (medical/legal).
- **Consequences of Violation:** Quantization level either wastes RAM (unnecessary quality headroom) or degrades output quality below acceptable threshold; wrong trade-off selected without data.

### R2: Match quantization precision to the available VRAM, not the model's native precision
- **Category:** Performance
- **Rule:** Calculate available VRAM (after OS and other workloads), then select a quantization level that fits the model entirely in VRAM with 20% headroom; never run a model that doesn't fit entirely in VRAM.
- **Reason:** Models that exceed VRAM partially load into system RAM, causing "GPU offloading" that is 10-50x slower than full GPU execution. The faster quantization that fits fully in VRAM beats a higher-precision model that spills to system RAM.
- **Bad Example:** Running Llama 3.1 8B at FP16 on a 12GB GPU — doesn't fully fit (8B FP16 ≈ 16GB), so 4GB spills to CPU, resulting in 5 tokens/second.
- **Good Example:** Running the same model at Q4_K_M (8B Q4 ≈ 5GB) on 12GB GPU — fits with 60% headroom, achieving 40 tokens/second.
- **Exceptions:** CPU-only inference where only quantization level matters for performance.
- **Consequences of Violation:** Model runs 5-10x slower than necessary; developer experience is degraded; users perceive the application as unresponsive.

### R3: Use KV-cache quantization when context length exceeds 32K tokens for throughput improvement
- **Category:** Performance
- **Rule:** Enable KV-cache quantization (FP8 or INT8) when the application uses context windows >32K tokens; leave KV-cache at full precision for shorter windows; never use KV-cache quantization for short-context tasks.
- **Reason:** KV-cache dominates VRAM usage at long context lengths (e.g., 128K context KV-cache for 8B model ≈ 32GB at FP16). Quantizing KV-cache saves significant VRAM at minimal quality cost, but for short context the overhead of quantization is not justified.
- **Bad Example:** A short-context chatbot (2K tokens) with KV-cache quantization enabled — the quality cost is incurred with no memory benefit.
- **Good Example:** A document analysis agent using 64K context with KV-cache FP8 — VRAM usage reduced by 50% with negligible quality impact on retrieval tasks.
- **Exceptions:** VRAM-constrained environments where any savings help regardless of context length.
- **Consequences of Violation:** Long-context applications exceed VRAM, causing offloading or OOM; or unnecessary quality cost incurred for short-context tasks that didn't need KV-cache quantization.
