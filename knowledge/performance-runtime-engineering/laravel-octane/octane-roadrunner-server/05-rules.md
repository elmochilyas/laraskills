## Set num_workers based on workload profile and memory budget, not CPU cores alone
---
Category: Configuration
---
Calculate RoadRunner's num_workers as CPU core count for CPU-bound workloads, 1.5-2x core count for I/O-bound workloads, then validate against available memory and database connection limits — never exceed the most restrictive bound.
---
Reason: Each RoadRunner PHP worker is a separate OS process consuming 30-80MB RSS and maintaining persistent database connections. CPU-based ratios alone ignore the memory and connection constraints that are typically more binding. Setting 16 workers on a 4GB server with 80MB RSS per worker consumes 1.28GB before any worker processes a request. The correct num_workers is the minimum of the CPU-ratio value, the RAM-ceiling value, and the DB-connection-limited value.
---
Bad Example:
```yaml
# CPU-only worker count — ignores memory and DB limits
pool:
  num_workers: 16  # 8 cores × 2 — but only 4GB RAM available
```

Good Example:
```yaml
# Multi-constraint worker count
# 8 cores, I/O-bound → 12-16 workers
# 16GB RAM, 80MB RSS → 200 workers max (not binding)
# DB max_connections = 100, 2 connections/worker → 50 workers max
pool:
  num_workers: 12  # CPU-based, validated against RAM and DB limits
```
---
Exceptions: When monitoring shows listen queue buildup and both RAM and DB connections have headroom, increase workers incrementally and verify.
---
Consequences Of Violation: OOM kills from excessive worker RSS (memory bound) or connection refused errors from exhausted database pool (connection bound).

## Always configure max_jobs (500-2000) in RoadRunner worker pool definitions
---
Category: Reliability
---
Set max_jobs in every RoadRunner pool configuration to recycle workers after 500-2000 requests and prevent unbounded memory drift.
---
Reason: Without max_jobs, PHP workers never reset their Zend Memory Manager state. Over thousands of requests, fragmented memory pages accumulate, growing worker RSS by 1.5-2x until OOM. max_jobs triggers periodic worker recycling that resets memory state. The cost (~10-50ms spawn cycle per worker) is negligible compared to the OOM risk it prevents. Adjust within the 500-2000 range based on observed memory growth rate.
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
  max_jobs: 1000  # Worker recycled after 1000 requests
```
---
Exceptions: Environments where workers are short-lived due to container auto-scaling may set higher values (5000+) or rely on instance lifecycle.
---
Consequences Of Violation: Monotonic RSS growth over hours, memory exhaustion, OOM kills, gradual throughput degradation before crash.

## Configure supervisor.max_workers to cap RoadRunner's worker pool expansion
---
Category: Configuration
---
Set an explicit maximum worker count in the supervisor section of `.rr.yaml` to prevent RoadRunner from spawning unlimited workers under load.
---
Reason: RoadRunner can spawn additional workers beyond num_workers on demand under certain configurations. Without an upper cap, a traffic spike could trigger worker creation that exhausts all available memory or database connections. The supervisor.max_workers value should be the absolute maximum the server can support based on the multi-constraint calculation (RAM, CPU, DB connections).
---
Bad Example:
```yaml
# No cap — workers can multiply beyond server capacity
pool:
  num_workers: 8
  # No max_workers — spike could trigger 100+ workers
```

Good Example:
```yaml
# Explicit cap at 150% of num_workers
pool:
  num_workers: 8
  supervisor:
    max_workers: 12  # Hard cap — never exceed available memory
```
---
Exceptions: Environments with auto-scaling (Kubernetes HPA) that adds instances before worker exhaustion may use a higher cap relative to num_workers.
---
Consequences Of Violation: Unbounded worker creation during traffic spikes, memory exhaustion, database connection pool overflow, cascading service failure.

## Configure allocate_timeout to 60s for Laravel Octane workers
---
Category: Configuration
---
Set allocate_timeout to 60 seconds in the RoadRunner pool configuration to account for Laravel's bootstrap time during worker startup.
---
Reason: Laravel Octane workers can take 2-10 seconds to bootstrap — loading the service container, registering providers, establishing connections. The default allocate_timeout may be too short, causing RoadRunner to kill workers that are still booting. A 60-second timeout provides ample margin for bootstrap while still detecting genuinely stuck workers.
---
Bad Example:
```yaml
# Default timeout too short for Laravel bootstrap
pool:
  num_workers: 8
  allocate_timeout: 10s  # Workers killed during bootstrap
```

Good Example:
```yaml
# Adequate timeout for Laravel workers
pool:
  num_workers: 8
  allocate_timeout: 60s  # Workers have time to boot fully
```
---
Exceptions: Applications with minimal service providers and fast bootstrap may use shorter timeouts (30s).
---
Consequences Of Violation: Workers killed during bootstrap, worker count below expected level, degraded throughput, false crash alerts from healthy workers that were killed too early.

## Never expose RoadRunner's RPC port to external networks
---
Category: Security
---
Bind the RoadRunner RPC listener to 127.0.0.1 only in production — never use 0.0.0.0 or expose the port to external networks.
---
Reason: The RPC interface provides administrative commands (rr reset, rr workers, rr status) that can inspect worker state, reset worker pools, and drain active connections. An attacker with RPC access can cause denial of service by resetting all workers, or gather intelligence about the worker pool configuration and size.
---
Bad Example:
```yaml
# RPC exposed to all interfaces — security risk
rpc:
  listen: tcp://0.0.0.0:6001
```

Good Example:
```yaml
# RPC restricted to localhost
rpc:
  listen: tcp://127.0.0.1:6001
```
---
Exceptions: Monitoring tools on separate hosts may require network-accessible RPC, but should use firewall rules and TLS authentication.
---
Consequences Of Violation: Unauthorized worker pool manipulation, denial of service via RPC reset commands, information disclosure about worker configuration.
