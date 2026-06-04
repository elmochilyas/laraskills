# Knowledge Unit: Meilisearch Filterable/Sortable Attributes

## Metadata

- **ID:** K024
- **Subdomain:** Relevance & Ranking
- **Source:** Meilisearch Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Pre-declare filter/sort fields

## Executive Summary

Meilisearch requires explicit declaration of which attributes are filterable and sortable. Unlike schema-free indexing where field types are inferred, filterable and sortable attributes must be configured in index settings before they can be used in queries. This is done via the `config/scout.php` file and synchronized with `scout:sync-index-settings`.

## Core Concepts

- **filterableAttributes**: Fields usable in `where()`, `whereIn()`, and faceted search. Array of attribute names.
- **sortableAttributes**: Fields usable in `orderBy()` clauses. Array of attribute names.
- **Pre-Declaration Required**: Attempting to filter on undeclared attributes silently fails.
- **Per-Index Configuration**: Settings apply to a specific model/index combination.

## Internal Mechanics

Meilisearch stores filterable attributes in a separate data structure optimized for fast filtering. Sortable attributes are stored in an ordered data structure. When Scout's `where()` is called, it translates to Meilisearch's `filter` parameter. Without declaration, the filter parameter is ignored.

## Patterns

- **Declare all fields used in `where()` calls** in `filterableAttributes`.
- **Declare all fields used in `orderBy()` calls** in `sortableAttributes`.
- **Use `scout:sync-index-settings`** after any changes to these declarations.
- **Group settings by model** in `config/scout.php` for organization.

## Architectural Decisions

Meilisearch's pre-declaration requirement trades developer convenience (schema-free indexing) for query-time performance (optimized filter/sort data structures). The tradeoff is that developers must remember to configure this ahead of time.

## Tradeoffs

- Pre-declaration: More setup, faster filter/sort performance.
- Auto-inference: Less setup, potentially slower or unavailable filter/sort.
- Type safety: Declared attributes have consistent types across all documents.

## Performance Considerations

- Filterable attributes are indexed for O(1) lookups — performance is near-instant regardless of dataset size.
- Sortable attributes add storage overhead proportional to attribute cardinality.
- Declaring too many filterable attributes increases index build time and size.

## Production Considerations

- **Include filter/sort configuration in deployment pipeline** — `scout:sync-index-settings` should run on every deploy.
- **Monitor index size** — adding many filterable attributes increases storage.
- **Test filter/sort in staging** — ensure declared attributes match actual data shapes.

## Common Mistakes

- Forgetting to declare `filterableAttributes` — `where()` calls silently return unfiltered results.
- Not running `scout:sync-index-settings` after adding new filterable fields.
- Declaring non-existent attribute names — settings sync succeeds but filters fail.
- Expecting sorting on text fields — Meilisearch sorts alphabetically, not by relevance.

## Failure Modes

- **Silent filter failure**: `where()` returns unfiltered results without error.
- **Settings not applied**: `scout:sync-index-settings` must run — index settings persist across restarts.
- **Type inconsistency**: Inconsistent attribute types across documents cause filter errors.

## Ecosystem Usage

Mandatory configuration step for any Meilisearch Scout implementation that uses filtering or sorting.

## Related Knowledge Units

- K023 (Meilisearch driver setup)
- K025 (Meilisearch typo tolerance)
- K027 (Meilisearch faceted search)
- K030 (Meilisearch ranking rules)

## Research Notes

Source: Meilisearch docs, Laravel Scout docs. The `scout:sync-index-settings` command was added to Laravel Scout specifically to support engine-specific index configuration (Meilisearch filterable/sortable, Algolia settings, Typesense schemas).


## Mental Models

- **Card Catalog**: Meilisearch is like an automated card catalog that updates instantly as new books arrive. Every field is indexed and searchable by default.
- **Ranking Dashboard**: Search ranking rules are like dials on a dashboard — you adjust proximity, typo tolerance, attribute weights, and recency to tune relevance.

