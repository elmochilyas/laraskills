## Enable JIT universally, then benchmark
---
Category: Performance
---
Always enable JIT on all PHP 8.0+ deployments. Measure before/after to quantify benefit. Do not disable JIT because it doesn't help web requests.
---
Reason: JIT is harmless on I/O-bound paths (0-2% overhead) and provides 61-95% gain on CPU-bound paths. Even if web requests are I/O-bound, cron jobs, queue workers, and batch processing benefit significantly.
---
Bad Example:
```ini
; Disabling JIT because web endpoints don't see throughput gain
opcache.jit=0
```

Good Example:
```ini
; Enable JIT universally and measure impact
opcache.jit=1254
opcache.jit_buffer_size=128M
```
---
Exceptions: Memory-constrained environments where 128MB JIT buffer cannot be spared.
---
Consequences Of Violation: 61-95% performance left on the table for CPU-bound background workloads.

## Configure OpCache before JIT — never tune JIT first
---
Category: Configuration
---
Always optimize OpCache configuration before tuning JIT. JIT reads opcodes from OpCache shared memory and depends on it.
---
Reason: OpCache provides 2-4x throughput gain. JIT adds 0-95% on top. If OpCache is misconfigured (cache full, low hit rate), JIT performance suffers. Fix the foundation before optimizing on top of it.
---
Bad Example:
```ini
; Tuning JIT before OpCache — wrong order
opcache.jit=1235
opcache.jit_buffer_size=256M
; OpCache still at defaults (128MB, 10000 files)
```

Good Example:
```ini
; OpCache first, then JIT
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
; Then JIT
opcache.jit=1254
opcache.jit_buffer_size=128M
```
---
Exceptions: Environments where OpCache is already optimally configured.
---
Consequences Of Violation: Poor JIT results, mistaken conclusion that "JIT doesn't work," wasted tuning effort.

## Use tracing JIT (1254) as the default — switch only after profiling
---
Category: Performance
---
Start with tracing JIT mode (1254) for all deployments. Only switch to function (1205) or max (1235) modes after profiling confirms benefit.
---
Reason: Tracing JIT is the safest general-purpose setting with minimal compilation overhead. Function JIT is better for method-heavy code. Max mode has highest compilation overhead. Benchmark each mode before switching.
---
Bad Example:
```ini
; Max JIT everywhere without testing
opcache.jit=1235
opcache.jit_buffer_size=256M
```

Good Example:
```ini
; Start with tracing, benchmark, then adjust if needed
opcache.jit=1254
opcache.jit_buffer_size=128M
```
---
Exceptions: Known CPU-bound batch processing workloads where max mode is justified.
---
Consequences Of Violation: Higher compilation overhead, increased latency variance, potential buffer overflows.

## Monitor JIT buffer utilization — increase if <20% free
---
Category: Performance
---
Monitor jit_buffer_free after deployment. If free space drops below 20% of total buffer size, increase jit_buffer_size.
---
Reason: An undersized buffer causes compilation thrashing: compiling, evicting, and recompiling code. This negates JIT benefits and increases CPU usage. Monitor utilization and size accordingly.
---
Bad Example:
```ini
; Fixed 128MB buffer, never monitored
opcache.jit_buffer_size=128M
; Actual usage: 120MB used, 8MB free — thrashing!
```

Good Example:
```php
// Monitor and alert
$jit = opcache_get_status(false)['jit'];
$freePercent = $jit['buffer_free'] / $jit['buffer_size'] * 100;
if ($freePercent < 20) {
    // Increase jit_buffer_size
}
```
---
Exceptions: Applications with minimal CPU-bound work where JIT thrashing has negligible impact.
---
Consequences Of Violation: JIT compilation thrashing, hot paths reverting to interpreter, CPU waste.

## Pre-warm JIT in long-running processes
---
Category: Performance
---
Execute representative requests after worker start in Octane, Swoole, or FrankenPHP to trigger JIT compilation before accepting traffic.
---
Reason: JIT compilation happens on first encounter of hot code. Without pre-warming, the first 100+ requests on each worker run un-optimized. Pre-warming reduces cold-start latency variance.
---
Bad Example:
```php
// Octane worker starts and immediately accepts traffic
// First 100 requests per worker are slow (JIT not yet compiled)
```

Good Example:
```php
// Pre-warm JIT after worker start
$warmupUrls = ['/', '/api/health', '/api/products'];
foreach ($warmupUrls as $url) {
    $this->call('GET', $url); // Triggers JIT compilation
}
```
---
Exceptions: PHP-FPM with high pm.max_requests where workers recycle frequently.
---
Consequences Of Violation: Cold-start latency spikes, inconsistent response times after deployment.
