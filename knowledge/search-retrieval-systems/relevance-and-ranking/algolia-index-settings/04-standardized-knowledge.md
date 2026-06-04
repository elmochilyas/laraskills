| Metadata | |
|---|---|
| KU ID | K019 |
| Subdomain | relevance-and-ranking |
| Topic | Algolia Index Settings via Scout Config |
| Source | Algolia Docs / Scout |
| Maturity | Stable |

## Overview

Algolia index settings (searchableAttributes, attributesForFaceting, customRanking, etc.) can be configured through Scout's `config/scout.php` file under the `algolia.index-settings` key. This provides version-controlled, environment-specific index configuration that's applied during deployment. Settings can also be managed via the Algolia dashboard, but code-based configuration is preferred for reproducibility.

## Core Concepts

- **searchableAttributes**: Ordered list of fields considered for search (determines field weighting).
- **attributesForFaceting**: Fields available for faceted filtering.
- **customRanking**: Business-specific ranking criteria (popularity, recency).
- **replicas**: Virtual replicas for different sort orders.
- **queryRules**: Business rules for promoting, hiding, or redirecting results.

## When To Use

- Every Algolia-based Scout implementation
- Version-controlling search configuration alongside application code
- Environment-specific settings (dev vs staging vs prod)
- Configuring faceting, ranking, and custom ranking

## When NOT To Use

- Settings that change frequently (manage in dashboard instead)
- Non-Algolia search engines (settings are Algolia-specific)
- Very small applications where dashboard management is sufficient

## Best Practices

1. **Version-control settings**: Store in `config/scout.php` for reproducibility.
2. **Define searchableAttributes order**: Field order determines importance (title first).
3. **Declare all facetable fields**: Any field used in `where()` must be in `attributesForFaceting`.
4. **Use replicas for sorting**: Each sort order needs its own replica index.
5. **Apply settings via deployment**: Run import after settings change for full effect.

## Architecture Guidelines

- Configure per-index under `algolia.index-settings` in `config/scout.php`.
- Each Searchable model maps to its own index with its own settings.
- Settings are applied when Scout first detects a new index (during import).
- For existing indexes, settings updates require re-importing data.

## Performance Considerations

- `searchableAttributes` order directly impacts search quality — cheaper attributes first.
- Too many `attributesForFaceting` increases index size.
- Each replica index consumes additional Algolia resources (pricing impact).
- Settings changes do not affect query performance — only index structure.

## Related Topics

- K018 (Algolia driver setup)
- K022 (Algolia A/B testing)
- K020 (Algolia analytics)
- K021 (Algolia geo-search)

## AI Agent Notes

- Index settings in scout.php enable version-controlled Algolia configuration.
- `searchableAttributes` order is the most important relevance lever.
- For agents: configure all settings in scout.php; use environment-specific settings; apply settings before deployment.

## Verification

- [ ] searchableAttributes configured with correct priority order
- [ ] attributesForFaceting includes all filterable fields
- [ ] customRanking configured for business signals
- [ ] Replica indexes created for different sort orders
- [ ] Settings applied during deployment pipeline
