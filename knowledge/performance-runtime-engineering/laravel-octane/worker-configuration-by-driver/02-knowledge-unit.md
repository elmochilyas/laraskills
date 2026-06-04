# Metadata

Domain: Performance & Runtime Engineering
Subdomain: Laravel Octane Performance
Knowledge Unit: Worker Configuration by Driver — worker_num, max_request, task_worker_num
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Each Octane driver has distinct worker configuration semantics. **RoadRunner** uses `num_workers` in `.rr.yaml`. **Swoole** uses PHP constants. **FrankenPHP** uses `num_threads` in Caddyfile. Common across all drivers: `max_requests` (worker recycling to prevent memory drift) and worker count derived from CPU cores × workload factor.

---

# Core Concepts

- **RoadRunner config** (.rr.yaml): `rpc: { listen: tcp://127.0.0.1:6001 }`, `server: { command: "php artisan octane:start --server=roadrunner" }`, `http: { address: "0.0.0.0:8080", pool: { num_workers: 4, max_jobs: 1000, supervisor: { max_workers: 8 } } }`.
- **Swoole config** (via PHP): `$server->set(['worker_num' => swoole_cpu_num(), 'max_request' => 1000, 'task_worker_num' => swoole_cpu_num() / 2])`. Octane abstracts this via `config/octane.php`.
- **FrankenPHP config** (Caddyfile): `php_server { worker { num_threads 4 max_threads 8 } }`. Threads are not directly analogous to workers.
- **max_request across drivers**: 1000-5000 for stable apps, 300-500 for apps with known leak patterns. Monitor worker RSS to calibrate.

---

# Patterns

**Worker count formula**: Start at `number_of_CPU_cores`. For I/O-bound workloads (high DB time), increase by 50-100%. For CPU-bound workloads (computation), stay at core count. Monitor listen queue and RSS to validate.

---

# Common Mistakes

**Setting workers = cores for I/O-bound Octane**: Unlike FPM where workers block on I/O, Octane workers are persistent. Each worker can handle one request at a time. If requests spend 80% of time waiting for database, more workers don't help — they just consume memory.

---

# Performance Considerations

- Octane delivers 2.5-20x throughput over PHP-FPM; API endpoints with <50ms response see biggest gains
- Each worker uses 30-80MB RSS; total memory = workers x per-worker memory
- Each worker maintains persistent DB/Redis connections; total = workers x connections-per-worker
- Under Octane, database queries become primary bottleneck (bootstrap is eliminated)
- OpCache preloading further reduces cold-start latency by 2-5ms per worker

---

# Related Knowledge Units

Driver Selection Comparison | Octane Installation and Configuration | FPM Worker vs Octane Worker Differences

---

## Mental Models

**Power plant model**: PHP-FPM is starting up and shutting down a generator for every kilowatt produced. Octane is a power plant that keeps the turbine spinning â€” fuel (bootstrap) is burned once, and the spinning turbine handles variable load. Sandbox containers are separate circuit breakers that contain faults without taking down the whole grid.

---

## Internal Mechanics

Octane's bootstrap occurs once per worker during rtisan octane:start. The worker's boot sequence: Illuminate\Foundation\Application constructed â†’ service providers registered â†’ providers booted â†’ routes/facades registered â†’ event loop begins. Per-request handling creates a sandbox by cloning the application instance. Request-specific services (database connections, session, auth) are fresh per-request while config, events, and logging singletons are shared. Octane intercepts framework shutdown by replacing $app->terminate() calls with sandbox reset logic. State leaks are detected by tracking static property modifications via a callback registered in zend_execute_data.

---

## Patterns

**Safe migration pattern**: 1) Audit all service providers for state leaks, 2) Add Octane::booted() callbacks for per-worker initialization, 3) Replace static property usage with pp()->instance() bindings, 4) Test with php artisan octane:status to verify worker health, 5) Deploy to 10% of servers first, compare error rates for 24 hours.

---

## Architectural Decisions

- **RoadRunner vs Swoole vs FrankenPHP as Octane driver**: RoadRunner offers the simplest worker model (process-per-worker) and best isolation. Swoole provides coroutine-based concurrency for I/O-bound workloads. FrankenPHP is easiest to deploy (single binary). The driver choice affects maximum concurrency, memory footprint, and debugging complexity.
- **Service provider strategy**: Deferring non-essential providers to per-request execution reduces worker memory. Boot essential providers once, defer expensive ones. Audit all providers for request-scoped singletons.

---

## Tradeoffs

| Tradeoff | Benefit | Cost |
|----------|---------|------|
| Octane vs FPM | 2-20x throughput improvement | State management, package compatibility |
| RoadRunner driver | Process isolation, simple | Higher per-worker memory |
| Swoole driver | Coroutine concurrency, low memory | Non-blocking requirement, complex debugging |
| FrankenPHP driver | Single binary, zero config | Newer, smaller ecosystem |

---

## Production Considerations

- **Health checks**: Configure Octane health endpoint (/octane/health). Monitor via load balancer. Alert if health check fails on any worker.
- **Graceful reload**: php artisan octane:reload â€” reloads workers without dropping requests. Run after every deploy.
- **State leak detection**: Monitor worker RSS growth. Increase >10% per hour indicates state leak. Set octane:watch during development to detect leaks.
- **Connection pooling**: Configure database and Redis connection limits to match worker count. Each worker maintains persistent connections.

---

## Failure Modes

- **Memory leak in long-running worker**: Service provider registers listeners on each request without cleanup. Symptom: Worker RSS grows by 1-5MB per request until OOM. Mitigation: Audit providers, use Octane::booted() for one-time registration, monitor RSS.
- **Stale singleton state**: Singleton holds request-scoped data that leaks to next request. Symptom: User A sees User B's data. Mitigation: Use sandbox pattern, clone stateful services, never store request data in singletons.
- **Deadlock in connection pool**: All database connections checked out, request waits forever. Symptom: Workers stuck, no requests complete. Mitigation: Set connection pool timeout, monitor pool utilization, ensure connections returned after request.

---

## Ecosystem Usage

- **Laravel Octane**: The primary Octane user base. Over 1M installs on Packagist. Supported by Laravel Forge, Laravel Cloud, and Vapor. Used in production by major Laravel agencies.
- **RoadRunner**: Spiral Framework's application server. Over 500 GitHub stars for Octane integration. Mature, well-documented, PHP 8.4 compatible.
- **FrankenPHP**: Newest runtime. Growing rapidly with Docker official image, K8s Helm chart, and Laravel-specific documentation. 6K+ GitHub stars.
- **Swoole**: Most mature coroutine-based PHP runtime. Used in China extensively (WeChat, Meituan). PHP 8.x support lags slightly behind RoadRunner and FrankenPHP.

---

## Research Notes

- Laravel Octane's sandbox model: Research on per-request Application cloning overhead shows 0.5-2ms per request â€” negligible compared to the 10-40ms bootstrap it replaces.
- State leak prevention: Static analysis tools (Larastan, PHPStan) now include rules for detecting Octane-unsafe static property usage. Community packages like stan-blade/laravel-octane-analyzer provide automated audits.
- Performance cliff research: Octane throughput drops 40-60% when memory pressure triggers swap. Proper max_children calculation is critical for maintaining gains.
- FrankenPHP + Octane: Initial benchmarks show 5-10% overhead over RoadRunner due to CGO boundary crossing in PHP request handling. Expected to narrow in future releases.
