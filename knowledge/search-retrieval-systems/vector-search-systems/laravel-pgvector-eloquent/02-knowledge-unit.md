# Knowledge Unit: Laravel + pgvector via Eloquent

## Metadata

- **ID:** K070
- **Subdomain:** Vector Similarity Search
- **Source:** Community / pgvector-php
- **Maturity:** Emerging
- **Laravel Relevance:** PHP pgvector client libraries

## Executive Summary

Integrating pgvector with Laravel Eloquent bridges vector similarity search and the ORM. The community package `pgvector/pgvector-php` provides a PHP client for pgvector, enabling vector operations from Eloquent models. This integration allows storing embeddings alongside model data and performing vector search using familiar Eloquent patterns, though no official Scout engine exists yet.

## Core Concepts

- **pgvector-php Package**: Community library providing PHP types and query builders for pgvector.
- **Eloquent Integration**: Use raw SQL or query scopes to perform vector operations within Eloquent queries.
- **Custom Scout Engine**: Build a Scout engine that translates Scout queries to pgvector operations.
- **No Official Scout Driver**: pgvector is not a supported Scout driver — integration requires custom code.

## Internal Mechanics

The `pgvector/pgvector-php` package registers a custom Doctrine DBAL type for the `vector` column type. It provides PHP classes for querying vector distances. Integration with Eloquent requires extending models with custom scopes or using raw SQL for distance queries. A custom Scout engine would implement the Engine interface to proxy Scout search queries to pgvector.

## Patterns

- **Custom Eloquent scope**: `scopeNearestNeighbors($query, $embedding, $limit)` using raw SQL.
- **Accessor for embedding**: Cast the vector column to a PHP array via Eloquent casts.
- **Custom Scout engine**: Build an engine that queries pgvector via raw SQL for Scout compatibility.
- **Hybrid raw SQL**: Use raw SQL in Eloquent queries for vector operations, maintaining ORM benefits for relational data.

## Architectural Decisions

The Laravel ecosystem has not yet produced a first-party Scout-for-pgvector solution. The community `pgvector-php` package fills this gap but is less mature than the official Scout drivers for Meilisearch, Algolia, and Typesense.

## Tradeoffs

| Approach | Integration Level | Complexity | Community Support |
|---|---|---|---|
| Raw SQL + Eloquent | Tight (manual) | Low | Universal SQL knowledge |
| pgvector-php package | Partial (types + queries) | Medium | Growing |
| Custom Scout Engine | Full (Scout API) | High | Niche |
| Python microservice | Loose (API call) | Medium | Strong |

## Performance Considerations

- Raw SQL vector queries are as fast as the PostgreSQL + pgvector stack.
- Eloquent overhead is minimal for vector queries — the main cost is the vector distance computation.
- Custom Scout engines add minimal overhead (HTTP-free, in-database).
- Thread count in PHP-FPM may limit concurrent vector queries compared to dedicated vector DBs.

## Production Considerations

- **Use raw SQL for vector queries** — it's the most tested and predictable approach.
- **Build a re-usable trait** for nearest-neighbor queries across models.
- **Consider a custom Scout engine** if Scout compatibility is required.
- **Write tests** — the community packages are evolving and may have edge cases.
- **Monitor for breaking changes** — the integration landscape is emerging.

## Common Mistakes

- Expecting Scout compatibility out of the box — Scout does not support pgvector natively.
- Not using parameterized queries for vector values — SQL injection risk with raw embedding vectors.
- Forgetting to create HNSW indexes — vector searches will be slow without them.
- Using pgvector without considering the PHP ecosystem maturity gap.

## Failure Modes

- **Package incompatibility**: `pgvector/pgvector-php` may not support the latest pgvector version.
- **Type casting errors**: Vector data must be properly serialized/deserialized between PHP and PostgreSQL.
- **Scout engine bugs**: Custom engines may have edge cases that native Scout drivers handle automatically.

## Ecosystem Usage

Growing adoption among Laravel teams on PostgreSQL who want vector search without additional infrastructure. The community package is seeing increased usage as RAG pipelines become more common in Laravel applications.

## Related Knowledge Units

- K041 (pgvector extension)
- K042 (pgvector HNSW / IVFFlat)
- K014 (Custom engine development)

## Research Notes

Sources: pgvector-php GitHub, community blog posts. The pgvector Laravel integration is the #1 gap in the Scout ecosystem. A first-party Scout pgvector driver would significantly reduce the barrier to vector search in Laravel. The community is actively building solutions, but no standard has emerged.


## Mental Models

- **Extension as Plugin**: pgvector is like a plugin module for PostgreSQL that adds a new data type (vectors) and new index types (IVFFlat, HNSW). It is SQL-native.
- **Dual Engine**: A pgvector hybrid search combines a diesel engine (FTS) with an electric motor (vector search) in the same car. RRF is the transmission that combines their output.

