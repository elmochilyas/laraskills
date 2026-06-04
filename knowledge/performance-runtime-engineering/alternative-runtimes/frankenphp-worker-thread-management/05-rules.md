## Calculate max_threads from available memory budget, not throughput desire
---
Category: Performance
---
Use the formula max_threads = (available_RAM - system_reserve - Go_overhead) / avg_thread_RSS with a 1.2x safety factor to determine the maximum thread count.
---
Reason: Each FrankenPHP thread consumes ~30-80MB RSS (similar to an FPM worker). Unlike FPM, threads also share Go runtime memory (Caddy, TLS, goroutines) that must be reserved separately. Setting max_threads based on throughput expectations rather than memory budget guarantees OOM kills under load. The formula ensures the thread pool stays within available memory.
---
Bad Example:
```caddy
# Guessing max_threads — OOM risk
worker {
    max_threads 32  # May exceed available memory by 2-3x
}
```

Good Example:
```caddy
# Formula-based: 8GB RAM - 1GB OS - 500MB Go = 6.5GB for threads
# 6.5GB / 80MB per thread / 1.2 safety = 67 threads
worker {
    num_threads 4
    max_threads 65  # Conservative, within memory budget
}
```
---
Exceptions: When P95 thread RSS data is unavailable, start with 50MB per thread and adjust after measuring production usage.
---
Consequences Of Violation: OOM kills from oversubscribed thread pool, all threads crash simultaneously, complete service unavailability.

## Set num_threads for baseline traffic and let auto-scaling handle spikes
---
Category: Configuration
---
Configure num_threads to handle average baseline traffic, with max_threads providing headroom for spikes through auto-scaling.
---
Reason: Setting num_threads too high wastes memory on idle threads that consume RSS without doing work. Setting it too low causes thread spawn latency (~30-100ms) on every traffic increase. The auto-scaling mechanism (triggered by max_wait_time) efficiently handles the gap between baseline and peak if num_threads is sized correctly for the average load.
---
Bad Example:
```caddy
# num_threads equal to max_threads — no auto-scaling benefit
worker {
    num_threads 12      # All threads always active
    max_threads 12      # Wastes memory during low traffic
}
```

Good Example:
```caddy
# num_threads for baseline, max_threads for spikes
worker {
    num_threads 4       # Handles baseline traffic
    max_threads 12      # Auto-scales for peak
    max_idle_time 30s   # Idle threads released after 30s
}
```
---
Exceptions: Applications with extremely predictable, flat traffic may set num_threads closer to max_threads after validating the traffic pattern.
---
Consequences Of Violation: Wasted memory on idle threads during low traffic (num_threads too high) or latency from thread spawn on every traffic increase (num_threads too low).

## Set max_requests per thread to prevent memory drift in FrankenPHP
---
Category: Reliability
---
Configure max_requests in the worker block (1000-5000) to recycle threads periodically and prevent unbounded memory growth.
---
Reason: Like FPM workers, FrankenPHP threads accumulate memory fragmentation over time through Zend Memory Manager allocations. Without periodic recycling via max_requests, thread RSS grows monotonically, eventually consuming all available memory. The recycling cost is lower than FPM because threads share OpCache memory, making more frequent recycling cheaper.
---
Bad Example:
```caddy
# No thread recycling — unbounded memory growth
worker {
    num_threads 4
    max_threads 12
    # max_requests not set
}
```

Good Example:
```caddy
# Thread recycling configured
worker {
    num_threads 4
    max_threads 12
    max_requests 2000   # Recycle after 2000 requests per thread
}
```
---
Exceptions: In environments where threads are short-lived (auto-scaling constantly creates new containers), max_requests may be set higher since the container lifecycle itself recycles threads.
---
Consequences Of Violation: Monotonic RSS growth, thread memory exhaustion over hours of operation, OOM kills, or degraded performance from memory pressure.

## Monitor thread pool utilization and alert at 80% capacity
---
Category: Monitoring
---
Track the number of busy threads versus max_threads and alert when utilization exceeds 80% for more than 30 seconds.
---
Reason: At 80% utilization, an unexpected traffic increase of 25% exhausts the thread pool, causing request queuing. 80% provides a 20% safety margin for auto-scaling to add threads (which takes 30-100ms per thread) before requests start waiting. Waiting until 100% utilization means requests are already queued before the alert fires.
---
Bad Example:
```bash
# Alerting at 100% thread utilization — too late
# Requests already queuing, latency already degraded
```

Good Example:
```bash
# Alerting at 80% thread utilization — proactive
# 20% headroom for auto-scaling before requests queue
```
---
Exceptions: Applications with very fast auto-scaling (sub-100ms thread spawn) may use 85-90% thresholds.
---
Consequences Of Violation: Requests queued before the team is alerted, latency degradation, potential 502 errors from thread pool exhaustion.
