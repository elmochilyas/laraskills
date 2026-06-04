# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** # Memory Leak Detection â€” Growing Static Collections, Closure Accumulation, Checkpointing, Profiling
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Implement memory checkpoint middleware and verify it logs baseline and deltas.
- [ ] Set up RSS monitoring for workers: track over 1-hour soak test.
- [ ] Run `php artisan octane:profile-memory` (Octane) in development.
- [ ] Enable `octane:watch` during development to detect state leaks.
- [ ] Verify no baseline increase over 1000 requests in a soak test.
- [ ] Memory leak identified and fixed
- [ ] RSS growth flattened to <2% per hour
- [ ] Leak source documented with root cause
- [ ] Monitoring in place to detect future leaks
- [ ] Team trained on common leak patterns
- [ ] Memory growth trend confirmed (>10% per hour = leak)
- [ ] Leak source isolated through component disabling
- [ ] Common leak sources checked (statics, singletons, listeners, closures)
- [ ] Octane:watcher or equivalent used for detection
- [ ] Fix applied and verified
- [ ] RSS slope flat for 4+ hours after fix
- [ ] Leak source and fix documented
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Checkpoint workflow**: Record `memory_get_usage(true)` at the start of each request â†’ process â†’ record at end â†’ log delta. Track the baseline (memory after GC at request end). A rising baseline indicates a leak.
- [ ] **RSS tracking workflow**: Monitor `/proc/<pid>/status` or `ps -o rss` for each worker. Plot RSS over time. A linear trend indicates a leak; a flat trend indicates stability.
- [ ] **Leak triage**: 1) Confirm the leak with checkpointing, 2) Isolate by disabling code sections, 3) Use memory profiler to identify the source, 4) Apply fix (bound cache, remove listener, use WeakReference), 5) Verify fix with checkpointing.
- [ ] **Binary search method**: Disable half the application's services/providers â†’ test if leak persists â†’ narrow down to the responsible component â†’ inspect that component for common patterns.
- [ ] **Octane-specific auditing**: Use `octane:watch` during development to detect state leaks. Run `php artisan octane:profile-memory` to identify service providers that consume excessive memory.
- [ ] Document and follow through on architectural decision: Detecting and diagnosing memory leaks
- [ ] Ensure architecture aligns with core concept: **Growing static collections**: `public static array $cache = []` that accumulates entries per-request. Over 10,000 requests â†’ 10,000 entries consuming growing memory. Fix: LRU-size-bound caches or WeakReference-based caches.
- [ ] Ensure architecture aligns with core concept: **Closure accumulation**: Event listeners registered per-request but never removed. Each closure captures scope variables, preventing their memory from being freed. Fix: register listeners at boot time (Octane), not per-request (FPM).
- [ ] Ensure architecture aligns with core concept: **Circular reference leaks**: Complex object graphs where GC cannot determine reachability. Rare but catastrophic. Fix: audit with memory profiling, use WeakReference.
- [ ] Ensure architecture aligns with core concept: **Checkpoint technique**: `memory_get_usage()` at request boundaries. If baseline increases by >5% over 1000 requests, a leak exists. `memory_get_peak_usage()` shows worst-case allocation per request.
- [ ] Ensure architecture aligns with core concept: **RSS monitoring**: Track process RSS via `ps` or `/proc/pid/status`. Worker RSS includes heap, stack, and shared libraries. Most reliable indicator of total memory usage.
- [ ] Ensure architecture aligns with core concept: **Memory profiler**: Tools like Blackfire, SPX, and Tideways can profile memory allocation per function call, identifying leak sources.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Confirm a leak exists: monitor worker RSS over 24 hours â€” if growth >10% per hour, a leak is present
- [ ] Isolate the leak: disable components one at a time to identify which module causes the growth
- [ ] Use memory profiling: compare memory snapshots at request start and end â€” the difference should be near zero in long-running workers
- [ ] Check common leak sources: static properties holding data across requests, singleton registries, event listeners accumulating, closures capturing large scopes
- [ ] For Laravel Octane: run `php artisan octane:watch` to detect state leaks automatically
- [ ] For Symfony: check that services are not holding request-scoped data in shared instances
- [ ] Once identified, fix the leak: unset() large variables, remove accumulated listeners, convert statics to instance properties
- [ ] Verify: monitor RSS over 4 hours â€” slope should be flat (<2% growth per hour)
- [ ] Document the leak source and fix

# Performance Checklist (from 04/06)
- [ ] Memory checkpointing overhead: `memory_get_usage()` takes ~0.5â€“1Âµs per call. Negligible. Enable in production.
- [ ] RSS monitoring overhead: reading `/proc/pid/status` is a syscall taking ~1â€“5Âµs. Batch reads across workers.
- [ ] Memory profiler overhead: tools like SPX add 5â€“15% overhead when actively profiling. Use in staging or for targeted investigations only.
- [ ] Leak detection cost: the cost of detection (checkpointing, monitoring) is orders of magnitude lower than the cost of an undetected OOM crash.
- [ ] Worker recycling cost: each worker restart costs ~200ms spawn overhead + 10â€“40ms bootstrap. Recycling too frequently (every 100 requests) adds 0.1â€“0.4% overhead.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Data leakage: memory leaks can retain sensitive data from previous requests. User A's data may remain in worker memory when User B's request runs. This is the primary security concern of memory leaks in Octane.
- [ ] OOM attacks: an attacker may intentionally trigger memory leaks (by repeatedly hitting leaky endpoints) to cause OOM and denial of service. Rate limiting helps but leak fixing is the real solution.
- [ ] Checkpoint logging: logs containing `memory_get_usage()` values are safe. Avoid logging request data in memory monitoring logs.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Implement memory checkpoint middleware and verify it logs baseline and deltas.
- [ ] Set up RSS monitoring for workers: track over 1-hour soak test.
- [ ] Run `php artisan octane:profile-memory` (Octane) in development.
- [ ] Enable `octane:watch` during development to detect state leaks.
- [ ] Verify no baseline increase over 1000 requests in a soak test.
- [ ] Test with known leak pattern (static array accumulation) and verify detection.
- [ ] Document the memory monitoring setup and alerting thresholds.
- [ ] Memory leak identified and fixed
- [ ] RSS growth flattened to <2% per hour
- [ ] Leak source documented with root cause
- [ ] Monitoring in place to detect future leaks
- [ ] Team trained on common leak patterns
- [ ] Memory growth trend confirmed (>10% per hour = leak)
- [ ] Leak source isolated through component disabling
- [ ] Common leak sources checked (statics, singletons, listeners, closures)
- [ ] Octane:watcher or equivalent used for detection
- [ ] Fix applied and verified
- [ ] RSS slope flat for 4+ hours after fix
- [ ] Leak source and fix documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using `memory_get_usage(false)` instead of `true`
- [ ] Avoid: Assuming `pm.max_requests` solves the problem
- [ ] Avoid: Not calling `gc_collect_cycles()` before measurement
- [ ] Avoid: Profiling with Xdebug in production
- [ ] Avoid anti-pattern: **Memory leak denial**: "Workers always grow a bit, it's normal." Linear growth is not normal. Any sustained memory increase in a stable application indicates a leak.
- [ ] Avoid anti-pattern: **Reactive leak detection**: Waiting until workers OOM before investigating. Proactive monitoring catches leaks when they are small and easy to fix.
- [ ] Avoid anti-pattern: **One-size-fits-all max_requests**: Using the same `max_requests` value for all apps without measuring memory growth. Calibrate based on observed RSS trends.
- [ ] Avoid anti-pattern: **Ignoring memory in development**: "It works on my machine" â€” development machines don't handle millions of requests. Test memory stability under load in staging.
- [ ] Guard against anti-pattern: Ignoring zval Memory Overhead for Scalars vs Compounds
- [ ] Guard against anti-pattern: Copy-On-Write Violation - Unnecessary Array Duplication
- [ ] Guard against anti-pattern: Ignoring Cyclic Garbage Collection Overhead
- [ ] Guard against anti-pattern: Memory Leak in Long-Running Workers
- [ ] Guard against anti-pattern: Oversized Memory Limit Masking Waste
- [ ] Hot-path data uses scalars

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Growing static collections**: `public static array $cache = []` that accumulates entries per-request. Over 10,000 requests â†’ 10,000 entries consuming growing memory. Fix: LRU-size-bound caches or WeakReference-based caches., **Closure accumulation**: Event listeners registered per-request but never removed. Each closure captures scope variables, preventing their memory from being freed. Fix: register listeners at boot time (Octane), not per-request (FPM)., **Circular reference leaks**: Complex object graphs where GC cannot determine reachability. Rare but catastrophic. Fix: audit with memory profiling, use WeakReference., **Checkpoint technique**: `memory_get_usage()` at request boundaries. If baseline increases by >5% over 1000 requests, a leak exists. `memory_get_peak_usage()` shows worst-case allocation per request., **RSS monitoring**: Track process RSS via `ps` or `/proc/pid/status`. Worker RSS includes heap, stack, and shared libraries. Most reliable indicator of total memory usage.
**Rules:**
- General: Set max_requests as Safety Net, Not Leak Fix
**Skills:** PHP Memory Model, GC Telemetry and Root Buffer, State Management and Leak Prevention, Octane Architecture and Execution Model
**Decision Trees:** Detecting and diagnosing memory leaks
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** GC Telemetry and Root Buffer Monitoring, Efficient Data Structures for Memory, Octane Memory Management, Memory Limit Configuration, Persistent vs Per-Request Allocators


