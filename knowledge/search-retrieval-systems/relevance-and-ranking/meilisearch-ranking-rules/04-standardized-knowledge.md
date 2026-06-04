| Metadata | |
|---|---|
| KU ID | K030 |
| Subdomain | relevance-and-ranking |
| Topic | Meilisearch Ranking Rules |
| Source | Meilisearch Docs |
| Maturity | Stable |

## Overview

Meilisearch uses seven default ranking rules applied in order: words, typo, proximity, attribute, sort, position, exactness. These rules determine how search results are ordered. The order can be customized, rules can be removed, and custom ranking rules can be added. Understanding these rules is essential for tuning Meilisearch search relevance.

## Core Concepts

- **Words**: Results matching more query words rank higher.
- **Typo**: Results with fewer typos rank higher (fewer typos = better match).
- **Proximity**: Results with query terms closer together rank higher.
- **Attribute**: Results matching more important attributes (per `searchableAttributes` order) rank higher.
- **Sort**: Results matching the user's sort preference (if any).
- **Position**: Results with query terms earlier in the document rank higher.
- **Exactness**: Results that exactly match the query rank higher.

## When To Use

- Every Meilisearch deployment (rules are applied by default)
- Tuning search relevance for specific use cases
- Adding custom ranking rules (popularity, recency)
- Removing rules that don't apply to your data

## When NOT To Use

- Default configuration is already optimal for your use case
- When using another search engine (rules are Meilisearch-specific)

## Best Practices

1. **Keep the default order unless there's a specific reason to change**: Default rules work well for most applications.
2. **Add custom ranking after defaults**: Custom rules should enhance, not replace, text relevance.
3. **Remove unnecessary rules**: If exactness doesn't matter for your content, remove it.
4. **Test rule changes**: Any rule order change should be A/B tested.
5. **Understand rule interactions**: Earlier rules have more influence than later ones.

## Architecture Guidelines

- Configure in Meilisearch index settings via dashboard, API, or Scout config.
- Default order: `["words", "typo", "proximity", "attribute", "sort", "exactness"]`.
- Custom rules appended: `["words", "typo", "proximity", "attribute", "sort", "exactness", "popularity:desc"]`.
- Rule order changes require re-indexing.

## Performance Considerations

- Ranking rules are applied at query time — no index impact.
- More rules = more computation, but overhead is negligible.
- Custom ranking on numeric attributes adds minimal overhead.
- Removing unused rules slightly improves query performance.

## Related Topics

- K031 (Meilisearch custom ranking)
- K024 (Meilisearch filterable/sortable attributes)
- K025 (Meilisearch typo tolerance)
- K066 (Faceted search implementation)

## AI Agent Notes

- The seven default rules handle the majority of search relevance tuning.
- Custom ranking rules are the most common modification.
- For agents: keep default order; add custom ranking for business signals; test changes before production.

## Verification

- [ ] Default ranking rule order understood
- [ ] Custom ranking rules added if needed
- [ ] Rule order optimized for content type
- [ ] Relevance tested with representative queries
