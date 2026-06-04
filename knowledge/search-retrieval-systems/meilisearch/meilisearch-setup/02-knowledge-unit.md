# Knowledge Unit: Meilisearch Setup

## Metadata

- **ID:** ku-00
- **Subdomain:** 03-meilisearch
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Meilisearch Setup

## Executive Summary

Meilisearch is an open-source, Rust-based search engine that provides instant search-as-you-type, typo tolerance, faceted search, and relevance ranking out of the box. Its Scout driver requires a running Meilisearch instance (self-hosted or cloud) and the meilisearch/meilisearch-php package. Known for zero-configuration setup — index documents and search immediately with good default relevance.

## Core Concepts

- **Self-Hosted or Cloud**: Available as open-source (MIT) or managed cloud.
- **Schema-Free Indexing**: No schema declaration needed — Meilisearch infers field types automatically.
- **Instant Search**: Search-as-you-type works out of the box with no configuration.
- **Disk-Based Storage**: Uses LMDB for memory-mapped storage; dataset doesn't need to fit in RAM.
- **SSPL License Implication**: Core is MIT but enterprise features require commercial license.

## Internal Mechanics

Standard implementation patterns for Meilisearch Setup.

## Patterns

- Standard patterns apply for Meilisearch Setup.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Meilisearch Setup.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K024 (Meilisearch filterable/sortable)
- - K025 (Meilisearch typo tolerance)
- - K027 (Meilisearch faceted search)
- - K028 (Meilisearch hybrid search)
- - K030 (Meilisearch ranking rules)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
