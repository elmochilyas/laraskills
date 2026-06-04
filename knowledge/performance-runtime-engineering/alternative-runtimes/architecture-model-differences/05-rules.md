## Match concurrency model to isolation requirements before selecting a runtime
---
Category: Architecture
---
Evaluate the isolation needs of your application — process (strongest), thread (medium), coroutine (weakest), or event loop (none) — and select the runtime whose concurrency model matches your security and stability requirements.
---
Reason: Process isolation (FPM, RoadRunner) prevents one worker crash or memory corruption from affecting others. Thread isolation (FrankenPHP) shares address space — one thread crash can crash all threads. Coroutine isolation (Swoole) shares thread memory. Event loop (ReactPHP) has no isolation. Choosing the wrong model for your security requirements creates a fundamental architectural risk that no amount of tuning can fix.
---
Bad Example:
```php
// Selecting Swoole for a multi-tenant application with strict isolation requirements
// Coroutine isolation is the weakest — one tenant's memory corruption affects all tenants
```

Good Example:
```php
// Selecting RoadRunner for multi-tenant isolation
// Process-level isolation — each PHP worker is a separate OS process
```
---
Exceptions: Internal-facing applications with low security requirements may use weaker isolation models for performance gains.
---
Consequences Of Violation: Fundamental security architecture weakness, cross-request data leakage, single-point-of-failure crashes affecting all concurrent requests.

## Match runtime to workload I/O profile, not just throughput benchmarks
---
Category: Design
---
Classify your workload's I/O profile (high-latency >50ms, mixed, low-latency <1ms) and select Swoole for high-latency I/O, RoadRunner or FrankenPHP for mixed/low-latency I/O.
---
Reason: Swoole's coroutine model excels when database queries exceed 50ms — coroutines yield during I/O wait, freeing the thread for other coroutines. For sub-1ms queries, coroutine overhead (~1µs per yield) makes Swoole 10% slower than FPM. RoadRunner's goroutine scheduler handles all I/O profiles efficiently without coroutine overhead.
---
Bad Example:
```php
// Using Swoole for sub-1ms Redis lookups — coroutine overhead is net-negative
// 10%+ performance regression vs FPM
```

Good Example:
```php
// Using RoadRunner for mixed low-latency API workload
// No coroutine overhead, goroutines handle I/O efficiently
```
---
Exceptions: When the application has mixed I/O profiles across endpoints, use separate pools or runtimes per workload type rather than forcing one runtime for all.
---
Consequences Of Violation: Performance regression instead of improvement, wasted migration effort, disappointing throughput results that erode team confidence in alternative runtimes.

## Always benchmark and soak-test with production-representative workloads before committing to a runtime
---
Category: Testing
---
Run 24-hour soak tests with production-representative traffic patterns and datasets for any alternative runtime before approving it for production use.
---
Reason: All memory-resident runtimes can develop memory leaks over hours that don't appear in short benchmarks. Static properties, singletons, and service containers accumulate state across requests. A 24-hour soak catches memory growth, performance degradation, and worker crash patterns that 30-minute benchmarks completely miss.
---
Bad Example:
```bash
# 10-minute benchmark — misses memory leaks entirely
# Runtime passes, deployed to production, OOM after 6 hours
```

Good Example:
```bash
# 24-hour soak test with production traffic replay
# Memory growth detected at hour 8 — runtime rejected or leak fixed
```
---
Exceptions: Teams migrating proven runtimes between environments (e.g., RoadRunner staging to production) may reduce soak duration if the runtime already has production history.
---
Consequences Of Violation: Undetected memory leaks surface in production after hours of operation, OOM kills, emergency rollback to FPM.

## Evaluate deployment complexity alongside performance when selecting a runtime
---
Category: Architecture
---
Factor deployment pipeline impact (binary management, PHP extension compilation, CI/CD changes) into runtime selection — not just throughput benchmarks.
---
Reason: Runtime performance is meaningless if the team cannot reliably deploy it. Swoole requires PHP extension compilation (complex CI/CD), RoadRunner needs binary downloads and version pinning, FrankenPHP provides a single-binary deployment (simplest). The operational complexity spectrum — FrankenPHP (lowest) → RoadRunner (medium) → Swoole (highest) — must match team capabilities.
---
Bad Example:
```bash
# Chose Swoole for 3x throughput but team can't manage extension compilation
# CI/CD pipeline breaks, deployments stalled for weeks
```

Good Example:
```bash
# Chose FrankenPHP for simpler operations
# Single binary deployment, team self-sufficient within days
```
---
Exceptions: Teams with mature DevOps practices and CI/CD automation can handle higher-complexity runtimes.
---
Consequences Of Violation: Extended deployment times, frequent pipeline failures, frustrated operations team, reverting to FPM after significant migration investment.

## Never mix concurrency models within the same application process
---
Category: Architecture
---
Use only one runtime's concurrency model per PHP process — do not combine Swoole coroutines with ReactPHP event loops or mix RoadRunner workers with Swoole workers in the same application instance.
---
Reason: Different concurrency models have incompatible scheduling mechanisms. Swoole's event loop (epoll-based) and ReactPHP's event loop (stream_select-based) will conflict if both are active in the same process, causing coroutine scheduling failures, deadlocks, and undefined behavior. Each runtime expects full control over event dispatch.
---
Bad Example:
```php
// Mixing Swoole coroutines and ReactPHP in the same process — scheduling conflicts
$swooleServer = new Swoole\Http\Server(...);
$reactLoop = React\EventLoop\Loop::get(); // Incompatible — undefined behavior
```

Good Example:
```php
// Single runtime per process
$swooleServer = new Swoole\Http\Server(...);
```
---
Exceptions: Isolated background task workers (not request handling) may use different runtime models as separate processes coordinated by a message queue.
---
Consequences Of Violation: Undefined behavior, coroutine scheduling failures, deadlocks, process crashes, difficult-to-diagnose intermittent failures.
