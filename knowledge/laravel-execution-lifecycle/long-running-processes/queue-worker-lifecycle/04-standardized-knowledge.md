# Queue Worker Lifecycle

## Metadata
- **ID:** ku-05-roadrunner-lifecycle
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Overview
Laravel queue workers are long-running PHP processes that share fundamental lifecycle characteristics with Octane workers: a one-time boot, persistent container, and a job-processing loop. However, queue workers lack Octane's sandbox mechanism — there is no automatic per-job container isolation. Every state leak pattern (singleton mutation, static accumulation) applies equally to queue workers. Understanding the queue worker lifecycle is essential for writing safe job classes and configuring Horizon or `php artisan queue:work`.

## Core Concepts
- **Worker Boot Sequence**: `php artisan queue:work` boots the framework, registers service providers, and enters a `while(true)` loop.
- **Job Instance Lifecycle**: Each job is a fresh object instance created from the queue payload (via `unserialize`). However, the **container** and its **singletons** are the same across all jobs.
- **`Queue::looping()` Callback**: Runs at the end of each job iteration — the queue worker's equivalent of Octane's `RequestTerminated`. Canonical place to reset state between jobs.
- **Horizon Supervisors**: Orchestration layer on top of `queue:work`. Manages worker pools, balances across queues, enforces timeout/memory limits.
- **`--max-jobs` / `--max-time`**: CLI options limiting how many jobs a worker processes before recycling. Equivalent to Octane's `max_requests`.

## When To Use
- **Queue job processing**: All queue workers use this lifecycle — default, Horizon, custom workers.
- **Long-running job processing**: Workers running for hours processing thousands of jobs.
- **Horizon-managed pools**: When using Horizon's auto-balancing and supervisor architecture.
- **Job state safety audit**: Before deploying queue workers in production.

## When NOT To Use
- **Synchronous job processing**: `dispatchNow()` runs in the current process, not a worker.
- **Serverless (Vapor)**: Vapor runs each job in a separate Lambda invocation — per-job isolation is automatic.
- **HTTP requests**: Queue workers are CLI-based; the HTTP Kernel processes web requests.
- **Octane workers**: Different lifecycle; queue workers don't have sandbox isolation.

## Best Practices (WHY)
- **Always set `--max-jobs` or configure Horizon `maxJobs`**: Without it, a worker runs until OOM. Safe default: `maxJobs=500`. *Why: Static accumulation and singleton leaks cause unbounded memory growth — max-jobs is the safety valve.*
- **Treat every job as if in a fresh process**: Do not rely on previous jobs' side effects. Explicitly load all dependencies in `handle()`. *Why: The container persists across jobs — a previous job's mutations affect the next job.*
- **Register `Queue::looping()` for state reset**: Reset known leaky services (auth guards, string caches, static registries). *Why: This is the only hook between jobs — without it, accumulated state persists indefinitely.*
- **Avoid resolving singletons in the job constructor**: The constructor runs at dispatch time, not when the worker processes the job. *Why: Constructor-injected services may be stale or incorrect by the time the job executes.*

## Architecture Guidelines
- **No sandbox in queue workers**: Architecture complexity; queue jobs assumed stateless historically.
- **`Queue::looping()` as sole reset hook**: Simple, one-hook model; easy to understand and monitor.
- **Job instances are fresh per execution**: Ensures no object-level state leakage between jobs of same class.
- **Container singletons persist**: Consistent with Laravel's container semantics across all entry points.

## Performance
- **Job deserialization**: ~0.1-1ms. Container resolution adds another ~0.5ms per job.
- **`Queue::looping()` overhead**: A 10ms reset on a 50ms job adds 20% overhead. Keep reset callbacks focused and fast.
- **`--sleep=3`**: Sleeps 3 seconds when no job available. Reduces CPU idle spinning but delays job pickup.
- **Horizon `balance: 'auto'`**: Monitors queue length every `balancePeriod` (default 30s). Worker churn adds ~1s per start.

## Security
- **Queue Worker OOM**: Worker accumulates 1MB/job in static array. After 2000 jobs, hits `memory_limit`. Current job lost unless driver supports retry.
- **Silent Data Corruption**: Singleton `PaymentGateway` remembers last transaction's credentials. Job B uses Job A's credentials.
- **Worker Deadlock**: Job acquires DB row lock, then dies. Transaction rolls back but connection left in broken state. Next job fails with connection error.
- **Horizon Supervisor Cascade**: Supervisor's worker pool exhausts memory. Killed by OS. Master respawns supervisor but queue backlog has grown.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assuming Eloquent models in constructors are fresh | Model serialized at dispatch time | Stale model data when job runs | Fetch model in handle() |
| Registering Queue::looping() without context check | Fires every iteration — including Octane | Unexpected state reset in non-queue context | Guard with `app()->runningInConsole()` |
| Storing state on $this in job | Instance may persist between retries | State leaks across retry attempts | Use fresh state per handle() call |
| Using dispatchNow() inside a running job | Synchronous processing in same container | Overwrites singleton state | Use queue for async dispatch |

## Anti-Patterns
- **Unbounded queue workers**: Running `queue:work` without `--max-jobs` or `--max-time`.
- **Job constructor injection of request-scoped services**: Resolving `Request`, `Auth`, or session in the constructor. These are not available in queue context.
- **Singleton-as-cache in job classes**: Using singleton properties to cache data across jobs — leaks between unrelated jobs.
- **Over-reliance on Horizon defaults**: Horizon's default `maxJobs` may not match your application's memory profile. Always tune based on profiling.

## Examples

```php
// Safe job: stateless, fresh dependencies in handle()
class ProcessPayment implements ShouldQueue
{
    public function handle(PaymentGateway $gateway): void
    {
        // $gateway is resolved fresh from container each time
        $gateway->charge($this->amount);
    }
}

// Queue::looping() for state reset
Queue::looping(function () {
    app(AuthManager::class)->forgetGuards();
    Str::resetCache();
    Collection::clearMacros();
    if (memory_get_usage() > 100 * 1024 * 1024) {
        gc_collect_cycles();
    }
});

// Running with safety limits
// php artisan queue:work redis --queue=high,default --max-jobs=500 --max-time=3600 --sleep=3
```

## Related Topics
- **Singleton State Leaks**: State leak patterns apply to queue workers.
- **Static Property Accumulation**: Accumulation in queue workers.
- **Scoped Bindings for Octane**: Scoped bindings behave differently in queue workers vs Octane.
- **Octane Lifecycle Hooks**: RequestTerminated vs Queue::looping() parallels.
- **Memory Profiling and Observability**: Profiling queue workers.

## AI Agent Notes
- Laravel 10+ made `Queue::looping()` more reliable by executing it after the framework's internal job-processing cleanup runs.
- Horizon v5.20+ supports `maxJobs` per worker pool, matching Octane's `max_requests` pattern.
- Research question: Should queue workers implement a sandbox mechanism similar to Octane? The Laravel core team has discussed this but no RFC exists. The challenge is performance overhead for high-throughput queues.
- PHP 8.1+ fiber-based concurrency could enable cooperative multitasking within a single queue worker, but Laravel has not adopted fibers for queue processing.

## Verification
- [ ] Start a queue worker with `--max-jobs=10` and verify it stops after 10 jobs
- [ ] Register a `Queue::looping()` callback and verify it runs between jobs
- [ ] Create a job that stores state in a singleton — verify leak across jobs
- [ ] Fix the leak using Queue::looping() reset
- [ ] Configure Horizon with appropriate maxJobs per pool
- [ ] Monitor worker memory over 1000+ jobs — verify delta is stable
