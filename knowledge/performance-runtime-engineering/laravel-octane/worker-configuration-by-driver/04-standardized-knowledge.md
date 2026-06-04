# Standardized Knowledge: Worker Configuration by Driver

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | Worker Configuration by Driver — worker_num, max_request, task_worker_num |
| Difficulty | Intermediate |
| Lifecycle | Configure, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Each Octane driver has distinct worker configuration semantics. **RoadRunner** uses `num_workers` in `.rr.yaml`. **Swoole** uses PHP constants. **FrankenPHP** uses `num_threads` in Caddyfile. Common across all drivers: `max_requests` (worker recycling to prevent memory drift) and worker count derived from CPU cores × workload factor.

## Core Concepts

- **RoadRunner config** (.rr.yaml): `rpc: { listen: tcp://127.0.0.1:6001 }`, `server: { command: "php artisan octane:start --server=roadrunner" }`, `http: { address: "0.0.0.0:8080", pool: { num_workers: 4, max_jobs: 1000, supervisor: { max_workers: 8 } } }`.
- **Swoole config** (via PHP): `$server->set(['worker_num' => swoole_cpu_num(), 'max_request' => 1000, 'task_worker_num' => swoole_cpu_num() / 2])`. Octane abstracts this via `config/octane.php`.
- **FrankenPHP config** (Caddyfile): `php_server { worker { num_threads 4 max_threads 8 } }`. Threads are not directly analogous to workers.
- **max_request across drivers**: 1000-5000 for stable apps, 300-500 for apps with known leak patterns. Monitor worker RSS to calibrate.

## When To Use

- Configuring Octane workers for production deployment
- Tuning worker counts based on workload profile
- Switching between Octane drivers
- Debugging worker-related performance issues

## When NOT To Use

- Without monitoring worker RSS first (tuning without data = guessing)
- For single-worker development environments (use defaults)
- When the bottleneck is database connections, not worker count

## Best Practices

- **Worker count formula**: Start at `number_of_CPU_cores`. For I/O-bound workloads (high DB time), increase by 50-100%. For CPU-bound workloads (computation), stay at core count. Monitor listen queue and RSS to validate.
- **Set max_requests**: 1000-5000 for stable apps. Lower to 300-500 if memory drift is observed. Monitor worker RSS over time to calibrate.
- **Monitor listen queue**: If requests are queuing, increase worker count. If RSS is too high, decrease worker count.
- **Account for connection pool limits**: Each worker maintains persistent DB/Redis connections. N workers × M connections ≤ database max_connections.

## Architecture Guidelines

- **RoadRunner workers**: Process-per-worker model. Each worker is a separate PHP process. Best isolation but higher per-worker memory (~50-80MB RSS). num_workers should not exceed available RAM / per-worker RSS.
- **Swoole workers**: In-process worker model. Lower memory per worker. Supports task workers for background processing. worker_num typically = CPU cores.
- **FrankenPHP threads**: Thread-based model (requires ZTS). Threads share memory within a process. num_threads controls concurrent request handling. max_threads sets upper bound for auto-scaling.
- **max_request across drivers**: Prevents memory drift by recycling workers after N requests. Essential for all drivers.

## Performance Considerations

- Octane delivers 2.5-20x throughput over PHP-FPM; API endpoints with <50ms response see biggest gains
- Each worker uses 30-80MB RSS; total memory = workers × per-worker memory
- Each worker maintains persistent DB/Redis connections; total = workers × connections-per-worker
- Under Octane, database queries become primary bottleneck (bootstrap is eliminated)
- OpCache preloading further reduces cold-start latency by 2-5ms per worker

## Security Considerations

- More workers = more concurrent database connections. Plan for connection pool exhaustion.
- FrankenPHP threads share memory — a memory leak in one thread affects all threads in the process.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Setting workers = cores for I/O-bound Octane | FPM thinking | Workers spend most time waiting, wasting memory | Increase workers 50-100% for I/O-bound |
| Disabling max_requests (max_requests = 0) | No recycling | Unbounded memory drift | Set 1000-5000 based on monitoring |
| Running FrankenPHP with 1 thread | Default config | No concurrency benefit | Set num_threads = CPU cores |
| Not accounting for DB connections | No capacity planning | Connection pool exhaustion | N workers × connections ≤ DB max |

## Anti-Patterns

- **Over-provisioning workers beyond memory capacity**: Each worker consumes 30-80MB RSS. Total RSS must fit in available RAM with headroom.
- **Setting max_requests too low**: max_requests = 100 recycles workers too frequently, wasting CPU on constant worker restarts. Monitor RSS and set accordingly.
- **Ignoring FrankenPHP thread nuances**: Threads are not workers. A FrankenPHP thread handles one request at a time, but threads share memory. Thread count ≤ CPU cores.

## Examples

```yaml
# RoadRunner .rr.yaml
http:
  address: "0.0.0.0:8080"
  pool:
    num_workers: 4
    max_jobs: 1000
    supervisor:
      max_workers: 8
      watch_ticks: 10
```

```bash
# Swoole via Octane
php artisan octane:start \
    --server=swoole \
    --workers=4 \
    --max-requests=1000 \
    --task-workers=2
```

```caddyfile
# FrankenPHP Caddyfile
php_server {
    worker {
        num_threads 4
        max_threads 8
        max_wait_time 30s
    }
}
```

## Related Topics

- Driver Selection Comparison
- Octane Installation and Configuration
- FPM Worker vs Octane Worker Differences
- Memory Management in Long-Running Processes

## AI Agent Notes

- RoadRunner: process-per-worker, best isolation, .rr.yaml config.
- Swoole: in-process workers, coroutines, task workers, PHP config.
- FrankenPHP: thread-based (ZTS), Caddyfile config, shared memory.
- Worker count formula: start at CPU cores, increase 50-100% for I/O-bound.
- max_requests: 1000-5000 default. Lower if memory drift observed.
- Monitor RSS, listen queue, and connection pool limits to calibrate.
- Each worker consumes 30-80MB RSS + persistent connections.

## Verification

- [ ] Worker count configured based on CPU cores and workload profile
- [ ] max_requests set to appropriate value (1000-5000 default)
- [ ] Monitor listen queue and RSS to validate worker count
- [ ] Connection pool limits calculated (N workers × connections)
- [ ] FrankenPHP thread configuration understood (not directly = workers)
- [ ] Swoole task workers configured if needed (background processing)
- [ ] RoadRunner supervisor config reviewed for max_workers limit
