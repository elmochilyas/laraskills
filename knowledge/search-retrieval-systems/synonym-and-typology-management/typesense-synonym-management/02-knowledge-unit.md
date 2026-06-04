# Knowledge Unit: Typesense Synonym Management

## Metadata

- **ID:** K039
- **Subdomain:** Relevance & Ranking
- **Source:** Typesense Docs
- **Maturity:** Stable
- **Laravel Relevance:** API-managed synonyms

## Executive Summary

Typesense provides synonym management via its API, allowing configuration of equivalent terms that expand query matching. Synonyms can be bidirectional (term ↔ synonym) or one-way. Unlike Meilisearch's settings-based approach, Typesense manages synonyms as separate API resources that can be created, updated, and deleted independently.

## Core Concepts

- **Synonym Types**: `multi_way` (bidirectional), `one_way` (directional).
- **Root Concept**: A single root concept maps to multiple synonyms.
- **API Resources**: Synonyms are managed via the `/collections/{name}/synonyms` endpoint.
- **Per-Collection**: Synonyms are scoped to a specific collection/index.

## Internal Mechanics

Typesense stores synonym configurations as part of the collection metadata. At query time, if a query term matches a synonym root, Typesense expands the query to include all synonym variants. The expansion happens transparently — the application sends the original query, Typesense handles the expansion internally.

## Patterns

- **Bidirectional for common variants**: "laptop" ↔ "notebook" ↔ "ultrabook".
- **One-way for brand-to-product**: "nike" → "air max", "jordan" (but not reverse).
- **Acronym expansion**: "API" ↔ "Application Programming Interface".

## Architectural Decisions

Typesense chose API-resource-based synonym management (rather than settings-based) because synonyms can be numerous and change independently of other index settings. This allows bulk import and deletion without affecting other configurations.

## Tradeoffs

- API-resource approach scales to thousands of synonym sets better than settings-based.
- Scout's `scout:sync-index-settings` does not manage Typesense synonyms separately — they must be managed via direct API calls or the Typesense dashboard.
- More flexible but requires additional integration code compared to Meilisearch's settings-based approach.

## Performance Considerations

- Synonym query expansion adds minimal latency (microseconds per synonym).
- Very large synonym collections (>100K) may increase indexing time.

## Production Considerations

- **Use Typesense API directly** for synonym management — Scout does not abstract this.
- **Version-control synonym configurations** — export them as JSON files.
- **Test synonym expansion** — verify that queries with synonyms return expected results.
- **Audit synonyms regularly** — remove outdated mappings.

## Common Mistakes

- Relying on Scout to manage synonyms — Scout does not have a synonym API abstraction.
- Creating synonym chains that cause excessive query expansion (A→B→C→A).
- Not testing synonym impact — poorly configured synonyms degrade precision.

## Failure Modes

- **Incorrect synonym type**: Using one_way where multi_way is appropriate (or vice versa).
- **Synonym API errors**: Invalid synonym definitions rejected by Typesense.
- **Expansion overload**: Too many synonyms for a single root term cause broad, imprecise results.

## Ecosystem Usage

Used in Typesense-based search implementations where synonym management is required. Common in e-commerce and content platforms with varied terminology.

## Related Knowledge Units

- K033 (Typesense driver setup)
- K034 (Typesense collection schemas)
- K026 (Meilisearch synonym management)

## Research Notes

Source: Typesense docs. Typesense's synonym API is more flexible than Meilisearch's settings-based approach but requires more integration effort. The API resource model is well-suited to large synonym collections that change independently of other settings.


## Mental Models

- **Lightning Rod**: Typesense is designed for sub-50ms responses. Every architectural decision prioritizes speed, like a lightning rod channeling energy with minimal resistance.
- **Schema-on-Write**: Unlike schema-on-read databases, Typesense enforces structure at write time, like pre-sorting mail before delivery rather than sorting at the mailbox.

