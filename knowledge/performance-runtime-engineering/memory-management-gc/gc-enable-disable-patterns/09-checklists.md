# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** gc_enable/gc_disable — Time-Sensitive Code Sections, gc_status() Pre/Post
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Disable strategically, not permanently**: gc_disable() around critical sections, gc_enable() after
- [ ] **Call gc_collect_cycles() at boundaries**: Every 100 requests or after heavy batch processing
- [ ] **Monitor gc_status()['roots']**: If root buffer grows >80% of capacity, trigger collection
- [ ] **FPM vs Octane**: In FPM, GC disable is harmless. In Octane, permanent disable causes memory exhaustion
- [ ] **Use gc_status()['protected'] to verify state**: Log before/after in debug builds
- [ ] GC enable/disable pattern understood for time-sensitive code
- [ ] No permanent gc_disable() in long-running processes
- [ ] gc_collect_cycles() called at batch boundaries in Octane/Swoole workers
- [ ] gc_status()['roots'] monitoring configured
- [ ] Root buffer growth alert threshold defined (>5000 entries)
- [ ] GC strategy matched to workload type
- [ ] If disabled: explicit collection plan in place and tested
- [ ] 24-hour test confirms memory stability
- [ ] GC CPU overhead acceptable (<1% of total)
- [ ] Configuration documented with rationale
- [ ] GC CPU time measured (profiling)
- [ ] Root buffer accumulation trend established
- [ ] Workload type matched to GC strategy
- [ ] If disabled: explicit collection strategy defined
- [ ] If enabled: thresholds tuned if needed

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Reference counting vs cycle collection**: Reference counting provides immediate, deterministic memory reclamation for linear structures. Cycle collection is deferred, non-deterministic, and only handles the minority case (cycles). PHP correctly prioritizes RC for performance.
- [ ] **Per-request heap vs shared heap**: PHP-FPM's per-request allocation ensures complete memory isolation and automatic cleanup at request end. Octane's persistent memory trades this safety for performance â€” requiring explicit memory management via sandbox patterns and WeakReference.
- [ ] **High-frequency pattern**: `gc_disable()` at worker start, `gc_collect_cycles()` every 100 requests, `gc_enable()` only on graceful shutdown. Predictable latency with controlled memory growth.
- [ ] **Per-request heap vs shared heap**: PHP-FPM's per-request allocation automatically frees all memory at request end, making GC disable safe. Octane's persistent heap requires active GC management.
- [ ] **Root buffer monitoring**: Track `gc_status()['roots']` over time in production. Monotonic growth signals a leak that periodic collection isn't fixing.
- [ ] Document and follow through on architectural decision: Whether to disable GC for specific operations
- [ ] Document and follow through on architectural decision: Re-enable pattern after GC-disable
- [ ] Ensure architecture aligns with core concept: **gc_disable()**: Sets the `gc_protected` flag. The root buffer continues accumulating entries but collection is not triggered. Pauses are eliminated.
- [ ] Ensure architecture aligns with core concept: **gc_enable()**: Clears protection. If root buffer is over threshold, collection triggers immediately.
- [ ] Ensure architecture aligns with core concept: **gc_status()['protected']**: Boolean indicating whether GC is currently disabled. Check before/after critical sections.
- [ ] Ensure architecture aligns with core concept: **Risk of permanent disable**: In long-running processes (Octane workers), permanently disabled GC causes unbounded root buffer growth â†’ eventual OOM. Always re-enable.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Disable strategically, not permanently**: gc_disable() around critical sections, gc_enable() after
- [ ] **Call gc_collect_cycles() at boundaries**: Every 100 requests or after heavy batch processing
- [ ] **Monitor gc_status()['roots']**: If root buffer grows >80% of capacity, trigger collection
- [ ] **FPM vs Octane**: In FPM, GC disable is harmless. In Octane, permanent disable causes memory exhaustion
- [ ] **Use gc_status()['protected'] to verify state**: Log before/after in debug builds
- [ ] Profile the workload: measure GC CPU time and root buffer accumulation over 24 hours
- [ ] For PHP-FPM web requests: leave GC enabled at default settings â€” GC rarely runs during a single request, and running it adds minimal overhead
- [ ] For Octane/Swoole long-running workers: keep GC enabled but tune thresholds (see GC Threshold Tuning skill)
- [ ] For batch processing jobs with well-defined phases: disable GC during the processing phase, call `gc_collect_cycles()` explicitly between phases
- [ ] For daemon processes where latency jitter from GC pauses is unacceptable: consider disabling GC and using explicit collection at scheduled times
- [ ] Never disable GC entirely without a plan for explicit collection â€” cycles will accumulate until OOM
- [ ] After any GC configuration change, run a 24-hour test to verify memory does not grow unbounded
- [ ] Document the GC configuration and rationale

# Performance Checklist (from 04/06)
- [ ] GC pause avoidance: Disabling GC during critical sections eliminates latency spikes but defers collection cost
- [ ] The deferred cost is identical â€” GC still takes 50-500Âµs when eventually triggered
- [ ] PHP-FPM's shared-nothing architecture makes GC disable safer (process resets after each request) than Octane's persistent workers
- [ ] Root buffer growth rate determines how long you can safely disable GC before OOM risk
- [ ] gc_disable()
- [ ] Persistent memory (Octane)
- [ ] Per-request cleanup (FPM)
- [ ] WeakReference

# Security Checklist (from 04/06 - only if relevant)
- [ ] In multi-tenant Octane apps, disabled GC could let one tenant's memory leak affect others via shared worker
- [ ] gc_status() exposes allocation metadata â€” consider access restrictions in production

# Reliability Checklist (from 04/05/06)
- [ ] **Circular reference leak**: Long-running process accumulates cycles that GC can't collect efficiently. Symptom: Memory grows linearly with request count. Mitigation: Call gc_collect_cycles() periodically, check WeakReference usage.
- [ ] **GC pause storm**: Root buffer fills frequently, causing repeated stop-the-world GC cycles. Symptom: Latency spikes every N requests. Mitigation: Increase GC threshold, or strategically disable/re-enable GC around critical sections.
- [ ] **Reference counting overflow**: refcount wraps on extremely shared values (rare, >4 billion references). Symptom: Memory corruption or segfault. Mitigation: Avoid sharing the same zval across millions of containers.
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- [ ] **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

# Testing Checklist (from 04/06)
- [ ] GC enable/disable pattern understood for time-sensitive code
- [ ] No permanent gc_disable() in long-running processes
- [ ] gc_collect_cycles() called at batch boundaries in Octane/Swoole workers
- [ ] gc_status()['roots'] monitoring configured
- [ ] Root buffer growth alert threshold defined (>5000 entries)
- [ ] GC pause impact measured (confirm it's a real bottleneck before optimizing)
- [ ] GC strategy matched to workload type
- [ ] If disabled: explicit collection plan in place and tested
- [ ] 24-hour test confirms memory stability
- [ ] GC CPU overhead acceptable (<1% of total)
- [ ] Configuration documented with rationale
- [ ] GC CPU time measured (profiling)
- [ ] Root buffer accumulation trend established
- [ ] Workload type matched to GC strategy
- [ ] If disabled: explicit collection strategy defined
- [ ] If enabled: thresholds tuned if needed
- [ ] 24-hour test confirms stable memory
- [ ] GC configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Disable strategically, not permanently**: gc_disable() around critical sections, gc_enable() after
- [ ] **Call gc_collect_cycles() at boundaries**: Every 100 requests or after heavy batch processing
- [ ] **Monitor gc_status()['roots']**: If root buffer grows >80% of capacity, trigger collection
- [ ] **FPM vs Octane**: In FPM, GC disable is harmless. In Octane, permanent disable causes memory exhaustion
- [ ] **Use gc_status()['protected'] to verify state**: Log before/after in debug builds

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Permanently disabling GC in PHP-FPM
- [ ] Avoid: Permanently disabling GC in Octane
- [ ] Avoid: Not calling gc_collect_cycles() before re-enable
- [ ] Avoid: Disabling GC without monitoring roots
- [ ] Avoid anti-pattern: **Disabling GC and never re-enabling**: In Octane, this guarantees eventual OOM. Always pair gc_disable() with gc_enable().
- [ ] Avoid anti-pattern: **gc_collect_cycles() per request**: Wastes CPU. Collect at batch boundaries (100 requests) instead.
- [ ] Avoid anti-pattern: **Disabling GC as a performance "hack"**: GC pauses are 50-500Âµs. Profile first to confirm GC pauses are a real bottleneck.
- [ ] Guard against anti-pattern: Ignoring zval Memory Overhead for Scalars vs Compounds
- [ ] Guard against anti-pattern: Copy-On-Write Violation - Unnecessary Array Duplication
- [ ] Guard against anti-pattern: Ignoring Cyclic Garbage Collection Overhead
- [ ] Guard against anti-pattern: Memory Leak in Long-Running Workers
- [ ] Guard against anti-pattern: Oversized Memory Limit Masking Waste
- [ ] Hot-path data uses scalars
- [ ] No unnecessary string allocations in loops

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- [ ] **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **gc_disable()**: Sets the `gc_protected` flag. The root buffer continues accumulating entries but collection is not triggered. Pauses are eliminated., **gc_enable()**: Clears protection. If root buffer is over threshold, collection triggers immediately., **gc_status()['protected']**: Boolean indicating whether GC is currently disabled. Check before/after critical sections., **Risk of permanent disable**: In long-running processes (Octane workers), permanently disabled GC causes unbounded root buffer growth â†’ eventual OOM. Always re-enable.
**Rules:**
- General: Monitor gc_status protected Flag When Using gc_disable
**Skills:** GC Threshold Tuning, GC Algorithm and Cycle Collection, Memory Leak Detection Patterns
**Decision Trees:** Whether to disable GC for specific operations, Re-enable pattern after GC-disable
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Cyclic GC Algorithm, gc_collect_cycles() Strategic Calling, GC Telemetry and Root Buffer Monitoring, Memory Leak Detection Patterns

