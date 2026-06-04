# Knowledge Unit: pgvector Extension

## Metadata

- **ID:** K041
- **Subdomain:** Vector Similarity Search
- **Source:** pgvector Docs
- **Maturity:** Stable
- **Laravel Relevance:** PostgreSQL vector extension

## Executive Summary

pgvector is an open-source PostgreSQL extension that adds vector similarity search capabilities directly to PostgreSQL. It introduces a `vector` data type and supports exact nearest neighbor search (via `ORDER BY ... LIMIT`) and approximate nearest neighbor search (via HNSW or IVFFlat indexes). For Laravel applications already on PostgreSQL, pgvector is the lowest-friction path to vector search — no additional infrastructure required.

## Core Concepts

- **Vector Data Type**: `vector(n)` stores n-dimensional embeddings. Supports up to 16,000 dimensions.
- **Distance Operators**: `<=>` (cosine), `<->` (L2), `<#>` (inner product).
- **ANN Indexes**: HNSW (hierarchical graph) and IVFFlat (inverted file) for approximate nearest neighbor search.
- **ACID Compliance**: Vector operations are transactional — consistent with the rest of your PostgreSQL data.
- **No External Server**: Runs inside PostgreSQL. Data is co-located with application data.

## Internal Mechanics

pgvector registers a new data type with PostgreSQL's type system. Vector columns are stored like any other column in PostgreSQL's heap. Distance functions are implemented as C functions in the extension. ANN indexes (HNSW/IVFFlat) are built using PostgreSQL's index access method hooks. Queries with `ORDER BY embedding <=> '[1,2,3]' LIMIT 10` can use these indexes when available.

## Patterns

- **Store embeddings alongside data**: Add a `vector` column to existing tables rather than creating a separate vector store.
- **Hybrid with FTS**: Combine vector search with PostgreSQL's built-in full-text search for hybrid retrieval.
- **Eager loading**: In Laravel, access the vector column like any other attribute via raw SQL or the community `pgvector-php` package.

## Architectural Decisions

pgvector's key architectural decision is integrating vectors as a native PostgreSQL data type rather than creating a separate database. This provides ACID compliance, JOIN capabilities, and point-in-time recovery at the cost of vector-specific optimization (no GPU support, limited cross-node scaling).

## Tradeoffs

| Factor | pgvector | Dedicated Vector DB |
|---|---|---|
| Infrastructure | None (uses existing PostgreSQL) | Separate server/cluster |
| ACID compliance | Full | None (eventual consistency) |
| JOINs across vectors/data | Native | Requires application logic |
| Query performance | Good (sub-10ms for <10M vectors) | Excellent (sub-5ms at scale) |
| Scaling | Vertical (single PostgreSQL instance) | Horizontal (distributed) |
| GPU support | No | Yes (Milvus, Qdrant) |

## Performance Considerations

- Exact search (no index) is O(n) — fine for <10K vectors, impractical beyond.
- HNSW index provides sub-10ms search for millions of vectors.
- IVFFlat index builds faster but has lower recall.
- Vector columns significantly increase table storage (1536-dim vector = 6KB per row for `halfvec`).

## Production Considerations

- **Install as a PostgreSQL extension**: `CREATE EXTENSION vector;`.
- **Use `halfvec`** for 50% storage savings with negligible recall loss.
- **Build HNSW indexes** for production-scale vector search.
- **Monitor index size** — HNSW indexes can be memory-intensive.
- **Use `REINDEX INDEX CONCURRENTLY`** for zero-downtime index maintenance.
- **Consider partitioning** for very large vector tables.

## Common Mistakes

- Not creating an ANN index — exact search on large vector tables is extremely slow.
- Using `vector` without specifying dimensions — column must have explicit dimension count.
- Expecting GPU-level performance — pgvector is CPU-bound.
- Not using `halfvec` for 1536-dim embeddings — 2x storage waste.

## Failure Modes

- **OOM during index build**: HNSW index building on large datasets consumes significant memory. Raise `maintenance_work_mem`.
- **Slow exact search**: Missing ANN index causes sequential scan of all vectors.
- **Dimension mismatch**: Query vectors must match column dimension — mismatch causes an error.

## Ecosystem Usage

The most common vector search solution in the Laravel ecosystem due to zero infrastructure overhead. Used in production RAG pipelines, semantic search, and recommendation systems.

## Related Knowledge Units

- K042 (pgvector HNSW / IVFFlat)
- K043 (pgvector distance functions)
- K044 (pgvector half-precision)
- K045 (pgvector + FTS hybrid)
- K070 (Laravel + pgvector via Eloquent)

## Research Notes

Sources: pgvector GitHub, docs, community benchmarks. pgvector v0.8.0+ introduced iterative scans, fixing the "empty results with filters" problem. v0.7.0+ added parallel HNSW builds and SIMD optimizations. The extension has become the default vector store for Laravel applications on PostgreSQL.


## Mental Models

- **Extension as Plugin**: pgvector is like a plugin module for PostgreSQL that adds a new data type (vectors) and new index types (IVFFlat, HNSW). It is SQL-native.
- **Dual Engine**: A pgvector hybrid search combines a diesel engine (FTS) with an electric motor (vector search) in the same car. RRF is the transmission that combines their output.

