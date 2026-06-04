| Metadata | |
|---|---|
| KU ID | K045 |
| Subdomain | hybrid-search |
| Topic | pgvector + PostgreSQL FTS Hybrid Search |
| Source | pgvector Docs |
| Maturity | Stable |

## Overview

pgvector enables hybrid search by combining PostgreSQL full-text search (FTS) with vector similarity search in a single query. The keyword path uses PostgreSQL's `tsvector`/`tsquery` for BM25-like ranking. The vector path uses pgvector's distance operators for semantic similarity. Results are fused using Reciprocal Rank Fusion (RRF) implemented in SQL or at the application level. This is the most common hybrid search approach in the Laravel ecosystem because it requires no additional infrastructure beyond PostgreSQL.

## Core Concepts

- **PostgreSQL FTS Path**: `tsvector` columns with GIN indexes, ranked by `ts_rank` or `ts_rank_cd`.
- **pgvector Path**: Standard vector similarity using distance operators (`<=>`, `<->`).
- **Fusion Point**: Can be done in SQL (single query with RRF) or in PHP (application-level).
- **RRF in SQL**: Use window functions and rank calculations to fuse results in a single query.
- **RRF in PHP**: Query both paths separately, fuse results in application memory.

## When To Use

- PostgreSQL-based Laravel applications needing hybrid search
- Applications already using pgvector that want to add keyword search
- Teams that prefer minimizing infrastructure (no separate search engines)
- Laravel + PostgreSQL stacks (the majority of deployments)

## When NOT To Use

- Non-PostgreSQL databases (requires both pgvector and PostgreSQL FTS)
- Very high query volume (hybrid query is more expensive than single-path)
- When a dedicated search engine's features are needed (typo tolerance, faceting, analytics)
- Very large datasets where dedicated hybrid engines (Qdrant, Typesense) are more efficient

## Best Practices

1. **Create necessary indexes**: GIN index on `tsvector` column + HNSW on vector column.
2. **Use RRF for fusion**: Implement RRF in SQL for single-query hybrid search.
3. **Limit candidate pools**: Retrieve top-100 from each path, fuse to top-20.
4. **Parallelize queries**: If fusing in PHP, query both paths concurrently.
5. **Benchmark individual paths**: Know each path's recall before optimizing fusion.

## Architecture Guidelines

- Add `tsvector` column with generated-always expression for FTS.
- Add `vector` column for embeddings.
- Create RRF SQL function or use application-level fusion.
- For application-level fusion: use Laravel's HTTP client pools for parallel queries.

## Performance Considerations

- Hybrid query is more expensive than either path alone — expected.
- RRF fusion in SQL adds minimal overhead (<1ms).
- GIN and HNSW indexes must be maintained (write overhead).
- Read replicas can offload hybrid search from primary database.

## Examples

```sql
-- SQL-level RRF hybrid search
WITH keyword_results AS (
    SELECT id, ts_rank(fts_vector, query) AS score,
           row_number() OVER (ORDER BY ts_rank(fts_vector, query) DESC) AS rank
    FROM documents, plainto_tsquery('english', 'search query') AS query
    WHERE fts_vector @@ query
    LIMIT 100
),
vector_results AS (
    SELECT id, 1 - (embedding <=> '[0.1, 0.2, ...]') AS score,
           row_number() OVER (ORDER BY embedding <=> '[0.1, 0.2, ...]') AS rank
    FROM documents
    LIMIT 100
)
SELECT id, SUM(1.0 / (60.0 + rank)) AS rrf_score
FROM (
    SELECT id, rank FROM keyword_results
    UNION ALL
    SELECT id, rank FROM vector_results
) combined
GROUP BY id
ORDER BY rrf_score DESC
LIMIT 20;
```

## Related Topics

- K041 (pgvector extension)
- K042 (pgvector HNSW / IVFFlat indexing)
- K061 (RRF - Reciprocal Rank Fusion)
- K028 (Meilisearch hybrid search)
- K049 (Qdrant hybrid queries)

## AI Agent Notes

- pgvector + PostgreSQL FTS is the lowest-infrastructure hybrid search for Laravel.
- Implement RRF in SQL for simplicity or in PHP for flexibility.
- For agents: use SQL-level RRF for simplest setup; create both GIN and HNSW indexes; benchmark individual paths.

## Verification

- [ ] tsvector column with GIN index created
- [ ] vector column with HNSW index created
- [ ] RRF fusion implemented (SQL or PHP)
- [ ] Individual path recall benchmarked
- [ ] Hybrid recall improvement measured over single-path
- [ ] Candidate pool size tuned
