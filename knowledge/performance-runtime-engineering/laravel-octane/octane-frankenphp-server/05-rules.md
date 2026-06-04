## Use worker mode (--workers) in every production FrankenPHP deployment
---
Category: Configuration
---
Launch FrankenPHP with the --workers flag or the frankenphp_worker Caddyfile directive — never use standard mode for production traffic.
---
Reason: Without worker mode, FrankenPHP creates a new PHP process per request, delivering throughput comparable to PHP-FPM (within 5-10%). Worker mode boots PHP once per thread and handles many requests per thread, achieving the 3-5x throughput advantage that justifies using FrankenPHP. Running standard mode in production negates Octane's primary benefit while adding the operational complexity of FrankenPHP.
---
Bad Example:
```bash
# Standard mode — no performance benefit over FPM
./frankenphp php-server
```

Good Example:
```bash
# Worker mode — 3-5x throughput
./frankenphp php-server --workers
```
---
Exceptions: Development environments where hot-reload is preferred may use standard mode for convenience.
---
Consequences Of Violation: Throughput comparable to FPM, wasted migration effort, team concludes FrankenPHP "doesn't help" based on misconfigured deployment.

## Set num_threads to CPU core count and max_threads to 1.5-2x for FrankenPHP
---
Category: Configuration
---
Configure num_threads equal to CPU core count as the minimum thread pool size, with max_threads at 1.5-2x CPU cores as the maximum for auto-scaling during traffic spikes.
---
Reason: Each FrankenPHP thread is an OS thread that handles one request synchronously. Setting num_threads below core count leaves CPU capacity unused. Setting num_threads above core count causes context switching overhead without throughput gain for CPU-bound workloads. max_threads at 1.5-2x allows the pool to handle I/O-bound requests where threads spend time waiting, while the auto-scaling mechanism (triggered by max_wait_time) adds threads only when needed.
---
Bad Example:
```caddy
# Single thread — no concurrency benefit
worker {
    num_threads 1  # No concurrency on multi-core CPU
}
```

Good Example:
```caddy
# Sized to CPU cores with headroom
worker {
    num_threads 4     # 4-core CPU baseline
    max_threads 8     # 2x for I/O-bound spikes
}
```
---
Exceptions: Containers with CPU limits below the physical core count should base thread count on the effective CPU limit.
---
Consequences Of Violation: Underutilized CPU (too few threads) or context switching overhead (too many threads for CPU-bound work), both degrading throughput.

## Set GOMEMLIMIT in every containerized FrankenPHP deployment
---
Category: Configuration
---
Always configure the GOMEMLIMIT environment variable to 80% of the container memory limit in FrankenPHP container deployments.
---
Reason: Without GOMEMLIMIT, the Go runtime's heap can grow until the container's cgroup OOM-kills the process. FrankenPHP runs both Go and PHP in the same process — memory pressure from either runtime causes a total process kill. Setting GOMEMLIMIT to 80% of the container limit provides a soft target for Go's GC while leaving 20% headroom for PHP thread memory, page cache, and filesystem buffers.
---
Bad Example:
```yaml
# No GOMEMLIMIT — Go heap grows unbounded
resources:
  limits:
    memory: "1Gi"
```

Good Example:
```yaml
# GOMEMLIMIT configured
resources:
  limits:
    memory: "1Gi"
```
```dockerfile
ENV GOMEMLIMIT=800MiB
```
---
Exceptions: Bare-metal FrankenPHP deployments without container boundaries may use system-level memory limits instead.
---
Consequences Of Violation: Container OOM kills under memory pressure, complete service unavailability, unpredictable process termination.

## Set max_requests per thread (500-2000) to prevent memory drift in FrankenPHP
---
Category: Reliability
---
Configure max_requests in the FrankenPHP worker block to recycle threads after 500-2000 requests and prevent unbounded memory growth in persistent threads.
---
Reason: FrankenPHP threads accumulate Zend Memory Manager fragmentation over time, similar to FPM workers. Without periodic recycling via max_requests, thread RSS grows monotonically until memory exhaustion. The recycling cost is lower than FPM because threads share OpCache memory, making more frequent recycling cheaper. Adjust within the 500-2000 range based on observed memory growth rate.
---
Bad Example:
```caddy
# No thread recycling — unbounded memory growth
worker {
    num_threads 4
    max_threads 8
    # max_requests not set
}
```

Good Example:
```caddy
# Thread recycling configured
worker {
    num_threads 4
    max_threads 8
    max_requests 1000  # Recycle each thread after 1000 requests
}
```
---
Exceptions: Short-lived container environments where container lifecycle itself recycles threads may set higher values.
---
Consequences Of Violation: Monotonic RSS growth across threads, memory exhaustion, process OOM kill, complete service unavailability.

## Never run FrankenPHP as root in production
---
Category: Security
---
Run the FrankenPHP binary under a non-root user account in production, using setcap for privileged port binding if needed.
---
Reason: The FrankenPHP binary is a single process containing both the web server (Caddy) and PHP execution engine. As root, a vulnerability in PHP code or the CGO bridge gives an attacker full system access. Running as a non-root user with minimal capabilities (CAP_NET_BIND_SERVICE for ports <1024) limits the blast radius to the application's own data.
---
Bad Example:
```bash
# Running as root — unnecessary privilege
root@server: ./frankenphp run
```

Good Example:
```bash
# Non-root user with minimal capabilities
sudo setcap CAP_NET_BIND_SERVICE=+eip ./frankenphp
sudo -u www-data ./frankenphp run --config Caddyfile
```
---
Exceptions: Development environments and single-user servers may run as root for convenience.
---
Consequences Of Violation: PHP code vulnerability grants full system access, privilege escalation from application compromise, exposure of all server resources.
