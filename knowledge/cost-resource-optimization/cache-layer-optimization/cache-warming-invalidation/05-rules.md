# Cache Warming & Invalidation Rules

## Rule 1: Use Laravel Cache Tags for Invalidation
- **Category**: Framework Usage
- **Rule**: Use `Cache::tags()` for atomic group invalidation rather than manual prefix scanning or full cache flush
- **Reason**: Tag-based invalidation is atomic with zero race conditions compared to prefix scanning; `Cache::tags(['posts'])->flush()` invalidates all post cache instantly
- **Bad Example**: Using `Cache::flush()` on deploy, invalidating all cache and causing 10 minutes of origin overload
- **Good Example**: Using `Cache::tags(['posts', 'users'])->flush()` to selectively invalidate only the relevant cache groups
- **Exceptions**: Non-Redis cache drivers (file, database) do not support tags natively
- **Consequences Of Violation**: Over-invalidation of unrelated cache or stale cache served for invalidated data

## Rule 2: Implement Stampede Prevention
- **Category**: Performance
- **Rule**: Always wrap expensive cache recomputation in a distributed lock using `Cache::lock()`
- **Reason**: Without stampede prevention, 100 concurrent requests may all recompute the same expired cache entry simultaneously, overloading the database
- **Bad Example**: 100 users request the same expired dashboard report simultaneously; 100 database queries execute at once, causing a database outage
- **Good Example**: `Cache::lock("report:dashboard")->block(5, fn() => expensiveComputation())` ensuring only one request recomputes
- **Exceptions**: Cache entries that are cheap to recompute (<10ms) do not need stampede prevention
- **Consequences Of Violation**: Database overload during cache expiration events; potential cascading failures

## Rule 3: Warm Critical Cache After Deploy
- **Category**: Performance
- **Rule**: Warm only critical cache entries (config, routes, top-N most accessed data) after deployment
- **Reason**: Cold cache after deploy causes 5-15 minutes of degraded performance as popular entries are recomputed on demand; selective warming eliminates this without wasting resources on unused entries
- **Bad Example**: Running `Cache::flush()` on deploy with no warm-up; every first request after deploy hits the database
- **Good Example**: Post-deploy script warming config cache, route cache, and top-100 most-viewed blog posts
- **Exceptions**: Zero-downtime deploys with blue-green environments may not need warming (second environment stays warm)
- **Consequences Of Violation**: 5-15 minutes of degraded performance after every deploy; database load spikes

## Rule 4: Use Versioned Cache Keys for Deploy Safety
- **Category**: Maintainability
- **Rule**: Append a version string to cache key prefixes and increment on deploy
- **Reason**: Versioned keys make old cache automatically unreadable; new keys get fresh data at natural read time; no explicit invalidation or flush needed
- **Bad Example**: Using non-versioned keys and issuing `Cache::flush()` on deploy, causing server overload
- **Good Example**: `Cache::put("posts:v2:{$post->id}", $html, 86400)`; on next deploy, increment to `v3`
- **Exceptions**: Applications that use cache tags for granular invalidation may prefer tag-based flushing over versioning
- **Consequences Of Violation**: Stale data served after deploy, or origin overload from mass invalidation

## Rule 5: Implement Event-Driven Invalidation
- **Category**: Architecture
- **Rule**: Fire cache invalidation events on model save/delete and use observers/listeners to invalidate related cache
- **Reason**: Reactive invalidation ensures cache consistency without waiting for TTL expiry; stale data is removed within milliseconds of the underlying change
- **Bad Example**: A blog post is updated but its cached HTML is served for another 23 hours until TTL expiry
- **Good Example**: Laravel model observer calls `Cache::tags(['posts'])->flush()` in the `saved()` event
- **Exceptions**: Read-heavy, write-rare data where TTL-based expiry is sufficient (static reference data)
- **Consequences Of Violation**: Stale data served for the duration of the TTL; users see outdated content
