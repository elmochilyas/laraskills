# Knowledge Unit: Full Reindex Vs Incremental

## Metadata

- **ID:** ku-03
- **Subdomain:** 01-laravel-scout-foundation
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Full Reindex Vs Incremental

## Executive Summary

Full re-index (scout:import) rebuilds the entire search index from the database. Incremental indexing syncs individual model changes as they happen. Each serves different purposes: full re-index for initialization and recovery, incremental for day-to-day operation.

## Core Concepts

- **Full Re-index**: Truncates index, re-imports all records. Use for schema changes, data repair, initial population.
- **Incremental Sync**: Auto-syncs on model save/delete via Searchable trait observers.
- **Queue Import**: scout:import with queue processes models in chunks.
- **Chunk Size**: Configurable batch size for import (default 500).

## Internal Mechanics

Standard implementation patterns for Full Reindex Vs Incremental.

## Patterns

- Standard patterns apply for Full Reindex Vs Incremental.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Full Reindex Vs Incremental.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K009 (scout:import / scout:flush)
- - K010 (makeAllSearchableUsing)
- - K004 (Queue indexing)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
