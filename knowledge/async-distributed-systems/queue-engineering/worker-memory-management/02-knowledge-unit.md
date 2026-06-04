# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Worker Management
Knowledge Unit: Queue Worker Memory Management
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
PHP daemon workers accumulate memory over their lifetime due to the persistent container, cached data, and memory fragmentation. Laravel provides `--memory` limit (worker exits if RSS exceeds this threshold) and recycling via `--max-jobs`/`--max-time` as the primary defenses. Beyond these, memory behavior depends on job code — jobs that load large datasets, cache objects in static properties, or use in-memory data structures accelerate growth. Understanding PHP memory allocation (zend_mm), garbage collection cycles, and the difference between RSS and allocator-internal memory is key to diagnosing worker memory issues.

# Core Concepts
- **RSS (Resident Set Size)**: Actual physical memory used by the process. What `--memory` measures via `memory_get_usage(true)`.
- **PHP memory allocator (zend_mm)**: PHP manages memory internally, not freeing it back to the OS immediately. RSS may stay high even after freeing memory in PHP.
- **Garbage collection**: PHP's refcount-based GC. Cyclic references (`gc_collect_cycles()`) can be collected but memory may not be returned to OS.
- **Memory fragmentation**: Repeated allocation/free cycles fragment the allocator's memory. RSS grows over time even without leaks.
- **`--memory` limit**: Hard threshold. Worker exits when `memory_get_usage(true)` exceeds this. Default 128MB.
- **Recycling**: `--max-jobs` and `--max-time` are the practical mitigation — restart the worker before memory growth becomes problematic.

# Mental Models
- **Sponge absorbing water**: The worker process is a sponge. Each job is a drop of water. The sponge absorbs the drop (memory). Over time, the sponge gets heavier (RSS grows). Squeezing the sponge (GC) helps some, but only drying the sponge (restart) truly resets weight.
- **Expanding backpack**: Each job puts items in a backpack. Some items are taken out (freed), but the backpack never fully empties. Eventually, the backpack is too heavy to carry (OOM).

# Internal Mechanics
- `memory_get_usage(true)` returns the memory allocated by PHP's internal allocator (zend_mm), not the memory used by the application.
- zend_mm allocates memory in chunks from the OS. It does NOT return chunks to the OS after freeing — it reuses them internally.
- This means even after `gc_collect_cycles()`, RSS may stay high because zend_mm holds onto memory chunks.
- The `--memory` check runs AFTER each job, NOT during the job. A single job that allocates > `--memory` will be killed by the system OOM killer, not the `--memory` check.
- `--memory` default (128MB) is a safety net. Production workers may need higher for jobs that handle large datasets.
- Common memory growth sources:
  - Static properties accumulating data
  - Service container singletons with growing caches
  - Facades caching resolved instances with large data
  - Log data buffered in memory
  - File handles and network connections not released

# Patterns
## Conservative Recycling
- **Purpose**: Prevent memory growth by restarting frequently.
- **Benefit**: Predictable memory footprint.
- **Tradeoff**: Restart overhead; worker capacity lost during restart.

## Memory-Growth Monitoring
- **Purpose**: Track per-worker RSS to detect leaks.
- **Benefit**: Identify problematic jobs that cause memory growth.
- **Tradeoff**: Monitoring infrastructure; signal-to-noise ratio.

## Explicit Garbage Collection
- **Purpose**: Call `gc_collect_cycles()` manually after heavy jobs.
- **Benefit**: Frees cyclic references; may reduce memory.
- **Tradeoff**: GC overhead; may not reduce RSS.

# Architectural Decisions
- **Set `--memory` to a reasonable maximum**: 128MB is low for many production apps. Consider 256MB-512MB.
- **Rely on recycling over GC**: Restarting is more effective at reducing RSS than garbage collection.
- **Identify leaky jobs**: If RSS grows monotonically after certain job types, those jobs need investigation.
- **Separate memory-intensive jobs to dedicated supervisors**: Reports/media processing jobs should have their own supervisor with higher `--memory` limit.

# Tradeoffs
Low `--memory` (128MB) | Quick OOM prevention, reduced OOM risk | May kill workers unnecessarily during legitimate memory usage
High `--memory` (512MB) | Handles large jobs | Delayed OOM detection; more memory pressure
Frequent recycling | Bounded RSS, predictable | Restart overhead; potential job processing delay

# Performance Considerations
- zend_mm memory allocation: fast (~nanoseconds). Fragmentation: measurable after thousands of cycles.
- `gc_collect_cycles()`: pauses execution for 1-10ms per call. Run only after memory-heavy jobs.
- `memory_get_usage(true)`: ~microsecond call. Negligible overhead.
- Restart overhead: ~50-200ms for PHP+Laravel boot. Spread across 500 jobs = 0.1-0.4ms per job.

# Production Considerations
- Monitor worker RSS over time. Growing trend indicates leak. Flat trend (with sawtooth from restart) is normal.
- Use `--max-jobs=500` and `--max-time=3600` as baseline. Adjust based on observed memory growth rate.
- If workers consistently hit `--memory` limit, either: increase the limit, reduce `--max-jobs`, or fix the memory-leaking job.
- RSS ≠ application memory usage. zend_mm holds onto freed memory. A worker with high RSS may not be leaking — it may be fragmentation.
- Each restart resets RSS to baseline. Frequent restarts means RSS never grows high, but code caches are also lost.

# Common Mistakes
- **Assuming `--memory` measures job memory**: `--memory` checks after the job. A single job using 200MB will not be caught by a 128MB limit unless it continues to hold that memory after completion.
- **Blindly increasing `--memory`**: More memory per worker means fewer workers per server. OOM risk shifts from workers to the server.
- **Not recycling, relying on garbage collection**: GC collects cyclic references but doesn't return memory to the OS. RSS stays high.
- **Using `memory_get_usage(false)`**: This reports memory used by the application (not including zend_mm overhead). `memory_get_usage(true)` reports actual RSS.
- **Assuming zero memory growth is possible**: All daemon workers grow over time. The question is growth rate, not growth presence.

# Failure Modes
- **OOM killer (kernel)**: Worker RSS exceeds server physical memory. Linux OOM killer terminates a process (potentially the worker or another critical process).
- **Swap thrashing**: Worker RSS exceeds physical memory, forcing swap. Performance collapses.
- **Segfault from memory corruption**: Long-running PHP processes with memory bugs may segfault. Entire process dies.
- **Silent data corruption**: Memory exhaustion causes PHP to return `false` from memory allocation functions. Jobs may silently corrupt data.
- **Worker stall during GC**: PHP's garbage collector pauses execution. On large object graphs, this pause can be seconds to minutes.

# Ecosystem Usage
- **Laravel framework**: `--memory` option on `queue:work`. Default 128MB.
- **Laravel Horizon**: Horizon supervisors have per-supervisor `memory` setting. Workers are killed when memory exceeds this.
- **Spatie packages**: Not directly related, but any package job that accumulates data (especially in static properties) can contribute to memory growth.

# Related Knowledge Units
- K056 Worker Daemon Architecture (the loop that runs jobs) | K058 `--max-jobs`, `--max-time` (recycling mechanism)

## Research Notes
- The queue:work command uses a daemon loop that persists the Laravel application instance across job processing — memory grows over time and periodic recycling via --max-jobs or --max-time is essential in production.
- Process signal handling for workers (SIGTERM, SIGQUIT, SIGINT) changed in Laravel 11 — workers now attempt to finish the current job before stopping, reducing job loss during deployments.
- Supervisor's stopwaitsecs must be configured in relation to the --timeout value — a common misconfiguration causes process force-kill during graceful shutdown before jobs complete.
- Systemd service units for queue workers need Restart=always, RestartSec=3s, and KillMode=process to prevent the supervisor from killing child processes prematurely during unit restart.
- The --sleep parameter controls polling backoff when the queue is empty — setting this too low causes unnecessary CPU usage from idle polling; too high delays job processing when jobs arrive.
- Containerized environments (Docker/Kubernetes) introduce additional complexity for worker lifecycle — SIGTERM propagated from container orchestration must be mapped to the worker process correctly.
- Monitoring worker health requires tracking queue:work process uptime, job processing rate, and memory usage — the php artisan queue:monitor command provides basic health checks since Laravel 10.
