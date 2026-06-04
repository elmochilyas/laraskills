# Memory Profiling and Observability

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Executive Summary
Memory profiling in Octane and queue workers is fundamentally different from PHP-FPM profiling. In PHP-FPM, memory is allocated per-request and freed when the process dies. In long-running processes, memory accumulates, leaks grow, and the profile changes over thousands of requests. Observability requires tracking memory across request boundaries, identifying growth trends, and pinpointing the sources of accumulation. This KU covers tools (Blackfire, Telescope, Xdebug, custom scripts), metrics to monitor, and strategies for establishing memory observability in production.

## Core Concepts
- **Baseline Memory:** The memory footprint of an idle worker after booting Laravel but before handling any requests. Typically 30-50MB. This is the floor — memory should return near this value after each request.
- **Per-Request Delta:** The difference in worker memory usage before and after handling a single request. A non-zero delta indicates memory that was allocated and not freed. Consistent positive deltas = accumulation.
- **Accumulation Rate:** The average memory growth per request (MB/request). Calculated: `(memory_after_100_requests - memory_after_0_requests) / 100`. A rate of 0.5MB/request means the worker grows 250MB over 500 requests.
- **Terminating Callback Accumulation:** Callbacks registered via `register_shutdown_function()`, `Blade::directive()`, `Collection::macro()`, or event listeners that are never removed. These accumulate in static arrays and registries, growing the baseline over time.
- **Observable State:** The set of application state that can be inspected at runtime without modifying the application. Includes container bindings, static properties, worker memory, and opcache state.

## Mental Models
- **"The Water Tank":** Worker memory is a water tank. Each request pours water in (allocations). Ideally, the tank drains completely between requests (deallocations). A leak means the water level rises request after request.
- **"The MRI Scanner":** Memory profiling is like an MRI for the application — it produces a snapshot of what's inside. A single snapshot shows organs (objects). A time series shows growth (tumors).
- **"The Garbage Truck":** PHP's garbage collector is a garbage truck that comes periodically (every 10,000 cycles by default, or when `gc_collect_cycles()` is called). Until the truck arrives, trash (circular references) stays on the curb.

## Internal Mechanics
1. **PHP Memory Management:** PHP uses `zend_mm_heap` for allocation. Memory is allocated in pages (256KB chunks). Freed memory is reused by subsequent allocations within the same worker. The heap grows but rarely shrinks (no `munmap` of freed pages in Zend MM by default).
2. **Memory Measurement:**
   - `memory_get_usage()`: Actual memory allocated by userland PHP code.
   - `memory_get_usage(true)` (`$real_usage`): Memory allocated from the OS (includes Zend MM internal overhead, cached pages). This value only grows.
   - `gc_status()`: Returns `['runs' => N, 'collected' => N, 'threshold' => 10001, 'roots' => N]`. The `roots` count shows pending circular reference candidates.
3. **Leak Detection Sequence:**
   - Snapshot A before request: `$start = memory_get_usage()`
   - Process request
   - Snapshot B after request: `$end = memory_get_usage()`
   - Delta = B - A. If delta > 0 consistently, a leak exists.
4. **Static Inspection:** `(new ReflectionClass($class))->getStaticProperties()` returns all static properties and their current values. Compare snapshots across requests to identify growing arrays.
5. **Object Graph Traversal:** Tools like Blackfire or Xdebug trace can capture a full object graph. Largest objects and most numerous object classes are suspects for leaks.

## Patterns
- **Baseline Trend Tracking:** Log `memory_get_usage(true)` at worker start, after every 100 requests, and at worker shutdown. If the baseline increases by >10% over the worker lifetime, investigate.
- **Pre/Post Request Hooks:** Register a `RequestReceived` listener that records `$start = memory_get_usage()`. Register `RequestTerminated` listener that logs `memory_get_usage() - $start`. Collect in a structured log.
- **Static Property Scanner:** An artisan command that reflects on all loaded classes, captures static property values, and diffs against a previous snapshot to identify growing arrays.
- **Blackfire Octane Integration:** Blackfire's PHP probe can profile Octane workers. Use `blackfire-player` to simulate requests and profile continuously. Set alerts for memory growth trends.
- **Telescope Watcher:**
  Use Telescope's `DumpWatcher` and `QueryWatcher` to capture data during requests. Combine with a custom `MemoryWatcher` that records memory snapshots per request.
- **`gc_collect_cycles()` Checkpoint:** After every N requests (e.g., 100), force garbage collection and log the difference: `$before = memory_get_usage(); $collected = gc_collect_cycles(); $after = memory_get_usage(); Log::info("GC: collected $collected, freed " . ($before - $after) . " bytes");`.

## Architectural Decisions
| Decision | Rationale |
|---|---|
| `memory_get_usage()` over `xdebug_memory_usage()` | Available without extension; sufficient for trend detection |
| Real usage (`true`) for baseline | Shows OS-level allocation; real_usage only increases, making leaks obvious |
| Structured logging over metrics | Allows post-hoc analysis and correlation with request context |
| Telescope integration over custom tool | Reduces toolchain complexity; Telescope already deployed |

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Per-request memory delta logging | Adds ~0.1ms overhead per request | Produces actionable data for leak detection |
| Blackfire continuous profiling | License cost; agent resource usage (~2% CPU) | Best-in-class object graph analysis |
| Static property snapshotting | Reflection on all classes is slow (1-3s) | Run as nightly or on-demand, not per-request |
| `gc_collect_cycles()` checkpoints | GC scan is CPU-intensive (~10ms per 1000 roots) | Use sparingly; monitor performance impact |

## Performance Considerations
- `memory_get_usage()` is extremely fast (~0.001ms). Log it freely.
- Reflection-based static property scanning is slow. Cache class lists (`get_declared_classes()`) and diff only changed classes.
- Blackfire's continuous profiling samples at 100ms intervals. The agent adds ~2% CPU overhead continuously.
- Telescope's watchers add ~1-5ms per request. Enable only relevant watchers for Octane profiling (disable `EventWatcher`, `ModelWatcher` if not needed).
- GC collection: PHP's GC runs automatically when root buffer threshold (10,000) is hit. Manual `gc_collect_cycles()` forces a full scan. Use only when root count is high.

## Production Considerations
- Memory profiling is **observability, not monitoring**. Use data to identify trends, not to trigger alerts (though OOM alerts are critical).
- Set up a **memory dashboard**: Grafana panel showing worker baseline memory, per-request delta median/P95, and accumulation rate over time.
- Configure alerts: (a) Worker memory >80% of `memory_limit`, (b) Per-request delta >5MB consistently, (c) Baseline increased >20% over 1000 requests.
- For RoadRunner, memory metrics come from the Go process manager (`rr metrics` command). Monitor `http.rss` for PHP worker RSS.
- For Swoole, `swoole_stats()` provides `['worker_memory' => N]` per-worker. Combine with `memory_get_usage()` for PHP-side measurement.
- Blackfire in production: Use `blackfire agent:config --env` to set sampling rate. Lower sampling in high-traffic workers.

## Common Mistakes
- Only measuring `memory_get_usage()` at request end. Without the start baseline, the delta is meaningless for leak detection.
- Confusing "high memory usage" with "memory leak." A worker that uses 100MB may be fine if that's stable. A worker that grows from 50MB → 100MB → 150MB has a leak.
- Not accounting for PHP's memory management internals. Zend MM does not return memory to the OS. `memory_get_usage(true)` shows OS-level allocation, which only grows. Use `memory_get_usage(false)` to see actual used memory.
- Forgetting that opcache preloaded classes increase baseline but are stable. A growing baseline despite stable opcache = leak.
- Relying solely on Blackfire snapshots. A snapshot shows a single point in time. Continuous trending requires repeated snapshots or metrics.

## Failure Modes
- **Memory Profiling Overhead Death:** Enabling Blackfire, Telescope, and custom logging simultaneously adds 10%+ overhead. Under high load, this pushes the worker over `memory_limit`.
- **False Positive Leak Alert:** A memory spike from a legitimate operation (large file download, report generation) triggers a leak alert. Team wastes hours investigating normal behavior.
- **Blind Spot in Profiling:** The profiling tool itself stores data in a static array (e.g., Telescope watcher that accumulates entries). The tool reporting the leak is the source of the leak.
- **Metric Deluge:** Logging memory usage on every request for 100 workers × 500 requests/min = 50,000 log entries/minute. Logging infrastructure costs spike. Storage increases 10x.

## Tools Reference
| Tool | Use Case | Cost |
|---|---|---|
| Blackfire.io | Full object graph, method-level allocations, continuous profiling | Paid (SaaS) |
| Laravel Telescope | Request-level watchers (queries, mails, jobs, dumps) with memory snapshot hook | Free |
| Xdebug + xhprof | Function-level profiling, memory traces | Free (extension) |
| php-meminfo | Custom memory analysis, object graph traversal | Free (PECL) |
| Grafana + Prometheus | Memory metrics dashboard and alerting | Free (self-hosted) |
| `memory_get_usage()` | Quick baseline and delta tracking | Built-in |

## Ecosystem Usage
- **Blackfire.io:** Continuous profiling integration for Octane workers. Use `blackfire-player` to simulate request sequences and profile memory growth trends. Set alerts for per-request memory delta thresholds.
- **Laravel Telescope:** Deploy a custom `MemoryWatcher` alongside built-in watchers to capture memory snapshots per request. Telescope automatically flushes watcher state under Octane, preventing the profiling tool itself from becoming a memory leak.
- **Grafana + Prometheus:** Export per-worker memory metrics (baseline, delta, accumulation rate) via custom middleware or `Octane::tick()` callbacks. Build dashboards showing worker memory over time and per-request delta distributions.
- **PHP-Meminfo (by Facebook):** Dump the full PHP heap for offline analysis during staging load tests. Identify object graphs that grow across requests when Blackfire trends show unexplained heap growth.
- **Laravel Pulse:** Monitor Octane and queue worker memory alongside throughput. Pulse's system usage cards surface workers approaching memory limits.
- **OpenTelemetry PHP SDK:** Export memory usage as OTel metrics or spans. Integrate with Datadog, Honeycomb, or Jaeger to correlate memory growth with request attributes (route, user, input size).

## Related Knowledge Units
### Prerequisites
- singleton-state-leaks (the leaks to profile)
- static-property-accumulation (the main source of growth)

### Related Topics
- octane-lifecycle-hooks (hooks for pre/post request measurement)
- octane-configuration-and-workers (max_requests as leak safety valve)
- octane-package-compatibility (profiling package memory behavior)

### Advanced Follow-up Topics
- service-binding-audit (profiling to validate audit findings)
- queue-worker-lifecycle (profiling queue worker memory patterns)
- scoped-bindings-for-octane (measuring scoped binding creation overhead)

## Research Notes
- `php-meminfo` (by Facebook) can dump the entire PHP heap and analyze it offline. Useful for deep leak investigations but requires 5-10s per dump.
- Blackfire's Octane integration was improved in 2023. It now correctly handles coroutine context in Swoole and sandbox lifecycle.
- PHP 8.2+ improved `gc_status()` to include `'collected_percentage'` and `'memory_freed'` fields, making GC observability easier without custom instrumentation.
- Research question: Could a PHP extension provide per-request memory reset (like a lightweight worker fork + CoW)? Similar to how uWSGI's "emperor" mode works for Python. This would solve accumulation at the runtime level.
- The OpenTelemetry PHP SDK can be used to export memory metrics as spans/metrics. Not yet widely adopted in Laravel Octane ecosystem.
- Swoole's `\Swoole\Coroutine\Channel` can be used for inter-coroutine memory sharing, but this does not help with leak detection.
