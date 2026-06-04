# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** GC Telemetry and Root Buffer Monitoring â€” gc_status(), Collection Frequency
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Monitor in Octane workers**: Log gc_status() every N requests. Alert if root_buffer_entries > 5000 or collector_time/application_time > 5%.
- [ ] **Track trends, not absolutes**: Root buffer entries growing over time = leak. Stable or cycling = healthy.
- [ ] **Compare across workers**: Inconsistent root buffer growth across workers indicates a request-order-dependent leak.
- [ ] **Log at worker start as baseline**: Capture gc_status() once to know baseline "roots" and "collected" counters.
- [ ] GC telemetry logging configured in production (Octane/Swoole workers)
- [ ] Alert threshold defined for root_buffer_entries > 5000
- [ ] Alert threshold defined for collector_time > 5% of application_time
- [ ] Baseline gc_status() captured at worker start
- [ ] RSS monitoring cross-referenced with GC telemetry
- [ ] gc_status() monitoring implemented with dashboard
- [ ] Root buffer growth rate established and tracked
- [ ] Alert configured for elevated root buffer (>80% of threshold)
- [ ] GC CPU overhead (application_time) tracked
- [ ] Telemetry interpretation documented for team
- [ ] gc_status() recorded at regular intervals
- [ ] runs, collected, threshold, roots, application_time understood
- [ ] Collection efficiency calculated (collected / runs)
- [ ] Root buffer growth rate established
- [ ] Alert set for roots > 80% of threshold
- [ ] Monitoring dashboard created with GC metrics

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Reference counting vs cycle collection**: Reference counting provides immediate, deterministic memory reclamation for linear structures. Cycle collection is deferred, non-deterministic, and only handles the minority case (cycles). PHP correctly prioritizes RC for performance.
- [ ] **Per-request heap vs shared heap**: PHP-FPM's per-request allocation ensures complete memory isolation and automatic cleanup at request end. Octane's persistent memory trades this safety for performance Ã¢â‚¬â€ requiring explicit memory management via sandbox patterns and WeakReference.
- [ ] **FPM vs Octane monitoring**: In FPM, GC state resets per request so per-request monitoring is meaningless. Monitor process-level RSS instead. In Octane, gc_status() accumulates and is meaningful.
- [ ] **Root buffer capacity planning**: Default threshold is 10,000 entries. If collector_time/application_time > 5%, raise threshold or investigate cycle formation.
- [ ] **Combined with RSS tracking**: Cross-reference gc_status()['roots'] with worker RSS. If RSS grows but roots stay flat, the leak is not from cycles (likely static property or closure accumulation).
- [ ] Document and follow through on architectural decision: How to monitor GC activity
- [ ] Document and follow through on architectural decision: When to alert on GC metrics
- [ ] Ensure architecture aligns with core concept: **gc_status() output**: `{ running: bool, protected: bool, full: bool, buffer_size: int, running_time: float, collected: int, roots: int, threshold: int, application_time: float, collector_time: float }`
- [ ] Ensure architecture aligns with core concept: **Root buffer entries**: Number of potential cycle roots currently tracked. If growing monotonically, GC may be disabled or cycles may be forming faster than collection.
- [ ] Ensure architecture aligns with core concept: **Collection frequency**: `gc_status()['collected']` â€” total cycles collected since process start. Rapid growth indicates cycle-heavy code patterns.
- [ ] Ensure architecture aligns with core concept: **collector_time vs application_time**: Ratio of GC time to application time. >5% GC time indicates excessive cycles or too-frequent collection.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Monitor in Octane workers**: Log gc_status() every N requests. Alert if root_buffer_entries > 5000 or collector_time/application_time > 5%.
- [ ] **Track trends, not absolutes**: Root buffer entries growing over time = leak. Stable or cycling = healthy.
- [ ] **Compare across workers**: Inconsistent root buffer growth across workers indicates a request-order-dependent leak.
- [ ] **Log at worker start as baseline**: Capture gc_status() once to know baseline "roots" and "collected" counters.
- [ ] Call `gc_status()` and record the five fields: runs, collected, threshold, roots, application_time
- [ ] `runs`: number of times GC has executed since process start â€” should increase slowly over time for long-running workers
- [ ] `collected`: total number of cycles freed since process start â€” should correlate with runs
- [ ] `threshold`: the root buffer size that triggers GC (default 10001) â€” check if appropriate for workload
- [ ] `roots`: current root buffer size â€” this is the most critical metric for active monitoring
- [ ] `application_time`: time spent in GC since process start â€” high values indicate GC is consuming CPU
- [ ] Calculate collection efficiency: `collected / runs` â€” should be > 100 (each run should collect hundreds of cycles)
- [ ] Measure growth rate: `roots` over time in Octane workers â€” if growing, cycles are accumulating faster than collected
- [ ] If `roots` consistently stays high (near threshold), GC runs frequently â€” investigate cycle sources
- [ ] Set up monitoring to alert if `roots` exceeds 80% of `threshold` for sustained periods

# Performance Checklist (from 04/06)
- [ ] Reference counting overhead: each zval assignment/deletion manipulates refcount; hot loops see measurable CPU cost
- [ ] GC collection pauses execution for 1-10ms depending on root buffer size and number of cycles
- [ ] Copy-on-write: array/string modification triggers duplication; use SplFixedArray for large fixed-size arrays
- [ ] Zend MM uses per-request heap; persistent allocator reduces fragmentation in long-running processes
- [ ] WeakReference resolution requires hash table lookup (~0.1Âµs); negligible for occasional use
- [ ] gc_disable()
- [ ] Persistent memory (Octane)
- [ ] Per-request cleanup (FPM)
- [ ] WeakReference

# Security Checklist (from 04/06 - only if relevant)
- [ ] gc_status() exposes internal memory state. In multi-tenant environments, restrict access to this function.
- [ ] Root buffer growth patterns could theoretically leak information about request processing patterns.

# Reliability Checklist (from 04/05/06)
- [ ] **Circular reference leak**: Long-running process accumulates cycles that GC can't collect efficiently. Symptom: Memory grows linearly with request count. Mitigation: Call gc_collect_cycles() periodically, check WeakReference usage.
- [ ] **GC pause storm**: Root buffer fills frequently, causing repeated stop-the-world GC cycles. Symptom: Latency spikes every N requests. Mitigation: Increase GC threshold, or strategically disable/re-enable GC around critical sections.
- [ ] **Reference counting overflow**: refcount wraps on extremely shared values (rare, >4 billion references). Symptom: Memory corruption or segfault. Mitigation: Avoid sharing the same zval across millions of containers.
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- [ ] **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

# Testing Checklist (from 04/06)
- [ ] GC telemetry logging configured in production (Octane/Swoole workers)
- [ ] Alert threshold defined for root_buffer_entries > 5000
- [ ] Alert threshold defined for collector_time > 5% of application_time
- [ ] Baseline gc_status() captured at worker start
- [ ] RSS monitoring cross-referenced with GC telemetry
- [ ] Review cycle established for weekly GC telemetry checks
- [ ] gc_status() monitoring implemented with dashboard
- [ ] Root buffer growth rate established and tracked
- [ ] Alert configured for elevated root buffer (>80% of threshold)
- [ ] GC CPU overhead (application_time) tracked
- [ ] Telemetry interpretation documented for team
- [ ] gc_status() recorded at regular intervals
- [ ] runs, collected, threshold, roots, application_time understood
- [ ] Collection efficiency calculated (collected / runs)
- [ ] Root buffer growth rate established
- [ ] Alert set for roots > 80% of threshold
- [ ] Monitoring dashboard created with GC metrics
- [ ] Interpretation documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Monitor in Octane workers**: Log gc_status() every N requests. Alert if root_buffer_entries > 5000 or collector_time/application_time > 5%.
- [ ] **Track trends, not absolutes**: Root buffer entries growing over time = leak. Stable or cycling = healthy.
- [ ] **Compare across workers**: Inconsistent root buffer growth across workers indicates a request-order-dependent leak.
- [ ] **Log at worker start as baseline**: Capture gc_status() once to know baseline "roots" and "collected" counters.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Not monitoring GC in long-running workers
- [ ] Avoid: Reading gc_status() once in FPM
- [ ] Avoid: Alerting on absolute root count
- [ ] Avoid: Ignoring collector_time ratio
- [ ] Avoid anti-pattern: **Checking gc_status() only during incidents**: By the time RSS is alarming, cycles have been accumulating for hours. Monitor continuously.
- [ ] Avoid anti-pattern: **Assuming gc_status()['collected'] = 0 means no leaks**: Cycles may exist that GC hasn't detected yet. Root buffer may not have filled.
- [ ] Avoid anti-pattern: **Setting and forgetting threshold**: As application evolves, cycle patterns change. Review GC telemetry weekly after major deploys.
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
**Core Concepts:** **gc_status() output**: `{ running: bool, protected: bool, full: bool, buffer_size: int, running_time: float, collected: int, roots: int, threshold: int, application_time: float, collector_time: float }`, **Root buffer entries**: Number of potential cycle roots currently tracked. If growing monotonically, GC may be disabled or cycles may be forming faster than collection., **Collection frequency**: `gc_status()['collected']` â€” total cycles collected since process start. Rapid growth indicates cycle-heavy code patterns., **collector_time vs application_time**: Ratio of GC time to application time. >5% GC time indicates excessive cycles or too-frequent collection.
**Rules:**
- General: Collect Baseline gc_status at Worker Start
**Skills:** GC Algorithm and Cycle Collection, GC Threshold Tuning, Memory Leak Detection Patterns
**Decision Trees:** How to monitor GC activity, When to alert on GC metrics
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Cyclic GC Algorithm, gc_collect_cycles() Strategic Calling, Memory Leak Detection Patterns, GC Enable/Disable Patterns

