# Anti-Patterns — Queue Worker Memory Management

## Metadata
| Field | Value |
|-------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Worker Management |
| Knowledge Unit | Queue Worker Memory Management |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. No `--memory` Limit — Silent OOM
2. Reliance on GC Instead of Recycling
3. Using `memory_get_usage(false)` — Underestimated RSS
4. Mixed Memory Profiles on Shared Workers

---

## 1. No `--memory` Limit

### Category
Reliability

### Description
Running queue workers without the `--memory` limit, allowing RSS to grow unbounded until the system OOM killer terminates the process.

### Why It Happens
The `--memory` flag is optional and defaults to 0 (no limit). The developer focuses on `--max-jobs` and `--max-time` for recycling, assuming they're sufficient. But recycling limits are checked only after job completion — a single memory-intensive job can exceed available memory before the post-job check runs.

### Warning Signs
- Worker command missing `--memory` flag
- Workers crash with OOM kill
- Server OOM events attributed to PHP workers
- Memory graph shows unbounded growth until crash

### Why Harmful
A worker has `--max-jobs=500` and `--max-time=3600`. A single job loads a 500MB CSV file into memory. The worker's RSS jumps from 40MB to 540MB. The post-job `--memory` check hasn't run yet (job still processing). The system's OOM killer terminates the worker mid-job. The job is lost and re-queued after `retry_after`. The OOM kill may also affect other processes on the server.

### Consequences
- Workers force-killed by OOM killer
- Jobs lost mid-processing
- Potential crash of other processes on the server
- Unstable server from repeated OOM events

### Alternative
Always set `--memory` to a safe upper bound (e.g., 256MB or 512MB) based on observed RSS.

### Refactoring Strategy
1. Monitor RSS for one recycling cycle to establish baseline
2. Set `--memory` to 2x the observed maximum RSS
3. Add `--memory` to all worker commands
4. For memory-intensive jobs, use a dedicated worker with higher `--memory`

### Detection Checklist
- [ ] `--memory` limit set on all workers
- [ ] No OOM-related worker crashes
- [ ] RSS stays below memory limit
- [ ] `--memory` safety net catches abnormal growth

### Related Rules
Always Set --memory Limit on Workers

### Related Skills
Manage Queue Worker Memory Growth with Limits and Recycling

### Related Decision Trees
--memory Limit Setting

---

## 2. Reliance on GC Instead of Recycling

### Category
Performance

### Description
Relying on PHP garbage collection (`gc_collect_cycles()`) to manage worker memory instead of using `--max-jobs`/`--max-time` recycling, expecting GC to release memory back to the OS.

### Why It Happens
PHP developers familiar with request-scoped memory management apply the same approach to daemon workers. They add `gc_collect_cycles()` calls after heavy jobs, assuming this will free memory. They don't understand that zend_mm does not return freed memory chunks to the OS — RSS stays high even after GC.

### Warning Signs
- Custom `gc_collect_cycles()` calls in job code or middleware
- No `--max-jobs` or `--max-time` configured
- Workers assume GC replaces recycling
- RSS grows despite GC calls

### Why Harmful
PHP's zend_mm allocator requests memory from the OS in large chunks and does not return them when freed internally. `gc_collect_cycles()` collects cyclic references but freed memory remains in the allocator's free lists, not returned to the OS. RSS stays at the peak level. A worker processes 500 jobs, each allocating and freeing memory — RSS grows to 200MB and stays there despite GC. Only a process restart resets RSS.

### Consequences
- RSS never decreases despite GC
- Workers hold peak memory indefinitely
- False expectation that GC replaces recycling
- Eventual OOM despite regular GC calls

### Alternative
Use `--max-jobs` and `--max-time` for worker recycling — the only reliable way to reset RSS to baseline.

### Refactoring Strategy
1. Remove or minimize custom `gc_collect_cycles()` calls
2. Set `--max-jobs=500` and `--max-time=3600` on all workers
3. Configure Supervisor autorestart for recycling
4. Monitor: RSS resets to baseline after each restart

### Detection Checklist
- [ ] Recycling configured (`--max-jobs`/`--max-time`)
- [ ] No reliance on GC for memory management
- [ ] RSS resets on worker restart
- [ ] OOM eliminated with recycling

### Related Rules
Rely on Worker Recycling (--max-jobs/--max-time), Not GC

### Related Skills
Manage Queue Worker Memory Growth with Limits and Recycling

### Related Decision Trees
Worker Memory Leak Detection Strategy

---

## 3. Using `memory_get_usage(false)`

### Category
Observability

### Description
Using `memory_get_usage(false)` (default) instead of `memory_get_usage(true)` when monitoring worker memory, reporting lower-than-actual memory usage and missing OOM risks.

### Why It Happens
Both the developer and monitoring scripts use `memory_get_usage()` without the `$real_usage` parameter. The false parameter reports memory allocated by zend_mm internally, which is less than the actual RSS. The discrepancy can be 20-40%, masking memory pressure.

### Warning Signs
- Monitoring uses `memory_get_usage(false)`
- Reported memory is significantly lower than RSS in `ps` output
- Workers OOM despite monitoring showing "safe" memory
- Discrepancy between memory metrics and actual RSS

### Why Harmful
A worker's RSS is 180MB (OOM risk at 200MB). `memory_get_usage(false)` reports 120MB. Monitoring shows "safe" (120 < 200). The actual memory situation is critical but invisible. The worker hits 200MB RSS and is OOM-killed, but monitoring showed green until the crash. The monitoring gives a false sense of safety.

### Consequences
- Underestimated memory usage in monitoring
- OOM crashes with no advance warning
- False green status in memory dashboards
- Debugging confusion from metric discrepancy

### Alternative
Always pass `true` to `memory_get_usage()`: `memory_get_usage(true)`.

### Refactoring Strategy
1. Update all custom memory monitoring to use `true` parameter
2. Compare `memory_get_usage(true)` with `ps -o rss=` to verify accuracy
3. Update alerting thresholds based on real RSS values
4. Retire any monitoring using `false` parameter

### Detection Checklist
- [ ] All memory monitoring uses `memory_get_usage(true)`
- [ ] Reported memory matches OS-level RSS
- [ ] Alerting thresholds based on real RSS
- [ ] No discrepancy between metrics and actual memory

### Related Rules
Use memory_get_usage(true) When Monitoring Manually

### Related Skills
Manage Queue Worker Memory Growth with Limits and Recycling

### Related Decision Trees
--memory Limit Setting

---

## 4. Mixed Memory Profiles on Shared Workers

### Category
Scalability

### Description
Running memory-intensive jobs (reports, data processing) on the same supervisor/workers as lightweight jobs, causing the shared `--memory` limit to either crash the heavy job or allow leaks from it to kill lightweight jobs.

### Why It Happens
One supervisor group runs all queues: `--queue=notifications,reports,default`. `--memory=128` is set for the group. The lightweight notification jobs use 30MB. The report generation job needs 300MB. The report job hits the 128MB limit and is killed, or the limit is raised to 512MB and a leaky report job grows to 500MB — lightweight jobs sharing the same worker are evicted by OOM.

### Warning Signs
- One supervisor for all queue types regardless of memory profile
- Memory-intensive jobs crash on shared workers
- Lightweight jobs OOM from co-located heavy jobs
- `--memory` limit tuned for the heaviest job, causing late detection of leaks

### Why Harmful
A shared supervisor has `--memory=512` to accommodate report generation jobs. A notification job has a slow memory leak — after 200 jobs, it grows to 400MB. The default threshold of 512MB hasn't been hit, so the worker continues. By 600 jobs, RSS is 600MB — the worker is OOM-killed. The notification leak remained undetected because the high memory limit masked it.

### Consequences
- Memory limit must accommodate the heaviest job, masking leaks
- Lightweight workers killed by co-located heavy jobs
- Leaks in lightweight jobs undetected until OOM
- Workers cannot be tuned per workload

### Alternative
Separate memory-intensive jobs onto dedicated supervisor groups with appropriate `--memory` limits.

### Refactoring Strategy
1. Identify jobs by memory profile: lightweight (<64MB), standard (64-256MB), heavy (>256MB)
2. Create separate supervisor groups per memory tier
3. Route jobs to appropriate queues and supervisor groups
4. Tune `--memory` per group (128MB for lightweight, 512MB for heavy)
5. Monitor: verify each group stays within its memory budget

### Detection Checklist
- [ ] Separate supervisor groups for different memory profiles
- [ ] `--memory` tuned per workload type
- [ ] Lightweight workers not affected by heavy jobs
- [ ] Memory leaks visible per workload profile

### Related Rules
Dedicate Separate Supervisors for Memory-Intensive Jobs

### Related Skills
Manage Queue Worker Memory Growth with Limits and Recycling

### Related Decision Trees
Worker Memory Leak Detection Strategy
