# Octane Configuration and Workers

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Executive Summary
Octane's behavior is governed by `config/octane.php`, which controls worker count, max requests, runtime selection, and per-runtime options. Worker management is the operational backbone of Octane — incorrect configuration leads to wasted resources, request timeouts, or cascading failures. This KU covers every configuration option, the rationale behind defaults, and how worker count interacts with the underlying runtime's concurrency model (processes vs coroutines).

## Core Concepts
- **`server`:** The runtime adapter: `swoole`, `roadrunner`, or `frankenphp`. This determines which `ServerProcessInspector` and which worker lifecycle implementation Octane uses.
- **`max_requests`:** The number of requests a worker processes before being gracefully recycled. Default: 500. Lower values increase safety (less leak accumulation) but reduce cache warmth. Higher values increase throughput but risk OOM.
- **`worker_count`:** Number of worker processes. Default: `auto` (equals CPU core count). RoadRunner uses OS threads (goroutines) multiplexed across workers. Swoole uses one process per worker, each with internal coroutine scheduling.
- **`max_execution_time`:** Maximum seconds a request can execute before Swoole terminates it (Swoole only). Default: 30 (matches PHP-FPM `max_execution_time`).
- **`request_timeout`:** RoadRunner-specific: the maximum duration for a request before RoadRunner kills the PHP process.
- **Concurrency Models:** Swoole supports coroutine-based concurrency (many "requests" in one worker simultaneously). RoadRunner uses process-per-core with goroutine scheduling on the Go side. FrankenPHP uses Caddy's event loop with Go workers.

## Mental Models
- **"The Factory Floor":** Each worker is a worker on a factory line. `worker_count` is how many parallel lines. `max_requests` is how many items each worker processes before maintenance.
- **"The Taxi Fleet":** Workers are taxis. `worker_count` is fleet size. When a taxi has served `max_requests` passengers, it returns to the depot (restart). During rush hour (high concurrency), you want enough taxis but not too many idling.
- **"The Concurrency Spectrum":** Swoole is like a single taxi driver who can teleport (coroutines) between passengers. RoadRunner is like a fleet where each driver handles one passenger at a time.

## Internal Mechanics
1. **Configuration Load:** `config/octane.php` is read by `OctaneServiceProvider`. Options are passed to the runtime's server factory.
2. **Worker Spawning (Swoole):** `Swoole\Process\Pool` creates `worker_count` processes. Each process runs the Octane worker bootstrap (boot Laravel, enter event loop). Swoole's Reactor threads handle I/O and dispatch to worker processes.
3. **Worker Spawning (RoadRunner):** The Go RoadRunner server spawns a configurable number of PHP processes per `rpc` pool. Each process handles one request at a time. RoadRunner's HTTP plugin acts as a reverse proxy, forwarding requests to available workers.
4. **Worker Spawning (FrankenPHP):** Caddy starts PHP workers as subprocesses. The number is controlled by `frankenphp.yml`'s `num_threads` directive. Each worker is a PHP-CGI process running in "embankment" mode.
5. **Max Requests Counter:** Each worker increments an internal counter (`$workerRequestCount`) after each request. When `$workerRequestCount >= max_requests`, the worker sets a shutdown flag. After the current request completes, the worker gracefully exits.
6. **Graceful Shutdown:** The runtime allows in-flight requests to complete (up to `max_wait_time`/`graceful_timeout` seconds), then sends SIGTERM to the worker. The worker's `WorkerStopping` event fires. The runtime spawns a replacement worker.

## Patterns
- **CPU-Bound Tuning:** For CPU-bound apps, set `worker_count = CPU core count`. More workers cause context switch thrashing.
- **I/O-Bound Tuning (Swoole):** With Swoole coroutines, a single worker can handle hundreds of concurrent I/O requests. Set `worker_count = CPU cores`, rely on coroutines for concurrency.
- **Memory-Leak-Profile-Informed max_requests:** Profile memory growth rate. If worker grows by 1MB per request and `memory_limit` is 128MB, set `max_requests = 100` to stay well below limit with margin.
- **Mixed-Request-Type Pool:** If some routes are memory-heavy (reports, exports), consider separate Octane instances with different `max_requests` values, fronted by a load balancer.
- **Staged Rollout Configuration:** Deploy config changes via environment variables: `OCTANE_WORKER_COUNT`, `OCTANE_MAX_REQUESTS`. Override `config('octane.worker_count')` in `AppServiceProvider`.

## Architectural Decisions
| Decision | Rationale |
|---|---|
| `auto` worker count defaults to CPU cores | Safe default that prevents oversubscription on any hardware |
| `max_requests` default 500 | Balances leak safety (low enough to prevent most OOM) with throughput (high enough to amortize bootstrap cost) |
| Swoole `max_execution_time` defaults to 30 | Backward compatibility with PHP-FPM expectations; prevents truly stuck requests |
| RoadRunner uses separate PHP processes | Process isolation guarantees no shared memory corruption; simpler mental model |

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Process isolation (RoadRunner/FrankenPHP) | Higher memory per worker (~30-50MB baseline) | Memory budget must account for worker_count × per-worker RSS |
| Coroutine concurrency (Swoole) | Must write coroutine-safe code | glob(), sleep(), curl() calls must be wrapped or replaced |
| Fine-grained max_requests tuning | Requires profiling to set optimally | Wrong value means either OOM (too high) or wasted throughput (too low) |
| Runtime selection flexibility | Each runtime has different config surface | Operations team must learn Swoole or RoadRunner ecosystem separately |

## Performance Considerations
- Worker count × max_requests determines the total request capacity before full rotation. With `worker_count=8` and `max_requests=500`, the fleet handles 4,000 requests before full rotation.
- Swoole coroutine scheduler yields on PHP I/O functions (if hooked). Non-hooked blocking calls (sleep(), curl without SWOOLE_HOOK_CURL) block the entire worker — all coroutines in that worker stall.
- RoadRunner's Go-side goroutines add sub-millisecond request routing overhead. The PHP process itself is single-threaded; Go's goroutine scheduler manages concurrency.
- FrankenPHP's Caddy integrates request buffering. Static files are served by Caddy directly, never reaching PHP. This reduces worker load for asset-heavy applications.

## Production Considerations
- Monitor `octane:status` for worker health. Configure alerts for worker restart frequency, request queue depth, and response time percentile drift.
- Set `OCTANE_WORKER_COUNT` proportionally to available memory. Each Swoole worker uses ~50MB baseline. With 8GB RAM: (8000MB - 2000MB for OS) / 50MB = ~120 workers max. But CPU usually bottlenecks first.
- Configure `max_wait_time` (Swoole) or `graceful_timeout` (RoadRunner) for shut downs. Default 60s is often too short for long-running requests.
- For Swoole, enable `package_max_length` in the server options if handling large request bodies.
- For RoadRunner, configure `http.pool.max_jobs` as the equivalent of `max_requests`. This is set in `.rr.yaml`, not `octane.php`.
- Graceful deployment: set `max_requests` to a low value (e.g., 10) before deployment. Workers recycle quickly, picking up new code. After all workers are recycled, restore normal `max_requests`.

## Common Mistakes
- Setting `worker_count` to the number of expected concurrent users. With Swoole coroutines, one worker handles hundreds of concurrent requests. High `worker_count` wastes memory.
- Forgetting that `max_requests` is per-worker, not global. 8 workers × 500 requests each = 4,000 total requests before full rotation.
- Disabling `max_requests` entirely (`max_requests: null` or `0`). No safety valve for memory leaks. Workers grow unbounded until OOM.
- Using `$_ENV` or `php.ini` values that assume per-request reset. `max_execution_time` is per-worker, not per-request in Swoole.
- Setting `worker_count` higher than available CPU cores on a CPU-bound app. Oversubscription causes context switching overhead that reduces throughput.

## Failure Modes
- **Oversubscription Meltdown:** `worker_count=100` on a 4-core machine. CPU time is split across 100 processes. Each request takes 10x longer. Request queue backs up. New requests pile up. System collapses under load.
- **Stuck Worker Cascade:** One worker hits an infinite loop (blocking I/O, deadlock). Other workers pick up the slack. Remaining workers become overloaded. Response times spike. Health checks fail. Orchestrator kills all workers.
- **Worker Starvation (RoadRunner):** `http.pool.max_jobs` too low. Workers recycle too quickly. Application never warms caches. Each request suffers cold-start overhead. Throughput is significantly below capacity.
- **Memory Limit Cross-Talk (Swoole):** `memory_limit` set in `php.ini` applies per-worker. But Swoole's shared memory tables (not PHP memory) can grow independently. Monitor both `memory_get_usage()` and Swoole table stats.

## Ecosystem Usage
- **Laravel Forge:** Forge UI sets `max_requests` and `worker_count`. Defaults to `auto` for count, `500` for requests. Forge's Octane dashboard shows worker status.
- **Envoyer:** Zero-downtime deployment uses `max_requests` gradual rotation. Sets low `max_requests` during deployment, restores normal after all workers cycled.
- **Vapor:** Serverless Octane via FrankenPHP. Worker lifecycle is managed by Lambda's scaling policy, not `octane.php`. Vapor's `vapor.yml` runtime config is the equivalent.
- **Laravel Horizon:** Queue workers have separate config (`horizon.php`) but share similar concepts: `maxProcesses()`, `balance()` strategy, `maxJobs()` per worker.

## Related Knowledge Units
### Prerequisites
- octane-architecture-overview (worker lifecycle context)

### Related Topics
- octane-lifecycle-hooks (worker lifecycle events)
- static-property-accumulation (max_requests as safety valve)
- memory-profiling-and-observability (profiling to set max_requests)

### Advanced Follow-up Topics
- queue-worker-lifecycle (parallel configuration patterns)
- scoped-bindings-for-octane (scoped binding configuration implications)
- singleton-state-leaks (configuration implications for leak budgets)

## Research Notes
- Swoole v5.x changed default `reactor_count` from CPU count to 1. Octane handles reactor config internally.
- RoadRunner v3.x moved from YAML to `.rr.yaml` with dynamic configuration reload via `rr reset`. Octane's `config/octane.php` is read once at worker start.
- FrankenPHP's `num_threads` in `frankenphp.yml` controls PHP process count. Default is `0` (auto = number of CPUs).
- Swoole's `task_worker_count` is separate from `worker_count` and is not used by Octane. Octane handles all logic in worker processes.
- Research question: Could Octane dynamically adjust `worker_count` based on request queue depth? Some frameworks (Fastify, Koa) implement auto-scaling worker pools.
