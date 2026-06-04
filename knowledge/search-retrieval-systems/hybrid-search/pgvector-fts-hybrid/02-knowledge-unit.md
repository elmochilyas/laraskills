# Knowledge Unit: pgvector + PostgreSQL FTS Hybrid Search

## Metadata

- **ID:** K045
- **Subdomain:** Hybrid Search
- **Source:** pgvector Docs / Community
- **Maturity:** Stable
- **Laravel Relevance:** RRF or cross-encoder fusion

## Executive Summary

Combining pgvector (vector similarity) with PostgreSQL's built-in full-text search (tsvector/tsquery) enables hybrid search within a single database. Keyword results from FTS and semantic results from vector search can be fused using Reciprocal Rank Fusion (RRF), weighted summation, or cross-encoder re-ranking. This approach eliminates the need for a separate search infrastructure while providing both exact keyword matching and semantic understanding.

## Core Concepts

- **Single Database**: Both vector and FTS indexes live in the same PostgreSQL database.
- **Dual Querying**: Run `ts_query` and vector `<=>` queries, then fuse results.
- **RRF Fusion**: `score = 1 / (k + rank)` for each result set, sum scores across sets.
- **Weighted Fusion**: `score = w1 * normalized_fts_score + w2 * cosine_similarity`.
- **Cross-Encoder**: Top candidates from both paths are re-ranked by a second-pass model.

## Internal Mechanics

The hybrid pipeline executes two queries: a full-text search query using `to_tsvector() @@ plainto_tsquery()` with `ts_rank()` ordering, and a vector search using `ORDER BY embedding <=> query_embedding LIMIT N`. Results are fetched separately, then fused in application code or a database function. RRF combines rank positions; weighted fusion combines normalized scores.

## Patterns

- **Application-level fusion**: PHP code runs both queries and fuses results.
- **SQL-level fusion**: Write a stored procedure that returns fused results.
- **Scout-level fusion**: Custom Scout engine that queries both paths and combines results.
- **Chunk-then-fuse**: Retrieve top-100 from each path, fuse to top-20.

## Architectural Decisions

Using PostgreSQL for both FTS and vector search means no additional infrastructure. The tradeoff is that both compete for the same database resources, and the fusion logic must be implemented by the application.

## Tradeoffs

- Infrastructure simplicity vs resource contention (both queries tax the same database).
- Application-level fusion gives full control over the fusion algorithm.
- RRF is simpler and training-free; cross-encoders are more accurate but add latency and require ML infrastructure.
- No built-in fusion in PostgreSQL — must be implemented externally.

## Performance Considerations

- Run both queries in parallel (separate connections or async) to minimize wall-clock time.
- Limit candidate pool: top-100 from each path, not top-1000.
- Cross-encoder re-ranking adds 50-200ms for top-20 candidates.
- HNSW index for vector search + GIN index for FTS — both indexes consume memory and storage.

## Production Considerations

- **Create both GIN (FTS) and HNSW (vector) indexes**.
- **Use `SET LOCAL hnsw.ef_search`** to tune vector recall per query type.
- **Monitor database load** — hybrid queries double the search query load.
- **Consider read replicas** — run FTS on primary, vector search on replica.

## Common Mistakes

- Running both queries sequentially instead of parallel — doubles latency.
- Using the same top-K for both paths — FTS typically needs higher candidate count than vector search.
- Not normalizing FTS scores before combining with vector similarity (scales differ).

## Failure Modes

- **Imbalanced results**: One path dominates the fused output if weights are not calibrated.
- **Resource contention**: Both queries compete for shared_buffers and CPU.
- **Migration complexity**: Switching to a dedicated search engine requires rebuilding the fusion layer.

## Ecosystem Usage

Growing adoption among Laravel teams already on PostgreSQL who want hybrid search without infrastructure overhead. Common in RAG pipelines where pgvector is the vector store and FTS handles exact keyword matching for code, product codes, or proper nouns.

## Related Knowledge Units

- K041 (pgvector extension)
- K042 (pgvector HNSW / IVFFlat)
- K045 (pgvector + FTS hybrid)
- K061 (RRF - Reciprocal Rank Fusion)
- K062 (Cross-encoder re-ranking)

## Research Notes

Sources: pgvector docs, PostgreSQL FTS docs, community production patterns. This is an emerging pattern in the Laravel ecosystem — no first-party Scout driver exists yet for hybrid search with pgvector. The community `pgvector-php` package provides basic vector operations.


## Mental Models

- **Extension as Plugin**: pgvector is like a plugin module for PostgreSQL that adds a new data type (vectors) and new index types (IVFFlat, HNSW). It is SQL-native.
- **Dual Engine**: A pgvector hybrid search combines a diesel engine (FTS) with an electric motor (vector search) in the same car. RRF is the transmission that combines their output.

