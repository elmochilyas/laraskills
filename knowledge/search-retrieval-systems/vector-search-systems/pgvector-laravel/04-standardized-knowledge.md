| Metadata | |
|---|---|
| KU ID | ku-02 |
| Subdomain | vector-similarity-search |
| Topic | pgvector with Laravel |
| Source | pgvector docs / Community |
| Maturity | Emerging |

## Overview

pgvector is a PostgreSQL extension adding vector data type and similarity search operators (<->, <=>, <#>). In Laravel, integration is via raw SQL or the community pgvector/pgvector-php package. No first-party Scout driver exists — requires custom implementation.

## Core Concepts

- **PostgreSQL Extension**: CREATE EXTENSION vector;
- **Vector Column**: ALTER TABLE items ADD COLUMN embedding vector(1536);
- **Distance Operators**: <-> (L2), <=> (cosine), <#> (inner product)
- **ANN Indexes**: HNSW and IVFFlat for approximate search
- **Laravel Integration**: Raw DB queries or pgvector-php package

## When To Use

- Already using PostgreSQL
- Want vector search without separate infrastructure
- Need JOINs between vectors and relational data
- ACID compliance for vector data

## When NOT To Use

- Not using PostgreSQL
- Need dedicated vector database performance at scale
- Want managed vector infrastructure (use Pinecone/Qdrant Cloud)

## Best Practices

1. **Enable extension via migration**: Ensure ector extension is created.
2. **Use raw SQL for queries**: Scout doesn't support vector queries natively.
3. **Add ANN index for production**: HNSW for query performance, IVFFlat for build speed.
4. **Use SET LOCAL hnsw.ef_search**: Tune recall per query.
5. **Consider Eloquent + raw SQL**: Mix Scout for keyword, raw SQL for vector.

## Related Topics

- K041 (pgvector extension)
- K042 (HNSW / IVFFlat)
- K043 (Distance functions)

## AI Agent Notes

- pgvector is the lowest-friction vector search for Laravel (co-located with data)
- No native Scout driver yet — requires custom implementation
- For agents: recommend for Laravel + PostgreSQL stacks

## Verification

- [ ] pgvector extension enabled
- [ ] Vector column added to table
- [ ] Distance queries working
- [ ] ANN index created
- [ ] PHP integration working (raw SQL or package)
- [ ] Hybrid with FTS tested
