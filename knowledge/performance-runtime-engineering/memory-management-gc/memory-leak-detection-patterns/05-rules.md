## Never rely solely on pm.max_requests to mask memory leaks
---
Category: Reliability
---
Fix memory leaks at the root cause rather than relying on worker recycling to mask them.
---
Reason: pm.max_requests recycles workers before OOM but doesn't fix the leak. At scale, constant recycling (~200ms spawn overhead per replacement) adds significant CPU cost and increases latency variance. Fix the leak, don't hide it.
---
Bad Example:
```php
// Setting low max_requests instead of fixing the leak
pm.max_requests = 100
// Workers recycle 10x more often than necessary
```

Good Example:
```php
// Fix the root cause first
// Static property accumulation → use WeakReference or clear at boundaries
// Then set max_requests to optimal value (1000+)
```
---
Exceptions: Third-party package leaks that cannot be fixed — isolate via separate worker pool.
---
Consequences Of Violation: 5-10% CPU waste on constant worker recycling, increased latency from frequent spawns.

## Audit static properties before migrating to Octane
---
Category: Maintainability
---
Search for `static` properties across the codebase before moving from PHP-FPM to Octane. Each static property must be justified as intentionally persistent.
---
Reason: In PHP-FPM, static properties reset per request. In Octane, they persist across requests. Accumulated static data causes memory drift and state leakage between requests.
---
Bad Example:
```php
// Static property that accumulates in Octane
class Cache {
    public static array $store = []; // Grows with every request
}
```

Good Example:
```php
// Bounded cache or external store
class Cache {
    public static array $store = [];
    public static function set($key, $value) {
        if (count(self::$store) > 100) {
            array_shift(self::$store); // LRU eviction
        }
        self::$store[$key] = $value;
    }
}
```
---
Exceptions: Intentionally persistent caches with bounded size and clear eviction policy.
---
Consequences Of Violation: Monotonically increasing memory, state leakage between requests, eventual OOM.

## Use memory checkpointing at request boundaries to detect drift
---
Category: Monitoring
---
Log memory_get_usage() at the start and end of each request. Alert when baseline RSS drifts >20% over 1000 requests.
---
Reason: Rising baseline RSS across requests is the definitive indicator of a memory leak. Checkpointing catches leaks early, before OOM kills occur, and provides precise timing for when the leak started.
---
Bad Example:
```php
// No memory monitoring — leak detected only after OOM
```

Good Example:
```php
static $baseline = null;
$usageAfter = memory_get_usage(true);
if ($baseline === null) $baseline = $usageAfter;
$drift = $usageAfter - $baseline;
if ($drift > $baseline * 0.2) {
    // Alert: memory leak suspected
}
```
---
Exceptions: PHP-FPM where baseline resets per request naturally.
---
Consequences Of Violation: Leak detected only when OOM kills workers, causing production outages.
