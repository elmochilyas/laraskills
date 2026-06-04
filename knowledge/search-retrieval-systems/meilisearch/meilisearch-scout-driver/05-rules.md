---
## Rule Name
Always Sync Index Settings After Config Changes

## Category
Framework Usage

## Rule
Always run `scout:sync-index-settings` after every change to index settings in `config/scout.php`.

## Reason
Scout does not automatically apply settings changes to existing indexes. Without explicit sync, filterable, sortable, and ranking rule changes remain inactive.

## Bad Example
```bash
# Changed filterableAttributes in config but forgot to sync
git push production
# Settings not applied — where() calls still failing
```

## Good Example
```bash
# Include in deployment pipeline
php artisan scout:sync-index-settings
```

## Exceptions
Development environments where settings drift is acceptable.

## Consequences Of Violation
Search features silently break (filters, sorting, ranking), causing debugging confusion and user-facing issues.

---
## Rule Name
Keep the PHP SDK Updated

## Category
Maintainability

## Rule
Always keep `meilisearch/meilisearch-php` updated to the latest compatible version.

## Reason
The Meilisearch PHP SDK evolves rapidly with API changes. Falling behind causes compatibility issues and missed features.

## Bad Example
```json
// composer.json — stale version
"meilisearch/meilisearch-php": "^1.0"
```

## Good Example
```json
"meilisearch/meilisearch-php": "^1.12"
```

## Exceptions
Pin to a specific version during a production freeze window; update in next cycle.

## Consequences Of Violation
Scout driver failures after Meilisearch server upgrades, missing features, and security patches.

---
## Rule Name
Enable Authentication in Production

## Category
Security

## Rule
Always set `MEILI_MASTER_KEY` in production environments.

## Reason
Without authentication, anyone with network access can query, modify, or delete your search index.

## Bad Example
```env
MEILISEARCH_KEY=
```

## Good Example
```env
MEILISEARCH_KEY=your-master-key
```

## Exceptions
Local development environments behind a firewall.

## Consequences Of Violation
Unauthorized data access, index manipulation, and potential data breach.

---
## Rule Name
Version-Control All Index Config in scout.php

## Category
Maintainability

## Rule
Store all Meilisearch index settings in `config/scout.php`, not in the Meilisearch dashboard or API directly.

## Reason
Dashboard-only configuration is invisible to other developers, unreviewable in PRs, and lost on environment rebuild.

## Bad Example
```php
// Empty config — settings exist only in Meilisearch dashboard
'meilisearch' => [
    'host' => env('MEILISEARCH_HOST'),
    'key' => env('MEILISEARCH_KEY'),
],
```

## Good Example
```php
'meilisearch' => [
    'host' => env('MEILISEARCH_HOST'),
    'key' => env('MEILISEARCH_KEY'),
    'index-settings' => [
        Product::class => [
            'filterableAttributes' => ['price', 'category'],
            'sortableAttributes' => ['price', 'created_at'],
        ],
    ],
],
```

## Exceptions
Ephemeral settings for A/B testing that are actively managed.

## Consequences Of Violation
Configuration drift, unreproducible environments, and opaque search behavior changes.

---
## Rule Name
Use Async Indexing via Queue

## Category
Performance

## Rule
Always set `'queue' => true` in Scout config for production environments to prevent search latency from affecting HTTP response times.

## Reason
Synchronous indexing blocks the HTTP response until the search engine confirms indexing, adding 20-200ms to every save operation.

## Bad Example
```php
// config/scout.php — production
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
Development environments where simpler debugging is prioritized.

## Consequences Of Violation
Degraded HTTP response times, poor user experience during writes, and cascading timeouts under load.
