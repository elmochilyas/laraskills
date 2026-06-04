## Prefer Cursor Pagination for Production Data Syncs
---
## Category
Reliability
---
## Rule
Use cursor-based pagination for data synchronization jobs; use page-based only for user-facing list views requiring random access.
---
## Reason
Cursor pagination is stable under concurrent writes — new records don't shift page boundaries, eliminating duplicates or missed records during iteration.
---
## Bad Example
```php
$paginated = $connector->paginate(new ListOrdersRequest()); // page-based — can miss/duplicate records
```
---
## Good Example
```php
$paginated = $connector->paginate(new ListOrdersRequest(), paginationMethod: PaginationMethod::CURSOR);
```
---
## Exceptions
Admin panels where "jump to page N" is required and concurrent writes are minimal.
---
## Consequences Of Violation
Duplicate or missed records during data synchronization, inconsistent data between systems.
## Always Set Maximum Page Limits
---
## Category
Reliability
---
## Rule
Always configure a maximum page limit on paginated requests to prevent runaway API calls.
---
## Reason
APIs may return empty pages with `hasNext=true` or encounter bugs causing infinite pagination loops.
---
## Bad Example
```php
while ($paginated->hasNext()) { $paginated = $paginated->next(); } // potential infinite loop
```
---
## Good Example
```php
$paginated = $connector->paginate(new ListOrdersRequest(), maxPages: 100);
while ($paginated->hasNext()) { $paginated = $paginated->next(); }
```
---
## Exceptions
Known-bounded APIs that guarantee proper pagination termination.
---
## Consequences Of Violation
Runaway requests causing unexpected API costs, rate limit exhaustion, and prolonged job execution.
## Use LazyCollection for Large Paginated Data Sets
---
## Category
Performance
---
## Rule
Wrap paginated iteration in `LazyCollection` to process one page at a time without loading all results into memory.
---
## Reason
Fetching all pages via `collect()` stores the entire result set in memory, causing OOM on large data sets (50K+ records).
---
## Bad Example
```php
$allItems = collect(); // grows unbounded
while ($paginated->hasNext()) { $allItems = $allItems->merge($paginated->items()); }
```
---
## Good Example
```php
$items = LazyCollection::make(function () use ($connector) {
    $paginated = $connector->paginate(new ListOrdersRequest());
    while ($paginated->hasNext()) {
        yield from $paginated->items();
        $paginated = $paginated->next();
    }
});
foreach ($items as $item) { /* process one item at a time */ }
```
---
## Exceptions
Small result sets (<1000 records) where memory is not a concern.
---
## Consequences Of Violation
Memory exhaustion on large data syncs, OOM crashes, inability to process full datasets.
## Combine Pagination with Rate Limiting Plugin
---
## Category
Reliability
---
## Rule
Always enable the rate limiting plugin on connectors that perform deep pagination (100+ pages).
---
## Reason
Deep pagination generates many rapid requests that can trigger upstream rate limits.
---
## Bad Example
```php
class OrdersConnector extends Connector {
    use HasPagination; // no rate limiting — 200 pages = 200 rapid requests
}
```
---
## Good Example
```php
class OrdersConnector extends Connector {
    use HasPagination;
    use HasRateLimitPlugin;
    protected function boot(): void {
        $this->withRateLimit(new RateLimit(100, 60)); // 100 requests per 60 seconds
    }
}
```
---
## Exceptions
Internal services with no rate limits.
---
## Consequences Of Violation
429 rate limit errors during pagination, partial data synchronization, wasted retry resources.
## Implement Checkpointing for Long-Running Pagination
---
## Category
Reliability
---
## Rule
Save the last successful cursor/page ID during pagination to enable resume on failure.
---
## Reason
Full re-fetch on retry wastes time and API quota; checkpointing resumes from the last saved position.
---
## Bad Example
```php
// If pagination fails at page 50, next retry starts from page 1
```
---
## Good Example
```php
$checkpoint = Cache::get('sync:orders:checkpoint');
$paginated = $checkpoint
    ? $connector->paginate(new ListOrdersRequest(cursor: $checkpoint))
    : $connector->paginate(new ListOrdersRequest());
while ($paginated->hasNext()) {
    // process...
    Cache::put('sync:orders:checkpoint', $paginated->nextCursor(), 86400);
}
```
---
## Exceptions
Small data sets that paginate in seconds.
---
## Consequences Of Violation
Repeated full re-fetches waste API quota, prolong sync times, increase upstream load.
