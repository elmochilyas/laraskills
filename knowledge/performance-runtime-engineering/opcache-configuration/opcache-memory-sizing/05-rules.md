## Size memory_consumption to your application, never use defaults
---
Category: Configuration
---
Calculate memory_consumption as num_files × avg_compiled_size / 0.8. Start at 256MB for Laravel/Symfony. Monitor and adjust.
---
Reason: Default 128MB is insufficient for modern frameworks. A Laravel app with 20K files × 10KB compiled size needs 200MB + 20% headroom = 256MB minimum. Undersizing causes cache_full, eviction, and recompilation.
---
Bad Example:
```ini
; Default 128MB for a 25K-file Laravel app
opcache.memory_consumption=128 ; cache_full within minutes
```

Good Example:
```ini
; Calculated sizing
opcache.memory_consumption=256 ; 20K files × 10KB / 0.8 ≈ 256MB
```
---
Exceptions: Small applications (<5000 PHP files) where 128MB default is sufficient.
---
Consequences Of Violation: Cache full → eviction → 50%+ CPU increase from recompilation.

## Monitor free_memory weekly — never set-and-forget
---
Category: Maintainability
---
Check opcache_get_status()['memory_usage']['free_memory'] weekly. If free memory drops below 20% of total, increase memory_consumption by 50%.
---
Reason: Application file count grows with features, packages, and dependencies. A correctly sized cache becomes undersized over time. Regular monitoring prevents gradual performance degradation.
---
Bad Example:
```php
// Set-and-forget — never monitored
// 6 months later: cache was full for 5 months
```

Good Example:
```php
// Weekly monitoring
$memory = opcache_get_status(false)['memory_usage'];
$freePercent = $memory['free_memory'] / $memory['total_memory'] * 100;
if ($freePercent < 20) {
    // Increase memory_consumption by 50%
}
```
---
Exceptions: Applications with stable, unchanging file counts.
---
Consequences Of Violation: Gradual hit rate decline, silent performance degradation over months.

## Never set memory_consumption to max available RAM
---
Category: Reliability
---
Size memory_consumption based on application need, not available RAM. Over-allocation permanently reserves memory that other processes need.
---
Reason: OpCache memory is pre-allocated at PHP-FPM startup and never released. Setting it to 4GB on an 8GB server starves PHP workers, databases, and other processes, potentially causing swap.
---
Bad Example:
```ini
; Wastes 3.5GB of RAM permanently
opcache.memory_consumption=4096 ; For a WordPress site
```

Good Example:
```ini
; Sized to actual need
opcache.memory_consumption=128 ; WordPress: 5K files × 10KB / 0.8 ≈ 64MB
```
---
Exceptions: Dedicated application servers with abundant RAM and no competing processes.
---
Consequences Of Violation: Memory pressure, swap usage, OOM killer activation.
