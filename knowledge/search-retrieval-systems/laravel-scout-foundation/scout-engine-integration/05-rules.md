## Use Environment Variable for Driver Selection
---
## Category
Maintainability
---
## Rule
Always configure the Scout engine driver via `SCOUT_DRIVER` environment variable, never hardcode it in `config/scout.php`.
---
## Reason
Hardcoding prevents environment-specific engine selection (collection for dev, Meilisearch for staging, Algolia for prod) without code changes.
---
## Bad Example
```php
// config/scout.php
'driver' => 'meilisearch', // Same engine in every environment
```
---
## Good Example
```php
// config/scout.php
'driver' => env('SCOUT_DRIVER', 'database'),
// .env: SCOUT_DRIVER=collection (dev), SCOUT_DRIVER=meilisearch (prod)
```
---
## Exceptions
Single-environment deployments with no need for engine switching.
---
## Consequences Of Violation
Brittle configuration, environment-specific bugs, accidental production indexing from dev.

## Prefer Built-in Engines Before Custom Development
---
## Category
Maintainability
---
## Rule
Always use Scout's built-in engines (database, Meilisearch, Typesense, Algolia) before considering custom engine development.
---
## Reason
Custom engines require implementing 8 abstract methods, ongoing maintenance, and testing — rarely justified when community packages or built-in engines cover most needs.
---
## Bad Example
```php
// Building a custom engine for Elasticsearch when a community package exists
class ElasticsearchEngine extends Engine { /* 8 methods */ }
```
---
## Good Example
```php
// Using an existing community package via Scout::extend()
Scout::extend('elasticsearch', fn ($app) => new ElasticsearchEngine($app));
```
---
## Exceptions
Proprietary backends, unsupported engines, or when no community package exists for your search backend.
---
## Consequences Of Violation
Unnecessary development and maintenance burden, potential bugs in engine interface implementation.

## Use searchableUsing for Per-Model Engine Selection
---
## Category
Architecture
---
## Rule
Use `searchableUsing()` on a model to assign a specific engine when different models require different search backends.
---
## Reason
Without per-model engine selection, all Searchable models must use the same engine, preventing optimized routing (e.g., products to Meilisearch, logs to database engine).
---
## Bad Example
```php
// All models forced to use the same engine via SCOUT_DRIVER
```
---
## Good Example
```php
class Product extends Model
{
    use Searchable;

    public function searchableUsing(): Engine
    {
        return app(MeilisearchEngine::class);
    }
}

class AuditLog extends Model
{
    use Searchable;

    public function searchableUsing(): Engine
    {
        return app(DatabaseEngine::class);
    }
}
```
---
## Exceptions
Single-engine applications where all models use the same backend.
---
## Consequences Of Violation
Suboptimal engine utilization, unnecessary infrastructure for models that don't need dedicated search.

## Document Engine-Specific Features Used
---
## Category
Maintainability
---
## Rule
Always document which engine-specific features (typo tolerance, ranking rules, faceting) your application relies on, since Scout's abstraction does not cover them.
---
## Reason
Switching engines becomes risky when undocumented engine-specific features silently break, causing search quality degradation.
---
## Bad Example
```php
// Using engine-specific features with no documentation
Product::search($q)->query(fn ($meilisearch, $query) => $meilisearch->...);
```
---
## Good Example
```php
// Documented in ARCHITECTURE.md
// "We use Meilisearch's custom ranking rules via index-settings config"
```
---
## Exceptions
When only using Scout's generic API (where, paginate, search) with no engine-specific calls.
---
## Consequences Of Violation
Broken search after engine migration, debugging difficulty, team knowledge loss.
