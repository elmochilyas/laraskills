# Knowledge Unit: Scout Import Commands

## Metadata

- **ID:** ku-08
- **Subdomain:** 01-laravel-scout-foundation
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Scout Import Commands

## Executive Summary

Scout provides artisan commands for batch index management: scout:import (index all records), scout:flush (remove all records from index), scout:sync-index-settings (sync engine-specific config), and scout:delete-all-indexes (remove all indexes).

## Core Concepts

- **scout:import**: Batch imports all models into search index
- **scout:flush**: Removes all models from search index
- **scout:sync-index-settings**: Syncs filterable/sortable/ranking settings per engine
- **scout:delete-all-indexes**: Destructive — removes all indexes
- **Chunk Configuration**: --chunk option for batch size

## Internal Mechanics

Standard implementation patterns for Scout Import Commands.

## Patterns

- Standard patterns apply for Scout Import Commands.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Scout Import Commands.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K009 (scout:import / scout:flush)
- - K010 (makeAllSearchableUsing)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
