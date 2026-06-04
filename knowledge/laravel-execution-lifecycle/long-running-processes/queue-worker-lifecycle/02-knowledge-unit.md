# Queue Worker Lifecycle

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Executive Summary
Laravel queue workers are long-running PHP processes that share fundamental lifecycle characteristics with Octane workers: a one-time boot, persistent container, and a job-processing loop. However, queue workers lack Octane's sandbox mechanism — there is no automatic per-job container isolation. Every state leak pattern (singleton mutation, static accumulation) applies equally to queue workers. Understanding the queue worker lifecycle is essential for writing safe job classes and configuring Horizon or `php artisan queue:work`.

## Core Concepts
- **Worker Boot Sequence:** `php artisan queue:work` boots the framework (`bootstrap/app.php`), registers service providers, and enters a `while(true)` loop: `$job = $this->getNextJob($queue); $job->fire();`.
- **Job Instance Lifecycle:** Each job is a fresh object instance created from the queue payload (via `unserialize`). However, the **container** and its **singletons** are the same across all jobs in the worker. A singleton used by the job persists for the worker's lifetime.
- **`Queue::looping()` Callback:** Registered via `Queue::looping($callback)`. Runs at the end of each job iteration, after the job completes. This is the queue worker's equivalent of Octane's `RequestTerminated` — the canonical place to reset state between jobs.
- **Horizon Supervisors:** Horizon adds an orchestration layer on top of `queue:work`. Supervisors manage worker pools, balance across queues, and enforce timeout/memory limits. Each supervisor-spawned worker is a separate `queue:work` process.
- **`--max-jobs` / `--max-time`:** CLI options that limit how many jobs a worker processes before recycling. `--max-jobs=500` is equivalent to Octane's `max_requests`. Without these, the worker runs until memory exhaustion.

## Mental Models
- **"Octane Without Sandbox":** A queue worker is identical to an Octane worker, except there is no per-request sandbox. Every job shares the same container with no automatic state isolation.
- **"The Assembly Line Without Cleaners":** The factory line runs 24/7. Each station (job class) operates on the same machinery (container). If a station leaves grease (state), the next station slips on it.
- **"The Shared Kitchen":** Jobs are chefs. The container is the kitchen. All chefs use the same knives, ovens, and ingredients. If Chef A leaves the stove on, Chef B burns the food.

## Internal Mechanics
1. **Worker Start:** `php artisan queue:work redis --queue=high,default --tries=3`. Artisan boots the app, resolves `QueueManager`, creates a `Worker` instance.
2. **Job Loop:** The worker calls `popJob()` on the queue connection. If a job is available, it's deserialized into a job object. The job's `handle()` method is called via the container.
3. **Container Context:** The job is resolved through the container: `$container->call([$job, 'handle'])`. If the job has dependencies injected in `handle()`, they are resolved from the persistent container. Singletons are shared across all jobs.
4. **Exception Handling:** If the job throws, the worker increments attempt count. If `tries` exceeded, the job is marked as failed. The worker continues to the next job — the container retains any state from the failed job.
5. **Looping Callback:** After each job (whether succeed or fail), `Queue::looping()` callbacks execute. These can reset accumulators, close connections, or trigger garbage collection.
6. **Worker Stops:** When `--max-jobs` reached, or `--max-time` elapsed, or a SIGTERM is received, the worker finishes the current job and exits gracefully.

## Patterns
- **Job Statelessness:** Treat every job as if it runs in a fresh process. Do not rely on previous jobs' side effects for state. Explicitly load all dependencies in `handle()`.
- **Queue Looping Reset:** Register a `Queue::looping()` callback in `AppServiceProvider` that resets known stateful services: `app(AuthManager::class)->forgetGuards()`, `Str::resetCache()`.
- **Singleton-Aware Job Constructor:** Avoid resolving singletons in the job constructor. The constructor runs when the job is queued (dispatched), not when the worker processes it. Use `handle()` injection or manual `resolve()`.
- **Job-Specific Container Instance:** For jobs that must isolate state (e.g., processing on behalf of different users), create a child container per job: `$child = $container->make(Container::class); $child->instance('user', $user); $child->call([$jobInstance, 'handle'])`.
- **Horizon Queue Balancing:** Use `balance: 'auto'` in Horizon config to dynamically adjust worker counts based on queue load. Pair with `maxJobs` per worker to bound lifecycle.

## Architectural Decisions
| Decision | Rationale |
|---|---|
| No sandbox in queue workers | Architecture complexity; queue jobs assumed stateless historically |
| `Queue::looping()` as sole reset hook | Simple, one-hook model; easy to understand and monitor |
| Job instances are fresh per execution | Ensures no object-level state leakage between jobs of same class |
| Container singletons persist | Consistent with Laravel's container semantics across all entry points |

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Simple worker model (no sandbox complexity) | No automatic state isolation | Singleton leaks are the developer's responsibility |
| `Queue::looping()` provides manual reset | Reset intensity vs performance tradeoff | Heavy resets slow the job loop |
| Fresh job instances prevent object leaks | Constructor injection resolves before `handle()` | Constructors must not use request-scoped services |
| Horizon's auto-scaling balances load | Supervisors add process management overhead | More moving parts; supervisor crashes affect multiple workers |

## Performance Considerations
- Deserializing a job payload is ~0.1-1ms. The job object is then resolved through the container, adding another ~0.5ms. Total overhead per job is small.
- `Queue::looping()` callbacks run on every job iteration. A 10ms reset operation on a 50ms job adds 20% overhead. Keep reset callbacks focused and fast.
- Workers with `--sleep=3` sleep for 3 seconds when no job is available. This reduces CPU idle spinning but delays job pickup. Tune based on time-sensitivity.
- Horizon's `balance: 'auto'` monitors queue length and adjusts workers every `balancePeriod` (default 30s). Worker churn adds ~1s per worker start.

## Production Considerations
- Always set `--max-jobs` or configure Horizon `maxJobs`. Without it, a worker runs until OOM. Safe defaults: `maxJobs=500` for most apps.
- Monitor queue worker RSS. A worker whose memory grows by >5% over its lifetime likely has a static accumulation leak.
- Use Horizon's `--delay` option for failed job retries. Immediate retries of transient-failed jobs can amplify memory pressure.
- For long-running queue workers (e.g., processing 10,000 emails), design the job to yield periodically: close DB connections, call `gc_collect_cycles()`, check memory usage.
- Separate queue workers for different queue types (e.g., `high` for time-sensitive, `default` for throughput). Configure different `maxJobs` per queue.

## Common Mistakes
- Assuming Eloquent models resolved in job constructors are fresh when the job runs. The model is serialized at dispatch time. By the time the worker processes it, the model's attributes may be stale.
- Registering `Queue::looping()` inside a service provider without checking if a worker is running. The callback fires every iteration — including in Octane's event loop under some configs. Guard with `app()->runningInConsole()`.
- Storing state on `$this` in a job class that uses `ShouldBeUnique`. The unique lock is released after `handle()` but the instance properties may persist.
- Using `dispatchNow()` inside a job that's already running in a worker. `dispatchNow()` synchronously processes the new job in the same container, potentially overwriting singleton state.
- Forgetting that Horizon's `balance: 'simple'` creates a fixed number of workers. If all workers are busy with slow jobs, new jobs queue indefinitely.

## Failure Modes
- **Queue Worker OOM:** A worker accumulates 1MB per job in a static array. After 2000 jobs, it hits `memory_limit` and is killed. The current job (not yet processed) is lost unless the queue driver supports retry-after-crash.
- **Silent Data Corruption:** A singleton `PaymentGateway` remembers the last transaction's credentials. Job B (different merchant) uses Job A's credentials. Transactions are attributed to the wrong merchant.
- **Worker Deadlock:** A job acquires a DB row lock, then dies. The transaction is rolled back but the connection is left in a broken state. The worker's next job fails with "SQLSTATE[HY000]: General error."
- **Horizon Supervisor Cascade:** Supervisor A's worker pool exhausts memory. Supervisor A is killed by the OS. Horizon's master process respawns Supervisor A. Respawned supervisor inherits no state but the queue backlog has grown. System enters a death spiral under sustained load.

## Ecosystem Usage
- **Laravel Horizon:** The standard queue monitoring UI. Horizon runs a master process (`horizon:supervisor`) that manages worker pools. Each pool is a group of `queue:work` processes with shared configuration.
- **Laravel Vapor:** Queue workers on Lambda. Each Lambda invocation processes one job. This effectively provides per-job process isolation (like PHP-FPM for queues), eliminating accumulation concerns.
- **Laravel Pulse:** Monitors queue throughput, worker count, and job duration. Integrates with Horizon's telemetry.
- **Laravel Scout:** Queue-based model indexing. Scout's import jobs must be stateless and handle large batches without accumulation.

## Related Knowledge Units
### Prerequisites
- singleton-state-leaks (state leak patterns apply to queue workers)
- static-property-accumulation (accumulation in queue workers)

### Related Topics
- scoped-bindings-for-octane (scoped bindings behave differently in queue workers vs Octane)
- octane-lifecycle-hooks (RequestTerminated vs Queue::looping() parallels)
- memory-profiling-and-observability (profiling queue workers)

### Advanced Follow-up Topics
- octane-architecture-overview (comparing worker architectures)
- octane-configuration-and-workers (worker configuration parallels)
- octane-package-compatibility (package compatibility for queue jobs)

## Research Notes
- Laravel 10+ made `Queue::looping()` more reliable by executing it after the framework's internal job-processing cleanup runs.
- Horizon v5.20+ supports `maxJobs` per worker pool, matching Octane's `max_requests` pattern.
- Research question: Should queue workers implement a sandbox mechanism similar to Octane? The Laravel core team has discussed this but no RFC exists. The challenge is performance overhead for high-throughput queues.
- PHP 8.1+ fiber-based concurrency could enable cooperative multitasking within a single queue worker, but Laravel has not adopted fibers for queue processing.
- Swoole's `Process` module can be used to run queue workers in coroutine context, but this is not officially supported by Laravel Octane. Mixing Octane and queue workers requires separate processes.
