# Skill: Configure Queue Worker Safety for Long-Running Execution

## Purpose
Configure queue workers with job limits, `Queue::looping()` state reset, and safe dependency injection patterns to prevent memory leaks and data contamination across jobs.

## When To Use
- Setting up queue workers for production
- Configuring Horizon worker pools
- Auditing job classes for state safety
- Debugging OOM or cross-job data leaks

## When NOT To Use
- Synchronous job processing (`dispatchNow()`)
- Serverless queue workers (Vapor — per-invocation isolation)
- Octane workers (different lifecycle, use sandbox instead)

## Prerequisites
- Queue driver configured (Redis, database, SQS)
- Access to queue worker startup configuration
- List of known leaky singletons/statics from binding audit
- Horizon installed (optional, for managed pools)

## Inputs
- `config/queue.php` current settings
- Job class files (application and package jobs)
- Memory profiling data (baseline, per-job delta)
- Horizon configuration (if using Horizon)

## Workflow
1. Configure `--max-jobs` (or Horizon `maxJobs`) based on memory profile: `(memory_limit - baseline) / growth_per_job * 0.8 safety_margin`; never run without a job limit
2. Register `Queue::looping()` callback in `AppServiceProvider::boot()` to reset auth guards, string caches, collection macros, and app-specific static registries between jobs — guard with `app()->runningInConsole()` to prevent firing in Octane context
3. Audit all job classes: ensure dependencies are loaded in `handle()`, not constructor — store only identifiers (IDs), not models or request-scoped services
4. Verify no mutable state stored on `$this` in job classes — each `handle()` call must treat state as fresh, especially across retry attempts
5. Configure `--max-time` (or Horizon `maxTime`) to recycle workers after a maximum wall-clock duration even if `maxJobs` not reached
6. Set `--sleep` (default 3) to avoid CPU spinning when queue is empty; tune higher for low-throughput queues

## Validation Checklist
- [ ] `--max-jobs` or `horizon.maxJobs` configured and enforced — workers recycle after job limit
- [ ] `Queue::looping()` callback registered and guarded with `app()->runningInConsole()`
- [ ] Job constructors do not resolve Eloquent models, auth, or session — only primitive IDs
- [ ] No mutable `$this` properties in job classes that persist across retry attempts
- [ ] `--max-time` or Horizon `maxTime` configured as secondary safety valve
- [ ] Worker memory over 1000+ jobs shows stable delta — no monotonic baseline growth

## Common Failures
- Running `queue:work` without `--max-jobs` — unbounded memory growth until OOM
- Registering `Queue::looping()` without `runningInConsole()` guard — fires during Octane requests too
- Injecting Eloquent models in job constructors — stale model data at execution time
- Storing mutable counters on `$this` — incorrect values across retry attempts
- Over-relying on Horizon defaults without tuning `maxJobs` to application memory profile

## Decision Points
- `Queue::looping()` reset scope: reset all known leaky services vs only high-risk ones
- Job constructor injection: primitive only vs stateless service (logger, HTTP client) is safe
- Horizon balance mode: `auto` (queue-length-aware) vs `simple` (fixed) based on workload predictability
- Per-queue `max_jobs` vs global: memory-intensive jobs may need lower limit on specific queues

## Performance Considerations
- Job deserialization: ~0.1-1ms
- `Queue::looping()` overhead: a 10ms reset on a 50ms job adds 20% — keep reset callbacks focused
- `--sleep=3`: reduces CPU idle spinning but delays job pickup by up to 3 seconds
- Horizon `balance: 'auto'` monitors queue length every `balancePeriod` (default 30s)
- Worker churn from `--max-jobs`: each restart costs ~1s for framework bootstrap

## Security Considerations
- OOM crash: worker accumulates memory, hits limit, current job lost (depends on driver retry support)
- Silent data corruption: singleton `PaymentGateway` remembers last transaction's credentials — Job B uses Job A's credentials
- Worker deadlock: job acquires DB lock, dies, connection left in broken state — next job fails
- Horizon supervisor cascade: supervisor's pool exhausts memory, killed by OS, queue backlog grows

## Related Rules
- Always set `--max-jobs` or Horizon `maxJobs` (05-rules.md)
- Register a `Queue::looping()` callback for state reset (05-rules.md)
- Load dependencies in `handle()`, not the constructor (05-rules.md)
- Guard `Queue::looping()` against non-queue contexts (05-rules.md)
- Avoid storing mutable state on `$this` in job classes (05-rules.md)

## Related Skills
- Establish Memory Baseline and Trend Tracking (memory-profiling-and-observability)
- Register Octane Lifecycle Hooks for State Cleanup (octane-lifecycle-hooks)
- Identify Singleton State Leaks (singleton-state-leaks)

## Success Criteria
- Queue workers consistently restart after `--max-jobs` without OOM crashes
- `Queue::looping()` resets auth guards, string caches, and static registries — no cross-job data contamination
- Job classes load all dependencies fresh in `handle()` and use only primitive IDs in constructors
- No mutable state on `$this` across job retry attempts — retry logic works correctly
- Worker memory baseline is stable across 1000+ jobs with no monotonic growth
- Horizon-configured pools respect per-pool `maxJobs` and `maxTime` settings
