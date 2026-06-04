## Always set GOMEMLIMIT to 80% of the container memory limit in FrankenPHP containers
---
Category: Configuration
---
Configure the GOMEMLIMIT environment variable to 80% of the container's memory limit in every FrankenPHP container deployment.
---
Reason: Without GOMEMLIMIT, Go's runtime can grow its heap until the container OOM-kills the process. Setting it to 80% provides the Go garbage collector with a soft target while leaving 20% headroom for the page cache, filesystem buffers, and PHP thread allocations. This prevents OOM kills while maximizing available memory for the Go runtime.
---
Bad Example:
```yaml
# No GOMEMLIMIT — Go heap grows unbounded, OOM risk
resources:
  limits:
    memory: "1Gi"
# GOMEMLIMIT not set
```

Good Example:
```yaml
# GOMEMLIMIT at 80% of container limit
resources:
  limits:
    memory: "1Gi"
```
```dockerfile
ENV GOMEMLIMIT=800MiB
```
---
Exceptions: Go runtimes below version 1.19 do not support GOMEMLIMIT. Upgrade to Go 1.19+ or use cgroup-based limits as a fallback.
---
Consequences Of Violation: Unbounded Go heap growth, container OOM kills, service unavailability under memory pressure.

## Use debian-slim (glibc) base images for production FrankenPHP containers, not Alpine (musl)
---
Category: Performance
---
Choose debian-slim or official FrankenPHP debian-based Docker images for production deployments; reserve Alpine images for development only.
---
Reason: musl's memory allocator and string operations are 10-20% slower than glibc for PHP workloads. This performance penalty directly reduces throughput on every request. For a 500 RPS application, Alpine costs 50-100 RPS in lost capacity. The image size savings of Alpine do not justify the permanent throughput penalty for production.
---
Bad Example:
```dockerfile
# Alpine in production — 10-20% performance penalty
FROM dunglas/frankenphp:latest-alpine
```

Good Example:
```dockerfile
# debian-slim for production
FROM dunglas/frankenphp:latest-debian
```
---
Exceptions: Environments with extreme disk or memory pressure where every MB of image size matters may accept the performance penalty.
---
Consequences Of Violation: 10-20% lower throughput, higher CPU utilization for the same workload, wasted capacity that could have been avoided with the correct base image.

## Calculate max_threads from the container OOM risk formula, not by guessing
---
Category: Reliability
---
Use the formula max_threads = (container_limit × 0.75 - Go_overhead) / P95_thread_RSS to determine the safe maximum thread count, with Go_overhead estimated at 50-100MB.
---
Reason: FrankenPHP's memory consumption has two components: Go runtime memory (Caddy, TLS, goroutines) and PHP thread memory (Zend MM, per-request allocations). Without a formula-based calculation, max_threads can exceed available memory, causing OOM kills. The 0.75 factor leaves 25% headroom for page cache and temporary allocations.
---
Bad Example:
```yaml
# Guessing max_threads — no memory calculation
# Container: 1GB limit
max_threads: 32  # May exceed memory budget by 2x
```

Good Example:
```yaml
# Formula-based calculation
# 1GB × 0.75 = 768MB budget
# 768MB - 80MB Go overhead = 688MB for threads
# 688MB / 80MB per thread = 8 threads
max_threads: 8  # Calculated, not guessed
```
---
Exceptions: When P95 thread RSS data is unavailable, use 80MB as a conservative estimate and recalibrate after one week of production data.
---
Consequences Of Violation: OOM kills from oversubscribed thread pool, container restarts, service unavailability during traffic spikes.

## Set PHP memory_limit per thread in addition to GOMEMLIMIT
---
Category: Configuration
---
Configure memory_limit in php.ini for FrankenPHP threads to provide per-thread fault isolation independent of the Go-level GOMEMLIMIT.
---
Reason: GOMEMLIMIT controls the Go runtime's total memory but cannot limit individual PHP threads. Without per-thread memory_limit, a single request with excessive memory allocation can exhaust available memory and crash all threads in the process. memory_limit ensures one leaky request crashes only its own thread, which the pool automatically restarts.
---
Bad Example:
```dockerfile
# No per-thread memory limit — one request can crash all threads
# memory_limit not configured (default: 128M)
```

Good Example:
```dockerfile
# Per-thread memory limit configured
RUN echo "memory_limit = 128M" > /usr/local/etc/php/conf.d/memory.ini
```
---
Exceptions: Applications with carefully audited memory usage may use memory_limit = -1 but must implement equivalent safeguards through request-level monitoring.
---
Consequences Of Violation: A single memory-intensive request crashes all threads, full process restart required, all concurrent requests lost.

## Monitor FrankenPHP memory in separate layers — Go heap, PHP thread RSS, and OpCache
---
Category: Monitoring
---
Track Go heap size, per-thread PHP RSS, and OpCache memory usage as separate metrics to identify which layer is driving memory growth.
---
Reason: Each memory layer has different growth patterns and root causes. Go heap growth indicates Caddy or TLS issues. PHP thread RSS growth indicates application memory leaks. OpCache growth indicates file cache pressure. Combined monitoring hides these signals — a slowly growing OpCache looks like a thread leak, leading to incorrect diagnosis and wasted investigation time.
---
Bad Example:
```bash
# Combined memory monitoring — can't identify root cause
# "Memory is growing" — no way to tell if Go, PHP, or OpCache
```

Good Example:
```bash
# Per-layer monitoring
# Go heap stable at 120MB — OK
# PHP thread RSS growing 2MB/hour — leak detected in application code
# OpCache stable at 80MB — OK
```
---
Exceptions: Development environments where individual layer granularity is unnecessary may use combined memory tracking.
---
Consequences Of Violation: Misdiagnosed memory issues, wasted investigation time, leaks undetected until they cause OOM.
