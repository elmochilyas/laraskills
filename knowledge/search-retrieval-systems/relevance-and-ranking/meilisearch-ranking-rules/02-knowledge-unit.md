# Knowledge Unit: Meilisearch Ranking Rules (7 Defaults)

## Metadata

- **ID:** K030
- **Subdomain:** Relevance & Ranking
- **Source:** Meilisearch Docs
- **Maturity:** Stable
- **Laravel Relevance:** Words, typo, proximity, attribute, sort, position, exactness

## Executive Summary

Meilisearch uses seven default ranking rules applied sequentially to determine result order: words, typo, proximity, attribute, sort, position, exactness. These rules are evaluated in order — each subsequent rule acts as a tiebreaker for the previous. Understanding this hierarchy is essential for effective relevance tuning. Custom ranking rules can be inserted into this sequence.

## Core Concepts

- **Ordered Execution**: Rules are evaluated in sequence. Each rule only affects results that are tied after the previous rule.
- **Seven Defaults**: 1) words (number of matched words), 2) typo (number of typos), 3) proximity (distance between query terms), 4) attribute (field importance order), 5) sort (asc/desc sorting), 6) position (position of matched term in field), 7) exactness (exact phrase match).
- **Custom Ranking**: Custom rules (asc/desc on numeric attributes) can be inserted anywhere in the sequence.
- **Per-Index Configuration**: Ranking rules are configurable per index via settings.

## Internal Mechanics

Meilisearch assigns a rank score for each rule, then sorts results lexicographically by the rule sequence. For example, all documents matching all query words (rule 1) come before those matching only some. Within that group, documents with zero typos (rule 2) come before those with typos. This hierarchical approach ensures deterministic ordering.

## Patterns

- **Business-first ranking**: Insert custom ranking rules early (position 2-3) to prioritize business metrics like revenue or popularity.
- **Relevance-first ranking**: Leave defaults as-is for content-focused search.
- **Promote attribute**: Move attribute rule earlier when field weighting is critical.
- **Remove sort rule**: When you don't want users to manually override relevance order.

## Architectural Decisions

Meilisearch's sequential rule evaluation is simpler than Algolia's complex ranking formula but also less flexible. The tradeoff is ease of understanding vs fine-grained control.

## Tradeoffs

- Sequential rules are easy to reason about but cannot express complex non-linear ranking formulas.
- Adding custom ranking at position 2 overrides all subsequent default rules for that result segment.
- Removing a rule (e.g., typo) changes the entire ranking dynamic — results may seem "wrong" until they are retrained.

## Performance Considerations

- Ranking rule evaluation adds minimal latency — rules are evaluated against already-retrieved candidates.
- Custom ranking on high-cardinality numeric fields (e.g., popularity score with 10K+ distinct values) may add sorting overhead.

## Production Considerations

- **Test ranking rule changes** with representative queries before deploying.
- **Document custom ranking rules** and their rationale.
- **Use Algolia A/B testing** (if available) for scientific validation; otherwise, manual A/B test.

## Common Mistakes

- Removing rules without understanding their effect — exactness removal especially impacts phrase search.
- Adding too many custom ranking rules — complex interactions are hard to debug.
- Expecting rules to compensate for poor data quality — ranking can't fix missing or inconsistent data.

## Failure Modes

- **Custom ranking dominates relevance**: Business priority scoring overrides text relevance for all queries.
- **Unexpected interaction**: Custom rule at position 3 may have unintended effects when combined with defaults.
- **Ranking not updated**: Settings not synced via `scout:sync-index-settings`.

## Ecosystem Usage

Fundamental to every Meilisearch implementation. Default rules are sufficient for many applications; custom ranking is added as search requirements mature.

## Related Knowledge Units

- K023 (Meilisearch driver setup)
- K031 (Meilisearch custom ranking)
- K019 (Algolia index settings)

## Research Notes

Source: Meilisearch docs. The seven default rules provide a strong foundation for relevance. The sequential evaluation model is Meilisearch's signature approach — different from Algolia's scoring formula and Typesense's parameter-based system.


## Mental Models

- **Card Catalog**: Meilisearch is like an automated card catalog that updates instantly as new books arrive. Every field is indexed and searchable by default.
- **Ranking Dashboard**: Search ranking rules are like dials on a dashboard — you adjust proximity, typo tolerance, attribute weights, and recency to tune relevance.

