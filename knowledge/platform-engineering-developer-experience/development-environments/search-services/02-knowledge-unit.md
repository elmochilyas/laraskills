# Knowledge Unit: Search Services (Meilisearch, Typesense)

## Metadata
- **Subdomain:** Development Environments
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** development-environments/search-services
- **Maturity:** Mature
- **Related Technologies:** Meilisearch, Typesense, Laravel Scout, Algolia, Elasticsearch, Laravel Sail

## Executive Summary

Search services in the Laravel development environment context refer to dedicated search engine containers (primarily Meilisearch and Typesense) that are bundled with Laravel Sail for local development. Meilisearch and Typesense are open-source, typed-tolerant search engines that serve as lightweight alternatives to Elasticsearch for full-text search functionality in Laravel applications. Laravel Scout provides the unified query interface to these engines. Sail includes one-click installation for Meilisearch (default) and supports Typesense via configuration. These services run in Docker containers alongside the application, providing instant search indexing and querying without external API dependencies during development. Both engines offer REST APIs, typo-tolerant search, faceted filtering, and near-instant indexing, making them suitable for product search, documentation search, and any full-text search feature.

## Core Concepts

- **Meilisearch:** An open-source search engine with instant typo-tolerant full-text search, faceted filters, and ranking rules; runs as a standalone HTTP service (default port 7700); uses a master key for authentication
- **Typesense:** An open-source search engine with similar capabilities to Meilisearch but with a different query syntax and configuration model; runs on port 8108; requires an API key for access
- **Laravel Scout:** Laravel's official driver-based search package that provides a unified interface for search engines (Meilisearch, Typesense, Algolia, database); manages model indexing, search queries, and queue-based sync
- **Indexing:** The process of transforming Eloquent model data into searchable documents in the search engine; Scout's `Searchable` trait automates this via model events (created, updated, deleted)
- **Sail Service Integration:** Meilisearch is available as a default Sail service; enabled via `php artisan sail:install --with=meilisearch` or by adding the service block to docker-compose.yml

## Mental Models

- **Search Engine as Indexed Data Store:** Unlike database LIKE queries (full table scan), the search engine maintains pre-built inverted indexes for instant term lookups—like a book's index vs reading every page
- **Scout as Search ORM:** Laravel Scout is the ORM for search engines; it abstracts away the engine-specific API (Meilisearch vs Typesense vs Algolia) behind Eloquent-like methods: `Model::search('query')->get()`
- **Sail Service as Toggle:** Search services in Sail are toggles—add Meilisearch to docker-compose.yml, configure Scout's MEILISEARCH_HOST, and the local search engine is running with zero external dependencies

## Internal Mechanics

1. **Service Startup:** Sail starts the meilisearch container which runs the Meilisearch binary, listening on port 7700 with a randomized master key passed via MEILISEARCH_MASTER_KEY environment variable
2. **Scout Registration:** Install `laravel/scout` and `meilisearch/meilisearch-php`; set `SCOUT_DRIVER=meilisearch` and `MEILISEARCH_HOST=http://meilisearch:7700` in .env
3. **Model Indexing:** Adding `Searchable` trait to an Eloquent model registers model event listeners; after each save, Scout sends the model data to Meilisearch's index API
4. **Batch Import:** `php artisan scout:import "App\Models\Product"` sends all existing models to the search engine in batches (configurable batch size)
5. **Query Flow:** `Product::search('shoes')->get()` sends an HTTP request to Meilisearch's search endpoint; the engine performs typo-tolerant matching against the index and returns ranked results
6. **Queue Integration:** Scout can defer index updates to the queue (`SCOUT_QUEUE=true`) to avoid blocking HTTP responses during model saves

## Patterns

- **Sail Installation Pattern:**
  ```bash
  php artisan sail:install --with=meilisearch
  sail up -d
  ```
  Adds Meilisearch service to docker-compose.yml and starts it.
- **Scout Setup Pattern:**
  ```bash
  composer require laravel/scout meilisearch/meilisearch-php
  php artisan vendor:publish --provider="Laravel\Scout\ScoutServiceProvider"
  # Set SCOUT_DRIVER=meilisearch in .env
  ```
- **Model Searchable Pattern:**
  ```php
  use Laravel\Scout\Searchable;
  class Product extends Model {
      use Searchable;
      public function toSearchableArray() {
          return ['id' => $this->id, 'name' => $this->name, 'description' => $this->description];
      }
  }
  ```
- **Faceted Search Pattern:**
  ```php
  $results = Product::search('shoes')
      ->where('category_id', 5)
      ->paginate(20);
  ```
  Scouts forwards `where` filters as Meilisearch facet filters; define facet attributes in Meilisearch index settings.
- **Typesense Alternative Pattern:**
  ```env
  SCOUT_DRIVER=typesense
  TYPESENSE_HOST=http://typesense:8108
  TYPESENSE_API_KEY=xyz
  ```
  For projects preferring Typesense over Meilisearch; requires the `typesense/typesense-php` Scout engine package.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Search engine | Meilisearch vs Typesense vs Algolia | Meilisearch for self-hosted; Algolia for managed; Typesense for self-hosted with advanced relevance tuning |
| Indexing mode | Real-time vs queue-based | Queue-based for write-heavy apps; real-time for low-volume or admin-only search |
| Index strategy | Single index per model vs combined | Per-model (default, Scout) for separation; combined for cross-entity search |
| Meilisearch master key | Fixed vs auto-generated in .env | Auto-generated (Sail default) for development; fixed key for team environments |

## Tradeoffs

- **Meilisearch vs Typesense:** Meilisearch has simpler setup and better Laravel documentation; Typesense offers more advanced relevance tuning and ranking rules. Both are fast and developer-friendly. Meilisearch is pre-integrated with Sail; Typesense requires custom docker-compose service.
- **Local vs Production Search Engine:** Local Meilisearch may behave differently than production Algolia. Use Meilisearch locally and Algolia in production for cost savings, but test search relevance parity before deployment.
- **Scout vs Direct API:** Scout abstracts engine differences but limits access to engine-specific features (Meilisearch's geo-search, synonyms, stop-words). Use Scout for standard search; fall back to direct Meilisearch PHP SDK for advanced features.

## Performance Considerations

- **Index Build Time:** `scout:import` processes 500 records per batch by default; for large datasets (100k+ records), increase batch size and use queue workers to avoid timeouts
- **Memory Usage:** Meilisearch with a 10k-document index uses ~50-100MB RAM; Typesense is comparable. Both are significantly lighter than Elasticsearch (typically 1-2GB minimum).
- **Query Latency:** Meilisearch queries typically complete in <50ms for indexes under 100k documents; most of the perceived latency is HTTP round-trip from PHP to the Docker container
- **Index Update Throughput:** Meilisearch handles 100+ document additions per second on a development machine; queue-based indexing prevents DB write bottlenecks

## Production Considerations

- **Scout Production Driver:** For production, switch to Algolia (managed, SLA-backed) or a dedicated Meilisearch/Typesense instance (not the Sail container). Algolia handles scaling, backups, and uptime automatically.
- **Meilisearch Cloud:** Meilisearch offers a managed cloud service for production; configure `MEILISEARCH_HOST` and `MEILISEARCH_MASTER_KEY` in production .env
- **Index Persistence:** Sail's Meilisearch container stores indexes in a Docker volume; destroying the container (sail down -v) wipes all indexes. Re-import after rebuild.
- **Security:** Meilisearch's master key must be kept secret in production; Sail auto-generates a key but production should use a strong, managed key. Restrict network access to the search engine port.

## Common Mistakes

- **Missing Scout import:** Adding Searchable trait but forgetting `php artisan scout:import`; the index is empty and search returns no results
- **Environment variable mismatch:** Setting `MEILISEARCH_HOST=localhost:7700` instead of the Docker service hostname `meilisearch:7700`; the app container can't reach the search engine
- **Not configuring filterable attributes:** Using ->where() in Scout but not setting the corresponding filterableAttributes in Meilisearch; the filter silently fails or throws an error
- **Forgetting SCOUT_DRIVER:** Setting up Meilisearch but leaving `SCOUT_DRIVER=database`; Scout falls back to database LIKE queries with poor performance
- **Sail service not started:** Running artisan scout:import before starting the Meilisearch container; connection refused error

## Failure Modes

- **Meilisearch Container Not Starting:** Port 7700 already in use on the host. Mitigate: configure MEILISEARCH_PORT in docker-compose.yml to use an alternative port.
- **Index Corruption:** Meilisearch index becomes inconsistent with the database. Mitigate: run `php artisan scout:flush` followed by `scout:import` to rebuild the index from scratch.
- **OOM on Large Import:** Meilisearch runs out of memory importing a very large dataset. Mitigate: reduce Scout batch size in `config/scout.php`; increase container memory limit in docker-compose.yml.
- **Scout Queue Deadlock:** Queue worker crashes mid-index-update, leaving the index out of sync. Mitigate: use a failed job table for retries; implement periodic `scout:import` reconciliation.

## Ecosystem Usage

- **Laravel Sail:** Default Meilisearch service included; Typesense addable via custom docker-compose service
- **Laravel Scout:** Official search abstraction; supports Meilisearch, Typesense, Algolia drivers
- **Meilisearch Laravel Scout Driver:** Community-maintained package for fine-grained Meilisearch configuration within Scout
- **Laravel Nova:** Search functionality in Nova admin panel can be backed by Scout/Meilisearch for improved search quality

## Related Knowledge Units

- laravel-sail
- docker-compose-for-laravel
- cache-queue-services
- database-services

## Research Notes

- Meilisearch v1.x is the version bundled with Sail; it introduced a breaking API change from v0.x requiring Scout driver updates
- Typesense Scout driver is community-maintained (not officially by Laravel) and may lag behind Meilisearch driver in feature parity
- Sail configures Meilisearch with a randomized master key on each `sail up`; persist the key in .env for reproducible development sessions
- Meilisearch's typo-tolerance handles up to 2 typos by default; configurable via `meilisearch-php` SDK settings in the Scout configuration array
