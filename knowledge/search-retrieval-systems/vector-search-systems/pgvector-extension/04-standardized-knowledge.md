| Metadata | |
|---|---|
| KU ID | K041 |
| Subdomain | vector-similarity-search |
| Topic | pgvector Extension |
| Source | pgvector Docs |
| Maturity | Stable |

## Overview

pgvector is a PostgreSQL extension that adds vector similarity search capabilities directly within the database. It supports exact and approximate nearest neighbor search, multiple distance functions (L2, cosine, inner product), and both HNSW and IVFFlat indexing. For Laravel applications already using PostgreSQL, pgvector is the lowest-friction vector search addition — no separate infrastructure, ACID compliance, and JOIN capability across vectors and relational data.

## Core Concepts

- **In-Database Vectors**: Vectors stored as regular PostgreSQL columns in existing tables.
- **ANN Indexes**: HNSW and IVFFlat indexes for approximate nearest neighbor search.
- **Distance Operators**: `<->` (L2), `<=>` (cosine), `<#>` (inner product).
- **No Separate Infrastructure**: Runs within PostgreSQL — no additional servers or services.
- **ACID Compliance**: Vector operations participate in PostgreSQL transactions.

## When To Use

- PostgreSQL-based Laravel applications adding vector search
- Applications needing ACID compliance for vector operations
- Hybrid search combining traditional SQL with vector queries
- Teams that prefer minimizing infrastructure (one database for everything)
- Laravel + PostgreSQL stacks (the majority of Laravel deployments)

## When NOT To Use

- Non-PostgreSQL databases (MySQL, SQLite, SQL Server)
- Applications needing distributed vector search at massive scale
- When a dedicated vector DB's specific features are required (Qdrant's hybrid search, Pinecone's serverless)
- Very large datasets (>100M vectors) where standalone vector DBs perform better

## Best Practices

1. **Install via extension**: `CREATE EXTENSION vector;` — available on all major PostgreSQL platforms.
2. **Default to HNSW indexes**: Better query performance than IVFFlat for most workloads.
3. **Use cosine distance**: Most common distance metric, matches OpenAI and most embedding models.
4. **Tune index parameters**: `m`, `ef_construction` for HNSW; `lists` for IVFFlat.
5. **Monitor index build**: Large vector indexes may take significant time to build.

## Architecture Guidelines

- Add extension in migration: `DB::statement('CREATE EXTENSION IF NOT EXISTS vector');`.
- Store vectors as `vector(n)` columns where n matches embedding dimension.
- Create indexes via raw SQL migration: `CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops);`.
- Query vectors with distance operators in raw SQL or using scope methods on the model.

## Performance Considerations

- ANN search with HNSW: sub-10ms for millions of vectors.
- Index build time: HNSW is O(N log N), IVFFlat is O(N).
- Vector operations share PostgreSQL's memory and CPU resources.
- Read replicas can offload vector search traffic from primary.

## Examples

```php
// Migration
Schema::table('documents', function (Blueprint $table) {
    $table->vector('embedding', 1536); // 1536-dimensional vector
});

// Raw search query
$results = DB::select(
    'SELECT id, content, embedding <=> ? AS distance
     FROM documents
     ORDER BY embedding <=> ?
     LIMIT 10',
    [$queryEmbedding, $queryEmbedding]
);
```

## Related Topics

- K042 (pgvector HNSW / IVFFlat indexing)
- K043 (pgvector distance functions)
- K045 (pgvector + PostgreSQL FTS hybrid)
- K070 (Laravel + pgvector via Eloquent)

## AI Agent Notes

- pgvector is the lowest-friction vector search for Laravel apps on PostgreSQL.
- No separate infrastructure, ACID compliance, and JOIN capability with existing data.
- For agents: install via migration, use HNSW indexes, benchmark with real data.

## Verification

- [ ] CREATE EXTENSION vector executed
- [ ] Vector column added to table with correct dimension
- [ ] ANN index created (HNSW or IVFFlat)
- [ ] Distance operator queries return correct results
- [ ] Index parameters tuned for dataset
