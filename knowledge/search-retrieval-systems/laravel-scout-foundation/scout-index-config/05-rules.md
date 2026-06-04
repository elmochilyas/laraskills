## Keep Credentials in Environment Variables
---
## Category
Security
---
## Rule
Never hardcode search engine API keys, hostnames, or credentials in `config/scout.php` — always use `env()` calls.
---
## Reason
Hardcoded credentials are exposed in version control, CI/CD logs, and shared development environments, leading to security breaches.
---
## Bad Example
```php
// config/scout.php
'algolia' => [
    'id' => 'ABC123',
    'secret' => 'xyz789', // Credentials in code
],
```
---
## Good Example
```php
// config/scout.php
'algolia' => [
    'id' => env('ALGOLIA_APP_ID', ''),
    'secret' => env('ALGOLIA_SECRET', ''),
],
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Credential leaks, unauthorized search index access, data breaches.

## Use Index Prefix Per Environment
---
## Category
Reliability
---
## Rule
Always prefix index names with the environment name using `env('SCOUT_PREFIX')` to prevent cross-environment index contamination.
---
## Reason
Without prefixes, development imports overwrite production indexes or mix data, causing corrupted search results and data recovery nightmares.
---
## Bad Example
```php
// No prefix — dev and prod share the same "posts" index
```
---
## Good Example
```php
// config/scout.php
'prefix' => env('SCOUT_PREFIX', 'dev_'),
// .env: SCOUT_PREFIX=staging_ (staging), prod_ (production)
```
---
## Exceptions
Single-environment deployments with no risk of cross-contamination.
---
## Consequences Of Violation
Accidental overwriting of production indexes, mixed environment data, index corruption.

## Version-Control Index Settings in Code
---
## Category
Maintainability
---
## Rule
Always configure engine-specific index settings (filterable, sortable, ranking) in `config/scout.php`, not in the engine's dashboard UI.
---
## Reason
Dashboard-configured settings are invisible to other developers, lost on environment rebuilds, and cause drift between environments.
---
## Bad Example
```php
// No index-settings in config — configured manually in dashboard
```
---
## Good Example
```php
// config/scout.php
'meilisearch' => [
    'index-settings' => [
        \App\Models\Product::class => [
            'filterableAttributes' => ['category_id', 'price'],
            'sortableAttributes' => ['price', 'created_at'],
        ],
    ],
],
```
---
## Exceptions
Settings that change frequently and don't need version control (e.g., temporary A/B test configurations).
---
## Consequences Of Violation
Settings drift, hard-to-reproduce environments, onboarding friction for new developers.

## Run scout:sync-index-settings in Deployments
---
## Category
Reliability
---
## Rule
Always run `php artisan scout:sync-index-settings` as part of your deployment pipeline after configuration changes.
---
## Reason
Index settings defined in `config/scout.php` are not automatically synced to the search engine — the command must be explicitly called to apply them.
---
## Bad Example
```php
// Deploying config changes without syncing — settings never applied
```
---
## Good Example
```yaml
# deploy.yml
steps:
  - run: php artisan config:cache
  - run: php artisan scout:sync-index-settings
  - run: php artisan queue:restart
```
---
## Exceptions
When using engines that auto-detect settings or when settings are managed entirely via dashboard.
---
## Consequences Of Violation
Filterable/sortable attributes not working, silent search failures, wasted debugging time.
