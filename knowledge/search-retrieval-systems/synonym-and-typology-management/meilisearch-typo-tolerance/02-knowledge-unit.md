# Knowledge Unit: Meilisearch Typo Tolerance

## Metadata

- **ID:** K025
- **Subdomain:** Relevance & Ranking
- **Source:** Meilisearch Docs
- **Maturity:** Stable
- **Laravel Relevance:** Configurable typo rules (minWordSizeForTypos)

## Executive Summary

Meilisearch's typo tolerance corrects misspelled search queries by matching indexed terms with similar strings. It works out of the box with no configuration. Typo tolerance is controlled by `minWordSizeForTypos` (word length thresholds for 1 vs 2 typos), `disableOnAttributes` (per-field disabling), and `disableOnWords` (per-word disabling).

## Core Concepts

- **Automatic**: Typo tolerance is enabled by default — no setup required.
- **Levenshtein Distance**: Typos are measured by character edits (insert, delete, substitute).
- **Configurable Thresholds**: `minWordSizeForTypos: { 1: 5, 2: 9 }` means words 5+ chars get 1 typo, 9+ get 2 typos.
- **Per-Field Control**: Disable typo tolerance on specific fields (e.g., exact SKU matches) using `disableOnAttributes`.

## Internal Mechanics

Meilisearch's inverted index stores both exact tokens and their trigrams (for fuzzy matching). At query time, Meilisearch generates typo variations of each query word within the configured Levenshtein distance. These variations are looked up in the inverted index. Results with exact matches are ranked higher than typo-corrected matches.

## Patterns

- **Leave defaults for most fields**: Default thresholds (5/9) work well for general text.
- **Disable typo tolerance on IDs/codes**: Product SKUs, order numbers should require exact matches.
- **Adjust thresholds for language**: Shorter words in some languages may need lower thresholds.

## Architectural Decisions

Meilisearch enabled typo tolerance by default because it's the most commonly desired search feature. This aligns with Meilisearch's philosophy of excellent defaults with minimal configuration.

## Tradeoffs

- Universal typo tolerance improves search experience but may match unintended results for short queries.
- Disabling on specific fields trades tolerance for precision.
- Higher typo thresholds increase query latency (more variations to check).

## Performance Considerations

- Typo tolerance has minimal impact on query latency (microseconds per typo variation).
- Disabling typo tolerance on many attributes slightly improves query speed.
- Very short words with typo tolerance disabled may produce zero results for legitimately misspelled queries.

## Production Considerations

- **Configure thresholds for your language**: Non-English languages may need different `minWordSizeForTypos`.
- **Disable on exact-match fields**: SKUs, serial numbers, email addresses.
- **Test with real user queries**: Use search analytics (if available) to identify frequently mistyped queries.

## Common Mistakes

- Disabling typo tolerance globally — significantly degrades search experience.
- Not adjusting thresholds for specialized vocabularies (medical, legal, technical terms).
- Expecting typo tolerance to handle high error rates (>2 edits per word).

## Failure Modes

- **Zero results with typos**: If a word is short and typo tolerance is minimal, misspelled queries return nothing.
- **False positive matches**: Aggressive typo tolerance matches unrelated words (e.g., "car" matching "cat").
- **Per-field disable not recognized**: Setting not properly synced via `scout:sync-index-settings`.

## Ecosystem Usage

Universal in Meilisearch deployments. Default behavior is sufficient for most applications.

## Related Knowledge Units

- K023 (Meilisearch driver setup)
- K040 (Typesense typo tolerance)

## Research Notes

Source: Meilisearch docs. Typo tolerance is a defining feature of modern search engines. Meilisearch's implementation balances recall and precision well with its default configuration. The Levenshtein distance-based approach is standard across the industry.


## Mental Models

- **Card Catalog**: Meilisearch is like an automated card catalog that updates instantly as new books arrive. Every field is indexed and searchable by default.
- **Ranking Dashboard**: Search ranking rules are like dials on a dashboard — you adjust proximity, typo tolerance, attribute weights, and recency to tune relevance.

