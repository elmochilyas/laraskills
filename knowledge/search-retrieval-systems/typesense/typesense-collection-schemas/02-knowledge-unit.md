# Knowledge Unit: Typesense Collection Schemas

## Metadata

- **ID:** K034
- **Subdomain:** Search Indexing & Synchronization
- **Source:** Typesense Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Schema definition in scout.php

## Executive Summary

Typesense requires explicit collection schemas before indexing documents. Unlike Meilisearch's schema-free approach, Typesense collections define field names, types, and optional facets. In Laravel Scout, these schemas are defined in the `typesense` section of `config/scout.php` under `model-settings`. Schema changes require creating a new collection and performing an alias swap.

## Core Concepts

- **Schema Definition**: Each searchable model must have a schema with field definitions.
- **Field Types**: `string`, `int32`, `int64`, `float`, `bool`, `string[]`, `int32[]`, `auto` (infers).
- **Required Fields**: `id` must be a string. Timestamps should be integers.
- **Alias Swap**: Schema changes require creating a new collection with a new name, then swapping the alias.
- **Schema Enforcement**: Documents with undeclared fields may be rejected or stored without indexing.

## Internal Mechanics

Scout's Typesense engine reads `model-settings` from `config/scout.php` and creates/updates the collection via the Typesense API when `scout:sync-index-settings` runs. The schema maps to the collection's `fields` array. Each field specifies `name`, `type`, and optional `facet: true` or `sort: true`.

## Patterns

- **Define schema in scout.php**: `'App\\Models\\Product' => ['collection-schema' => ['fields' => [...]]]`.
- **Include all fields from `toSearchableArray()`**.
- **Set`id` as string and timestamps as int64**.
- **Declare facet/sort fields upfront** — cannot be changed without schema rebuild.

## Architectural Decisions

Typesense's schema requirement was a deliberate design choice over Meilisearch's schema-free approach. Schemas enable stricter validation, better query optimization, and explicit type safety. The tradeoff is higher upfront configuration.

## Tradeoffs

- Schema-free (Meilisearch): Faster to start, easier to evolve. Schema-based (Typesense): More reliable, better performance, safer queries.
- Schema changes require collection re-creation and alias swap — operational overhead.
- Undeclared fields in Typesense are not indexed (silently ignored vs Meilisearch which auto-indexes).

## Performance Considerations

- Schema-defined collections enable Typesense's optimal storage and indexing.
- Field type correctness prevents query-time type conversion overhead.
- Facet/sort declarations optimize internal data structures.

## Production Considerations

- **Plan schema migrations** — each change requires a new collection + alias swap.
- **Use model settings in `config/scout.php`** — version-controlled, deployable.
- **Run `scout:sync-index-settings`** after each deployment that changes schemas.
- **Test schema changes** in staging before production.

## Common Mistakes

- Missing `id` as string — Typesense requires string document IDs.
- Not declaring `facet: true` for filterable fields — `where()` calls silently fail.
- Forgetting to include newly added `toSearchableArray()` fields in the schema.

## Failure Modes

- **Schema mismatch**: Typesense rejects documents with undeclared fields. Scout may fail to index.
- **Alias swap timing**: Queries during alias swap may hit the old collection.
- **Type conflicts**: Sending an integer where string is declared causes indexing errors.

## Ecosystem Usage

Required for all Typesense-based Scout implementations. Schema definition is a core part of deployment configuration.

## Related Knowledge Units

- K033 (Typesense driver setup)
- K005 (toSearchableArray)
- K035 (Typesense dynamic search parameters)

## Research Notes

Source: Typesense docs, Laravel Scout Typesense documentation. The alias-swap pattern for schema evolution is unique to Typesense among the Scout-supported engines. Meilisearch and Algolia allow dynamic field addition.


## Mental Models

- **Lightning Rod**: Typesense is designed for sub-50ms responses. Every architectural decision prioritizes speed, like a lightning rod channeling energy with minimal resistance.
- **Schema-on-Write**: Unlike schema-on-read databases, Typesense enforces structure at write time, like pre-sorting mail before delivery rather than sorting at the mailbox.

