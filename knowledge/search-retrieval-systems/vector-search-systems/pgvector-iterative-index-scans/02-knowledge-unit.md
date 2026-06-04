# Knowledge Unit: pgvector Iterative Index Scans

## Metadata

- **ID:** K046
- **Subdomain:** Vector Similarity Search
- **Source:** pgvector Docs
- **Maturity:** Stable
- **Laravel Relevance:** Filtered ANN with relaxed/strict ordering

## Executive Summary

pgvector 0.8.0 introduced iterative index scans, solving the long-standing problem of empty result sets when combining vector search with WHERE filters. Pre-0.8, HNSW would return `ef_search` candidates and apply filters afterward — if few candidates matched the filter, results could be empty. Iterative scans expand the candidate pool until the filter is satisfied or a budget is exhausted.

## Core Concepts

- **Pre-0.8 Problem**: HNSW returns exactly `ef_search` candidates. If the WHERE clause matches < 5% of data, most candidates are filtered out, often leaving zero results.
- **Iterative Mode**: The index keeps fetching additional candidates beyond `ef_search` until `max_scan_tuples` is reached or the request is satisfied.
- **Three Modes**: `off` (original behavior), `strict_order` (exact distance ordering retained), `relaxed_order` (approximate ordering, faster).
- **Budget Parameter**: `hnsw.max_scan_tuples` (default 20000) caps the maximum candidates examined.

## Internal Mechanics

When iterative scan is enabled, pgvector's HNSW index continues traversing the graph beyond the initial `ef_search` candidates. It keeps fetching the next-nearest neighbors and checking the WHERE condition. In `strict_order` mode, it maintains exact distance ordering. In `relaxed_order`, it allows slight reordering for speed. The scan stops when either the required number of results is found or `max_scan_tuples` is exhausted.

## Patterns

- **Enable `relaxed_order` as default**: Provides the best balance of correctness and performance for filtered vector queries.
- **Use `strict_order`** when ranking precision under filters is critical (e.g., "find nearest 10 items in category X, preserving exact distance order").
- **Keep `max_scan_tuples` at 20000**: Sufficient for most workloads; increase if very selective filters miss results.
- **Add B-tree indexes on filter columns**: Helps the planner choose better strategies.

## Architectural Decisions

Iterative scans were the most requested feature for pgvector before 0.8.0. The pre-0.8 behavior was correct for unfiltered search but broken for filtered search. The three-mode design maintains backward compatibility while fixing the core issue.

## Tradeoffs

| Mode | Correctness | Performance | Use Case |
|---|---|---|---|
| `off` | Low (empty results with filters) | Fastest | Unfiltered search only |
| `strict_order` | Exact distance ordering | Slowest | Precision-critical filtered search |
| `relaxed_order` | Good (few position swaps) | Fast | Default for filtered RAG queries |

## Performance Considerations

- Iterative scans increase query latency when filters are selective (more candidates examined).
- `max_scan_tuples` acts as a safety valve — worst-case latency is bounded.
- `relaxed_order` is typically 2-5x faster than `strict_order` for filtered queries.
- Adding a B-tree index on the filter column can help the planner avoid iterative scans entirely.

## Production Considerations

- **Always enable iterative scans** if your application uses vector search with WHERE clauses.
- **Use `SET LOCAL hnsw.iterative_scan = 'relaxed_order'`** in transactions — don't set globally.
- **Test with selective filters** to ensure acceptable latency.
- **Monitor `max_scan_tuples`** — if you frequently exhaust the budget, raise it or add a B-tree index.

## Common Mistakes

- Not enabling iterative scans and wondering why filtered vector queries return empty results.
- Using `strict_order` everywhere when `relaxed_order` is sufficient.
- Not setting `max_scan_tuples` high enough for very selective filters.
- Expecting iterative scans to fix poorly written queries (non-sargable filters).

## Failure Modes

- **Budget exhausted**: `max_scan_tuples` reached without finding enough matching results. Returns what it found.
- **Performance regression**: Iterative scans with very selective filters may examine 20K candidates per query.
- **Planner interference**: PostgreSQL planner may choose a different plan (seq scan) if it estimates poor selectivity.

## Ecosystem Usage

Required feature for any production pgvector deployment that uses filtered vector search. Enables use cases like "find similar products in the same category" or "semantic search within a date range."

## Related Knowledge Units

- K041 (pgvector extension)
- K042 (pgvector HNSW / IVFFlat)

## Research Notes

Source: pgvector docs, pgvector v0.8.0 release notes. Iterative scans were the most significant feature in pgvector 0.8.0, fixing the "empty results with WHERE" bug that had been a top complaint since HNSW was introduced.


## Mental Models

- **Extension as Plugin**: pgvector is like a plugin module for PostgreSQL that adds a new data type (vectors) and new index types (IVFFlat, HNSW). It is SQL-native.
- **Dual Engine**: A pgvector hybrid search combines a diesel engine (FTS) with an electric motor (vector search) in the same car. RRF is the transmission that combines their output.

