# Knowledge Unit: Meilisearch Custom Ranking Rules

## Metadata

- **ID:** K031
- **Subdomain:** Relevance & Ranking
- **Source:** Meilisearch Docs
- **Maturity:** Stable
- **Laravel Relevance:** Asc/desc attribute ranking

## Executive Summary

Meilisearch custom ranking rules allow sorting results by a numeric attribute in ascending or descending order within the ranking hierarchy. They are inserted into the sequence of seven default ranking rules to prioritize business-specific signals like popularity, recency, price, or revenue. Custom ranking is the primary mechanism for business-aware relevance tuning.

## Core Concepts

- **Numeric Attributes Only**: Custom ranking works with integer, float, or timestamp fields.
- **Ascending or Descending**: `asc(price)` or `desc(popularity)`.
- **Inserted in Ranking Order**: Position determines priority relative to default rules.
- **Multiple Custom Rules**: Multiple fields can be ranked, evaluated in insertion order.

## Internal Mechanics

Custom ranking rules are stored as part of the index settings. When applied, Meilisearch evaluates the custom rule at its assigned position in the rule sequence. For `desc(popularity)`, documents with higher values come first. For `asc(price)`, lower values come first. The rule affects only results tied after all preceding rules are evaluated.

## Patterns

- **Recency boost**: `desc(published_at)` at position 4 — new content ranks higher.
- **Popularity boost**: `desc(view_count)` at position 3 — popular items get priority.
- **Revenue optimization**: `desc(revenue)` in e-commerce — high-value products shown first.
- **Sort by relevance then price**: Default rules for relevance, then `asc(price)` at position 6.

## Architectural Decisions

Meilisearch limits custom ranking to numeric attributes for performance — numeric comparisons are O(1) and can be efficiently indexed. Text-based custom ranking is not supported; use field weighting via `searchableAttributes` instead.

## Tradeoffs

- Numeric-only: Fast and simple, but cannot express complex mixed-type ranking criteria.
- Position in ranking order: Powerful but requires understanding of rule interaction.
- Cannot express non-linear ranking formulas (e.g., logarithmic decay for date-based ranking).

## Performance Considerations

- Custom ranking on indexed numeric fields adds minimal query latency.
- High-cardinality numeric fields (unique values for most documents) add sorting overhead.
- Multiple custom rules compound sorting complexity.

## Production Considerations

- **Position custom ranking carefully**: Placing `desc(popularity)` before text relevance rules makes popularity dominant over relevance.
- **Use in combination with searchableAttributes**: Field weighting and custom ranking together provide comprehensive relevance control.
- **Monitor impact**: Check whether custom ranking changes affect the top 10 results for your most important queries.

## Common Mistakes

- Putting custom ranking before relevance rules — business signals dominate text relevance.
- Using non-numeric fields — custom ranking silently fails.
- Adding too many custom rules — sorting becomes unpredictable.
- Not testing edge cases — a product with zero popularity always ranks last.

## Failure Modes

- **Dominant custom ranking**: All results sorted by popularity, text relevance ignored.
- **Null value handling**: Documents with null custom ranking fields sort to the bottom (asc) or top (desc).
- **Settings not synced**: Custom ranking changes not applied until `scout:sync-index-settings`.

## Ecosystem Usage

Used in most production Meilisearch deployments to incorporate business signals into ranking. Essential for e-commerce, content publishing, and any application where recency or popularity matters.

## Related Knowledge Units

- K023 (Meilisearch driver setup)
- K030 (Meilisearch ranking rules 7 defaults)
- K024 (Meilisearch filterable/sortable)

## Research Notes

Source: Meilisearch docs. Custom ranking is one of the most impactful relevance tuning levers. The position in the ranking order is critical — placing it before text relevance rules fundamentally changes search behavior.


## Mental Models

- **Card Catalog**: Meilisearch is like an automated card catalog that updates instantly as new books arrive. Every field is indexed and searchable by default.
- **Ranking Dashboard**: Search ranking rules are like dials on a dashboard — you adjust proximity, typo tolerance, attribute weights, and recency to tune relevance.

