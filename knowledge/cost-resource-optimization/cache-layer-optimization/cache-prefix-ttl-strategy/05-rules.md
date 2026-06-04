# Cache Prefix & TTL Strategy Rules

## Rule 1: Set TTL on Every Cache Key
- **Category**: Maintainability
- **Rule**: Always pass an explicit TTL to every `Cache::put()` call; never cache without expiry
- **Reason**: Keys without TTL accumulate until maxmemory is reached, triggering random evictions; explicit TTL ensures predictable cache behavior and prevents memory leaks
- **Bad Example**: `Cache::put('posts:123', $html)` with no TTL; the key stays in Redis forever, slowly filling memory
- **Good Example**: `Cache::put('posts:123', $html, 86400)` with explicit 24-hour TTL
- **Exceptions**: Truly immutable data with a small, bounded number of keys (configuration files)
- **Consequences Of Violation**: Cache fills with stale data; popular entries evicted unpredictably; hit ratio degrades

## Rule 2: Use Laravel Cache Tags for Group Invalidation
- **Category**: Architecture
- **Rule**: Use `Cache::tags()` for grouping related cache keys instead of manual prefix scanning
- **Reason**: Tags enable atomic multi-key invalidation (`Cache::tags('users')->flush()`) without scanning (which blocks Redis) and without flushing unrelated cache
- **Bad Example**: Using `Redis::keys('users:*')` to find and delete user cache entries—blocks Redis and is non-atomic
- **Good Example**: `Cache::tags(['users', 'active'])->put($key, $value, $ttl)` with `Cache::tags('users')->flush()` for atomic invalidation
- **Exceptions**: Non-Redis cache drivers that do not support tags (file, database)
- **Consequences Of Violation**: Over-invalidation of unrelated keys, or stale cache from missed invalidation

## Rule 3: Stagger TTL by +/-10% for High-Traffic Keys
- **Category**: Performance
- **Rule**: Add random jitter to TTL values for popular cache keys
- **Reason**: Without staggering, all keys of the same type expire simultaneously, causing origin load spikes and cache stampedes; jitter spreads expiration across a window
- **Bad Example**: All blog post HTML cache expires at exactly 3600 seconds; 1000 posts expire at the same moment, causing 1000 simultaneous database queries
- **Good Example**: Base TTL 3600 with random jitter: `3600 + rand(-360, 360)` spreading expiration across 12 minutes
- **Exceptions**: Keys with strict freshness requirements where jitter may cause premature expiration of some entries
- **Consequences Of Violation**: Periodic origin load spikes when large groups of keys expire simultaneously

## Rule 4: Prefix Queues and Cache by Environment
- **Category**: Security
- **Rule**: Include environment name in all cache and queue key prefixes
- **Reason**: Prevents cross-environment data contamination; staging workers processing production queue items can cause data corruption or security breaches
- **Bad Example**: Using `queues:emails` as queue name in both production and staging; staging workers may process production emails
- **Good Example**: Using `queues:production:emails` and `queues:staging:emails` as separate prefixes
- **Exceptions**: Shared development environments where cross-contamination is intentional
- **Consequences Of Violation**: Cross-environment data leakage; staging operations affecting production data

## Rule 5: Never Flush Entire Cache in Production
- **Category**: Reliability
- **Rule**: Never use `php artisan cache:clear` or `Cache::flush()` in production
- **Reason**: Full cache flush invalidates all entries simultaneously, causing origin overload for 5-30 minutes as all cache is recomputed on demand
- **Bad Example**: Running `php artisan cache:clear` during a deploy; all 10K cache entries expire at once, database CPU spikes to 100%
- **Good Example**: Using tag-based flush `Cache::tags(['posts'])->flush()` or versioned key prefixes for targeted invalidation
- **Exceptions**: Emergency scenarios where stale data must be immediately cleared; accept the performance impact
- **Consequences Of Violation**: Database overload, increased response times, potential application outage during cache rebuild
