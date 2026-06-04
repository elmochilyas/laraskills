# Skill: Configure Search Services (Meilisearch/Typesense)

## Purpose
Set up Meilisearch or Typesense as a dedicated search engine in Docker-based Laravel development environments with Laravel Scout integration for full-text search features.

## When To Use
- Full-text search features requiring typo-tolerant search
- Projects using Laravel Scout
- Search-as-you-type functionality

## When NOT To Use
- Small datasets where database LIKE queries suffice
- When Elasticsearch is already established in the stack
- Projects with no search functionality

## Prerequisites
- Laravel Sail (Meilisearch included) or Docker Compose with search service
- `laravel/scout` package installed

## Inputs
- `docker-compose.yml` — Meilisearch/Typesense service
- `.env` — Scout configuration
- `config/scout.php` — Scout driver configuration

## Workflow

1. **Add Search Service:** In `docker-compose.yml`, add Meilisearch service using `getmeili/meilisearch:latest` image with port 7700. For Sail, use `--with=meilisearch` flag during install.

2. **Install Laravel Scout:** Run `composer require laravel/scout`. Publish config with `php artisan vendor:publish --provider="Laravel\Scout\ScoutServiceProvider"`.

3. **Configure Scout Driver:** Set `SCOUT_DRIVER=meilisearch` in `.env`. Set `MEILISEARCH_HOST=http://meilisearch:7700` (using Docker service name, not localhost).

4. **Add Searchable Trait:** Add `use Searchable;` trait to Eloquent models that should be searchable. Define `toSearchableArray()` to control which fields are indexed.

5. **Configure Queue-Based Indexing:** Set `SCOUT_QUEUE=true` in `.env` for write-heavy applications. This queues index updates to avoid blocking HTTP responses.

6. **Import Existing Data:** Run `php artisan scout:import "App\Models\Product"` to populate the search index with existing records.

7. **Configure Filterable Attributes:** Set `filterableAttributes` in Meilisearch for fields used in `->where()` Scout queries. This must be configured server-side.

8. **Persist Master Key:** Sail auto-generates a Meilisearch master key. Save it in `.env` as `MEILISEARCH_KEY` for reproducible sessions.

## Validation Checklist

- [ ] Meilisearch/Typesense container running and accessible
- [ ] Laravel Scout installed and configured with correct driver
- [ ] `Searchable` trait added to relevant models
- [ ] `toSearchableArray()` defined on searchable models
- [ ] `scout:import` completes successfully
- [ ] Search queries return correct results
- [ ] Queue-based indexing working (if `SCOUT_QUEUE=true`)
- [ ] Production search engine matches dev engine

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Wrong host in config | Use service name (`meilisearch:7700`), not localhost |
| Data not indexed | Run `scout:import` after adding Searchable trait |
| Filter not working | Configure `filterableAttributes` in Meilisearch settings |
| Missing master key | Save key from Sail output; required for API access |

## Decision Points

- **Use for full-text search features** requiring typo-tolerant search
- **Use Scout + Meilisearch** for Laravel search out of the box
- **Use database LIKE queries** for small datasets where search engine overhead isn't justified
- **Match production search engine** — Test relevance parity between dev and prod

## Performance/Security Considerations

- **Queue-based indexing:** Essential for write-heavy apps to avoid blocking responses
- **Index size:** Monitor Meilisearch storage; indexes can grow significantly
- **Authentication:** Meilisearch uses master key authentication; store in `.env`

## Related Rules

- SEARCH-RULE-001: Use queue-based indexing
- SEARCH-RULE-002: Import after adding Searchable
- SEARCH-RULE-003: Configure filterable attributes
- SEARCH-RULE-004: Use Docker service hostname
- SEARCH-RULE-005: Persist master key

## Related Skills

- Configure Laravel Sail
- Set Up Docker Compose for Laravel
- Configure Cache and Queue Services

## Success Criteria

- Search queries return relevant, typo-tolerant results
- Scout indexes are kept up-to-date via queues
- Filterable attributes work correctly
- Dev and production search engines are compatible
