## Always set pm.max_requests to a finite value between 500-1000 in production
---
Category: Reliability
---
Configure pm.max_requests to a value between 500-1000 requests per worker in every production PHP-FPM pool.
---
Reason: Without recycling (pm.max_requests=0), worker RSS grows 1.5-2x over ~10,000 requests due to Zend Memory Manager fragmentation that the OS cannot reclaim. Recycling at 500-1000 requests bounds this drift while keeping spawn overhead negligible (<0.1% CPU).
---
Bad Example:
```ini
; No recycling — memory drift allowed to grow unbounded
pm.max_requests = 0 ; RSS doubles over 12 hours
```

Good Example:
```ini
; Controlled recycling
pm.max_requests = 500 ; Spawn overhead: 0.012ms/request, drift controlled
```
---
Exceptions: Short-lived container environments where workers run for minutes, not hours, may use higher values (1000-2000) if drift is measured and acceptable.
---
Consequences Of Violation: Memory drift doubles worker RSS over extended operation, causing OOM kills, SWAP usage, and server instability under sustained traffic.

## Prefer mitigating memory drift over reducing spawn overhead
---
Category: Performance
---
Optimize pm.max_requests for memory stability first; treat spawn overhead as a secondary concern.
---
Reason: The quantified tradeoff shows spawn overhead at 500 max_requests is 0.012ms per request (<0.1% CPU). Memory drift, by contrast, can add 50%+ memory pressure across the pool. Raising max_requests to "reduce overhead" trades a negligible cost for a significant risk.
---
Bad Example:
```ini
; Raising max_requests to reduce overhead — misguided
pm.max_requests = 5000 ; Drift risk increases 10x for negligible overhead savings
```

Good Example:
```ini
; Optimizing for memory stability
pm.max_requests = 500 ; 0.012ms overhead is acceptable; drift is controlled
```
---
Exceptions: Workloads with measured drift <5% across 5000 requests may safely increase max_requests after verification.
---
Consequences Of Violation: Increased memory pressure, higher OOM risk, and reduced server stability for a CPU savings that is below measurement noise.

## Use preloading to reduce worker spawn cost
---
Category: Performance
---
Implement OpCache preloading to reduce PHP-FPM worker bootstrap time by 50-80%.
---
Reason: Preloading loads framework classes and common scripts into shared memory at FPM startup, eliminating per-worker compilation and loading for those files. This makes worker recycling cheaper, allowing more aggressive recycling without meaningful CPU cost.
---
Bad Example:
```ini
; No preloading — each worker recompiles all framework classes
; Spawn cost: ~50ms per worker
pm.max_requests = 2000 ; Raised to compensate for high spawn cost
```

Good Example:
```ini
; Preloading enabled — spawn cost drops to ~10ms
php_admin_value[opcache.preload] = /app/preload.php
pm.max_requests = 500 ; Frequent recycling is now cheap
```
---
Exceptions: Applications that cannot use preloading due to compatibility issues may use file cache or other warmup mechanisms instead.
---
Consequences Of Violation: Higher spawn cost discourages appropriate recycling frequency, leading to increased memory drift risk.

## Measure memory drift before tuning pm.max_requests
---
Category: Maintainability
---
Compare worker RSS at spawn versus after max_requests to quantify actual drift before adjusting the recycling threshold.
---
Reason: Drift magnitude varies by application, framework, and even request mix. A drift-blind approach may set max_requests too high (allowing dangerous drift) or too low (unnecessary recycling). Measured drift provides a data-driven target: if growth > 20%, lower max_requests; if growth < 5%, consider raising it.
---
Bad Example:
```ini
; Tuning without measurement — arbitrary choice
pm.max_requests = 1000 ; Chosen by guessing
```

Good Example:
```bash
# Measure first: RSS at spawn = 65MB, after 500 requests = 85MB (30% growth — too high)
# Lower max_requests
```
```ini
pm.max_requests = 300 ; After measurement: 20% drift at 300 — acceptable
```
---
Exceptions: When adding a new application, start with 500 as a safe default and measure within the first week.
---
Consequences Of Violation: Suboptimal recycling threshold — either excessive spawn overhead or dangerous memory drift.

## Never set pm.max_requests to 0 in production
---
Category: Reliability
---
Always configure a finite, positive value for pm.max_requests in every production pool.
---
Reason: The default value of 0 disables worker recycling entirely. Without recycling, Zend Memory Manager fragmentation accumulates indefinitely, causing unbounded RSS growth. Over 12-24 hours of sustained traffic, worker RSS can double, leading to pool-wide OOM.
---
Bad Example:
```ini
; Default — dangerous
; pm.max_requests not set — effectively 0
```

Good Example:
```ini
pm.max_requests = 500 ; Always set an explicit finite value
```
---
Exceptions: Stateless container environments with aggressive horizontal scaling and short worker lifetimes (<1 hour) may set higher values, never 0.
---
Consequences Of Violation: Unbounded memory growth, pool-wide OOM kills, cascading application failure under sustained traffic.
