---
## Rule Name
Enable Authentication Before Production Deployment

## Category
Security

## Rule
Always set `MEILI_MASTER_KEY` before deploying Meilisearch to production.

## Reason
Without authentication, any client with network access can query, modify, or delete your search index — including from the public internet.

## Bad Example
```bash
docker run -d -p 7700:7700 getmeili/meilisearch
# No master key set — fully open
```

## Good Example
```bash
docker run -d -p 7700:7700 \
  -e MEILI_MASTER_KEY=your-secure-master-key \
  getmeili/meilisearch
```

## Exceptions
Local development environments behind a firewall.

## Consequences Of Violation
Public data exposure, unauthorized index modification, and potential data breach.

---
## Rule Name
Declare Filterable and Sortable Attributes Before Indexing

## Category
Framework Usage

## Rule
Always declare all `filterableAttributes` and `sortableAttributes` in `config/scout.php` before importing documents.

## Reason
Meilisearch silently ignores `where()` and `orderBy()` on undeclared attributes, returning unfiltered results.

## Bad Example
```php
Product::search('laptop')->where('in_stock', true)->get();
// 'in_stock' not declared — no filter applied
```

## Good Example
```php
// config/scout.php
'meilisearch' => [
    'index-settings' => [
        Product::class => [
            'filterableAttributes' => ['in_stock', 'price', 'category_id'],
        ],
    ],
],
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Silent filter failures, incorrect search results, and wasted debugging time.

---
## Rule Name
Use Queue for Production Indexing

## Category
Performance

## Rule
Always enable Scout queue indexing in production to prevent search engine latency from blocking HTTP responses.

## Reason
Synchronous indexing adds 20-200ms per save operation, degrading page load times and causing cascading failures under load.

## Bad Example
```php
// config/scout.php
'queue' => false,
```

## Good Example
```php
'queue' => [
    'connection' => 'redis',
    'queue' => 'scout',
],
```

## Exceptions
Development and CI environments for simplicity.

## Consequences Of Violation
Degraded HTTP response times, poor UX during data writes, and timeout errors under load.

---
## Rule Name
Never Use Meilisearch as a Primary Database

## Category
Architecture

## Rule
Always treat Meilisearch as a search index that mirrors data from your primary database; never write application logic that depends on Meilisearch as the source of truth.

## Reason
Meilisearch is optimized for search, not transactional durability or relational integrity. Data loss or corruption in the search index should not affect application functionality.

## Bad Example
```php
// Storing data only in Meilisearch with no database backup
$index->addDocuments([['id' => 1, 'title' => 'Product']]);
```

## Good Example
```php
// Database is source of truth — Meilisearch mirrors
$product = Product::create(['title' => 'Product']);
// Searchable trait automatically syncs to Meilisearch
```

## Exceptions
Cache-like search data that can be regenerated from other sources.

## Consequences Of Violation
Unrecoverable data loss on index corruption and application crashes when search engine is unavailable.

---
## Rule Name
Configure Snapshotting and Backup Strategy

## Category
Reliability

## Rule
Always enable Meilisearch snapshots and configure a regular backup schedule for LMDB data files.

## Reason
LMDB storage can corrupt on unclean shutdown. Without snapshots, the entire index must be rebuilt from the database.

## Bad Example
```bash
# No snapshot or dump configured
docker run -d -p 7700:7700 getmeili/meilisearch
```

## Good Example
```bash
docker run -d -p 7700:7700 \
  -e MEILI_SNAPSHOT_INTERVAL_SECS=86400 \
  getmeili/meilisearch
# Plus scheduled dumps via cron
```

## Exceptions
Meilisearch Cloud instances include automatic backups.

## Consequences Of Violation
Hours of index rebuild time and potential data loss on hardware failure or corruption.

---
## Rule Name
Pin Meilisearch Version in Docker

## Category
Maintainability

## Rule
Always specify an exact Meilisearch version tag in Docker Compose or deployment config; never use `latest`.

## Reason
Meilisearch releases with breaking API changes. `latest` pulls new versions unpredictably, causing deployment failures.

## Bad Example
```yaml
image: getmeili/meilisearch:latest
```

## Good Example
```yaml
image: getmeili/meilisearch:v1.12
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Unexpected breaking changes in CI/CD, index corruption, and emergency rollbacks.
