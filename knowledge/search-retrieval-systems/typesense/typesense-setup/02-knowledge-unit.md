# Knowledge Unit: Typesense Setup

## Metadata

- **ID:** ku-00
- **Subdomain:** 05-typesense
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Typesense Setup

## Executive Summary

Typesense is an open-source, C++-based search engine with a RAM-first architecture, offering sub-50ms query latency, built-in vector search, and high-availability clustering via Raft consensus. Its Scout driver requires a running Typesense instance and the 	ypesense/typesense-php package. Typesense requires explicit collection schemas but offers fine-grained control over search behavior.

## Core Concepts

- **RAM-First**: Entire index must fit in RAM for optimal performance.
- **Schema-Enforced**: Collections require explicit field type definitions before indexing.
- **Raft Clustering**: Built-in multi-node HA with automatic failover (3+ nodes).
- **High Performance**: Written in C++ — fastest raw query speed among open-source options.
- **Collection Schema Migration**: Field additions require collection recreation and alias swap.

## Internal Mechanics

Standard implementation patterns for Typesense Setup.

## Patterns

- Standard patterns apply for Typesense Setup.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Typesense Setup.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K034 (Typesense collection schemas)
- - K035 (Typesense dynamic search parameters)
- - K036 (Typesense vector search)
- - K037 (Typesense geo-search)
- - K039 (Typesense synonym management)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
