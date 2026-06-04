# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** gc_collect_cycles() Strategic Calling — Batch Boundaries, Not Per-Iteration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Verify Octane workers call gc_collect_cycles() after each request.
- [ ] Check hot loops for unnecessary gc_collect_cycles() calls.
- [ ] Monitor gc_status() before/after calls to measure effectiveness.
- [ ] Set up RSS monitoring for long-running workers.
- [ ] gc_collect_cycles() placed at optimal points in batch processing
- [ ] Memory reclaimed immediately after each explicit call
- [ ] CPU overhead from explicit calls measured and acceptable
- [ ] Automatic GC triggers prevented during critical phases (reduced latency variance)
- [ ] Strategy documented with rationale
- [ ] Batch process phases identified and memory profiled
- [ ] Root buffer growth monitored across phases
- [ ] gc_collect_cycles() called after memory-intensive phases
- [ ] Memory reclaimed confirmed after each call
- [ ] CPU overhead measured and justified
- [ ] Automatic GC triggers analyzed (threshold tuning if needed)
- [ ] Strategy documented
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- [ ] **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Reference counting vs cycle collection**: Reference counting provides immediate, deterministic memory reclamation for linear structures. Cycle collection is deferred, non-deterministic, and only handles the minority case (cycles). PHP correctly prioritizes RC for performance.
- [ ] **Per-request heap vs shared heap**: PHP-FPM's per-request allocation ensures complete memory isolation and automatic cleanup at request end. Octane's persistent memory trades this safety for performance â€” requiring explicit memory management via sandbox patterns and WeakReference.
- [ ] Automatic GC triggers when root buffer reaches 10,000 entries (stop-the-world pause).
- [ ] Proactive calling at controlled times prevents unpredictable pauses.
- [ ] PHP 8.5 reduces false positives from static fake closures and Enum singletons.
- [ ] Document and follow through on architectural decision: When to call gc_collect_cycles() manually
- [ ] Document and follow through on architectural decision: GC disable/enable strategy for hot paths
- [ ] Ensure architecture aligns with core concept: gc_collect_cycles() cost: 50-500us per full cycle depending on root buffer size and object graph complexity.
- [ ] Ensure architecture aligns with core concept: Per-iteration overhead: Calling GC after every loop iteration in 1000-iteration loop adds 50-500ms of total GC time.
- [ ] Ensure architecture aligns with core concept: Batch boundary pattern: Call after processing a batch (every 100 queue jobs, after each HTTP request in Octane).
- [ ] Ensure architecture aligns with core concept: gc_status() pre/post: Monitor collection effectiveness with before/after measurements.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Profile the batch process: measure memory usage at each phase
- [ ] Check GC telemetry: `gc_status()['root_buffer_length']` before and after each phase
- [ ] Identify phases where root buffer grows significantly (5000+ entries accumulated)
- [ ] After each such phase, call `gc_collect_cycles()` to immediately process the root buffer
- [ ] Measure memory after the call: should decrease as cycles are freed
- [ ] If memory does not decrease, the root buffer entries are not cycles â€” investigate other leak sources
- [ ] For very large batches (>100K items), consider calling gc_collect_cycles() every N items
- [ ] Monitor CPU overhead from the explicit calls: each call takes 1-50ms
- [ ] If CPU overhead exceeds the benefit, remove the explicit call and let automatic GC handle it
- [ ] Document the gc_collect_cycles() placement and rationale

# Performance Checklist (from 04/06)
- [ ] Each gc_collect_cycles() call: 50-500us.
- [ ] Per-iteration GC in 1000-iteration loop: 50-500ms added.
- [ ] Automatic GC at threshold: unpredictable pause during request.
- [ ] gc_disable()
- [ ] Persistent memory (Octane)
- [ ] Per-request cleanup (FPM)
- [ ] WeakReference

# Security Checklist (from 04/06 - only if relevant)
- [ ] No direct security implications.
- [ ] OOM from unchecked cycle accumulation is a denial-of-service risk.

# Reliability Checklist (from 04/05/06)
- [ ] **Circular reference leak**: Long-running process accumulates cycles that GC can't collect efficiently. Symptom: Memory grows linearly with request count. Mitigation: Call gc_collect_cycles() periodically, check WeakReference usage.
- [ ] **GC pause storm**: Root buffer fills frequently, causing repeated stop-the-world GC cycles. Symptom: Latency spikes every N requests. Mitigation: Increase GC threshold, or strategically disable/re-enable GC around critical sections.
- [ ] **Reference counting overflow**: refcount wraps on extremely shared values (rare, >4 billion references). Symptom: Memory corruption or segfault. Mitigation: Avoid sharing the same zval across millions of containers.
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- [ ] **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

# Testing Checklist (from 04/06)
- [ ] Verify Octane workers call gc_collect_cycles() after each request.
- [ ] Check hot loops for unnecessary gc_collect_cycles() calls.
- [ ] Monitor gc_status() before/after calls to measure effectiveness.
- [ ] Set up RSS monitoring for long-running workers.
- [ ] gc_collect_cycles() placed at optimal points in batch processing
- [ ] Memory reclaimed immediately after each explicit call
- [ ] CPU overhead from explicit calls measured and acceptable
- [ ] Automatic GC triggers prevented during critical phases (reduced latency variance)
- [ ] Strategy documented with rationale
- [ ] Batch process phases identified and memory profiled
- [ ] Root buffer growth monitored across phases
- [ ] gc_collect_cycles() called after memory-intensive phases
- [ ] Memory reclaimed confirmed after each call
- [ ] CPU overhead measured and justified
- [ ] Automatic GC triggers analyzed (threshold tuning if needed)
- [ ] Strategy documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Calling gc_collect_cycles() before every DB query
- [ ] Avoid anti-pattern: Calling gc_collect_cycles() per-iteration in loops.
- [ ] Avoid anti-pattern: Not calling gc_collect_cycles() in long-running Octane workers.
- [ ] Guard against anti-pattern: Ignoring zval Memory Overhead for Scalars vs Compounds
- [ ] Guard against anti-pattern: Copy-On-Write Violation - Unnecessary Array Duplication
- [ ] Guard against anti-pattern: Ignoring Cyclic Garbage Collection Overhead
- [ ] Guard against anti-pattern: Memory Leak in Long-Running Workers
- [ ] Guard against anti-pattern: Oversized Memory Limit Masking Waste
- [ ] Hot-path data uses scalars
- [ ] No unnecessary string allocations in loops
- [ ] Profiling confirms reduced allocation

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
**Core Concepts:** gc_collect_cycles() cost: 50-500us per full cycle depending on root buffer size and object graph complexity., Per-iteration overhead: Calling GC after every loop iteration in 1000-iteration loop adds 50-500ms of total GC time., Batch boundary pattern: Call after processing a batch (every 100 queue jobs, after each HTTP request in Octane)., gc_status() pre/post: Monitor collection effectiveness with before/after measurements.
**Skills:** GC Algorithm and Cycle Collection, GC Threshold Tuning, GC Telemetry and Root Buffer, Memory Leak Detection Patterns
**Decision Trees:** When to call gc_collect_cycles() manually, GC disable/enable strategy for hot paths
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Cyclic GC Algorithm, GC Enable/Disable Patterns, GC Telemetry and Root Buffer Monitoring

