# Memo Cache Driver Rules

## Rule 1: Use Memo as a Wrapper Around Redis
- **Category**: Performance
- **Rule**: Configure the Laravel cache driver as 'memo' wrapping a Redis store in Laravel 13+
- **Reason**: Memo adds an in-memory layer on top of Redis; repeated lookups hit local memory (0ns latency) instead of querying Redis, reducing Redis GET commands by 50-80%
- **Bad Example**: Using Redis directly without memo; the same config value is fetched from Redis 10 times per request
- **Good Example**: Configuring `'default' => 'memo'` in config/cache.php with Redis as the underlying store; repeated lookups hit local memory
- **Exceptions**: Laravel versions before 13.x do not support the memo driver
- **Consequences Of Violation**: 50-80% more Redis GET calls than necessary; higher Redis connection pool pressure

## Rule 2: Enable Memo for Octane Applications
- **Category**: Framework Usage
- **Rule**: Use memo cache driver with Laravel Octane; it is sandboxed per-request in Laravel 13+
- **Reason**: Octane shares state across requests if not sandboxed; memo driver in Laravel 13.x clears per-request automatically, preventing data leakage between requests
- **Bad Example**: Using a manual in-memory cache (static property) with Octane; cached data persists across requests, serving stale data
- **Good Example**: Using Laravel's memo driver which handles per-request sandboxing automatically
- **Exceptions**: Custom Octane sandboxing configurations may need verification that memo clears correctly
- **Consequences Of Violation**: Stale cache data served across requests; potential data leakage between users

## Rule 3: Monitor Redis Command Count for Memo Effectiveness
- **Category**: Performance
- **Rule**: Track Redis GET command count before and after enabling memo driver to validate effectiveness
- **Reason**: Memo's benefit is visible as reduced GET command count; benchmark should show 50-80% reduction; if reduction is <30%, the application may not have many repeated cache lookups
- **Bad Example**: Enabling memo without monitoring; no data on whether it actually improved performance
- **Good Example**: Recording Redis INFO commandstats `cmdstat_get` before and after enabling memo; validating 60% reduction in GET commands
- **Exceptions**: Apps with very few repeated cache lookups may still benefit from memo for the repeated lookups that do occur
- **Consequences Of Violation**: No visibility into memo's actual impact; cannot justify its configuration or troubleshoot issues

## Rule 4: Combine Memo with Cache Tags
- **Category**: Framework Usage
- **Rule**: Use memo driver with Redis cache tags for efficient grouped invalidation
- **Reason**: Memo caches the Redis response, including tagged cache results; invalidation of a tag on the next request triggers a fresh Redis lookup
- **Bad Example**: Using memo without cache tags; cache invalidation requires flushing entire cache or tracking individual keys
- **Good Example**: Using `Cache::tags(['posts'])->put('post:123', $html, 3600)` with memo driver; tag invalidation works correctly through the memo layer
- **Exceptions**: Applications using file or database cache drivers where tags are not natively supported
- **Consequences Of Violation**: Cache invalidation is less precise; more keys invalidated than necessary
