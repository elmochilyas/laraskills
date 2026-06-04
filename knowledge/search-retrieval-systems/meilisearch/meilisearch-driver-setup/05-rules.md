---
## Rule Name
Version-Pin Meilisearch Deployments

## Category
Maintainability

## Rule
Always pin the Meilisearch version in Docker or deployment config; never use the `latest` tag.

## Reason
Meilisearch releases with breaking changes. Pinning prevents unexpected failures during deployments.

## Bad Example
```yaml
# docker-compose.yml
services:
  meilisearch:
    image: getmeili/meilisearch:latest
```

## Good Example
```yaml
services:
  meilisearch:
    image: getmeili/meilisearch:v1.12
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Unexpected breaking changes during non-production upgrades cause index corruption and service disruption.

---
## Rule Name
Separate Admin and Search API Keys

## Category
Security

## Rule
Never expose the master API key in client-side code; always use a search-only API key for frontend requests.

## Reason
The master key grants full admin access including index manipulation and configuration changes.

## Bad Example
```javascript
fetch('http://localhost:7700/search', {
  headers: { 'Authorization': 'Bearer ' + process.env.MEILI_MASTER_KEY }
});
```

## Good Example
```javascript
fetch('http://localhost:7700/search', {
  headers: { 'Authorization': 'Bearer ' + process.env.MEILI_SEARCH_KEY }
});
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Unauthorized index manipulation, data deletion, or configuration changes via client-side compromise.

---
## Rule Name
Declare Filterable and Sortable Attributes Before Indexing

## Category
Framework Usage

## Rule
Always declare `filterableAttributes` and `sortableAttributes` in `config/scout.php` before the first document import.

## Reason
Meilisearch ignores `where()` and `orderBy()` calls on undeclared attributes; results silently return unfiltered.

## Bad Example
```php
Product::search('laptop')->where('price', '<', 1000)->get();
// price not declared as filterable — no filtering applied
```

## Good Example
```php
// config/scout.php
'meilisearch' => [
    'index-settings' => [
        Product::class => [
            'filterableAttributes' => ['price', 'category_id'],
        ],
    ],
],
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Silent filtering failures, incorrect search results, and wasted debugging time.

---
## Rule Name
Configure Automatic Dumps for Self-Hosted Instances

## Category
Reliability

## Rule
Always schedule Meilisearch dump snapshots for self-hosted deployments.

## Reason
Meilisearch stores data in LMDB files. Without dumps, data loss from corruption or accidental deletion is unrecoverable.

## Bad Example
```bash
# No dump schedule configured — relying on server backups alone
docker run -d -p 7700:7700 getmeili/meilisearch
```

## Good Example
```bash
# Schedule daily dumps
0 2 * * * curl -X POST http://localhost:7700/dumps -H 'Authorization: Bearer $MASTER_KEY'
```

## Exceptions
Meilisearch Cloud-managed instances handle backups automatically.

## Consequences Of Violation
Unrecoverable data loss on LMDB corruption, hardware failure, or accidental deletion.

---
## Rule Name
Set Up Resource Monitoring for Self-Hosted Meilisearch

## Category
Performance

## Rule
Always monitor memory, CPU, and disk usage for self-hosted Meilisearch instances and set proactive alerts.

## Reason
Meilisearch keeps large portions of the index in memory. Unmonitored memory growth causes OOM kills and service downtime.

## Bad Example
```bash
# Running without any monitoring or alerting
docker run -d -p 7700:7700 getmeili/meilisearch:v1.12
```

## Good Example
```bash
# Configure monitoring via Prometheus or health endpoint
curl http://localhost:7700/health
# Set up alert when memory > 80%
```

## Exceptions
Meilisearch Cloud includes built-in monitoring.

## Consequences Of Violation
Unexpected OOM crashes, service downtime, and slow incident response due to lack of visibility.

---
## Rule Name
Use Environment-Specific Meilisearch Instances

## Category
Architecture

## Rule
Always deploy separate Meilisearch instances for development, staging, and production environments.

## Reason
Shared instances cause data contamination across environments and risk production index corruption during testing.

## Bad Example
```env
# Same host for all environments
MEILISEARCH_HOST=http://localhost:7700
```

## Good Example
```env
# .env.production
MEILISEARCH_HOST=https://search.production.example.com

# .env.staging
MEILISEARCH_HOST=https://search.staging.example.com
```

## Exceptions
Single-developer projects with no staging environment may share a local instance.

## Consequences Of Violation
Accidental production data deletion during development testing and environment cross-contamination.
