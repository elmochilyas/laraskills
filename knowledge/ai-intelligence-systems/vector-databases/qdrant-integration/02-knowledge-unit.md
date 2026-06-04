# Knowledge Unit: Qdrant Integration

## Metadata

- **ID:** KU-030
- **Subdomain:** Vector Database Integration
- **Slug:** qdrant-integration
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Qdrant is an open-source (Apache 2.0) vector database written in Rust, offering self-hosted and cloud-managed options. It provides vector search with payload filtering, HNSW indexing, and horizontal scaling. In the Laravel ecosystem, `Spirit13/qdrant-laravel` and `wontonee/laravel-qdrant-sdk` provide PHP SDK integration. Qdrant is the primary alternative to pgvector when PostgreSQL isn't available or when scale exceeds pgvector's range.

## Core Concepts

- **Collections**: Qdrant's equivalent of tables — each collection has a vector configuration (dimensions, distance metric)
- **Points**: Individual records with vector + payload (metadata) + ID
- **Payload filtering**: Filter search results by payload fields before vector distance computation
- **HNSW index**: Graph-based ANN index, similar to pgvector's HNSW
- **Self-hosted**: Docker/standalone binary — Apache 2.0 license
- **Qdrant Cloud**: Managed SaaS with free tier ($25/month for 1GB)
- **gRPC & REST APIs**: Primary communication protocols

## Mental Models

- **PostgreSQL for vectors only**: Qdrant is optimized for vector storage and search — it does vectors and only vectors. No joins, no ACID transactions, no SQL.
- **Dedicated vector infrastructure**: Like using Redis for caching — it's a separate service optimized for one job. PG for relational data, Qdrant for vectors.

## Internal Mechanics

Qdrant stores vectors in collections with configurable:
- Vector size (must match embedding model dimensions)
- Distance function (Cosine, Dot, Euclid)
- HNSW index parameters (m, ef_construction, full_scan_threshold)
- Quantization (scalar or product quantization for memory reduction)

Search flow: user query → embed → send vector to Qdrant with filter → Qdrant returns top-K points with payload and score.

PHP SDKs wrap the REST/gRPC API: `$client->collections()->create()`, `$client->points()->upsert()`, `$client->points()->search()`.

## Patterns

- **Payload-heavy search**: Store document metadata in Qdrant payload — filter by tenant, type, date before vector search
- **Write-optimized ingestion**: Batch upsert points in chunks of 100-500 — far faster than individual inserts
- **Collection per tenant**: Isolate tenant data via separate collections — no cross-tenant leakage risk
- **WAL snapshot backup**: Qdrant's WAL enables point-in-time recovery — backup configuration and storage snapshot

## Architectural Decisions

- **Decision**: Qdrant vs. pgvector → pgvector for PostgreSQL-centric apps (95% of cases). Qdrant when: no PostgreSQL, scale >50M vectors, need built-in payload filtering at search time, or self-hosted Apache 2.0 license required.
- **Decision**: Qdrant Cloud vs. self-hosted → Cloud for teams without infrastructure bandwidth. Self-hosted for data sovereignty or cost optimization at scale.

## Tradeoffs

| Factor | Qdrant | pgvector | Pinecone |
|--------|--------|----------|----------|
| Scale | 100M+ vectors | ~50M vectors | Unlimited |
| Operations | Self-hosted or cloud | Existing PostgreSQL | Fully managed |
| Latency p50 | ~6ms (1M) | ~8ms (1M, HNSW) | ~8ms (1M) |
| Filtering | Native payload filter | SQL WHERE clause | Metadata filtering |
| Cost | Free (self-hosted) | Free (existing DB) | $70+/month |
| Language | Rust-based | C extension | Proprietary |

## Performance Considerations

- Qdrant's Rust implementation gives ~6ms p50 latency for 1M vectors — slightly faster than pgvector's ~8ms
- Self-hosted Qdrant: configure RAM allocation for vector storage (all vectors should fit in RAM for best performance)
- Quantization reduces memory 2-4x with 1-3% recall loss
- Batch upsets: 100-500 points per batch for optimal throughput
- gRPC is significantly faster than REST for bulk operations

## Production Considerations

- Configure WAL and snapshot backup strategy — Qdrant writes to disk, but RAM state needs snapshotting
- Set resource limits on Docker containers — Qdrant can consume all available memory without limits
- Monitor collection size — Qdrant performance degrades if vectors exceed allocated memory
- Implement retry logic in PHP client — Qdrant can return 429 under load
- Use dedicated networking — Qdrant client-server latency directly affects search performance
- Version collection schema — changing dimensions requires new collection and data migration

## Common Mistakes

- Using Qdrant when pgvector suffices (unnecessary infrastructure complexity)
- Not batching point upserts (individual HTTP calls are 100x slower)
- Forgetting to configure HNSW index parameters (defaults may not suit your data)
- Running Qdrant without persistent storage — data lost on container restart
- Mixing dimensions (different embedding models) in same collection
- Ignoring payload index — Qdrant recommends indexing filterable payload fields

## Failure Modes

- **Out of memory**: Qdrant loads vectors into memory — if collection exceeds RAM, Qdrant crashes or swaps
- **Storage corruption**: WAL corruption without proper backup — configure snapshot-based backup
- **Network partition**: Qdrant cluster split-brain in distributed mode — use single-node for most deployments
- **Client timeout**: Slow queries timeout PHP request — tune `ef_search` and implement client-side timeout
- **Version mismatch**: PHP SDK out of sync with Qdrant server version — pin both

## Ecosystem Usage

- `Spirit13/qdrant-laravel`: Laravel-specific SDK with config, facade, and Artisan commands
- `wontonee/laravel-qdrant-sdk`: Alternative package with collection management and CRUD operations
- Qdrant is commonly used when the existing stack uses MongoDB (no pgvector) or when vector scale exceeds 50M
- The package ecosystem is less mature than pgvector — expect more raw API usage

## Related Knowledge Units

- KU-028: pgvector Native Support
- KU-031: Pinecone Integration
- KU-035: Vector Database Selection Framework

## Research Notes

- Qdrant is Apache 2.0 licensed — no licensing cost for self-hosted deployments
- `Spirit13/qdrant-laravel`: 68+ stars, actively maintained (Apr 2026)
- `wontonee/laravel-qdrant-sdk`: 42+ stars, slower development cadence
- Qdrant's payload filtering is a key differentiator — enable vector + metadata search in a single call
- Self-hosted Qdrant requires careful resource planning — memory is the primary constraint
