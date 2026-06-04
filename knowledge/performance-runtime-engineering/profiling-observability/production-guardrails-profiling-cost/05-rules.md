## Never enable profiling fleet-wide during an active incident
---
Category: Reliability
---
When activating profiling during an incident, always enable on canary hosts first (1-5% of traffic). Never activate on all hosts simultaneously.
---
Reason: If the system is already CPU-bound or degraded, adding profiling overhead (5-10% in high-frequency mode) can push it past the breaking point, causing complete collapse. Canary activation limits blast radius.
---
Bad Example:
```bash
# Enabling profiling on all 50 hosts during active CPU incident
# Added 8% overhead → system collapses
```

Good Example:
```bash
# Enable on 1-2 canary hosts first
# Verify overhead is acceptable, then expand if needed
```
---
Exceptions: Systems with eBPF profiling (<0.5% overhead) where fleet-wide activation is safe.
---
Consequences Of Violation: Complete system collapse during incident, cascading failure.

## Allocate a profiling cost budget — alert when exceeded
---
Category: Monitoring
---
Reserve 2% of total CPU budget for profiling. Monitor profiling overhead as a dashboard metric. Alert when it exceeds the budget.
---
Reason: Profiling overhead is real and measurable. Without a budget, profiling can silently consume CPU capacity that should serve user traffic. Budgeting ensures profiling costs are intentional and monitored.
---
Bad Example:
```bash
# Profiling running 24/7, overhead unmonitored
# Using 8% of fleet CPU for profiling — nobody noticed
```

Good Example:
```bash
# Budget: 2% CPU for profiling
# Alert: profiling_overhead > 2% for >5 minutes
```
---
Exceptions: Development/staging environments where profiling overhead is not a concern.
---
Consequences Of Violation: Unnoticed CPU drain, reduced capacity for user traffic.

## Always exclude health check endpoints from profiling
---
Category: Configuration
---
Configure health check, metrics, and monitoring probe endpoints to be excluded from all profiling.
---
Reason: Health check endpoints create noise in profiling data, waste profile storage, and serve no diagnostic value. They run on every host at high frequency, generating the most profiles with the least insight.
---
Bad Example:
```php
// Profiling all endpoints including /health
```

Good Example:
```php
// Exclude monitoring paths
if (str_starts_with($request->path(), 'health') || 
    str_starts_with($request->path(), 'metrics')) {
    return; // Skip profiling
}
```
---
Exceptions: Investigations specifically targeting health check endpoint performance.
---
Consequences Of Violation: Noise in profiling data, wasted storage, misleading flame graphs dominated by health check traffic.

## Use canary pools for continuous profiling
---
Category: Architecture
---
Run low-overhead profiling (1-5% sample rate) on canary pool hosts (1-5% of fleet) for continuous observability without fleet-wide overhead.
---
Reason: Continuous profiling on all hosts would consume 1-5% of total CPU fleet-wide. A canary pool provides representative profiling data from 1-5% of traffic with proportional overhead, while the rest of the fleet serves traffic without profiling cost.
---
Bad Example:
```bash
# 100% sampling on all 100 hosts
# 5% CPU overhead fleet-wide = 5 hosts of capacity lost
```

Good Example:
```bash
# 10% sampling on 5 canary hosts
# 0.025% CPU overhead fleet-wide = negligible
```
---
Exceptions: Very small fleets (<5 hosts) where canary pools are impractical.
---
Consequences Of Violation: 1-5% sustained CPU overhead fleet-wide, unnecessary capacity cost.
