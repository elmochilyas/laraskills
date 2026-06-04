## Classify workload as CPU-bound, I/O-bound, or mixed before sizing workers
---
Category: Design
---
Measure CPU utilization during peak load to classify workload: <50% CPU = I/O-bound, >70% CPU = CPU-bound, 50-70% = mixed.
---
Reason: The optimal workers-per-core ratio differs by an order of magnitude between CPU-bound (2-4/core) and I/O-bound (8-12/core). Blindly applying a single ratio leaves throughput on the table or causes context switching overhead. Measured classification provides a data-driven starting point.
---
Bad Example:
```ini
; Guessing the workload type
pm.max_children = 50 ; No classification — may be 2x too high or 2x too low
```

Good Example:
```bash
# Measure first: CPU at 30% during peak — I/O-bound
# Use 8-12 workers/core for I/O-bound
```
```ini
pm.max_children = 80 ; 8 cores × 10 workers/core — informed by classification
```
---
Exceptions: Applications with multiple distinct endpoint types should classify per-pool rather than per-server.
---
Consequences Of Violation: Either wasted capacity (too few workers for I/O-bound) or context switching overhead (too many workers for CPU-bound), both degrading throughput.

## Limit CPU-bound pools to 2-4 workers per CPU core
---
Category: Performance
---
For workloads where CPU utilization exceeds 70% during peak, cap worker count at 2-4 per core and never exceed the core count by more than 4x.
---
Reason: CPU-bound workers keep the CPU busy constantly. Beyond the optimal core count, additional workers add context switching overhead (TLB misses, cache pollution) that degrades per-request latency and reduces total throughput. The CPU is already saturated — more workers cannot improve it.
---
Bad Example:
```ini
; CPU-bound workload with too many workers
; Server: 4 cores, CPU-bound (90% utilization)
pm.max_children = 80 ; 20 workers/core — context switching dominates
```

Good Example:
```ini
; CPU-bound workload, correctly sized
; Server: 4 cores, CPU-bound
pm.max_children = 12 ; 3 workers/core — optimal range
```
---
Exceptions: If RAM is the binding constraint and forces a lower value than the CPU-bound ratio, use the RAM-constrained value.
---
Consequences Of Violation: Context switching overhead degrades throughput, increased latency variance, reduced requests per second despite more workers.

## Allocate 8-12 workers per CPU core for I/O-bound workloads
---
Category: Performance
---
For workloads where CPU utilization stays below 50% during peak, use 8-12 workers per core to maximize throughput.
---
Reason: I/O-bound workers spend most of their time waiting (database queries, HTTP calls, file reads). While one worker blocks on I/O, other workers can use the CPU. Higher worker counts maximize CPU utilization during I/O wait periods, directly increasing throughput without adding CPU contention.
---
Bad Example:
```ini
; I/O-bound workload with too few workers
; Server: 8 cores, I/O-bound (20% CPU)
pm.max_children = 16 ; 2 workers/core — CPU idle 80% of the time
```

Good Example:
```ini
; I/O-bound workload, correctly sized
; Server: 8 cores, I/O-bound
pm.max_children = 80 ; 10 workers/core — CPU utilized during I/O wait
```
---
Exceptions: When RAM or database connection limits are more binding than the CPU-based ratio, use the lower constraint.
---
Consequences Of Violation: Wasted CPU capacity, lower throughput than the hardware can support, longer request queues during traffic spikes.

## Always validate worker count against RAM budget before applying CPU ratios
---
Category: Architecture
---
Calculate the RAM-based max_children ceiling first, then apply the CPU-bound/I/O-bound ratio within that ceiling — never exceed the RAM ceiling.
---
Reason: RAM is typically the binding constraint in PHP-FPM deployments. The CPU ratio might suggest 80 workers, but if P95 RSS × 80 exceeds available RAM, the server will OOM. The correct max_children is always min(CPU_ratio_value, RAM_ceiling_value).
---
Bad Example:
```ini
; CPU ratio applied without RAM check — dangerous
; 8 cores, I/O-bound: 80 workers, but only 8GB RAM available
pm.max_children = 80 ; P95_RSS=110MB → 80 × 110MB = 8.8GB > 8GB → OOM
```

Good Example:
```ini
; RAM checked first
; 8 cores, 8GB available RAM, P95_RSS=110MB
; RAM ceiling = 8GB / (110MB × 1.3) = 57 workers
; CPU ratio for I/O-bound = 80
pm.max_children = 57 ; RAM is the binding constraint
```
---
Exceptions: When the database connection limit is even more restrictive than RAM, use that as the ceiling instead.
---
Consequences Of Violation: OOM kills from exceeding available RAM, server instability despite correctly calculated CPU ratios.

## Use separate pools for workloads with different I/O profiles
---
Category: Architecture
---
Create isolated PHP-FPM pools for CPU-heavy endpoints (report generation, image processing) and I/O-heavy endpoints (API, read-heavy pages) with independently sized worker counts.
---
Reason: A single pool forces a compromise ratio that fits neither workload. CPU-heavy requests underperform with too many workers (context switching); I/O-heavy requests bottleneck with too few (idle CPU). Separate pools let each workload operate at its optimal ratio without interference.
---
Bad Example:
```ini
; Single pool for mixed workloads
; Image processing (CPU-bound) and API (I/O-bound) in the same pool
pm.max_children = 50 ; Compromise — suboptimal for both
```

Good Example:
```ini
; Separate pools — each sized for its workload
; Pool www_cpu: CPU-bound, 2-4 workers/core
pm.max_children = 12

; Pool www_io: I/O-bound, 8-12 workers/core
pm.max_children = 80
```
---
Exceptions: Small applications with <50 req/s total traffic where pool isolation overhead exceeds the benefit.
---
Consequences Of Violation: One workload type degrades the other's performance, forcing a suboptimal compromise that wastes capacity on both sides.
