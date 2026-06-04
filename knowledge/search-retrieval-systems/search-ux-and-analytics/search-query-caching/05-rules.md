---
## Rule Name
Normalize Cache Keys

## Category
Maintainability

## Rule
Always normalize cache keys by lowercasing, trimming, and sorting filter parameters.

## Reason
"In Stock", "in stock", and "  in stock  " should resolve to the same cache entry. Without normalization, cache hit ratio suffers.

## Bad Example
```php
$cacheKey = 'search.' . $request->q;  // "Laptop" vs "laptop" = different keys
```

## Good Example
```php
$normalized = trim(strtolower($request->q));
$sorted = $request->filters ? collect($request->filters)->sort() : collect();
$cacheKey = 'search.' . md5($normalized . $sorted->toJson() . $page);
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Low cache hit ratio — identical queries stored under different cache keys.

---
## Rule Name
Use Tag-Based Cache Invalidation

## Category
Architecture

## Rule
Always use Laravel cache tags for search results so they can be invalidated when data changes.

## Reason
Without tag-based invalidation, cache becomes stale or requires short TTLs that reduce hit ratio. Tags allow precise invalidation tied to model saves.

## Bad Example
```php
// No tags — cannot selectively invalidate
Cache::put($key, $results, 300);
```

## Good Example
```php
Cache::tags(['search_products'])->put($key, $results, 300);

// Invalidate on model save
Product::saved(fn() => Cache::tags(['search_products'])->flush());
```

## Exceptions
Environments without cache tag support (file cache, some Redis configs).

## Consequences Of Violation
Stale search results served until TTL expires, or cache frequently cleared (reducing hit ratio).

---
## Rule Name
Set Appropriate TTL Based on Data Freshness

## Category
Performance

## Rule
Set search cache TTL based on how frequently your data changes (1-5 minutes for most, longer for static content).

## Reason
Too-short TTL reduces cache effectiveness. Too-long TTL serves stale results. Match TTL to content update frequency.

## Bad Example
```php
Cache::put($key, $results, 86400);  // 24 hours — too stale
```

## Good Example
```php
$ttl = $this->contentIsStatic ? 3600 : 300;  // 1 hour static, 5 min dynamic
Cache::tags(['search_products'])->put($key, $results, $ttl);
```

## Exceptions
Real-time content (ticketing, live inventory) where caching is inappropriate.

## Consequences Of Violation
Stale search results or missed caching opportunities due to inappropriate TTL.
