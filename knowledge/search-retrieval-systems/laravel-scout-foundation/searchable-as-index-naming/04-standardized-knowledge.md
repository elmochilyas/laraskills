| Metadata | |
|---|---|
| KU ID | K006 |
| Subdomain | search-indexing-and-synchronization |
| Topic | searchableAs / Index Naming |
| Source | Laravel Docs / Scout |
| Maturity | Stable |

## Overview

The `searchableAs()` method on a Searchable model determines the search engine index name for that model. By default, Scout uses the model's table name (e.g., `posts`). Customizing the index name enables multi-tenancy, environment separation, versioning strategies, and index alias patterns.

## Core Concepts

- **Default Naming**: Uses the model's database table name as the index name.
- **Custom Naming**: Override `searchableAs()` to return any string as the index name.
- **Environment Separation**: Prefix index names with environment: `production_posts`, `staging_posts`.
- **Multi-Tenant Indexes**: Append tenant ID: `tenant_42_posts`.
- **Cross-Engine Naming**: Index naming conventions vary by engine (Algolia allows index aliases; Meilisearch uses UIDs).

## When To Use

- Multi-tenant applications needing separate indexes per tenant
- Environment isolation (dev/staging/prod index separation)
- Versioned indexes for blue-green index deployment
- Multiple models sharing the same index (polymorphic search)

## When NOT To Use

- Simple single-tenant application (default table name is fine)
- When you rely on automatic index name conventions for tooling
- Before understanding engine-specific naming rules (length, characters)

## Best Practices

1. **Include environment in index name**: Prevent accidental cross-environment data mixing.
2. **Use consistent naming convention**: `{prefix}_{model_table}` or `{env}_{tenant}_{model}`.
3. **Avoid special characters**: Use lowercase alphanumeric and underscores only.
4. **Document naming convention**: Ensure all team members understand the schema.
5. **Consider index aliases**: Algolia supports aliases for zero-downtime index swaps.

## Architecture Guidelines

- Override `searchableAs()` in the model: `return 'live_' . $this->getTable();`.
- For environment prefix, use `config('scout.prefix')` or a dedicated config value.
- For tenants, pass tenant ID: `return 'tenant_' . tenant()->id . '_posts';`.
- Multi-model indexes require all models to use the same index name.

## Performance Considerations

- Index name does not affect search performance.
- Having many small indexes (per-tenant) vs few large indexes affects engine resource usage.
- Each index consumes memory on the search engine — too many small indexes waste resources.
- Consider using filter-based multi-tenancy (single index + tenant filter) for better resource utilization.

## Examples

```php
class Post extends Model
{
    use Searchable;

    public function searchableAs(): string
    {
        return app()->environment() . '_posts';
    }
}
```

```php
// Multi-tenant naming
class Post extends Model
{
    use Searchable;

    public function searchableAs(): string
    {
        return 'tenant_' . tenant()->id . '_posts';
    }
}
```

## Related Topics

- K001 (Searchable trait)
- K005 (toSearchableArray)
- K007 (shouldBeSearchable)
- K057 (Pinecone namespaces)
- K052 (Qdrant multitenancy)

## AI Agent Notes

- Default index names work for simple apps — customize for environments and multi-tenancy.
- Environment prefix is the most common customization.
- For agents: always add environment prefix for production safety, even in simple apps.

## Verification

- [ ] searchableAs() returns correct index name
- [ ] Environment prefix implemented
- [ ] Multi-tenant naming strategy in place (if applicable)
- [ ] Naming convention documented
- [ ] Engine-specific naming rules validated (length, character restrictions)
