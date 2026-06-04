# Knowledge Unit: Meilisearch Synonym Management

## Metadata

- **ID:** K026
- **Subdomain:** Relevance & Ranking
- **Source:** Meilisearch Docs
- **Maturity:** Stable
- **Laravel Relevance:** Manual/API-based synonym configuration

## Executive Summary

Meilisearch synonyms enable defining equivalent terms that should produce the same search results. Synonyms can be one-way (e.g., "iOS" → "iPhone", "iPad") or bidirectional (e.g., "shoe" ↔ "sneaker" ↔ "trainer"). Synonyms improve recall by matching different terminology for the same concept.

## Core Concepts

- **Bidirectional Synonyms**: Both terms in the synonym group produce equivalent results. "running shoe" ↔ "sneaker".
- **One-Way Synonyms**: The source term maps to target terms but not vice versa. "iOS" → "iPhone", "iPad".
- **API Management**: Synonyms are managed via Meilisearch's settings API (or `scout:sync-index-settings`).
- **Per-Index Synonyms**: Synonym sets are specific to each index/model.

## Internal Mechanics

When a query contains a term that has synonyms configured, Meilisearch expands the query to include both the original term and all synonyms. Documents matching any variation are returned. Relevance scoring considers whether the match was from the original term or a synonym — original terms typically score higher.

## Patterns

- **Industry jargon**: Map technical terms to common equivalents.
- **Brand/product synonyms**: "Nike" ↔ "Air Jordan" — bidirectional for general, one-way for specific.
- **Acronym expansion**: "API" ↔ "Application Programming Interface".
- **Regional variations**: "sneakers" ↔ "trainers" (US vs UK English).

## Architectural Decisions

Meilisearch chose API-managed synonyms over automatic synonym generation (via ML) because manual control allows precise, domain-specific synonym sets. The tradeoff is maintenance overhead — synonyms must be explicitly defined and updated.

## Tradeoffs

- Manual synonyms are precise but labor-intensive to maintain.
- Synonyms increase query expansion, potentially reducing precision if overused.
- Synonym sets are static until updated — they don't adapt to changing terminology.

## Performance Considerations

- Query expansion with synonyms increases the number of terms to search, slightly increasing latency.
- Each synonym adds ~microseconds to query processing.
- Very large synonym sets (>10K pairs) may impact indexing time.

## Production Considerations

- **Audit synonyms regularly** — remove outdated or incorrect mappings.
- **Test synonym changes** with representative queries before deploying.
- **Monitor search analytics** for queries returning zero results — potential new synonym candidates.
- **Document synonym rationale** — future editors need to understand why mappings exist.

## Common Mistakes

- Creating circular synonym chains (A↔B, B↔C, C↔A) — excessive query expansion.
- Making highly specific terms bidirectional when they should be one-way.
- Not updating synonyms as product catalogs evolve.
- Relying solely on synonyms instead of improving indexed data quality.

## Failure Modes

- **Over-expansion**: Broad synonyms match too many documents, reducing precision.
- **Incorrect mapping**: Wrong synonyms produce irrelevant results.
- **Missing updates**: Synonyms become outdated as terminology changes.

## Ecosystem Usage

Common in production Meilisearch deployments, especially e-commerce where product terminology varies. Less critical for content sites with consistent vocabulary.

## Related Knowledge Units

- K023 (Meilisearch driver setup)
- K039 (Typesense synonym management)
- K024 (Meilisearch filterable/sortable)

## Research Notes

Source: Meilisearch docs. Synonym management is available via the settings API and the `scout:sync-index-settings` command. Meilisearch does not currently offer ML-based synonym generation.


## Mental Models

- **Card Catalog**: Meilisearch is like an automated card catalog that updates instantly as new books arrive. Every field is indexed and searchable by default.
- **Ranking Dashboard**: Search ranking rules are like dials on a dashboard — you adjust proximity, typo tolerance, attribute weights, and recency to tune relevance.

