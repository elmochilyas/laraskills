## Prefer simplePaginate Over paginate for Performance
---
## Category
Performance
---
## Rule
Use `simplePaginate()` instead of `paginate()` when total result count is not required (infinite scroll, API results, search-as-you-type).
---
## Reason
`paginate()` executes a `getTotalCount()` query on the search engine, which can be expensive on large indexes. `simplePaginate()` avoids this cost entirely.
---
## Bad Example
```php
// Total count computed unnecessarily for infinite scroll
$products = Product::search($q)->paginate(20);
```
---
## Good Example
```php
// No total count query — faster for scroll/API
$products = Product::search($q)->simplePaginate(20);
```
---
## Exceptions
When page navigation links (1, 2, 3...) with total count display are required.
---
## Consequences Of Violation
Unnecessary performance overhead, slower API responses, increased search engine load.

## Limit Pagination Depth
---
## Category
Reliability
---
## Rule
Never paginate beyond your search engine's documented page depth limit (e.g., Algolia caps at 1000 results).
---
## Reason
Most search engines enforce maximum page depth. Exceeding the limit returns empty results or errors for deep pages, breaking user navigation.
---
## Bad Example
```php
Product::search($q)->paginate(20, page: 100); // Page 100 = 2000th result
```
---
## Good Example
```php
// Check engine limits (Algolia: 1000 max)
$maxPage = min($request->page, 50);
Product::search($q)->paginate(20, page: $maxPage);
```
---
## Exceptions
Engines that support unbounded pagination (check documentation).
---
## Consequences Of Violation
Broken pagination at deep pages, confusing "no results" for valid queries.

## Cache Paginated Search Results
---
## Category
Performance
---
## Rule
Always cache paginated search results for high-traffic queries using query-hash-based cache keys.
---
## Reason
Each page request triggers a separate search engine query. Identical queries across users incur redundant costs and latency without caching.
---
## Bad Example
```php
// Every user hitting page 1 for "shoes" triggers a new API call
$products = Product::search('shoes')->paginate(20);
```
---
## Good Example
```php
$cacheKey = 'search.' . md5($request->fullUrl());
$products = Cache::tags(['search'])->remember($cacheKey, 300, function () use ($request) {
    return Product::search($request->q)->paginate(20);
});
```
---
## Exceptions
Personalized search results where each user gets different results.
---
## Consequences Of Violation
Wasted search engine costs, higher latency for repeated queries, unnecessary load.
