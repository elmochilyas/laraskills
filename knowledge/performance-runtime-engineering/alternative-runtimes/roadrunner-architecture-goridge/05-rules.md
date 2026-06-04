## Always calculate PHP worker pool size from memory budget, not CPU count
---
Category: Performance
---
Determine RoadRunner's num_workers using the formula (available_RAM - Go_overhead) / avg_worker_RSS with a 1.2x safety factor, not by CPU core count alone.
---
Reason: Each RoadRunner PHP worker consumes ~30-80MB RSS as a separate OS process. Unlike Go's goroutines (which share the Go process memory), each PHP worker is an independent process with its own memory allocation. Setting num_workers based on CPU ratios without a memory check guarantees OOM kills. Go overhead (~50-100MB for the binary and runtime) must also be reserved.
---
Bad Example:
```yaml
# CPU-based worker count — OOM risk
pool:
  num_workers: 32  # 8 cores × 4 — may exceed memory by 2x
```

Good Example:
```yaml
# Memory-based worker count
# 8GB RAM - 1GB OS - 100MB Go = 7GB / 80MB per worker / 1.2 = 72 workers
pool:
  num_workers: 70  # Within memory budget
```
---
Exceptions: When CPU measurements show CPU exhaustion before memory is fully utilized, reduce workers to the CPU-constrained number.
---
Consequences Of Violation: OOM kills from excessive PHP worker processes, system instability, cascading failures under load.

## Configure max_jobs for worker recycling to prevent memory drift
---
Category: Reliability
---
Set max_jobs in every RoadRunner worker pool definition (500-2000) to recycle PHP workers and prevent unbounded memory growth.
---
Reason: RoadRunner PHP workers persist across requests, so Zend Memory Manager fragmentation accumulates over time. Without max_jobs, worker RSS grows monotonically, eventually exhausting available memory. max_jobs is RoadRunner's equivalent of pm.max_requests — it provides periodic recycling that resets each worker's memory state at the cost of a ~10-50ms spawn cycle.
---
Bad Example:
```yaml
# No worker recycling — unbounded memory growth
pool:
  num_workers: 8
  # max_jobs not set — workers never recycled
```

Good Example:
```yaml
# Worker recycling configured
pool:
  num_workers: 8
  max_jobs: 1000  # Recycle each worker after 1000 requests
```
---
Exceptions: Environments where workers are short-lived due to container auto-scaling may set higher max_jobs values.
---
Consequences Of Violation: Monotonic RSS growth over hours, memory exhaustion, OOM kills, gradual performance degradation before crash.

## Use Unix socket for Goridge relay instead of TCP
---
Category: Performance
---
Configure the Goridge communication channel to use Unix sockets instead of TCP for lower latency and better security.
---
Reason: Unix sockets bypass the TCP stack entirely, eliminating protocol overhead, loopback interface processing, and the TCP port namespace. This reduces per-message latency from ~5-10µs (TCP localhost) to ~1µs and removes the risk of exposing the Goridge port to the network. The performance difference is negligible per request but compounds at high throughput.
---
Bad Example:
```yaml
# TCP relay — higher latency, network exposure risk
rpc:
  listen: tcp://0.0.0.0:6001  # Exposed to network
```

Good Example:
```yaml
# Unix socket — lower latency, no network exposure
relay: unix:///var/run/roadrunner.sock
```
---
Exceptions: When PHP workers and the Go process must run on different machines (distributed deployment), TCP relay is required.
---
Consequences Of Violation: Higher per-message latency, unnecessary network exposure of the Goridge port, potential security vulnerability from exposed RPC endpoint.

## Always enable and tune OpCache alongside RoadRunner
---
Category: Performance
---
Configure OpCache with production-appropriate settings in every RoadRunner deployment; do not assume persistent workers eliminate the need for OpCache.
---
Reason: RoadRunner workers are long-running, but they still compile PHP files on first access. Without OpCache, every unique file accessed across the worker's lifetime (1000+ requests under max_jobs) is compiled from disk, adding 10-20% CPU overhead. OpCache shares compiled bytecode between workers within the same process tree, reducing per-worker memory and CPU usage even in a persistent-worker model.
---
Bad Example:
```yaml
# OpCache not configured — 10-20% unnecessary CPU overhead
# opcache.enable defaults to 1 but with no tuning
```

Good Example:
```ini
; php.ini for RoadRunner workers
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
opcache.revalidate_freq=0
```
---
Exceptions: Development environments where file changes must be reflected immediately may disable OpCache for convenience.
---
Consequences Of Violation: 10-20% higher CPU utilization than necessary, lower throughput, increased per-worker memory from uncompiled file caches.
