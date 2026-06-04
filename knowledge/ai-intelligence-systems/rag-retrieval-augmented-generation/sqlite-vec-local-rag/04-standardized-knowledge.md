---
id: KU-027
title: "SQLite-vec for Local RAG"
subdomain: "rag-retrieval-augmented-generation"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/04-rag-retrieval-augmented-generation/sqlite-vec-local-rag/04-standardized-knowledge.md"
---

# SQLite-vec for Local RAG

## Overview

SQLite-vec is a vector search extension for SQLite enabling local RAG development without PostgreSQL or external vector databases. It's supported by `moneo/laravel-rag` as a development driver, enabling zero-infrastructure RAG on the developer's machine. Not recommended for production â€” limited to ~1M vectors and lacking production features.

## Core Concepts

- SQLite extension adding vector column type and similarity search
- Zero infrastructure: uses existing SQLite database (Laravel's default dev database)
- Compatible with pgvector SQL syntax for development/production parity
- Supported via `moneo/laravel-rag` driver abstraction
- Maximum practical scale: ~1M vectors
- No HNSW index â€” brute-force kNN only

## When To Use

- Production applications requiring SQLite-vec for Local RAG functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Driver abstraction**: Write once against interface, switch backend via `config/rag.php`
- **Dev/prod parity**: Same ingestion, chunking, embedding, and retrieval code â€” only vector store driver changes
- **CI vector tests**: Use SQLite-vec in CI for vector search tests â€” no PostgreSQL + pgvector extension needed

- **SQLite for AI dev**: Like using SQLite instead of MySQL in development â€” same code, different backend. Switch to pgvector in production without code changes.
- **Dev-only vector store**: Perfect for local development, CI tests, and prototyping. Any production workload needs pgvector or a dedicated vector DB.

## Architecture Guidelines

- **Decision**: SQLite-vec for dev only â†’ Not suitable for production. Reason: Brute-force search, no ACID guarantees for concurrent AI workloads, limited scaling.
- **Decision**: Driver-based vs. inline â†’ `moneo/laravel-rag` driver pattern. Reason: Same code, different backend, no application changes.

## Performance Considerations

- Brute-force search: O(n*d) â€” 100K vectors at 1536d â‰ˆ 50ms per query
- At 1M vectors: ~500ms+ per query â€” too slow for interactive use
- No index options â€” cannot improve beyond brute-force
- Storage: vectors stored as BLOBs â€” less efficient than pgvector's native type

| Factor | SQLite-vec | pgvector |
|--------|------------|----------|
| Setup | Zero (built into SQLite) | PostgreSQL extension install |
| Scale | <1M vectors | 10M+ vectors with HNSW |
| Performance | Brute-force O(n) | HNSW O(log n) |
| Index types | None | IVFFlat, HNSW |
| Production features | None | ACID, replication, backup |
| Dev friendliness | Excellent | Requires Docker/tooling |

## Security Considerations

- Only use SQLite-vec for development and testing
- Switch to pgvector driver in production via config
- Ensure your SQLite-vec tests are representative â€” production pgvector behavior differs subtly
- Don't rely on SQLite-vec performance metrics for production capacity planning
- Monitor SQLite database file size â€” vector storage increases file size significantly

## Common Mistakes

- Using SQLite-vec in production (performance and reliability issues)
- Assuming SQLite-vec query performance scales linearly â€” it degrades quadratically with vector count
- Not testing with pgvector before production deployment â€” edge cases differ
- Mixing SQLite-vec and pgvector drivers in same codebase without proper config scoping
- Relying on SQLite for concurrent AI workloads â€” write contention issues

## Anti-Patterns

- **Query timeout**: Brute-force search on large dataset exceeds request timeout
- **Corruption**: SQLite file corruption with large vector stores â€” backup regularly
- **Memory pressure**: Loading large vector store into memory â€” SQLite loads entire file
- **Concurrency**: Multiple simultaneous write transactions â€” SQLite locking issues
- **Dimension mismatch**: SQLite-vec doesn't validate embedding dimensions â€” silent query errors

## Examples

The following ecosystem packages provide reference implementations:

- Local Laravel development with RAG features
- CI/CD pipelines testing RAG quality without PostgreSQL
- Prototyping and proof-of-concept RAG applications
- Demo applications where production deployment isn't needed
- Educational exercises for learning RAG patterns

## Related Topics

- KU-021: RAG Pipeline with SimilaritySearch
- KU-028: pgvector Native Support
- KU-035: Vector Database Selection Framework

## AI Agent Notes

- When asked about SQLite-vec for Local RAG, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

