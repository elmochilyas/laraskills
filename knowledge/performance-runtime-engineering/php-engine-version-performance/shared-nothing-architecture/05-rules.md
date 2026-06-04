## Never share state across PHP-FPM workers via shared memory
---
Category: Architecture
---
Avoid sharing state across FPM workers using APCu, shared memory, or file-based state. Use external services for cross-request state.
---
Reason: PHP-FPM's shared-nothing architecture provides process-level isolation. Violating it with shared state introduces race conditions, subtle bugs, and data corruption that are extremely hard to debug.
---
Bad Example:
```php
// Shared state via APCu across FPM workers
apcu_store('request_count', apcu_fetch('request_count') + 1);
// Race condition: two workers increment simultaneously
```

Good Example:
```php
// External service for shared state
Redis::incr('request_count'); // Atomic, safe across workers
```
---
Exceptions: Read-only cached data (configuration, translations) stored via APCu is safe because it has no mutation race.
---
Consequences Of Violation: Race conditions, data corruption, non-deterministic bugs that are extremely difficult to reproduce.

## Choose memory-resident architecture when bootstrap exceeds 20% of request time
---
Category: Performance
---
Adopt Octane or persistent workers when framework bootstrap accounts for more than 20% of total request time.
---
Reason: In shared-nothing architecture, bootstrap runs on every request. For fast endpoints (<50ms), bootstrap is 60-80% of total time. Memory-resident architecture eliminates this overhead, providing 3-15x throughput gains.
---
Bad Example:
```php
// Shared-nothing for a 15ms API endpoint
// 10ms spent on bootstrap, 5ms on actual work
// 67% overhead on every request
Route::get('/fast-endpoint', fn() => ['status' => 'ok']);
```

Good Example:
```php
// Same endpoint on Octane — bootstrap runs once
Route::get('/fast-endpoint', fn() => ['status' => 'ok']);
// 5ms steady state after warmup
```
---
Exceptions: Slow applications (>500ms) where bootstrap is <10% of total time see minimal benefit from memory-resident architecture.
---
Consequences Of Violation: 3-15x lower throughput than possible for fast API endpoints, unnecessary infrastructure cost.

## Always optimize bootstrap within shared-nothing model
---
Category: Performance
---
Apply OpCache tuning, preloading, and Composer autoloader optimization even when using shared-nothing architecture.
---
Reason: These optimizations reduce bootstrap overhead within the shared-nothing model. OpCache provides 2-4x throughput, preloading reduces autoloading time, and --classmap-authoritative eliminates filesystem lookups.
---
Bad Example:
```bash
# Default Composer autoloader with filesystem lookups
composer install --no-dev
```

Good Example:
```bash
# Optimized autoloader
composer install --no-dev --optimize-autoloader --classmap-authoritative
```
---
Exceptions: Development environments where classmap changes require re-optimization.
---
Consequences Of Violation: 60-80% of fast request time wasted on bootstrap overhead.

## Never treat shared-nothing as a performance optimization
---
Category: Architecture
---
Avoid defending shared-nothing architecture as a "performance feature." It is a safety feature that optimizes isolation, not throughput.
---
Reason: Shared-nothing maximizes safety (no request can corrupt another) at the cost of per-request bootstrap overhead. For performance-sensitive workloads, memory-resident architecture is superior. Confusing safety with performance leads to wrong architectural decisions.
---
Bad Example:
```php
// Choosing FPM over Octane "for performance"
// Actually choosing isolation over throughput
```

Good Example:
```php
// Choose based on actual priority
// Need max throughput? → Octane / persistent workers
// Need max isolation? → PHP-FPM shared-nothing
```
---
Exceptions: Multi-tenant hosting environments where process-level isolation is a regulatory requirement.
---
Consequences Of Violation: Wrong architectural choices, unnecessary infrastructure cost, suboptimal performance.
