| Metadata | |
|---|---|
| KU ID | K046 |
| Subdomain | vector-similarity-search |
| Topic | pgvector Iterative Index Scans |
| Source | pgvector Docs |
| Maturity | Stable |

## Overview

pgvector's iterative index scans provide a way to balance recall and performance when filtering vectors. Instead of choosing between exact search (slow but accurate) and approximate ANN (fast but may miss filtered results), iterative scans progressively relax the ANN search parameters until enough results matching the filter are found. This is critical for filtered ANN queries where HNSW alone may miss relevant filtered results.

## Core Concepts

- **Filtered ANN Challenge**: HNSW indexes may miss vectors that match metadata filters because the index navigates by vector similarity, not filter conditions.
- **Iterative Scan**: Starts with strict ANN parameters (high ef_search), progressively relaxes until enough results match the filter.
- **Relaxed Ordering**: Returns results that matched the filter even if they scored lower.
- **Strict Ordering**: Only returns results in strict vector distance order, possibly fewer results.
- **Performance vs Recall Tradeoff**: More iterations = better recall but higher latency.

## When To Use

- Vector search with mandatory metadata filters
- Applications where filtered ANN recall is critical
- Scenarios where post-filter pruning reduces result set too much
- Any pgvector deployment using HNSW indexes with metadata filtering

## When NOT To Use

- Small datasets where exact search is fast enough
- Unfiltered vector search (no need for iterative scans)
- When using IVFFlat indexes (iterative scans are HNSW-specific)
- Applications where query latency is more critical than recall

## Best Practices

1. **Start with strict ordering**: Most applications prefer strict ordering with fallback.
2. **Set reasonable iteration limits**: Cap iterations to prevent runaway queries.
3. **Monitor filtered query recall**: Track how often filters reduce result sets below thresholds.
4. **Consider index-only filters**: If filter columns can be part of the vector index.
5. **Benchmark with real filters**: Test iterative scan performance with your actual filter distribution.

## Architecture Guidelines

- Use `SET hnsw.iterative_scan = relaxed` or `strict` at the session or query level.
- `strict` (default): Return exact distances, may return fewer results.
- `relaxed`: Return more results matching the filter, distances may be approximate.
- Also configurable per-query: `ORDER BY ... <-> ... LIMIT ...` with explicit scan mode.

## Performance Considerations

- Iterative scans add 20-100ms latency compared to unfiltered ANN.
- Each iteration increases recall but adds ~5-10ms.
- The iteration limit prevents unbounded query times.
- With optimal parameters, recall can exceed 95% even with restrictive filters.

## Related Topics

- K041 (pgvector extension)
- K042 (pgvector HNSW / IVFFlat indexing)
- K050 (Qdrant payload filtering)
- K058 (Pinecone metadata filtering)

## AI Agent Notes

- Iterative scans solve the filtered ANN problem where HNSW may miss filter-matching results.
- Start with strict ordering; switch to relaxed if filtered recall is insufficient.
- For agents: enable iterative scans when using metadata filters with HNSW indexes; set reasonable iteration limits.

## Verification

- [ ] Iterative scan mode configured (strict or relaxed)
- [ ] Filtered ANN recall measured against exact search
- [ ] Iteration limits set
- [ ] Query performance benchmarked with filters
