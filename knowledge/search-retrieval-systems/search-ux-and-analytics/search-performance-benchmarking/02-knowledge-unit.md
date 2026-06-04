# Knowledge Unit: Search Performance Benchmarking

## Metadata

- **ID:** K065
- **Subdomain:** Search UX & Analytics
- **Source:** General
- **Maturity:** Mature
- **Laravel Relevance:** Latency, QPS, recall measurement

## Executive Summary

Search performance benchmarking measures latency, throughput (QPS), recall, and precision under realistic conditions. Key metrics include P50/P95/P99 latency, queries per second, recall@K (for vector search), and search success rate. Benchmarking guides infrastructure sizing, relevance tuning, and cache strategy decisions.

## Core Concepts

- **Latency**: P50 (median), P95 (95th percentile), P99 (99th percentile) response times.
- **Throughput (QPS)**: Queries per second the system can handle at acceptable latency.
- **Recall@K**: Percentage of relevant documents returned in the top-K results (for vector search).
- **Precision@K**: Percentage of returned results that are relevant.
- **Cold vs Warm Cache**: Performance differs significantly for cache-miss vs cache-hit scenarios.
- **Concurrency**: How performance changes under simultaneous load.

## Internal Mechanics

Benchmarking tools (k6, vegeta, wrk, JMeter) send search requests to the application endpoint or directly to the search engine. Latency is measured at the client side. For recall measurement, a test set of queries with expected results is required. The benchmark must account for network latency, cache state, and concurrent load.

## Patterns

- **Latency benchmarking**: Measure P50/P95/P99 under target QPS.
- **Recall sweep**: For vector search, sweep `ef_search` (pgvector) and measure recall vs latency.
- **Cache impact measurement**: Compare latency with hot cache vs cold cache.
- **Scaling test**: Increase QPS until P99 exceeds SLA to find capacity limits.

## Architectural Decisions

Benchmarking methodology depends on what you're optimizing for: user-facing search (prioritize P95 latency) vs batch processing (prioritize throughput).

## Tradeoffs

| Metric | What It Measures | Optimization Priority |
|---|---|---|
| P50 latency | Typical user experience | General performance |
| P95 latency | "Slow but acceptable" experience | Tail latency tuning |
| P99 latency | Worst-case experience | Infrastructure scaling |
| Recall@K | Result quality | Relevance tuning |

## Performance Considerations

- P99 latency is typically 5-10x P50 for search engines (GC pauses, network jitter, queuing).
- Vector search recall depends on `ef_search` (HNSW) or probes (IVFFlat).
- Cold cache adds 10-100ms to first request latency.
- Concurrent users slow down each other due to resource contention.

## Production Considerations

- **Establish a baseline before optimizing** — benchmark before any tuning.
- **Benchmark with production-like data** — synthetic benchmarks don't predict real-world performance.
- **Include the full request path** — Laravel routing, Scout engine adapter, network, engine processing.
- **Monitor P99 latency** — it's the most important metric for user experience.
- **Set latency SLAs**: e.g., "P99 search latency < 200ms".
- **Run benchmarks in CI** to catch performance regressions.

## Common Mistakes

- Benchmarking only P50 — P99 is more important for user experience.
- Benchmarking with unrealistic data — small datasets or artificial query distributions.
- Warm cache only — cold start performance is often worse but not measured.
- Not isolating the search engine from application overhead.
- Running short benchmarks (<5 minutes) that don't capture GC pauses or tail latency.

## Failure Modes

- **Jitter from concurrency**: Benchmark results vary widely run-to-run due to GC, scheduling, or network.
- **Cache pollution**: One benchmark run pollutes cache for the next, masking cold-start performance.
- **Resource exhaustion**: Benchmarking saturates the search engine and affects production traffic.

## Ecosystem Usage

Standard practice for any production search implementation. Benchmarking is typically done during initial deployment, after infrastructure changes, and after relevance tuning.

## Related Knowledge Units

- K063 (Search query caching)
- K042 (pgvector HNSW / IVFFlat)

## Research Notes

Sources: General performance engineering practice, pgvector benchmarks (Instaclustr), ANNS benchmarks (ann-benchmarks.com). Search benchmarking methodology is well-established. The key insight: always measure P99 (not just P50), and always benchmark with production-like data and query distributions.


## Mental Models

- **Tool Analogy**: Think of this capability as a specialized tool in a toolbox. It addresses a specific problem well, but using it for the wrong job creates friction.
- **Lever Model**: The feature acts as a force multiplier — a small configuration change (effort) produces a large search quality improvement (result). Finding the right lever is key.

