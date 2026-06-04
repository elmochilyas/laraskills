# Knowledge Unit: Typesense Typo Tolerance

## Metadata

- **ID:** K040
- **Subdomain:** Relevance & Ranking
- **Source:** Typesense Docs
- **Maturity:** Stable
- **Laravel Relevance:** Configurable per-field

## Executive Summary

Typesense provides configurable typo tolerance with per-field control, enabling fine-grained management of fuzzy matching behavior. Parameters include `num_typos` (max allowed typos), `typo_tokens_threshold`, and per-field overrides. Unlike Meilisearch's settings-based approach, Typesense typo tolerance is configured at the collection level during schema definition.

## Core Concepts

- **num_typos**: Maximum number of typo corrections allowed per word (1 or 2).
- **typo_tokens_threshold**: The number of tokens that must have typos before typo tolerance kicks in.
- **Per-Field Control**: Typo tolerance can be disabled or adjusted for specific fields.
- **Levenshtein-Based**: Uses Levenshtein distance for typo measurement, like Meilisearch.

## Internal Mechanics

Typesense's typo tolerance is evaluated during the scoring phase. For each query token, Typesense computes Levenshtein distance against indexed tokens. Matches within the configured distance threshold are considered valid matches but scored lower than exact matches. The `typo_tokens_threshold` prevents typo tolerance from applying when only a small number of query tokens have typos.

## Patterns

- **Disable on identifier fields**: SKUs, order numbers, serial numbers — exact match required.
- **Lower tolerance on short fields**: Names, codes — fewer characters means more false positive matches.
- **Increase tolerance on long fields**: Body text, descriptions — users benefit from fuzzy matching.

## Architectural Decisions

Typesense's configuration of typo tolerance at the collection schema level (rather than global or query-level) provides a middle ground between Meilisearch's global settings and a hypothetical per-query approach.

## Tradeoffs

- Collection-level configuration is simpler than per-query but less flexible.
- Per-field control allows precision where needed but adds schema complexity.
- Scout does not expose Typesense typo tolerance tuning — requires direct API or callback.

## Performance Considerations

- Typo tolerance adds minimal latency.
- Disabling typo tolerance on high-cardinality fields (SKUs) may reduce false positive matches.
- Higher `num_typos` (2 vs 1) increases candidate pool slightly.

## Production Considerations

- **Define typo tolerance in collection schema** — cannot be changed easily (requires collection re-creation).
- **Test with real user queries** — verify that typo tolerance behavior matches user expectations.
- **Use per-field disable for exact-match fields** — prevents typos from matching wrong products.

## Common Mistakes

- Setting `num_typos` too high for short fields — "iPad" with 2 typos matches unrelated products.
- Not disabling typo tolerance on product SKUs — users searching "ABC-123" match "ABD-124".
- Relying on Scout to configure typo tolerance — Scout does not abstract Typesense's per-field typo settings.

## Failure Modes

- **False positives**: Aggressive typo tolerance matches unrelated documents.
- **Schema lock-in**: Changing typo tolerance requires collection re-creation.
- **Inconsistent behavior**: Users see different results for the same query depending on typo tolerance configuration.

## Ecosystem Usage

Standard in Typesense deployments. Per-field typo tolerance is critical for e-commerce where product codes require exact matches but product descriptions benefit from fuzzy matching.

## Related Knowledge Units

- K033 (Typesense driver setup)
- K034 (Typesense collection schemas)
- K025 (Meilisearch typo tolerance)

## Research Notes

Source: Typesense docs. Typesense's per-field typo tolerance provides more granular control than Meilisearch's global settings. However, the configuration is tied to the collection schema, making changes more expensive.


## Mental Models

- **Lightning Rod**: Typesense is designed for sub-50ms responses. Every architectural decision prioritizes speed, like a lightning rod channeling energy with minimal resistance.
- **Schema-on-Write**: Unlike schema-on-read databases, Typesense enforces structure at write time, like pre-sorting mail before delivery rather than sorting at the mailbox.

