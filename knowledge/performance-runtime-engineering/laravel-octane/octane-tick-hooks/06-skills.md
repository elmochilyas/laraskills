# Skill: Implement Octane Tick Hooks for Worker-Scoped Periodic Tasks

## Purpose
Register and manage periodic tick callbacks within Octane workers for lightweight worker-scoped tasks — cache warming, connection keepalive, metrics aggregation, and garbage collection — while preventing worker blocking, worker crashes, and duplicate execution.

## When To Use
- You need periodic cache warming within each worker (keep OpCache and application cache hot)
- You want per-worker health monitoring (log RSS, query counts, GC status on a timer)
- You need database connection keepalive (prevent firewall/proxy connection drops)
- You want periodic garbage collection in long-running workers
- You need to flush aggregated metrics in batches per-worker

## When NOT To Use
- The task is heavyweight (>100ms execution time) — use queue jobs instead
- The task should run once per server (not once per worker) — use cron or Laravel's scheduler
- The task requires precise cross-worker coordination — ticks are independent per worker
- The task modifies shared state that assumes single execution — use `cache()->lock()` for coordination
- The task is better suited for a dedicated queue worker

## Prerequisites
- Laravel application running under Octane with any driver (RoadRunner, Swoole, FrankenPHP)
- Understanding of tick lifecycle: registered in boot(), runs between requests, worker-scoped
- Knowledge of which tasks are lightweight enough for ticks (<100ms execution)
- Service provider for registering ticks (e.g., `App\Providers\OctaneServiceProvider`)

## Inputs
- List of candidate periodic tasks (cache warming, health checks, GC, keepalive, metrics)
- Expected execution time for each task (must be <100ms per tick rule)
- Desired interval in seconds for each task
- Worker count (determines how many times each tick runs — once per worker)

## Workflow

### 1. Identify Candidate Tasks for Tick Hooks
- Review periodic operations currently handled by cron jobs or Laravel's scheduler
- Identify tasks that are worker-scoped (benefit from running in each worker):
  - Cache warming: hit cached endpoints every 30-60s per worker
  - GC collection: `gc_collect_cycles()` when root buffer grows large
  - RSS monitoring: log worker memory for trend analysis
  - Connection keepalive: `DB::select('SELECT 1')` every 300s
  - Metrics flush: aggregate and flush per-worker metrics every 60s
- Exclude tasks that are server-scoped (should run once, not per-worker):
  - Database backups, report generation, email digests, invoice processing
- Exclude tasks with execution time >100ms (use queue jobs instead)

### 2. Register Tick Callbacks in Service Provider boot()
- Create or use an existing service provider (e.g., `App\Providers\OctaneServiceProvider`)
- Register ticks in the `boot()` method (not `register()`)
- Use unique, descriptive names for each tick:
```php
public function boot(): void
{
    Octane::tick('cache:warm', fn () => cache()->get('metrics:summary'), seconds: 60);
    Octane::tick('gc:collect', function () {
        $status = gc_status();
        if ($status['roots'] > 5000) {
            gc_collect_cycles();
        }
    }, seconds: 300);
    Octane::tick('memory:log', function () {
        Log::info('Worker RSS', ['mb' => memory_get_usage(true) / 1024 / 1024]);
    }, seconds: 120);
}
```
- Register all ticks in a single provider to avoid duplicate names

### 3. Wrap Tick Logic in try/catch
- Every tick callback must handle exceptions to prevent worker crashes:
```php
Octane::tick('metrics:flush', function () {
    try {
        Http::timeout(5)->post(config('metrics.endpoint'), $data);
    } catch (Throwable $e) {
        Log::error('Metrics flush failed', ['error' => $e->getMessage()]);
    }
}, seconds: 60);
```
- Log exceptions with enough context to investigate
- Never let exceptions propagate to the tick dispatcher (it crashes the worker)

### 4. Keep Tick Execution Under 100ms
- Profile each tick callback to verify execution time
- Use `$tick->runtime()` for built-in timing:
```php
Octane::tick('cache:warm', function ($tick) {
    $result = cache()->get('metrics:summary');
    if ($tick->runtime() > 0.1) { // 100ms
        Log::warning('Slow tick', ['name' => $tick->name(), 'runtime' => $tick->runtime()]);
    }
}, seconds: 60);
```
- If a tick consistently exceeds 100ms, move the work to a queue job
- Configure monitoring alerts for slow tick execution

### 5. Prevent Tick Overlap
- If a tick execution can exceed its interval, use `cache()->lock()` to prevent overlap:
```php
Octane::tick('data:sync', function () {
    $lock = cache()->lock('tick:data:sync', 10);
    if ($lock->get()) {
        try {
            // potentially slow operation
            $this->syncData();
        } finally {
            $lock->release();
        }
    }
}, seconds: 30);
```
- The lock prevents the same tick from running concurrently in the same worker
- Set lock TTL slightly longer than the tick's expected max execution time

### 6. Use $tick Parameter for Monitoring
- The `$tick` object provides:
  - `$tick->name()` — tick identifier (for logging, metrics)
  - `$tick->runtime()` — execution time of the current invocation
- Log tick execution time for monitoring:
```php
Octane::tick('health:check', function ($tick) {
    DB::select('SELECT 1');
    Log::debug('Health check', ['name' => $tick->name(), 'runtime' => $tick->runtime()]);
}, seconds: 300);
```
- Use runtime data to identify slow ticks before they impact request latency

### 7. Test Tick Behavior
- Start Octane and verify ticks execute at their configured intervals
- Test exception handling: make a tick throw an exception, verify worker does NOT crash
- Test tick blocking: measure request latency during tick execution (should not increase)
- Test `Octane::stopTicks()`: send a signal to stop ticks, verify they stop
- Test duplicate tick names: attempt to register two ticks with the same name, verify behavior

### 8. Document All Registered Ticks
- Create documentation listing all ticks: name, purpose, interval, expected runtime, error handling
- Example tick registry:
```markdown
| Tick Name | Purpose | Interval | Expected Runtime | Error Behavior |
|-----------|---------|----------|-----------------|----------------|
| cache:warm | Keep metrics cache hot | 60s | <10ms | Logged, not critical |
| gc:collect | Prevent cycle accumulation | 300s | <50ms | Logged, not critical |
| memory:log | Track worker RSS trend | 120s | <5ms | Logged, not critical |
| db:keepalive | Prevent connection drops | 300s | <20ms | Logged, not critical |
```
- Review the tick registry quarterly for relevance and performance

## Validation Checklist
- [ ] Candidate tasks classified as worker-scoped vs server-scoped
- [ ] All ticks registered in boot() method (not register())
- [ ] All tick callbacks wrapped in try/catch
- [ ] Tick execution time verified <100ms for all ticks
- [ ] Tick overlap prevented with cache locks where needed
- [ ] Ticks use unique, descriptive names
- [ ] No duplicate tick names across providers
- [ ] Tick exceptions logged but don't crash worker
- [ ] Octane::stopTicks() stops all ticks gracefully
- [ ] Request latency unchanged during tick execution (verified by benchmark)
- [ ] Tick documentation created with name, purpose, interval, runtime, error behavior

## Common Failures

| Failure | Symptom | Root Cause | Mitigation |
|---------|---------|------------|------------|
| Worker crash from tick | Worker dies, restarts by supervisor | Uncaught exception in tick callback | Wrap in try/catch |
| Slow request during tick window | p99 latency spike coinciding with tick interval | Tick execution >100ms blocks worker from handling requests | Profile tick, move heavy work to queue |
| Duplicate tick execution | Task runs N times (once per worker) | Tick performs server-scoped operation | Move to cron or use cache lock for coordination |
| Tick never runs | No tick execution observed | Tick registered in register() instead of boot() | Move to boot() method |
| Cache stampede from tick | Multiple workers clear/reload cache simultaneously | Tick clears cache on every execution | Use staggered intervals or cache lock |

## Decision Points

| Decision | How To Decide |
|----------|---------------|
| Tick vs queue job | Use tick for fast (<100ms), worker-scoped operations. Use queue job for slow, server-scoped, or background operations |
| Tick interval | Start conservative (300s for GC, 60s for cache warm). Shorten if data staleness is an issue; lengthen if tick overhead is noticeable |
| Critical vs non-critical tick | Non-critical: wrap in try/catch, log error, continue. Critical: tick is not appropriate — use dedicated monitoring |
| Single provider vs multiple providers | Single provider for all ticks to prevent duplicate names. Split only if different domains need independent lifecycle management |

## Performance Considerations
- Tick overhead: 10ms tick every 60s adds ~0.017% CPU per worker — negligible
- Long ticks (>100ms) directly impact request latency — the worker is blocked during tick execution
- Ticks run between requests — a busy worker may delay tick execution significantly
- GC collection tick: `gc_collect_cycles()` every 300s is sufficient for most applications
- Cache warming tick: keep frequently accessed cache keys hot to avoid cache miss penalty on first request after idle period
- Multiple ticks: if you register 5 ticks each running every 60s with 10ms each, total overhead = 50ms every 60s per worker

## Security Considerations
- Tick callbacks run inside the worker process and have full access to application data — ensure they don't log sensitive data
- Tick callbacks making HTTP requests should use internal URLs, not public URLs
- Tick callbacks accessing external services must have short timeouts to prevent worker blocking
- Race conditions: if a tick and a request handler access the same data, use proper locking
- Tick-based cache warmers should not cache user-specific data (PII, tokens) that could be served to the wrong user

## Related Rules

| Rule | File | Application |
|------|------|-------------|
| Keep all tick callbacks under 100ms execution time | `05-rules.md:1` | Step 4: monitor and limit tick runtime |
| Register all ticks in service provider boot() methods | `05-rules.md:29` | Step 2: correct registration method |
| Always wrap tick callbacks in try/catch | `05-rules.md:59` | Step 3: exception handling |
| Use distinct tick names across all providers | `05-rules.md:91` | Step 2: unique naming convention |

## Related Skills

| Skill | Relation |
|-------|----------|
| Manage and Prevent Octane State Leaks | GC collection tick directly supports state leak prevention |
| Configure Octane Workers by Driver | Worker count determines how many times each tick runs |
| Implement Concurrent Request Execution with Octane | Ticks complement concurrency for background periodic work |
| Perform FPM-to-Octane Migration | Ticks are an Octane-specific feature to adopt post-migration |

## Success Criteria
- All ticks registered in boot() with unique descriptive names
- Tick execution time <100ms for all registered ticks (verified by profiling)
- Worker does not crash when a tick throws an exception (error logged, worker continues)
- Octane::stopTicks() stops all ticks gracefully during shutdown
- Request latency is unaffected by tick execution (verified by benchmark)
- No duplicate tick registrations across providers
- Tick documentation maintained listing all registered ticks with purpose, interval, and error behavior
- Cache warming ticks keep hot cache keys available without excessive overhead
- GC collection tick prevents cycle accumulation in long-running workers
