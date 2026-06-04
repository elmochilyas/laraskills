## Use Callback API for Per-Query Engine Customization
---
## Category
Architecture
---
## Rule
Use Scout's callback API (`->query(fn($engine, $query) => ...)`) for per-query customization, not for global settings that belong in index configuration.
---
## Reason
Global behavior (default ranking, typo tolerance) should be set at the index level. Per-query callbacks are for query-specific overrides (e.g., boosting a field for a specific search context).
---
## Bad Example
```php
// Default ranking rules set per-query — should be index-level config
Product::search('shoes')->query(fn ($m, $q) => $m->setRankingRules([...]));
```
---
## Good Example
```php
// Index-level: ranking rules in config/scout.php
// Per-query: temporary boost for seasonal search
Product::search('shoes')->query(fn ($m, $q) => $m->setFilter('season = summer'));
```
---
## Exceptions
When index-level configuration is not available for your engine for a specific setting.
---
## Consequences Of Violation
Inconsistent search behavior across queries, harder debugging, engine migration difficulties.

## Abstract Engine-Specific Callbacks Behind Service Classes
---
## Category
Code Organization
---
## Rule
Never put engine-specific callback logic directly in controllers; wrap it in dedicated service or query-builder classes.
---
## Reason
Inline callbacks in controllers are untestable in isolation, non-reusable across endpoints, and tightly couple search logic to HTTP layer.
---
## Bad Example
```php
class SearchController
{
    public function search(Request $request)
    {
        return Product::search($request->q)
            ->query(fn ($m, $q) => $m->setFilter('...')) // Logic in controller
            ->get();
    }
}
```
---
## Good Example
```php
class ProductSearchService
{
    public function search(string $query, array $filters = [])
    {
        return Product::search($query)
            ->query(fn ($m, $q) => $this->applyFilters($m, $filters))
            ->get();
    }
}
```
---
## Exceptions
Very simple applications with a single search endpoint and minimal engine customization.
---
## Consequences Of Violation
Code duplication, difficult testing, tight coupling, poor maintainability.

## Wrap Engine-Specific Code in Conditional Checks
---
## Category
Maintainability
---
## Rule
Always wrap engine-specific callback code in conditional checks for the current driver to prevent breakage when switching engines.
---
## Reason
Engine-specific parameters (Meilisearch filters, Typesense query_by) crash or silently fail when used with a different engine.
---
## Bad Example
```php
Product::search('shoes')->query(fn ($m, $q) => $m->setFilter('price > 10'));
// Crashes if engine switches to Typesense
```
---
## Good Example
```php
Product::search('shoes')->query(function ($engine, $query) {
    if (config('scout.driver') === 'meilisearch') {
        $engine->setFilter('price > 10');
    }
});
```
---
## Exceptions
Applications committed to a single engine with no migration plans.
---
## Consequences Of Violation
Runtime errors during engine migration, silent search failures, production incidents.
