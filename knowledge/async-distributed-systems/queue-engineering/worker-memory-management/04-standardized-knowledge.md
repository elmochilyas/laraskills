# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K074 — Queue Worker Memory Management
- **Knowledge ID:** K074
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - PHP Manual — Memory Management
  - Laravel Source — `Illuminate\Queue\Worker::daemon()`

---

# Overview

PHP daemon workers accumulate memory over their lifetime due to the persistent container, cached data, and memory fragmentation. Laravel provides `--memory` limit (worker exits if RSS exceeds threshold) and recycling via `--max-jobs`/`--max-time`. PHP's memory allocator (zend_mm) does not return freed memory to the OS immediately — RSS stays high even after garbage collection. Understanding the difference between RSS and allocator-internal memory is key to diagnosing worker memory issues.

---

# Core Concepts

- **RSS (Resident Set Size):** Actual physical memory used. What `--memory` measures (`memory_get_usage(true)`).
- **zend_mm:** PHP's internal allocator. Allocates from OS in chunks, does NOT return chunks after freeing — reuses them internally.
- **Garbage collection:** Refcount-based. `gc_collect_cycles()` collects cyclic references but memory may not return to OS.
- **Memory fragmentation:** Repeated alloc/free cycles fragment the allocator — RSS grows even without leaks.
- **`--memory` limit:** Hard threshold checked AFTER each job. Default 128MB.
- **Recycling:** `--max-jobs`/`--max-time` are the primary mitigation — restart before growth becomes problematic.

---

# When To Use

- **`--memory` limit:** Always set — safety net against runaway memory growth.
- **Recycling via `--max-jobs`/`--max-time`:** Always set — primary defense, more effective than GC.

---

# When NOT To Use

- Relying on garbage collection alone — GC collects cycles but doesn't return memory to OS.
- `memory_get_usage(false)` — this reports application memory, not RSS. Use `true` parameter.
- Ignoring `--memory` — single large jobs can exceed memory before the post-job check runs.

---

# Best Practices

- **Set `--memory` based on observed RSS growth.** 128MB is low for many apps — consider 256-512MB. *Why: If a worker's baseline RSS is 40MB and it grows to 120MB over 500 jobs, the default 128MB limit is too tight — a single memory-intensive job will trigger OOM.*
- **Rely on recycling, not GC.** Restarting is far more effective at reducing RSS than garbage collection. *Why: zend_mm holds onto freed memory chunks — GC collects cycles but doesn't return memory to the OS. Only a process restart resets RSS to baseline.*
- **Identify leaky jobs by monitoring per-job memory growth.** If RSS grows monotonically after specific job types, investigate. *Why: Leaky jobs show a step-function increase in memory after each execution — jobs that cache data in static properties or singletons are common culprits.*
- **Run memory-intensive jobs on dedicated supervisors.** Reports, media processing, and data export jobs should have their own workers with higher `--memory` limits. *Why: A job that needs 256MB for data processing will crash a 128MB-limited worker shared with lightweight jobs — separate supervisors allow independent tuning.*

---

# Performance Considerations

- `memory_get_usage(true)`: ~1 microsecond call — negligible.
- `gc_collect_cycles()`: pauses execution 1-10ms per call. Run only after heavy jobs.
- Restart overhead: ~50-200ms per 500 jobs = 0.1-0.4ms per job — negligible.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assuming `--memory` checks during jobs | Check runs after job | Single 200MB job bypasses 128MB limit | Use system limits for per-job memory |
| No recycling, relying on GC | Misunderstanding zend_mm | RSS stays high after GC | Set `--max-jobs` and `--max-time` |
| `memory_get_usage(false)` | Wrong parameter | Reports lower than actual RSS | Use `memory_get_usage(true)` |
| Assuming zero growth is possible | Unrealistic expectation | Wasted debugging effort | Accept growth — manage rate via recycling |

---

# Related Topics

- **K056 Worker Daemon Architecture (K056)** — The loop running jobs
- **K058 max-jobs / max-time (K058)** — Recycling mechanism
