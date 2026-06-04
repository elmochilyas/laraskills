# Queue Worker Memory Management — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K074 — Queue Worker Memory Management
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand RSS (Resident Set Size) vs application memory
- [ ] Know that PHP's zend_mm does not return freed memory to OS immediately
- [ ] Familiar with `memory_get_usage(true)` vs `memory_get_usage(false)`

## Implementation Checklist
- [ ] `--memory` limit set on all workers (default 128MB, tune to 256-512MB as needed)
- [ ] `--max-jobs` and `--max-time` set as primary defense against memory growth
- [ ] Baseline RSS measured and documented per worker type
- [ ] Memory growth rate monitored over worker lifetime
- [ ] Memory-intensive jobs run on dedicated supervisors with higher limits
- [ ] `gc_collect_cycles()` called after heavy jobs if needed

## Verification Checklist
- [ ] RSS stays within `--memory` limit across worker lifetime
- [ ] Worker exits when RSS exceeds `--memory` threshold
- [ ] No unbounded memory growth between recycling events
- [ ] Per-job memory growth identified for leaky jobs
- [ ] Baseline memory is stable across restarts

## Security Checklist
- [ ] Workers don't accumulate sensitive data in memory
- [ ] Memory limits prevent OOM-related crashes
- [ ] Long-running workers don't leak customer data

## Performance Checklist
- [ ] `memory_get_usage(true)`: ~1 microsecond call (negligible)
- [ ] `gc_collect_cycles()`: pauses execution 1-10ms — run only after heavy jobs
- [ ] Restart overhead: ~50-200ms per 500 jobs (0.1-0.4ms per job)
- [ ] Recycling is far more effective than GC for reducing RSS

## Production Readiness Checklist
- [ ] `--memory` set based on observed RSS growth, not default
- [ ] Monitoring on worker RSS over time
- [ ] Alerts for workers approaching memory limit
- [ ] Periodic review of memory growth patterns
- [ ] Dedicated workers for memory-intensive job types

## Common Mistakes to Avoid
- [ ] Assuming `--memory` checks during jobs (check runs AFTER job)
- [ ] No recycling, relying on GC (zend_mm doesn't return memory to OS)
- [ ] `memory_get_usage(false)` instead of `true` (reports lower than actual RSS)
- [ ] Assuming zero growth is possible (accept growth, manage rate via recycling)
