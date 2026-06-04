## Always enable OpCache in production — highest-ROI PHP optimization
---
Category: Performance
---
Never run PHP in production without OpCache enabled. It is the single highest-ROI optimization for any PHP application.
---
Reason: OpCache provides 2-4x throughput improvement with zero code changes by eliminating the lex/parse/compile phases (60-80% of uncached request CPU time). 10-15% of production deployments still have it disabled.
---
Bad Example:
```ini
; OpCache not configured — defaults to disabled
; No opcache.enable=1 directive
```

Good Example:
```ini
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
```
---
Exceptions: Development environments where file changes must be immediately visible.
---
Consequences Of Violation: 50-75% lower throughput than possible, unnecessary CPU waste on recompilation.

## Never run OpCache with default settings in framework applications
---
Category: Configuration
---
Always tune memory_consumption, max_accelerated_files, and validate_timestamps for your application. Defaults are designed for small apps.
---
Reason: Default memory_consumption (128MB) is insufficient for Laravel/Symfony (256-512MB needed). Default max_accelerated_files (10000) is too low for 20K+ file codebases. Default validate_timestamps=1 adds stat() syscall overhead.
---
Bad Example:
```ini
; Default settings — insufficient for Laravel
opcache.enable=1
; memory_consumption=128 (default, too small)
; max_accelerated_files=10000 (default, too low)
; validate_timestamps=1 (default, CPU overhead)
```

Good Example:
```ini
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=32
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
```
---
Exceptions: Very small applications (<5000 files) where defaults are sufficient.
---
Consequences Of Violation: Cache full → eviction → hit rate below 90% → 50%+ CPU waste on recompilation.

## Verify OpCache is active before diagnosing other performance issues
---
Category: Maintainability
---
Always check opcache_get_status() first when investigating CPU spikes or performance degradation.
---
Reason: An under-provisioned OpCache mimics a CPU-bound bottleneck. Cache_full or low hit rate causes constant recompilation, appearing as application-level CPU issues. Check OpCache before profiling application code.
---
Bad Example:
```php
// Investigating CPU spike without checking OpCache
// 10 hours optimizing queries
// Actual cause: OpCache hit rate at 80%
```

Good Example:
```php
$status = opcache_get_status(false);
if ($status['cache_full'] || $status['statistics']['hit_rate'] < 99) {
    // Fix OpCache sizing first
}
```
---
Exceptions: Confirmed non-OpCache issues (clear database or application bottlenecks).
---
Consequences Of Violation: Wasted investigation hours, incorrect root cause identification.

## Set validate_timestamps=0 in all production environments
---
Category: Performance
---
Always set opcache.validate_timestamps=0 in production. Never leave timestamp validation enabled.
---
Reason: validate_timestamps=1 adds 200-2000 stat() syscalls per request. On a busy server (500 req/s, 500 files each), this eliminates 250,000 stat() calls per second, saving 1-3% CPU.
---
Bad Example:
```ini
; validate_timestamps=1 in production — unnecessary syscall overhead
opcache.validate_timestamps=1
opcache.revalidate_freq=2
```

Good Example:
```ini
; validate_timestamps=0 — no stat() overhead
opcache.validate_timestamps=0
; Must implement opcache_reset() in deployment pipeline
```
---
Exceptions: Environments without automated deployment pipelines that cannot call opcache_reset() after deploy.
---
Consequences Of Violation: 1-3% throughput loss, 250K stat() calls/second at scale, wasted CPU.
