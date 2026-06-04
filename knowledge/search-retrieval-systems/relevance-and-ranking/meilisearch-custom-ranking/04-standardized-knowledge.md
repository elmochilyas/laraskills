| Metadata | |
|---|---|
| KU ID | K031 |
| Subdomain | relevance-and-ranking |
| Topic | Meilisearch Custom Ranking Rules |
| Source | Meilisearch Docs |
| Maturity | Stable |

## Overview

Meilisearch's custom ranking allows ascending or descending sorting by numeric attributes (price, popularity, date) as part of the ranking rules. Custom ranking rules are applied after the default rules (words, typo, proximity, attribute, sort, position, exactness). This enables business-specific relevance signals like "newer items first" or "popular items first" within the search relevance formula.

## Core Concepts

- **Custom Ranking Rule**: Ascending or descending sort on a numeric attribute.
- **Ranking Rule Position**: Applied after default text-based rules but before sort.
- **Asc vs Desc**: Ascending (lower values first, e.g., price), descending (higher values first, e.g., popularity).
- **Numeric Only**: Custom ranking only works with numeric attributes.
- **Ranking Score Contribution**: Custom ranking contributes to the overall relevance score.

## When To Use

- Boosting popular items: `popularity:desc`
- Showing newer items first: `created_at:desc`
- Promoting discounted items: `discount_percentage:desc`
- Combined with default rules: relevance + business signals
- Any application where business metrics should influence search ranking

## When NOT To Use

- String or boolean attributes for ranking (only numeric supported)
- When sort order is the primary user concern (use sortable attributes instead)
- Very small result sets where ranking doesn't matter
- When custom ranking degrades text relevance too much

## Best Practices

1. **Place custom ranking after default rules**: Default rules should handle text relevance first.
2. **Use moderate weights**: Excessive custom ranking can override text relevance.
3. **Combine multiple signals**: Popularity + recency + margin for comprehensive ranking.
4. **Test with real queries**: Validate that custom ranking improves user-facing results.
5. **Monitor key metrics**: Track CTR and conversion after deploying custom ranking changes.

## Architecture Guidelines

- Configure in Meilisearch index settings via the dashboard, API, or Scout config.
- Default ranking rule order: `["words", "typo", "proximity", "attribute", "sort", "exactness", "custom:popularity:desc"]`.
- Custom ranking is applied at query time — index structure unaffected.
- Multiple custom ranking rules can be combined.

## Related Topics

- K030 (Meilisearch ranking rules)
- K024 (Meilisearch filterable/sortable attributes)
- K066 (Faceted search implementation)

## AI Agent Notes

- Custom ranking adds business signals to Meilisearch's relevance formula.
- Use `attribute:asc` or `attribute:desc` syntax in ranking rules.
- For agents: place custom ranking after default rules; test with real queries; monitor CTR impact.

## Verification

- [ ] Custom ranking rule configured (asc/desc on numeric attribute)
- [ ] Rule placed after default rules in ranking rule order
- [ ] Business relevance improved over default-only ranking
- [ ] Text relevance not excessively diluted
