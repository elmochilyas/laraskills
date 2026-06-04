## Always set max_children below the calculated RAM ceiling with 15%+ headroom
---
Category: Reliability
---
Leave at least 15% of available RAM free after calculating max_children from P95 RSS, and set max_children to a value that ensures this headroom.
---
Reason: The RAM ceiling formula gives the theoretical maximum concurrent workers. Operating at the ceiling leaves zero room for RSS variance, page cache pressure, or traffic spikes. At 85%+ RAM utilization, OOM risk increases non-linearly. The headroom is essential operational safety margin, not waste.
---
Bad Example:
```ini
; Operating at the ceiling — no safety margin
; 20GB available / 110MB RSS = 186 workers — no headroom
pm.max_children = 186 ; 100% RAM utilization — first spike causes OOM
```

Good Example:
```ini
; 15% headroom below ceiling
; 20GB × 0.85 = 17GB safe capacity / (110MB × 1.3) = 121 workers
pm.max_children = 120 ; 15% RAM free under peak
```
---
Exceptions: Auto-scaling environments where new instances are provisioned before crossing thresholds may use 10% headroom.
---
Consequences Of Violation: OOM kills from minor RSS variance, SWAP thrashing, cascading server crash under traffic spikes.

## Monitor listen queue rather than active processes for earliest saturation detection
---
Category: Monitoring
---
Track the FPM status page listen queue metric and alert when it exceeds 0 for more than 30 seconds, rather than waiting for active processes to reach max_children.
---
Reason: Listen queue > 0 is the earliest indicator of pool saturation — requests are waiting because all workers are busy. By the time active_processes = max_children, the pool has already been saturated and requests have been queued. Listen queue gives a 10-30 second earlier warning.
---
Bad Example:
```bash
# Alerting too late — saturation already happened
if active_processes == max_children:
    alert("Pool saturated") # Too late — requests already queued
```

Good Example:
```bash
# Alerting early — listen queue signals impending saturation
if listen_queue > 0:
    alert("Listen queue growing") # Early warning — 10-30s before max_children hit
```
---
Exceptions: None. Listen queue is always the preferred early indicator.
---
Consequences Of Violation: Delayed detection of pool saturation, longer time-to-resolution during traffic spikes, increased latency for end users before the team is notified.

## Measure worker RSS under realistic production load, not idle state
---
Category: Performance
---
Sample worker RSS at 10-second intervals during peak production traffic to establish the P95 value used for capacity calculations, never during low-traffic or maintenance periods.
---
Reason: Idle worker RSS can be 30-50% lower than RSS under load due to memory allocations made during request processing. Basing capacity calculations on idle RSS overcommits memory by the same margin, creating severe OOM risk during the very peak conditions the calculation is meant to handle.
---
Bad Example:
```bash
# Measured at 3 AM — 50% lower than peak values
avg_rss=45 # Idle measurement — dangerously low
max_children=200 # Based on idle, OOM during daytime peak
```

Good Example:
```bash
# Measured during peak traffic (2-4 PM)
p95_rss=98 # Under load — realistic
max_children=90 # Safe — based on actual peak usage
```
---
Exceptions: For new deployments without production traffic data, use staging load-test measurements as a starting point, then recalibrate within one week of going live.
---
Consequences Of Violation: Capacity oversubscription by 30-50%, OOM kills under the very peak load the server was designed to handle.

## Review worker capacity ceiling quarterly
---
Category: Maintainability
---
Recalculate the capacity ceiling every quarter and within one week of significant code or infrastructure changes.
---
Reason: Worker RSS, traffic volume, and request mix all drift over the application lifecycle. Code changes that add dependencies, increase object allocation, or change data access patterns directly impact per-worker memory usage. Without quarterly review, the capacity ceiling silently becomes inaccurate until a traffic spike triggers an incident.
---
Bad Example:
```ini
; Set once, never revisited
pm.max_children = 100 ; From 2023 — application has since doubled its memory footprint
```

Good Example:
```ini
; Reviewed and adjusted quarterly
; Q1 2026: P95=95MB, max_children=87
; Q2 2026: P95=110MB, max_children=75 (adjusted after RSS increase)
```
---
Exceptions: Stable applications with frozen code and flat traffic may extend to semi-annual reviews.
---
Consequences Of Violation: Silent capacity drift, unnoticed increase in OOM risk, eventual production incident from resource exhaustion.

## Never assume the theoretical capacity ceiling is the optimal operating point
---
Category: Design
---
Treat the calculated max_children ceiling as a maximum safety boundary, then find the optimal operating point through load testing — start conservative and increase while monitoring throughput and latency.
---
Reason: The formula gives a safe upper bound, but the throughput-maximizing worker count is often 10-30% below the ceiling. Beyond the inflection point, additional workers add memory pressure without increasing throughput. The optimal operating point is the lowest worker count that achieves target throughput with zero listen queue.
---
Bad Example:
```ini
; Ceiling = target — no optimization
pm.max_children = 100 ; Set to the calculated ceiling — may be past the inflection point
```

Good Example:
```bash
# Iterative optimization: start at 60, increase by 10, measure throughput
# At 80: maximum throughput, zero listen queue — optimal
# At 100: same throughput, higher memory pressure — past inflection
```
```ini
pm.max_children = 80 ; Optimal operating point, not the ceiling
```
---
Exceptions: Time-constrained deployments where immediate production stability is the priority may set the ceiling as a temporary value and optimize within two weeks.
---
Consequences Of Violation: Higher memory pressure than necessary, reduced headroom for spikes, potentially degraded throughput if past the inflection point.
