| Metadata | |
|---|---|
| KU ID | K024 |
| Subdomain | relevance-and-ranking |
| Topic | Meilisearch Filterable / Sortable Attributes |
| Source | Meilisearch Docs / Scout |
| Maturity | Stable |

## Overview

Meilisearch requires explicit declaration of `filterableAttributes` and `sortableAttributes` before they can be used in search queries. `filterableAttributes` enables field-level filtering via Scout's `where()` method. `sortableAttributes` enables result sorting by specific fields. These settings must be configured before indexing data — undeclared attributes cannot be filtered or sorted.

## Core Concepts

- **filterableAttributes**: Array of field names that can be used in `where()` filters.
- **sortableAttributes**: Array of field names that can be used for result sorting.
- **Pre-Index Declaration**: Settings must be configured before or during index creation.
- **Scout Integration**: Scout's `where()` and `orderBy()` rely on these engine settings.
- **Index Impact**: Adding many filterable/sortable attributes increases index size.

## When To Use

- Every Meilisearch index that uses Scout's `where()` method
- Every Meilisearch index that needs result sorting by specific fields
- Any field used for faceted search or filtering UI

## When NOT To Use

- Fields that are not used for filtering or sorting (declaration is unnecessary)
- Very small datasets where post-filtering in PHP is acceptable
- Text-only search with no structured filtering

## Best Practices

1. **Declare early**: Configure before first import to avoid re-indexing.
2. **Declare only what's needed**: Each declaration increases index size slightly.
3. **Declare all filterable fields**: Any field used in Scout `where()` must be declared.
4. **Declare all sortable fields**: Any field used for sorting must be declared.
5. **Use numeric types for sorting**: Sorting works best with numeric or timestamp fields.

## Architecture Guidelines

- Configure in `config/scout.php` under `meilisearch.index-settings` for each model.
- Alternatively, configure via Meilisearch dashboard or API.
- Settings apply at the index level (per model).
- After changing settings, re-import data for full effect.

## Performance Considerations

- Filterable attributes add a small overhead to index size.
- Sortable attributes require an additional data structure per field.
- Excessive filterable attributes (50+) may slow index updates.
- Filtering on declared attributes is much faster than post-query filtering in PHP.

## Examples

```php
// config/scout.php
'meilisearch' => [
    'index-settings' => [
        \App\Models\Product::class => [
            'filterableAttributes' => ['category_id', 'brand_id', 'price', 'in_stock', 'rating'],
            'sortableAttributes' => ['price', 'created_at', 'popularity', 'rating'],
        ],
    ],
],
```

## Related Topics

- K023 (Meilisearch driver setup)
- K030 (Meilisearch ranking rules)
- K027 (Meilisearch faceted search)
- K031 (Meilisearch custom ranking)

## AI Agent Notes

- Filterable/sortable attributes must be declared before indexing.
- Scout's `where()` won't work on undeclared fields.
- For agents: declare all filterable and sortable fields in scout.php; re-import index after changing settings.

## Verification

- [ ] filterableAttributes includes all fields used in where()
- [ ] sortableAttributes includes all fields used for sorting
- [ ] Settings configured before or during first import
- [ ] Re-import performed after settings change
- [ ] Only necessary attributes declared (avoid bloat)
