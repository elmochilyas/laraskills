| Metadata | |
|---|---|
| KU ID | K065 |
| Subdomain | search-ux-and-analytics |
| Topic | Search Performance Benchmarking |
| Source | General Industry |
| Maturity | Mature |

## Overview

Search performance benchmarking measures latency, throughput (QPS), recall, and resource utilization of search systems. Key metrics include p50/p95/p99 latency, queries per second, recall@K compared to exact search, and indexing throughput. Regular benchmarking establishes baselines, validates optimizations, and detects regressions.

## Core Concepts

- **Latency**: Time from query submission to response (p50, p95, p99).
- **Throughput**: Queries per second (QPS) under load.
- **Recall@K**: Percentage of relevant results in top-K compared to exact search.
- **Indexing Speed**: Documents indexed per second.
- **Concurrency**: Number of simultaneous queries the system can handle.
- **Resource Utilization**: CPU, memory, disk, network during search.

## When To Use

- Pre-production capacity planning
- Before/after performance optimization validation
- Regression testing after configuration changes
- Comparing search engine options
- SLA establishment and monitoring

## When NOT To Use

- Development environments (results aren't representative)
- Non-production prototyping (early optimization is premature)
- When the benchmark tool would distort production workload

## Best Practices

1. **Use realistic data**: Benchmark with production-scale data and query distributions.
2. **Measure percentiles (p95, p99)**: Average latency hides tail latency problems.
3. **Test at expected concurrency**: Single-threaded latency doesn't reflect real usage.
4. **Warm up the system**: Run queries before measurement to populate caches.
5. **Isolate the system under test**: Avoid noise from other services on shared hardware.
6. **Document benchmark conditions**: Data size, hardware, query mix for reproducibility.

## Architecture Guidelines

- Use k6, artillery, or custom Laravel benchmark commands for load testing.
- Benchmark both search and indexing paths separately.
- For vector search, measure recall@K against exact nearest neighbor search.
- Include query caching in benchmarks (both cache-hit and cache-miss).

## Performance Considerations

- Latency targets: p50 <50ms, p95 <200ms, p99 <500ms for typical web search.
- Throughput targets vary: 100 QPS for small apps, 10,000+ QPS for large deployments.
- Indexing speed: Meilisearch ~15K docs/sec, Qdrant ~5K vectors/sec, pgvector ~2K/sec.
- Caching can improve effective latency by 10-100x for popular queries.

## Related Topics

- K063 (Search query caching)
- K042 (pgvector HNSW / IVFFlat indexing)
- K051 (Qdrant quantization)

## AI Agent Notes

- Regular benchmarking prevents performance regressions.
- Always measure p95/p99 latency, not just average.
- For agents: establish baseline benchmarks before production; re-benchmark after configuration changes; use realistic data and query patterns.

## Verification

- [ ] Baseline latency benchmarks recorded (p50, p95, p99)
- [ ] Throughput (QPS) measured at expected concurrency
- [ ] Recall@K benchmarked against exact search (vector)
- [ ] Indexing throughput measured
- [ ] Benchmark conditions documented
- [ ] Regular benchmarking scheduled
