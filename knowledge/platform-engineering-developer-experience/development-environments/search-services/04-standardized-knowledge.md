# 04-Standardized Knowledge: Search Services (Meilisearch, Typesense)

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | search-services |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-sail, docker-compose-for-laravel, cache-queue-services |
| **Framework/Language** | Meilisearch, Typesense, Laravel Scout, PHP |

## Overview

Search services in Laravel dev environments are dedicated search engine containers (Meilisearch/Typesense) bundled with Sail. Open-source, typo-tolerant search engines serving as lightweight Elasticsearch alternatives. Laravel Scout provides unified query interface. Sail includes Meilisearch (default) and supports Typesense via configuration. Both offer REST APIs, typo-tolerant search, faceted filtering, near-instant indexing.

## Core Concepts

- **Meilisearch**: open-source search engine; typo-tolerant full-text search, faceted filters, ranking rules; port 7700; master key auth
- **Typesense**: similar to Meilisearch but different query syntax; port 8108; API key auth
- **Laravel Scout**: official driver-based search package; unified interface for Meilisearch/Typesense/Algolia
- **Indexing**: transforming Eloquent models into searchable documents via Scout's `Searchable` trait
- **Sail Integration**: Meilisearch available as default service; enabled via `--with=meilisearch`

## When to Use

- Full-text search features in Laravel applications
- Product search, documentation search, any typo-tolerant search
- Local development before deploying to Algolia or managed Meilisearch

## When NOT to Use

- Simple database LIKE queries suffice (small datasets)
- Production without managed/self-hosted search engine (Sail Meilisearch is dev-only)
- Elasticsearch-based projects (different API, heavier resource requirements)

## Best Practices (WHY)

- **Use queue-based indexing**: `SCOUT_QUEUE=true` for write-heavy apps avoids blocking responses
- **Import after adding Searchable**: `php artisan scout:import "App\Models\Product"` populates index
- **Configure filterable attributes**: `->where()` in Scout requires `filterableAttributes` in Meilisearch
- **Use Docker service hostname**: `MEILISEARCH_HOST=http://meilisearch:7700` (not `localhost`)
- **Persist master key**: Sail auto-generates; save in .env for reproducible sessions
- **Match production search engine**: test relevance parity between dev and prod search

## Architecture Guidelines

- Install Scout + Meilisearch PHP SDK via Composer
- Add `Searchable` trait to models; implement `toSearchableArray()` for index data
- Configure `SCOUT_DRIVER=meilisearch` in .env
- Add Meilisearch as Sail service via `--with=meilisearch`
- Use faceted search with `->where()` filters

## Performance Considerations

- Scout import: 500 records/batch default; increase for large datasets
- Meilisearch memory: 50-100MB for 10k documents
- Query latency: <50ms for indexes under 100k documents
- Index throughput: 100+ additions/second on dev machine

## Security Considerations

- Meilisearch master key must be secret in production
- Sail auto-generates key; production should use strong managed key
- Restrict network access to search engine port

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Forgetting scout:import | Index empty | Search returns nothing | Run import after Searchable setup |
| Wrong hostname | `localhost:7700` instead of `meilisearch:7700` | Connection refused | Use Docker service hostname |
| Not setting filterable attributes | ->where() not configured in Meilisearch | Filter silently fails | Set filterableAttributes |
| SCOUT_DRIVER not set | Falls back to database LIKE | Poor performance | Set to meilisearch |

## Anti-Patterns

- **Using Sail Meilisearch in production**: dev container lacks persistence, security, scaling
- **Ignoring search in CI**: search-dependent tests fail without search engine service

## Examples

```php
// Model with Searchable
class Product extends Model {
    use Searchable;
    public function toSearchableArray() {
        return ['id' => $this->id, 'name' => $this->name];
    }
}

// Search with filter
$results = Product::search('shoes')->where('category_id', 5)->get();
```

## Related Topics

- laravel-sail — Meilisearch optional service
- docker-compose-for-laravel — Docker Compose service
- cache-queue-services — queue-based indexing

## AI Agent Notes

- Include Laravel Scout + Meilisearch when scaffolding projects with search functionality
- Default `SCOUT_QUEUE=true` for production-ready indexing

## Verification

- [ ] Meilisearch/Typesense container running
- [ ] Scout driver configured
- [ ] Models have Searchable trait
- [ ] scout:import run
- [ ] Filterable attributes configured
- [ ] Queue-based indexing if write-heavy
- [ ] Search queries return expected results
