# Knowledge Unit: SQLite-vec for Local RAG

## Metadata

- **ID:** KU-027
- **Subdomain:** Retrieval-Augmented Generation (RAG)
- **Slug:** sqlite-vec-local-rag
- **Version:** 1.0.0
- **Maturity:** Experimental
- **Status:** Published

## Executive Summary

SQLite-vec is a vector search extension for SQLite enabling local RAG development without PostgreSQL or external vector databases. It's supported by `moneo/laravel-rag` as a development driver, enabling zero-infrastructure RAG on the developer's machine. Not recommended for production — limited to ~1M vectors and lacking production features.

## Core Concepts

- SQLite extension adding vector column type and similarity search
- Zero infrastructure: uses existing SQLite database (Laravel's default dev database)
- Compatible with pgvector SQL syntax for development/production parity
- Supported via `moneo/laravel-rag` driver abstraction
- Maximum practical scale: ~1M vectors
- No HNSW index — brute-force kNN only

## Mental Models

- **SQLite for AI dev**: Like using SQLite instead of MySQL in development — same code, different backend. Switch to pgvector in production without code changes.
- **Dev-only vector store**: Perfect for local development, CI tests, and prototyping. Any production workload needs pgvector or a dedicated vector DB.

## Internal Mechanics

The Laravel RAG driver abstraction provides:
- `VectorStore` interface: `store(string $id, array $embedding, array $metadata)`, `search(array $embedding, int $k)`
- SQLite-vec driver implements this using SQLite's vector extension
- Same migration/chunking/embedding code works with pgvector driver
- Driver switching via config — no code changes

SQLite-vec stores vectors as BLOBs in SQLite tables and performs brute-force cosine similarity (no index). This is O(n) per query — fine for <100K vectors, degrades beyond 1M.

## Patterns

- **Driver abstraction**: Write once against interface, switch backend via `config/rag.php`
- **Dev/prod parity**: Same ingestion, chunking, embedding, and retrieval code — only vector store driver changes
- **CI vector tests**: Use SQLite-vec in CI for vector search tests — no PostgreSQL + pgvector extension needed

## Architectural Decisions

- **Decision**: SQLite-vec for dev only → Not suitable for production. Reason: Brute-force search, no ACID guarantees for concurrent AI workloads, limited scaling.
- **Decision**: Driver-based vs. inline → `moneo/laravel-rag` driver pattern. Reason: Same code, different backend, no application changes.

## Tradeoffs

| Factor | SQLite-vec | pgvector |
|--------|------------|----------|
| Setup | Zero (built into SQLite) | PostgreSQL extension install |
| Scale | <1M vectors | 10M+ vectors with HNSW |
| Performance | Brute-force O(n) | HNSW O(log n) |
| Index types | None | IVFFlat, HNSW |
| Production features | None | ACID, replication, backup |
| Dev friendliness | Excellent | Requires Docker/tooling |

## Performance Considerations

- Brute-force search: O(n*d) — 100K vectors at 1536d ≈ 50ms per query
- At 1M vectors: ~500ms+ per query — too slow for interactive use
- No index options — cannot improve beyond brute-force
- Storage: vectors stored as BLOBs — less efficient than pgvector's native type

## Production Considerations

- Only use SQLite-vec for development and testing
- Switch to pgvector driver in production via config
- Ensure your SQLite-vec tests are representative — production pgvector behavior differs subtly
- Don't rely on SQLite-vec performance metrics for production capacity planning
- Monitor SQLite database file size — vector storage increases file size significantly

## Common Mistakes

- Using SQLite-vec in production (performance and reliability issues)
- Assuming SQLite-vec query performance scales linearly — it degrades quadratically with vector count
- Not testing with pgvector before production deployment — edge cases differ
- Mixing SQLite-vec and pgvector drivers in same codebase without proper config scoping
- Relying on SQLite for concurrent AI workloads — write contention issues

## Failure Modes

- **Query timeout**: Brute-force search on large dataset exceeds request timeout
- **Corruption**: SQLite file corruption with large vector stores — backup regularly
- **Memory pressure**: Loading large vector store into memory — SQLite loads entire file
- **Concurrency**: Multiple simultaneous write transactions — SQLite locking issues
- **Dimension mismatch**: SQLite-vec doesn't validate embedding dimensions — silent query errors

## Ecosystem Usage

- Local Laravel development with RAG features
- CI/CD pipelines testing RAG quality without PostgreSQL
- Prototyping and proof-of-concept RAG applications
- Demo applications where production deployment isn't needed
- Educational exercises for learning RAG patterns

## Related Knowledge Units

- KU-021: RAG Pipeline with SimilaritySearch
- KU-028: pgvector Native Support
- KU-035: Vector Database Selection Framework

## Research Notes

- SQLite-vec is an experimental feature of `moneo/laravel-rag`
- No official SQLite-vec extension maintained by the SQLite team — community project
- pgvector driver is the recommended production path — SQLite-vec is dev-only
- Laravel's default SQLite dev database is a natural fit for this pattern
- Switching between drivers should be transparent — test both paths
