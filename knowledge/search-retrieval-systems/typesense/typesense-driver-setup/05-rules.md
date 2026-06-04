---
## Rule Name
Define Schemas Before Indexing

## Category
Framework Usage

## Rule
Always define collection schemas in `config/scout.php` before running `scout:import` for any Typesense model.

## Reason
Typesense requires pre-defined schemas with explicit field types. Unlike Meilisearch, it does not auto-create indexes. Missing schemas cause import failures.

## Bad Example
```php
// No model-settings — import will fail
'typesense' => [
    'host' => env('TYPESENSE_HOST'),
    'api_key' => env('TYPESENSE_API_KEY'),
],
```

## Good Example
```php
'typesense' => [
    'host' => env('TYPESENSE_HOST'),
    'api_key' => env('TYPESENSE_API_KEY'),
    'model-settings' => [
        Product::class => [
            'collection-schema' => [
                'fields' => [
                    ['name' => 'id', 'type' => 'string'],
                    ['name' => 'title', 'type' => 'string'],
                ],
            ],
        ],
    ],
],
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Import failures blocking deployment and requiring emergency schema creation via API.

---
## Rule Name
Pin Typesense Version

## Category
Maintainability

## Rule
Always specify an exact Typesense version in Docker or deployment config; never use `latest`.

## Reason
Typesense releases with breaking changes. `latest` pulls new versions unpredictably, causing deployment failures.

## Bad Example
```yaml
image: typesense/typesense:latest
```

## Good Example
```yaml
image: typesense/typesense:27.0
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Unexpected breaking API changes in CI/CD causing service disruption.

---
## Rule Name
Use Environment-Specific API Keys

## Category
Security

## Rule
Always use the master API key only for admin operations and schema management; use a search-only API key for public search endpoints.

## Reason
The master key grants full access to all collections, schemas, and configuration. Exposure allows complete system compromise.

## Bad Example
```php
// Using master key for public search
Product::search('laptop')->options(['api_key' => $masterKey]);
```

## Good Example
```php
Product::search('laptop')->options(['api_key' => $searchOnlyKey]);
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Unauthorized schema changes, data deletion, and potential breach of all searchable data.

---
## Rule Name
Monitor RAM Usage Closely

## Category
Performance

## Rule
Always monitor Typesense RAM usage and set proactive alerts at 75% of available memory.

## Reason
Typesense keeps all indexes in memory. Exceeding available RAM causes OOM crashes and service downtime.

## Bad Example
```bash
# No RAM monitoring
# Index grows past available memory -> OOM kill
```

## Good Example
```bash
# Monitor memory usage
curl http://localhost:8108/health
# Alert when memory > 75% of available
```

## Exceptions
Typesense Cloud manages infrastructure monitoring automatically.

## Consequences Of Violation
Unexpected service crashes, index corruption, and extended downtime for recovery.

---
## Rule Name
Configure Snapshots for Disaster Recovery

## Category
Reliability

## Rule
Always enable Typesense automatic snapshots for self-hosted deployments.

## Reason
Typesense stores data in memory. On crash or restart without snapshots, the entire index must be rebuilt from the database.

## Bad Example
```bash
# No snapshots configured
# Server restart -> all index data lost
```

## Good Example
```bash
# Enable snapshots
docker run -d \
  -e TYPESENSE_SNAPSHOT_INTERVAL_SECONDS=86400 \
  typesense/typesense:27.0
```

## Exceptions
Typesense Cloud includes built-in backup and disaster recovery.

## Consequences Of Violation
Hours of index rebuild time and potential data loss on hardware failure.

---
## Rule Name
Size RAM for Dataset with Headroom

## Category
Architecture

## Rule
Always ensure the Typesense dataset fits in RAM with at least 2x headroom (index size x 2).

## Reason
Typesense is RAM-first — all indexes are memory-mapped. Insufficient RAM causes OOM crashes, swapping, and severe performance degradation.

## Bad Example
```bash
# 50GB dataset on a 32GB RAM server
# Guaranteed OOM
```

## Good Example
```bash
# 50GB dataset requires minimum 100GB RAM
# 64GB dataset -> 128GB+ RAM
```

## Exceptions
Typesense Cloud manages capacity planning.

## Consequences Of Violation
Frequent OOM crashes, extreme query latency due to swapping, and production outages.
