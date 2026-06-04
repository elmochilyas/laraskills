## Only configure pm.min_spare_servers when pm=dynamic; it is ignored by static and ondemand
---
Category: Configuration
---
Set pm.min_spare_servers exclusively in pools using dynamic process manager — do not configure it for static or ondemand pools.
---
Reason: pm.min_spare_servers has no effect in static mode (all workers are always active) or ondemand mode (zero idle workers by design). Configuring it in those pools creates a misleading impression of control while the actual behavior is determined by different settings. Only dynamic mode uses the idle worker target range.
---
Bad Example:
```ini
; Misleading — min_spare is ignored in static mode
pm = static
pm.min_spare_servers = 10 ; Wasted configuration — has no effect
```

Good Example:
```ini
; Only configure min_spare in dynamic mode
pm = dynamic
pm.min_spare_servers = 3 ; Effective — dynamic mode uses this
pm.max_spare_servers = 10
```
---
Exceptions: None. This rule is universal across all PHP-FPM versions.
---
Consequences Of Violation: Misleading configuration, false sense of control over idle worker behavior, no actual effect on pool behavior.

## Always keep pm.min_spare_servers below pm.max_spare_servers with a meaningful gap
---
Category: Configuration
---
Ensure pm.min_spare_servers is at least 30-50% below pm.max_spare_servers to create a buffer zone that prevents the process manager from oscillating between spawning and killing workers.
---
Reason: When min and max spare are too close, minor traffic fluctuations push the idle count below the minimum (triggering a spawn) or above the maximum (triggering a kill). The FPM master oscillates as traffic varies within the narrow band, creating unnecessary process churn, spawn latency, and CPU overhead.
---
Bad Example:
```ini
; Too close — oscillation under normal traffic variance
pm.min_spare_servers = 8
pm.max_spare_servers = 10 ; 2-worker buffer — spawn/kill on every fluctuation
```

Good Example:
```ini
; Meaningful gap — stable idle buffer
pm.min_spare_servers = 5
pm.max_spare_servers = 20 ; 15-worker buffer — absorbs traffic variance
```
---
Exceptions: When memory is extremely constrained and the gap must be minimized, set a minimum 2-worker buffer and monitor spawn frequency.
---
Consequences Of Violation: Unnecessary spawn/kill cycles, added latency from constant worker spawning, CPU wasted on process management overhead.

## Set pm.min_spare_servers based on baseline traffic, not max_children
---
Category: Design
---
Calculate pm.min_spare_servers from the baseline idle request rate: min_spare = baseline_RPS × avg_request_duration_seconds.
---
Reason: The purpose of min_spare_servers is to absorb traffic spikes without spawn latency. The appropriate value depends on how many workers are needed to handle normal low-traffic periods — not the maximum pool size. Setting it as a percentage of max_children (e.g., "10%") ignores the actual traffic pattern and either wastes memory or fails to provide adequate buffer.
---
Bad Example:
```ini
; Arbitrary percentage of max_children — traffic-agnostic
pm.max_children = 100
pm.min_spare_servers = 10 ; Should be 10% of max? No — depends on traffic
```

Good Example:
```bash
# Calculated from baseline traffic: 5 RPS × 2s avg response = 10 workers needed
```
```ini
pm.min_spare_servers = 5 ; Covers baseline with margin
pm.max_spare_servers = 20 ; Room for 2x traffic spike
```
---
Exceptions: When traffic data is unavailable, start at 2-5 for low-traffic or 10-20 for high-traffic APIs and adjust based on spawn event monitoring.
---
Consequences Of Violation: Either wasted memory (too many idle workers for low baseline traffic) or inadequate buffer (too few for high baseline traffic, causing spawn latency on every request).

## Never set pm.min_spare_servers to 0 in dynamic mode
---
Category: Performance
---
Always set pm.min_spare_servers to at least 1 in dynamic mode; never use 0.
---
Reason: With min_spare_servers=0, the FPM master allows the idle pool to drain completely. Every traffic dip creates a deficit that triggers a spawn cascade, and every subsequent request pays spawn latency until the spawn rate limiter restores workers. A minimum of 1-2 ensures at least a small buffer exists, avoiding the constant spawn-churn cycle.
---
Bad Example:
```ini
; Zero minimum — no idle buffer
pm = dynamic
pm.min_spare_servers = 0 ; Every fluctuation triggers spawning
```

Good Example:
```ini
; Minimum buffer
pm = dynamic
pm.min_spare_servers = 2 ; Small buffer prevents constant spawn churn
pm.max_spare_servers = 10
```
---
Exceptions: Environments where memory is so constrained that even one idle worker is unacceptable — but in that case, prefer ondemand mode over dynamic with min_spare=0.
---
Consequences Of Violation: Constant spawn/kill churn as workers are spawned on each request and killed shortly after, added latency from spawn events on every traffic uptick.

## Monitor spawn events in FPM error log to validate min_spare configuration
---
Category: Monitoring
---
Check the FPM error log for "spawning child" messages at regular intervals and alert if the rate exceeds one spawn per 10 seconds during normal traffic.
---
Reason: The spawn rate in the FPM log directly reflects whether min_spare_servers is adequate for the traffic pattern. Frequent spawning (>1 per 10s) during normal traffic means the idle buffer is too small — the master cannot maintain the minimum idle count, so it spawns continuously. This adds latency to every request that triggers a spawn and wastes CPU on process creation.
---
Bad Example:
```bash
# Spawn events not monitored — problem hidden
# FPM error log fills with "spawning child" messages, no one checks
```

Good Example:
```bash
# Monitoring spawn rate
spawn_count = grep -c "spawning child" /var/log/php-fpm/error.log
if spawn_count > 360_per_hour:  # More than 1 per 10s
    alert("Excessive spawning — min_spare_servers may be too low")
```
---
Exceptions: During deployment or cache clear events, elevated spawn rates are expected for 1-2 minutes.
---
Consequences Of Violation: Unnoticed spawn churn, degraded request latency from constant worker creation, increased CPU usage from process management.
