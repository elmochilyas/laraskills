# Knowledge Unit: Meilisearch Driver Setup

## Metadata

- **ID:** K023
- **Subdomain:** Dedicated Search Appliances
- **Source:** Meilisearch Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Open-source search server

## Executive Summary

Meilisearch is an open-source, Rust-based search engine that provides instant search-as-you-type, typo tolerance, faceted search, and relevance ranking out of the box. Its Scout driver requires a running Meilisearch instance (self-hosted or cloud) and the `meilisearch/meilisearch-php` package. Known for its zero-configuration setup — index documents and search immediately with good default relevance.

## Core Concepts

- **Self-Hosted or Cloud**: Available as open-source (MIT license) or managed cloud.
- **Schema-Free Indexing**: No schema declaration needed — Meilisearch infers field types automatically.
- **Instant Search**: Search-as-you-type works out of the box with no configuration.
- **Disk-Based Storage**: Uses LMDB for memory-mapped storage. Dataset doesn't need to fit in RAM.

## Internal Mechanics

Scout's Meilisearch engine uses the official PHP SDK to interact with Meilisearch's HTTP API. Index settings (filterableAttributes, sortableAttributes, ranking rules) are configured in `config/scout.php` under the `meilisearch` section and synchronized via `scout:sync-index-settings`. The engine automatically creates indexes on first document insertion.

## Patterns

- **Simplest dedicated engine setup**: Single binary, no schema, search immediately.
- **Content sites and blogs**: Excellent default relevance for text-heavy content.
- **Small to medium e-commerce**: Good search out of the box, faceting for product filtering.
- **Single-node deployments**: Meilisearch's single-node architecture is simple to operate.

## Architectural Decisions

Meilisearch chose schema-free indexing and disk-based storage (LMDB) over schema-enforced RAM-based storage (Typesense's approach). This makes setup easier and allows datasets larger than available RAM but sacrifices some query performance granularity.

## Tradeoffs

- Schema-free: Quick to start, but less control over field types and indexing behavior.
- Disk-based (LMDB): Handles larger datasets than Typesense's RAM-constrained approach.
- Single-node primary: High availability clustering is enterprise-only.
- No field weighting: Uses custom ranking rules instead, which are less intuitive.

## Performance Considerations

- Sub-50ms query latency on typical SaaS datasets (<10M documents).
- LMDB storage allows datasets larger than RAM, but performance degrades when index exceeds available memory.
- Embedding indexing is now 7x faster (v1.38, March 2026).
- 10-term limit per search query — complex queries with many terms may be truncated.

## Production Considerations

- **Self-host with Docker**: `docker run -it -p 7700:7700 getmeili/meilisearch`.
- **Enable authentication**: Production requires a master key for security.
- **Configure snapshotting**: LMDB snapshots for backup and recovery.
- **Declare filterable/sortable attributes** before use (via settings or `scout:sync-index-settings`).
- **Monitor index size** — Meilisearch performs best under 2TiB index size.

## Common Mistakes

- Running without authentication in production — anyone can access the search API.
- Not declaring filterable attributes — `where()` calls fail silently.
- Expecting high availability clustering in the free version (enterprise-only).
- Not understanding the SSPL license implications for commercial use.

## Failure Modes

- **Index corruption**: LMDB corruption from improper shutdown. Configure snapshots.
- **Memory pressure**: Large indexes approaching available RAM cause performance degradation.
- **Accidental public access**: Unauthenticated Meilisearch instances expose all indexed data.

## Ecosystem Usage

The most popular self-hosted search engine in the Laravel ecosystem. Dominates content sites and smaller applications.

## Related Knowledge Units

- K024 (Meilisearch filterable/sortable)
- K025 (Meilisearch typo tolerance)
- K027 (Meilisearch faceted search)
- K028 (Meilisearch hybrid search)
- K030 (Meilisearch ranking rules)

## Research Notes

Sources: Meilisearch docs, Laravel Scout docs, community benchmarks. Meilisearch v1.38 (March 2026) brought significant embedding performance improvements. The license is MIT (core), with commercial features behind the Enterprise tier.


## Mental Models

- **Card Catalog**: Meilisearch is like an automated card catalog that updates instantly as new books arrive. Every field is indexed and searchable by default.
- **Ranking Dashboard**: Search ranking rules are like dials on a dashboard — you adjust proximity, typo tolerance, attribute weights, and recency to tune relevance.

