## Progressively enable OpCache then JIT, never both at once
---
Category: Configuration
---
Always enable and tune OpCache to steady state before enabling JIT. Benchmark after each step.
---
Reason: JIT depends on OpCache. If OpCache has cache pressure or low hit rate, JIT will perform poorly. A progressive approach isolates each optimization's impact and prevents misattribution of results.
---
Bad Example:
```ini
; Enabling both simultaneously — can't isolate impact
opcache.enable=1
opcache.jit=1254
```

Good Example:
```ini
; Step 1: OpCache only
opcache.enable=1
opcache.memory_consumption=256
; Benchmark → verify hit rate >99%

; Step 2: Add JIT
opcache.jit=1254
opcache.jit_buffer_size=128M
; Benchmark → measure incremental gain
```
---
Exceptions: Greenfield deployments where baseline performance is known from similar environments.
---
Consequences Of Violation: Cannot attribute performance changes to specific optimizations, masking OpCache misconfiguration.

## JIT blacklist functions that cause guard failures (PHP 8.5+)
---
Category: Performance
---
Use opcache_jit_blacklist() to exclude functions that cause frequent guard failures or produce excessively large compiled code.
---
Reason: Functions with frequent guard failures compile to native code that always bails out to the interpreter, wasting buffer space. Blacklisting them preserves buffer capacity for code that actually benefits from JIT.
---
Bad Example:
```php
// Allowing problematic functions to waste JIT buffer
function processUserInput($data) {
    // Frequent type changes → guard failures → compilation waste
}
```

Good Example:
```php
// PHP 8.5+ JIT blacklist
opcache_jit_blacklist('processUserInput');
opcache_jit_blacklist('LegacyBridge::handle');
```
---
Exceptions: PHP versions below 8.5 where the blacklist API is unavailable.
---
Consequences Of Violation: JIT buffer space wasted on code that always bails to interpreter, reduced buffer for beneficial compilation.

## Keep JIT enabled on queue and cron workers
---
Category: Performance
---
Never disable JIT for queue workers, cron jobs, or batch processing. These workloads are often CPU-bound and benefit most from JIT.
---
Reason: Background workloads frequently perform data transformation, report generation, and other CPU-bound tasks. JIT provides 61-95% gain for these paths, far more than web request optimization.
---
Bad Example:
```ini
; php.ini for CLI (queue workers) — missing JIT
; No opcache.jit directive → JIT disabled by default in CLI
```

Good Example:
```ini
; php.ini for CLI
opcache.enable_cli=1
opcache.jit=1254
opcache.jit_buffer_size=128M
```
---
Exceptions: CLI scripts that run once and exit before JIT compilation amortizes.
---
Consequences Of Violation: 50%+ performance left on the table for background processing tasks.
