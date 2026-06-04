# Knowledge Unit: Search Appliance Comparison

## Metadata

- **ID:** ku-00
- **Subdomain:** 16-search-system-decision-guides
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Search Appliance Comparison

## Executive Summary

Three primary dedicated search appliances integrate with Laravel Scout: Meilisearch (open-source, Rust), Typesense (open-source, C++), and Algolia (cloud-managed). Each makes different architectural tradeoffs in storage, schema, clustering, performance, and cost. This KU provides a structured comparison to guide engine selection.

## Core Concepts

- **Meilisearch**: Schema-free, disk-based (LMDB), instant search defaults, single-node primary
- **Typesense**: Schema-enforced, RAM-first, Raft-based HA clustering, fastest raw speed
- **Algolia**: Cloud-managed, global CDN, richest feature set, per-query pricing
- **Scout Abstraction**: All three share the same Scout API, enabling engine switching
- **Cost Models**: Self-hosted (Meilisearch/Typesense) vs per-query (Algolia) vs resource-based (Typesense Cloud)

## Internal Mechanics

Standard implementation patterns for Search Appliance Comparison.

## Patterns

- Standard patterns apply for Search Appliance Comparison.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Search Appliance Comparison.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K002 (Scout database engine)
- - K014 (Custom engine development)
- - K018 (Algolia driver setup)
- - K023 (Meilisearch driver setup)
- - K033 (Typesense driver setup)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
