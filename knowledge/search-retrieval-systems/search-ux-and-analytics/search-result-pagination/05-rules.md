---
## Rule Name
Use Scout's paginate() Over Manual Offset

## Category
Framework Usage

## Rule
Always use Scout's built-in `paginate()` method instead of manual offset/limit for search pagination.

## Reason
Scout's `paginate()` handles engine-specific pagination mechanisms, total count retrieval, and returns a proper LengthAwarePaginator.

## Bad Example
```php
// Manual pagination — may not work with all engines
$results = Product::search($query)->take(20)->skip(40)->get();
```

## Good Example
```php
// Scout pagination — works with all engines
$results = Product::search($query)->paginate(20, page: 3);
```

## Exceptions
Custom pagination logic for specific engine behaviors.

## Consequences Of Violation
Broken pagination with certain search engines that don't support skip/offset.

---
## Rule Name
Limit Page Depth

## Category
Design

## Rule
Always handle search engine page depth limits (e.g., Algolia max 1000 results).

## Reason
Search engines impose maximum page depth for performance. Exceeding the limit causes query failures.

## Bad Example
```php
// No limit check — may exceed engine max
Product::search($query)->paginate(20, page: 100);
// Algolia: throws error beyond 1000 results
```

## Good Example
```php
$maxResults = match (config('scout.driver')) {
    'algolia' => 1000,
    default => PHP_INT_MAX,
};
$page = min($page, $maxResults / $perPage);
```

## Exceptions
Engines without page depth limits (Meilisearch, Typesense).

## Consequences Of Violation
Search errors when users navigate beyond the engine's maximum page depth.

---
## Rule Name
Cache Popular Search Pages

## Category
Performance

## Rule
Always cache frequently accessed search result pages to reduce engine load.

## Reason
Each search pagination click triggers a new engine query. Caching popular pages avoids redundant queries.

## Bad Example
```php
// No caching — each page load hits engine
Product::search($query)->paginate(20);
```

## Good Example
```php
$results = Cache::remember("search:$query:page:$page", 3600, function () use ($query) {
    return Product::search($query)->paginate(20);
});
```

## Exceptions
Real-time data that cannot be stale (live inventory, availability).

## Consequences Of Violation
Redundant engine queries for frequently accessed search pages.
