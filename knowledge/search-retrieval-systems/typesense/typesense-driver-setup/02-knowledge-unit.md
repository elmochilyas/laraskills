# Knowledge Unit: Typesense Driver Setup

## Metadata

- **ID:** K033
- **Subdomain:** Dedicated Search Appliances
- **Source:** Typesense Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Open-source, high-performance

## Executive Summary

Typesense is an open-source, C++-based search engine with a RAM-first architecture, offering sub-50ms query latency, built-in vector search, and high-availability clustering via Raft consensus. Its Scout driver requires a running Typesense instance and the `typesense/typesense-php` package. Typesense requires explicit collection schemas but offers fine-grained control over search behavior.

## Core Concepts

- **RAM-First**: Entire index must fit in RAM for optimal performance. This is the primary scaling constraint.
- **Schema-Enforced**: Collections require explicit field type definitions before indexing.
- **Raft Clustering**: Built-in multi-node HA with automatic failover (3+ nodes).
- **High Performance**: Written in C++ — the fastest raw query speed among open-source options.

## Internal Mechanics

Scout's Typesense engine uses the official PHP SDK. Collection schemas are defined in `config/scout.php` under `model-settings`. The `scout:sync-index-settings` command creates or updates collections via the Typesense API. Schema changes require creating a new collection and performing an alias swap, as Typesense does not support in-place schema evolution.

## Patterns

- **High-traffic e-commerce**: Best-in-class performance for demanding workloads.
- **HA-required applications**: Built-in Raft clustering for production resilience.
- **Predictable pricing**: Resource-based pricing (Typesense Cloud) vs Algolia's per-query model.
- **Field-level relevance**: Granular control over per-field weighting and ranking.

## Architectural Decisions

Typesense chose RAM-first storage for maximum query performance, C++ for raw speed, and schema enforcement for type safety. These decisions favor production reliability over developer convenience.

## Tradeoffs

| Factor | Typesense | Meilisearch |
|---|---|---|
| Storage | RAM (index must fit) | Disk (LMDB, can exceed RAM) |
| Schema | Required, defined upfront | Free, inferred |
| HA Clustering | Built-in (Raft) | Enterprise sharding |
| Performance | Fastest raw query speed | Excellent, slightly behind |
| Language | C++ | Rust |
| License | GPLv3 | MIT |

## Performance Considerations

- Query latency: sub-10ms for indexes that fit in RAM.
- Dataset must fit in RAM — this is the hard scaling limit.
- 2x the index size in RAM recommended for headroom.
- Multi-node clustering distributes read load but each node must hold the full index.

## Production Considerations

- **Ensure dataset fits in RAM** — this is non-negotiable for performance.
- **Use alias swap** for schema migrations — plan this in deployment scripts.
- **Configure enough nodes for Raft consensus** (minimum 3 for HA).
- **Declare all fields in `toSearchableArray()`** in the collection schema.
- **Monitor RAM usage** — set alerts at 75% of available RAM.

## Common Mistakes

- Running out of RAM because index exceeds memory — Typesense crashes with OOM.
- Not planning schema migrations — field additions require collection recreation.
- Missing field declarations in schema — types not indexed silently.
- Forgetting to cast `id` to string — required by Typesense.

## Failure Modes

- **OOM crash**: Dataset exceeds available RAM. Instance becomes unavailable.
- **Schema mismatch**: Indexing fails with field type errors. Requires collection re-creation.
- **Raft leader election**: Brief unavailability during leader re-election (typically <5s).
- **Stale alias**: After schema migration, queries may hit old collection if alias swap is misconfigured.

## Ecosystem Usage

Adopted by performance-sensitive production applications, especially in e-commerce and real-time search contexts. Preferred over Meilisearch when HA clustering is required.

## Related Knowledge Units

- K034 (Typesense collection schemas)
- K035 (Typesense dynamic search parameters)
- K036 (Typesense vector search)
- K037 (Typesense geo-search)
- K038 (Typesense faceting)
- K039 (Typesense synonym management)
- K040 (Typesense typo tolerance)

## Research Notes

Sources: Typesense docs, Laravel Scout Typesense documentation. Typesense grew significantly in 2024-2026 as an Algolia alternative. Its HA clustering and field-level relevance control are key differentiators. The Typesense Cloud pricing model ($14+/month) is resource-based, making it more predictable than Algolia's per-query model.


## Mental Models

- **Lightning Rod**: Typesense is designed for sub-50ms responses. Every architectural decision prioritizes speed, like a lightning rod channeling energy with minimal resistance.
- **Schema-on-Write**: Unlike schema-on-read databases, Typesense enforces structure at write time, like pre-sorting mail before delivery rather than sorting at the mailbox.

