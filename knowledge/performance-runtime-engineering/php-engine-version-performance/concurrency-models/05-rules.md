---
## Rule Name

Match Concurrency Model to Workload Type

## Category

Architecture

## Rule

Always select the concurrency model based on workload characteristics: process-based (FPM) for isolation, coroutine-based for I/O-heavy workloads, goroutine-based for high throughput, thread-based for moderate concurrency with simplicity.

## Reason

Each model trades isolation for efficiency differently. Using coroutines for CPU-bound workloads provides no benefit (coroutines do not parallelize CPU work). Using processes for sub-50ms APIs wastes 3-15x potential throughput.

## Bad Example

```bash
# PHP-FPM (process-based) for a sub-20ms API that is heavily I/O-bound
```

## Good Example

```bash
# Sub-50ms API: use RoadRunner (goroutine-based) or Swoole (coroutine-based)
# CPU-bound image processing: use PHP-FPM (process-based) for parallelism
# Multi-tenant hosting: use PHP-FPM for process isolation
```

## Exceptions

Deployments where team expertise constraints override the ideal model choice. A well-operated suboptimal model beats a misconfigured ideal model.

## Consequences Of Violation

Underutilized hardware, unnecessary latency, wasted infrastructure cost, or excessive complexity for the workload.

---

## Rule Name

Do Not Use Coroutines for CPU-Bound Work

## Category

Performance

## Rule

Never deploy a coroutine-based runtime (Swoole) for workloads that are primarily CPU-bound.

## Reason

Coroutines within a single OS thread do not parallelize CPU work. CPU-bound operations block the entire event loop, preventing other coroutines from making progress and degrading concurrency.

## Bad Example

```php
Co\run(function () {
    // CPU-bound loop blocks all other coroutines
    for ($i = 0; $i < 1000000; $i++) {
        $result = expensiveComputation($i);
    }
});
```

## Good Example

```php
// CPU-bound work should be offloaded or processed in separate processes
// Use PHP-FPM workers or Swoole's process pool instead
$pool = new Swoole\Process\Pool(4);
```

## Exceptions

When the CPU-bound work is small enough (<1ms) that it does not meaningfully impact the event loop.

## Consequences Of Violation

Degraded throughput under concurrent load, all coroutines blocked by a single computation, worse performance than simpler FPM deployment.

---

## Rule Name

Consider Memory Per Concurrent Unit When Sizing

## Category

Scalability

## Rule

Always calculate the memory budget per concurrent unit when selecting a concurrency model to determine the maximum achievable concurrency on available hardware.

## Reason

Process-based (30-80MB each) hits RAM limits far faster than coroutine-based (~2KB each). Sizing without accounting for per-unit memory leads to OOM under load.

## Bad Example

```bash
# 32GB server, 1000 max FPM workers
# At 40MB per worker: 40GB needed — guaranteed OOM
```

## Good Example

```bash
# 32GB server, 1000 concurrent requests
# FPM: (30-80MB * 1000) = 30-80GB — not feasible
# FrankenPHP threads: (10-20MB * 1000) = 10-20GB — feasible
# Swoole coroutines: (~2KB * 1000) = ~2MB — trivial
```

## Exceptions

Low-concurrency deployments (<50 concurrent requests) where the memory difference between models is negligible.

## Consequences Of Violation

OOM conditions under peak load, request failures, degraded performance from swap usage.

---

## Rule Name

Never Assume One Concurrency Model Is Universally Superior

## Category

Architecture

## Rule

Always benchmark the specific workload against multiple concurrency models before making a final selection.

## Reason

Coroutine advantage requires meaningful blocking time. With sub-1ms database queries, coroutine overhead can make Swoole slower than FPM. Each model's performance is workload-dependent.

## Bad Example

```bash
# Chose Swoole because "coroutines are faster" — no benchmarking
# Actual workload: 0.5ms Redis reads -> Swoole is 10% slower than FPM
```

## Good Example

```bash
# Ran benchmarks with production workload
# FPM: 5000 RPS, Swoole: 4800 RPS, RoadRunner: 7500 RPS
# Selected RoadRunner based on data, not dogma
```

## Exceptions

When a model cannot satisfy non-functional requirements (e.g., FPM is the only option for multi-tenant isolation regardless of performance).

## Consequences Of Violation

Suboptimal performance, wasted migration effort, increased operational complexity for no gain.

---

## Rule Name

Ensure ZTS Build for Thread-Based Runtimes

## Category

Maintainability

## Rule

Always verify that PHP is compiled with Zend Thread Safety (ZTS) enabled when using thread-based runtimes such as FrankenPHP.

## Reason

Thread-based runtimes require thread-safe PHP builds. Standard NTS (Non-Thread-Safe) builds will produce runtime errors, segmentation faults, or data corruption when multiple threads access shared memory concurrently.

## Bad Example

```bash
# ZTS not enabled — using standard PHP build
php -i | grep "Thread Safety"  # "disabled"
# FrankenPHP crashes on concurrent requests
```

## Good Example

```bash
# ZTS enabled
php -i | grep "Thread Safety"  # "enabled"
# Verify before deploying FrankenPHP
```

## Exceptions

Process-based or goroutine-based runtimes that do not require ZTS.

## Consequences Of Violation

Segmentation faults, data corruption, unpredictable crashes under concurrent load, difficult-to-reproduce production incidents.
