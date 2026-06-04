| Metadata | |
|---|---|
| KU ID | ku-14 |
| Subdomain | vector-similarity-search |
| Topic | Vector Search Benchmarking |
| Source | Industry / Academic |
| Maturity | Stable |

## Overview

Vector search benchmarking measures query latency, throughput, recall, and index build time across different configurations. Standard benchmarks: ANN-Benchmarks, BEIR (for embedding quality), and custom load tests. Key metrics: queries per second (QPS), recall@k, latency percentiles, and index build/refresh time.

## Core Concepts

- **QPS (Queries Per Second)**: Throughput under load
- **Recall@k**: Fraction of true nearest neighbors in top-k results
- **P50/P95/P99 Latency**: Query latency distribution
- **Index Build Time**: Time to build the ANN index from vectors
- **Index Size**: Storage required for vectors + index structures
- **ANN Benchmark Suite**: Standardized datasets and evaluation protocols

## When To Use

- Choosing between vector stores (pgvector vs Qdrant vs Pinecone)
- Tuning index parameters (ef_search, m, ef_construction)
- Capacity planning (hardware sizing for target QPS)
- Performance regression testing

## When NOT To Use

- Prototyping (use defaults)
- Very small datasets (<10K vectors)
- Pre-production environments (no need until performance matters)

## Best Practices

1. **Use production-representative data**: Synthetic data ≠ real data.
2. **Test at expected QPS**: Single-query latency differs from throughput under load.
3. **Measure P95 latency, not just average**: Tail latency affects UX.
4. **Plot recall vs latency curve**: Understand the tradeoff for your data.
5. **Test multiple index configurations**: Don't assume one config fits all.
6. **Include index build time**: Total cost = query performance + build time.

## Related Topics

- K013 (Vector search performance)
- K042 (HNSW / IVFFlat)
- K065 (Search performance monitoring)

## AI Agent Notes

- Benchmarking is essential before production deployment
- ANN-Benchmarks provides standardized evaluation protocols
- For agents: benchmark with real data, multiple index configs, and expected load

## Verification

- [ ] Production-representative test dataset created
- [ ] QPS benchmark under expected load
- [ ] Recall@k measured for each configuration
- [ ] P95 latency documented
- [ ] Multiple index configurations tested
- [ ] Index build time measured
- [ ] Benchmark results documented and compared
