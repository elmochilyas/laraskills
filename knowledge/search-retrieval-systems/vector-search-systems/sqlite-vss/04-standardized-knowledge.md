| Metadata | |
|---|---|
| KU ID | ku-06 |
| Subdomain | vector-similarity-search |
| Topic | SQLite VSS |
| Source | SQLite VSS docs |
| Maturity | New |

## Overview

SQLite VSS (Vector Similarity Search) is a SQLite extension for vector similarity search, similar to pgvector for PostgreSQL. Enables ANN search in SQLite databases using virtual tables. Useful for embedded, mobile, and testing scenarios where PostgreSQL is not available.

## Core Concepts

- **VSS Extension**: SQLite extension adding vector search capabilities
- **Virtual Tables**: CREATE VIRTUAL TABLE vss_items USING vss0(embedding(1536))
- **Distance Metrics**: Cosine, Euclidean, dot product
- **ANN Support**: Approximate nearest neighbor search via VSS indexes
- **Embedded Use**: No separate server — vectors stored in same SQLite DB

## When To Use

- SQLite-based Laravel applications
- Testing vector search functionality
- Embedded/IoT applications
- Offline-first applications

## When NOT To Use

- Production Laravel on MySQL/PostgreSQL (use pgvector)
- Large-scale vector search (SQLite is single-writer, limited scale)
- Multi-user write-heavy workloads

## Best Practices

1. **Use for testing and development**: Replicate pgvector-like queries locally.
2. **Match schema to production**: Use same vector dimensions as production.
3. **Use VSS virtual tables**: For ANN search performance.
4. **Limit to development**: SQLite VSS is not production-suitable for most Laravel apps.

## Related Topics

- K041 (pgvector extension)
- K001 (Vector embeddings concept)

## AI Agent Notes

- SQLite VSS is primarily for dev/testing environments
- Not suitable for production Laravel apps using MySQL/PostgreSQL
- For agents: use for development vector search testing

## Verification

- [ ] VSS extension installed
- [ ] Virtual table created with correct dimensions
- [ ] ANN search queries working
- [ ] Vectors match production dimensionality
- [ ] Testing vector search logic with SQLite VSS
