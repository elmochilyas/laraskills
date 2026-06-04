## Check Packagist Before Building Custom Engine
---
## Category
Maintainability
---
## Rule
Always search Packagist for an existing community package before building a custom Scout engine from scratch.
---
## Reason
Community packages for common backends (Elasticsearch, OpenSearch) are battle-tested, maintained, and save weeks of development. Building from scratch duplicates effort and introduces new bugs.
---
## Bad Example
```php
// Months of development for an Elasticsearch engine
class ElasticsearchEngine extends Engine { /* 8 methods */ }
```
---
## Good Example
```php
composer require matchish/laravel-scout-elasticsearch
```
---
## Exceptions
Backends with no community package available (internal proprietary systems, niche databases).
---
## Consequences Of Violation
Wasted development time, higher maintenance burden, increased risk of bugs.

## Implement Graceful Degradation for Engine Failures
---
## Category
Reliability
---
## Rule
Always return empty results rather than throwing exceptions when the custom engine backend is unreachable.
---
## Reason
Search is often a non-critical feature. If the search backend is down, showing no results (or degraded results) is better than a 500 error page that breaks the entire application.
---
## Bad Example
```php
public function search(Builder $builder, $options = [])
{
    throw new EngineException('Backend unavailable'); // 500 error
}
```
---
## Good Example
```php
public function search(Builder $builder, $options = [])
{
    try {
        return $this->client->search(...);
    } catch (ConnectionException $e) {
        Log::warning('Search backend down: ' . $e->getMessage());
        return ['hits' => []]; // Graceful degradation
    }
}
```
---
## Exceptions
Applications where search is the core feature and downtime must propagate as errors.
---
## Consequences Of Violation
Application-wide 500 errors, poor user experience, unnecessary incident escalations.

## Implement All Eight Engine Methods Correctly
---
## Category
Reliability
---
## Rule
Implement all eight abstract methods of `Laravel\Scout\Engines\Engine` — `update`, `delete`, `search`, `paginate`, `map`, `mapIds`, `getTotalCount`, `flush` — and test each one individually.
---
## Reason
Partially implemented engines cause silent failures: missing `map()` returns wrong models, unimplemented `paginate()` crashes on paginated searches, broken `flush()` prevents full re-indexing.
---
## Bad Example
```php
class CustomEngine extends Engine
{
    public function flush($model)
    {
        // Empty implementation — re-index fails silently
    }
}
```
---
## Good Example
```php
class CustomEngine extends Engine
{
    public function flush($model)
    {
        $this->client->deleteIndex($model->searchableAs());
        $this->client->createIndex($model->searchableAs());
    }
    // ... all 7 other methods implemented and tested
}
```
---
## Exceptions
No common exceptions; all eight methods are required by the Engine contract.
---
## Consequences Of Violation
Unpredictable scout:import behavior, pagination crashes, silent data corruption.

## Use Chunked Batch Updates in Custom Engine
---
## Category
Performance
---
## Rule
Always chunk batch updates in the `update()` method to avoid memory exhaustion when indexing large model collections.
---
## Reason
Sending 50,000 records in a single bulk API call consumes excessive memory and may exceed backend request size limits.
---
## Bad Example
```php
public function update($models)
{
    $this->client->bulkIndex($models->all()); // All records at once
}
```
---
## Good Example
```php
public function update($models)
{
    $models->chunk(500)->each(function ($chunk) {
        $this->client->bulkIndex($chunk->all());
    });
}
```
---
## Exceptions
Backends with very high request size limits and small datasets.
---
## Consequences Of Violation
Memory exhaustion crashes, request size limit errors, failed indexing.
