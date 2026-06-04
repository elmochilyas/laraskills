# Knowledge Unit: Algolia Index Settings via Scout Config

## Metadata

- **ID:** K019
- **Subdomain:** Relevance & Ranking
- **Source:** Algolia Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** searchableAttributes, faceting

## Executive Summary

Algolia index settings control which fields are searchable, how they are weighted, faceting configuration, and ranking rules. In Laravel Scout, these settings are configured in `config/scout.php` under the `algolia` section and synchronized via `scout:sync-index-settings`. Proper configuration is essential for search relevance — defaults are generic and rarely optimal.

## Core Concepts

- **searchableAttributes**: Ordered list of fields to search. Earlier fields have higher weight.
- **attributesForFaceting**: Fields that can be used for filtering and faceting.
- **customRanking**: Business-specific ranking signals (popularity, recency, revenue).
- **ranking**: The ordered list of ranking criteria (typo, proximity, attribute, custom).
- **Settings Apply Per-Index**: Each model/index has its own settings configuration.

## Internal Mechanics

Scout's Algolia engine reads `algolia.index-settings` from `config/scout.php`. The `scout:sync-index-settings` command calls Algolia's `setSettings()` API for each configured index. Algolia immediately applies these settings — they affect all subsequent queries. Settings are version-controlled via `config/scout.php`, not set manually in the Algolia dashboard.

## Patterns

- **Field weighting**: Order fields by importance: `['title', 'description', 'body']`.
- **Facet declaration**: `['categories', 'brand', 'price_range']`.
- **Custom ranking**: `['desc(score)', 'desc(popularity)']`.
- **Settings per model**: Group settings under the model's class name in `config/scout.php`.

## Architectural Decisions

Algolia chose a declarative settings API where most relevance tuning happens at index configuration time, not at query time. This differs from Meilisearch's approach where ranking rules are more baked into the engine defaults.

## Tradeoffs

- Settings-based relevance tuning is powerful but requires careful iteration.
- Changes require `scout:sync-index-settings` and may need a full re-index.
- Dashboard-based changes bypass version control — prefer config-file-driven settings.

## Performance Considerations

- Settings changes do not require re-indexing (unlike Typesense schema changes).
- Facet declarations increase index size slightly.
- Custom ranking adds sorting overhead at query time.

## Production Considerations

- **Store settings in `config/scout.php`** — version-controlled, deployable.
- **Run `scout:sync-index-settings` after every deployment** that changes settings.
- **Test settings in staging** before production — relevance changes can significantly impact user experience.
- **Use Algolia's A/B testing** (K022) to validate settings changes before full rollout.

## Common Mistakes

- Not defining `searchableAttributes` — defaults search all attributes equally.
- Forgetting to declare `attributesForFaceting` — `where()` calls fail.
- Setting `customRanking` without understanding how it interacts with text relevance.
- Making settings changes directly in the Algolia dashboard rather than version control.

## Failure Modes

- **Settings drift**: Dashboard changes overwritten by `scout:sync-index-settings` or vice versa.
- **Invalid attribute name**: Algolia API rejects settings for undeclared attributes.
- **Ordering degradation**: Incorrect ranking criteria order can produce unexpected result ordering.

## Ecosystem Usage

Standard configuration task for every Algolia-based Scout implementation. Settings are the primary mechanism for tuning search relevance.

## Related Knowledge Units

- K018 (Algolia driver setup)
- K022 (Algolia A/B testing)
- K030 (Meilisearch ranking rules)

## Research Notes

Sources: Algolia docs, Laravel Scout docs. Algolia's settings API is the most comprehensive among Scout-supported engines. The A/B testing feature allows relevance engineers to validate changes scientifically.


## Mental Models

- **Instant Gratification**: Algolia's architecture is built around instant search results as the user types. Every millisecond is optimized for perceived performance.
- **Analytics Dashboard**: Algolia analytics are like having a magnifying glass on your search bar — you see exactly what users search for and whether they find it.

