## Start worker count at CPU core count, increase 50-100% for I/O-bound workloads
---
Category: Configuration
---
Set the initial Octane worker count equal to the number of CPU cores, then increase by 50-100% if monitoring shows workers spending most of their time waiting (I/O-bound), but never exceed available memory or database connection limits.
---
Reason: CPU-bound workloads gain nothing from more workers than cores — additional workers add context switching overhead without throughput improvement. I/O-bound workloads benefit from extra workers because workers block on database queries, API calls, or file reads, leaving the CPU idle for other workers. The 50-100% increase accounts for the I/O wait ratio while staying within the memory budget. The formula is a starting point — monitor listen queue to validate.
---
Bad Example:
```yaml
# CPU-core-only count for I/O-bound workload — underutilized
pool:
  num_workers: 4  # 4 cores, but 80% I/O wait — workers idle 80% of time
```

Good Example:
```yaml
# I/O-adjusted count — better CPU utilization
pool:
  num_workers: 8  # 4 cores × 2 for I/O-bound — validated by monitoring
```
---
Exceptions: FrankenPHP threads use OS threads (not processes) — set num_threads to core count and max_threads to 1.5-2x for I/O-bound workloads.
---
Consequences Of Violation: Underutilized CPU (too few workers for I/O-bound) or OOM/connection exhaustion (too many workers for CPU-bound with limited resources).

## Set max_requests to 1000-5000 and calibrate based on observed RSS growth
---
Category: Reliability
---
Configure max_requests to 1000 as the default starting value, then increase to 5000 if worker RSS growth is <5% over 1000 requests, or decrease to 500 if RSS growth exceeds 20%.
---
Reason: The optimal max_requests balances memory safety against bootstrap waste. At 1000 max_requests, 0.1% of requests pay bootstrap cost. If RSS growth over 1000 requests is minimal (<5%), the worker can safely handle more requests per cycle — increasing to 5000 reduces bootstrap waste to 0.02%. If RSS growth is high (>20%), lower max_requests prevents memory drift at the cost of slightly more frequent recycling.
---
Bad Example:
```bash
# Guessing max_requests — no data
php artisan octane:start --max-requests=500  # Chosen arbitrarily
```

Good Example:
```bash
# Data-driven max_requests
# Monitor: RSS grows from 65MB to 71MB over 1000 requests (9%)
# Growth is moderate — max_requests=1000 is appropriate
php artisan octane:start --max-requests=1000
```
---
Exceptions: Applications with known memory leaks in vendor packages may need max_requests=500 as a temporary mitigation.
---
Consequences Of Violation: Excessive bootstrap overhead (too low) or unchecked memory drift (too high), both degrading effective throughput.

## Monitor listen queue to validate worker count — not CPU or memory alone
---
Category: Monitoring
---
Use listen queue depth (the number of requests waiting for an available worker) as the primary signal for worker count adequacy — zero listen queue means sufficient workers, growing listen queue means more workers needed.
---
Reason: CPU and memory are indicator metrics — listen queue is a direct measure of whether the worker pool can handle the current traffic rate. A server at 60% CPU with a growing listen queue needs more workers. A server at 90% CPU with zero listen queue has enough workers but may need query optimization. Listen queue tells you whether workers are the bottleneck, avoiding misdiagnosis from CPU or memory metrics alone.
---
Bad Example:
```bash
# CPU-based decision — misleading
# CPU at 60% — "less workers needed" but listen queue is growing
# Actually I/O-bound: more workers needed despite moderate CPU
```

Good Example:
```bash
# Listen queue-based decision
# Listen queue: 0 — workers are sufficient
# Listen queue growing: 5, 12, 25 — add more workers
```
---
Exceptions: Swoole coroutines handle multiple requests per worker — listen queue behavior differs from process-based models.
---
Consequences Of Violation: Wrong worker count from misleading CPU/memory signals, either under-provisioned (growing listen queue) or over-provisioned (wasted resources).

## Account for FrankenPHP thread nuances — threads are not workers
---
Category: Architecture
---
Understand that FrankenPHP threads share process memory and cannot be equated to RoadRunner workers or Swoole workers — thread count ≤ CPU cores for CPU-bound work, threads share OpCache but not request memory.
---
Reason: FrankenPHP threads are OS threads within a single process, not separate processes like RoadRunner workers or Swoole's process-per-worker model. Threads share the same address space — memory is cheaper per-thread (shared OpCache) but crash isolation is weaker (one thread's segfault can crash all threads). Worker configuration common to other drivers (num_workers) does not directly translate to FrankenPHP's num_threads.
---
Bad Example:
```caddy
# Treating threads like workers — over-provisioned
worker {
    num_threads 16  # 4-core CPU — 4x over-provisioned for CPU-bound work
}
```

Good Example:
```caddy
# Thread-appropriate configuration
worker {
    num_threads 4   # Equal to CPU cores
    max_threads 8   # 2x for I/O-bound spikes
}
```
---
Exceptions: I/O-bound workloads may benefit from max_threads up to 2x CPU cores, but thread contention at higher levels causes diminishing returns.
---
Consequences Of Violation: Thread contention degrades throughput (too many threads) or underutilized CPU (too few threads), incorrectly configured pool.

## Never set max_requests to 0 in any Octane driver
---
Category: Reliability
---
Always configure a finite, positive max_requests value in every Octane driver configuration — never set it to 0 or omit it entirely.
---
Reason: max_requests=0 disables worker recycling, allowing unbounded memory drift across all concurrent requests within a worker. Zend Memory Manager fragmentation accumulates indefinitely, growing worker RSS 1.5-2x over time until OOM. Every Octane driver (RoadRunner, Swoole, FrankenPHP) supports worker recycling — there is no valid reason to disable it in production.
---
Bad Example:
```yaml
# max_requests=0 — unbounded memory growth
pool:
  num_workers: 8
  max_jobs: 0  # Never recycle — RSS grows until OOM
```

Good Example:
```yaml
# Finite max_requests
pool:
  num_workers: 8
  max_jobs: 1000  # Controlled recycling
```
---
Exceptions: None. A finite max_requests is mandatory for production Octane deployments.
---
Consequences Of Violation: Unbounded memory drift, worker OOM after hours of operation, throughput degradation before crash, emergency worker recycling.
