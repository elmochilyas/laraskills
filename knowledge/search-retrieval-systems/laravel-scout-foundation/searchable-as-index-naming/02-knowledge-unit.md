# Knowledge Unit: searchableAs / Index Naming

## Metadata

- **ID:** K006
- **Subdomain:** Search Indexing & Synchronization
- **Source:** Laravel Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Multi-index strategies

## Executive Summary

`searchableAs()` determines the name of the search index where a model's records are stored. By default, Scout uses the model's table name (pluralized). Overriding this method enables multi-environment index separation, multi-tenancy, versioned indexes for deployment rollback, and cross-model indexing strategies.

## Core Concepts

- **Default**: Returns `Str::snake(class_basename($this)).'_index'` — typically the plural table name plus `_index`.
- **Scope**: Affects which index the model is written to and queried from. All queries via `Model::search()` automatically target this index.
- **Environment Separation**: Append `config('app.env')` to prevent dev/staging data from mixing with production: `return 'products_'.config('app.env')`.
- **Not applicable to database engine**: The database engine searches the actual DB table, not an index name.

## Internal Mechanics

`searchableAs()` is called by Scout's engine layer when building search queries and indexing commands. The engine uses the return value as the target index name. When `scout:import` runs, it determines which index to write to based on this method. Meilisearch and Typesense create indexes/collections lazily on first document insertion. Algolia requires explicit index initialization via settings sync.

## Patterns

- **Environment suffixes**: `'products_staging'`, `'products_production'` — prevents data leaks between environments.
- **Tenant-specific indexes**: `'company_'.$this->company_id` — isolates tenant data at the index level.
- **Versioned indexes**: `'products_v2'` during migration to a new schema, enabling blue/green index swaps.

## Architectural Decisions

Scout chose a method-based approach (over config file) because index naming is inherently model-specific. A config-based approach would require per-model configuration sections anyway.

## Tradeoffs

- Using environment-specific names simplifies deployment but requires `scout:import` on every deploy.
- Tenant-specific indexes improve isolation but increase operational complexity (more indexes to manage).

## Performance Considerations

- Search engines handle dozens to hundreds of indexes efficiently. Thousands of indexes may impact performance on some engines (Meilisearch has soft limits).
- Index name length: Most engines support names up to 255 characters. Keep names concise.

## Production Considerations

- **Include environment in index name** to prevent accidental data mixing.
- **Plan index migration strategy** when changing `searchableAs()` — old index becomes orphaned.
- **Run `scout:flush` before `scout:import`** when renaming to clean up old indexes.

## Common Mistakes

- Returning dynamic values that change per-request (e.g., based on logged-in user) — leads to writes to unpredictable indexes.
- Forgetting to update `searchableAs()` when model table name changes.
- Not including environment in multi-environment deployments.

## Failure Modes

- Index name collisions across environments cause data leakage (dev data appears in production search).
- Orphaned indexes accumulate if `searchableAs()` changes without cleanup.

## Ecosystem Usage

Standard practice in multi-environment Laravel deployments. Used with all engine drivers for environment isolation.

## Related Knowledge Units

- K001 (Searchable trait)
- K034 (Typesense collection schemas)

## Research Notes

Source: Laravel Scout docs. The environment-based naming pattern is the most common community recommendation. Some teams use a hash of the model schema version to automatically trigger re-indexing when the schema changes.


## Mental Models

- **Mirror Reflection**: Index synchronization is like keeping a mirror reflection of your database in the search engine. Every change to the original must be reflected in the mirror.
- **Conveyor Belt**: Batch indexing is a conveyor belt — documents enter on one end (import), travel through processing, and emerge searchable on the other end.

