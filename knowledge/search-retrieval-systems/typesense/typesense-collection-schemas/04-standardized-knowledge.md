| Metadata | |
|---|---|
| KU ID | K034 |
| Subdomain | dedicated-search-appliances |
| Topic | Typesense Collection Schemas |
| Source | Typesense Docs / Scout |
| Maturity | Stable |

## Overview

Typesense requires defining collection schemas before indexing data — unlike Meilisearch which auto-creates schemas. Schemas declare field names, types, and indexing options (facet, sort, optional). In Scout, schemas are configured in `config/scout.php` under the `typesense.model-settings` key. Schema changes require re-indexing the collection because Typesense does not support in-place schema alterations.

## Core Concepts

- **Collection Schema**: Pre-defined structure declaring each field's name, type, and indexing options.
- **Field Types**: `string`, `int32`, `int64`, `float`, `bool`, `geopoint`, `string[]`, `int32[]`, `auto`.
- **Index Options**: `facet` (for faceted filtering), `sort` (for sorting), `optional` (allow null values).
- **No Schema Alteration**: Schema changes require dropping and recreating the collection.
- **Auto-Detect**: `auto` type lets Typesense infer the field type from the first document.

## When To Use

- Every Typesense-based Scout integration (schema is required)
- Applications needing explicit control over which fields are facetable, sortable
- Projects where schema-as-code is preferred (version-controlled in scout.php)
- Multi-model search with different field structures per model

## When NOT To Use

- Using auto-detect for production (type inference can be brittle)
- Frequent schema changes (each change requires re-indexing)
- When using Meilisearch (no schema required)

## Best Practices

1. **Define schemas explicitly**: Avoid `auto` type in production — be explicit about field types.
2. **Declare all facetable fields**: Add `facet: true` for any field used in `where()` or faceted search.
3. **Declare all sortable fields**: Add `sort: true` for fields used in `orderBy()`.
4. **Version-control schemas**: Store in `config/scout.php` under `typesense.model-settings`.
5. **Plan for schema changes**: Document re-indexing process for each schema change.

## Architecture Guidelines

- Configure per-model in `config/scout.php` under `typesense.model-settings`.
- Each model gets its own collection named after `searchableAs()`.
- Schema is applied when Scout first detects a new collection name.
- For schema changes: deploy code change → re-run import → flush old collection.

## Performance Considerations

- Schema definition has no direct performance impact — it's created once.
- Declaring `facet: true` on many fields increases index size slightly.
- `sort: true` on string fields adds some index overhead.
- Schema validation happens at index time, not query time.

## Examples

```php
// config/scout.php
'typesense' => [
    'model-settings' => [
        \App\Models\Product::class => [
            'collection-schema' => [
                'fields' => [
                    ['name' => 'id', 'type' => 'string'],
                    ['name' => 'title', 'type' => 'string'],
                    ['name' => 'description', 'type' => 'string'],
                    ['name' => 'price', 'type' => 'float', 'facet' => true, 'sort' => true],
                    ['name' => 'category', 'type' => 'string', 'facet' => true],
                    ['name' => 'brand', 'type' => 'string', 'facet' => true],
                    ['name' => 'in_stock', 'type' => 'bool', 'facet' => true],
                    ['name' => 'created_at', 'type' => 'int64', 'sort' => true],
                ],
                'default_sorting_field' => 'created_at',
            ],
        ],
    ],
],
```

## Related Topics

- K033 (Typesense driver setup)
- K035 (Typesense dynamic search parameters)
- K038 (Typesense faceting)

## AI Agent Notes

- Typesense requires explicit schemas — unlike Meilisearch's auto-schema.
- Schema changes require re-indexing (drop + recreate collection).
- For agents: always declare `facet: true` for filterable fields and `sort: true` for sortable fields; version-control schemas in config.

## Verification

- [ ] Collection schemas defined for each Searchable model
- [ ] Facetable fields declared with facet: true
- [ ] Sortable fields declared with sort: true
- [ ] Schema re-indexing process documented
- [ ] No auto types in production
