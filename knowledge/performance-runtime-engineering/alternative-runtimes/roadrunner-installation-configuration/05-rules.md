## Version-lock the RoadRunner binary in deployment scripts
---
Category: Reliability
---
Pin a specific RoadRunner binary version (e.g., `v2024.1.0`) in deployment scripts and CI/CD pipelines — never use `latest` or unpinned version references.
---
Reason: RoadRunner releases across major versions have breaking changes in `.rr.yaml` schema, binary naming, and plugin APIs. An unpinned reference may pull a new major version mid-deployment, breaking the configuration format, plugin compatibility, or worker pool behavior. Version pinning ensures deterministic deployments and controlled upgrades.
---
Bad Example:
```bash
# Unpinned — version may change mid-deployment
curl -L https://github.com/roadrunner-server/roadrunner/releases/latest/download/rr-linux-amd64.zip
```

Good Example:
```bash
# Version pinned
curl -L https://github.com/roadrunner-server/roadrunner/releases/download/v2024.1.0/rr-linux-amd64.zip
```
---
Exceptions: Development environments where always using the latest version for testing is acceptable may skip pinning.
---
Consequences Of Violation: Unexpected breaking changes during deployment, `.rr.yaml` parsing failures, worker pool misconfiguration, production deployment failures.

## Configure max_jobs (500-2000) in every pool definition for memory safety
---
Category: Reliability
---
Always set max_jobs in the pool section of `.rr.yaml` to a value between 500-2000 requests per worker, adjusted based on application memory behavior.
---
Reason: Without max_jobs, RoadRunner PHP workers never recycle and accumulate Zend Memory Manager fragmentation indefinitely. This causes monotonic RSS growth that eventually OOM-kills workers or exhausts system memory. max_jobs triggers periodic worker recycling that resets memory state. Lower values (500) for memory-intensive applications; higher values (2000) for stable, lightweight applications.
---
Bad Example:
```yaml
# No max_jobs — unbounded memory growth
pool:
  num_workers: 8
```

Good Example:
```yaml
# max_jobs configured for memory safety
pool:
  num_workers: 8
  max_jobs: 1000  # Worker recycled after 1000 requests
  supervisor:
    max_worker_memory: 100  # Additional safety: restart if worker exceeds 100MB
```
---
Exceptions: Short-lived container environments where workers run for minutes may use higher values (5000+) or rely on container lifecycle for recycling.
---
Consequences Of Violation: Monotonic worker RSS growth, OOM kills after hours of operation, gradual throughput degradation before crash.

## Configure worker supervision (max_worker_memory) to auto-restart leaking workers
---
Category: Reliability
---
Enable the supervisor section in `.rr.yaml` with max_worker_memory set to 100-200MB to automatically restart workers that exceed the memory threshold.
---
Reason: Even with max_jobs configured, workers can develop sudden memory spikes from unexpected request patterns, memory leaks in new code, or corrupted request data. Without supervision, a single worker growing to 500MB can drag the entire pool down. max_worker_memory provides a hard per-worker memory ceiling that triggers automatic replacement, adding a second layer of memory safety beyond max_jobs recycling.
---
Bad Example:
```yaml
# No supervision — single leaky worker can crash the pool
pool:
  num_workers: 8
```

Good Example:
```yaml
pool:
  num_workers: 8
  max_jobs: 1000
  supervisor:
    max_worker_memory: 100  # Auto-restart if worker exceeds 100MB
    ttl: 3600s              # Also restart after 1 hour as additional safety
```
---
Exceptions: Memory-intensive applications with legitimate per-worker usage above 100MB should set the threshold to 2x the P95 worker RSS.
---
Consequences Of Violation: Single worker memory blowup causes OOM, all workers affected due to OS memory pressure, pool-wide crash.

## Use Unix socket for Goridge relay, not TCP
---
Category: Performance
---
Configure the Goridge relay transport to use Unix sockets when PHP workers and the Go binary run on the same machine, reserving TCP for cross-machine communication only.
---
Reason: Unix sockets eliminate TCP protocol overhead, loopback interface processing, and reduce per-message latency from ~5-10µs to ~1µs. They also eliminate the risk of exposing the Goridge port to the network, improving security. The performance benefit is small per message but compounds at thousands of requests per second.
---
Bad Example:
```yaml
# TCP relay — unnecessary overhead and exposure
rpc:
  listen: tcp://0.0.0.0:6001
```

Good Example:
```yaml
# Unix socket — lower latency, secure
rpc:
  listen: unix:///var/run/roadrunner.sock
```
---
Exceptions: When PHP workers are distributed across multiple machines, TCP relay is required.
---
Consequences Of Violation: Higher per-message latency, unnecessary network exposure, potential security vulnerability from an accessible RPC endpoint.
