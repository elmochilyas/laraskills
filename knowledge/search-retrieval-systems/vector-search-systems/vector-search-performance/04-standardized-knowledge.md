| Metadata | |
|---|---|
| KU ID | ku-13 |
| Subdomain | vector-similarity-search |
| Topic | Vector Search Performance |
| Source | pgvector / Qdrant / Industry |
| Maturity | Stable |

## Overview

Vector search performance depends on index type (HNSW/IVFFlat), index parameters (ef_search, probes, m, ef_construction), hardware (memory, CPU/GPU), and data characteristics (dimensionality, dataset size). Key metrics: query latency (P50/P95/P99), recall@k, QPS, and index build time.

## Core Concepts

- **HNSW Parameters**: m (connections per node), ef_construction (build quality), ef_search (search breadth)
- **IVFFlat Parameters**: lists (number of centroids), probes (search depth)
- **Dimensionality Scaling**: Higher dims = slower queries (curse of dimensionality)
- **Memory Usage**: Vectors + index structures compete for RAM
- **Quantization**: Binary, scalar, product quantization reduce memory and speed up search
- **Recall vs Latency**: Tradeoff curve — higher recall costs more latency

## When To Use

- Production vector search performance tuning
- Capacity planning for vector infrastructure
- Choosing between index types and parameters
- Performance regression investigation

## When NOT To Use

- Prototyping (use defaults)
- Very small datasets (<10K vectors) — exact search is fast enough

## Best Practices

1. **Benchmark recall vs latency**: Plot the tradeoff curve for your data.
2. **Tune ef_search (HNSW)**: Start at 100, increase if recall is insufficient.
3. **Tune probes (IVFFlat)**: Start at 1, increase until recall plateau.
4. **Use quantization**: Binary + re-rank for 32x memory reduction with high recall.
5. **Profile memory**: Ensure index + vectors fit in available RAM.
6. **Dimension reduction**: Lower dimensionality = faster search, lower storage.

## Related Topics

- K042 (HNSW / IVFFlat)
- K047 (Binary quantization)
- K014 (Performance benchmarking)

## AI Agent Notes

- HNSW is the default index choice for production
- Ef_search is the primary tuning lever for HNSW recall vs latency
- For agents: start with default HNSW, tune ef_search for recall requirements

## Verification

- [ ] Index type and parameters chosen
- [ ] Recall vs latency benchmarked
- [ ] Memory usage profiled
- [ ] ef_search/probes tuned
- [ ] Quantization evaluated
- [ ] Dimensionality justified
