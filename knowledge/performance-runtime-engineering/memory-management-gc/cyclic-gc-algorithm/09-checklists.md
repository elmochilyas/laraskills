# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** Cyclic GC Algorithm â€” Root Buffer, Mark-Grey/Scan/Sweep Phases
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Monitor gc_status() in production**: Track `root_buffer_entries` and `collected` to detect cycle accumulation
- [ ] **Call gc_collect_cycles() strategically**: At batch boundaries in long-running processes, not per-iteration
- [ ] **Use WeakReference to prevent cycles**: Cache-like patterns should not create circular references
- [ ] **Set pm.max_requests**: Recycle FPM workers every 500-1000 requests to prevent cycle accumulation
- [ ] GC algorithm phases understood (Mark-Grey, Scan, Sweep)
- [ ] Root buffer monitoring configured in production
- [ ] Strategic gc_collect_cycles() calls implemented for long-running processes
- [ ] WeakReference used for cache-like patterns to prevent cycles
- [ ] RSS monitoring alerts configured for >10% growth over 1000 requests
- [ ] GC algorithm (purple/grey/white) understood
- [ ] Root buffer size monitored and managed
- [ ] gc_collect_cycles() used strategically, not profligately
- [ ] Cycle prevention reduces unnecessary GC runs
- [ ] GC behavior documented for team reference
- [ ] GC activity monitored (runs, collected, threshold, roots)
- [ ] Purple/grey/white algorithm understood
- [ ] Root buffer entries minimized through cycle prevention
- [ ] gc_collect_cycles() used strategically after batch operations
- [ ] Long-running workers monitored for buffer accumulation
- [ ] GC behavior documented

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Reference counting vs cycle collection**: Reference counting provides immediate, deterministic memory reclamation for linear structures. Cycle collection is deferred, non-deterministic, and only handles the minority case (cycles). PHP correctly prioritizes RC for performance.
- [ ] **Per-request heap vs shared heap**: PHP-FPM's per-request allocation ensures complete memory isolation and automatic cleanup at request end. Octane's persistent memory trades this safety for performance Ã¢â‚¬â€ requiring explicit memory management via sandbox patterns and WeakReference.
- [ ] **Per-request vs persistent memory**: PHP-FPM's per-request heap destroys all memory at request end, making GC less critical. Octane's persistent memory requires active GC management.
- [ ] **GC trigger threshold**: Default root buffer is 10,000 entries. For memory-constrained environments, lower threshold. For latency-sensitive, raise or temporarily disable.
- [ ] **Reference counting priority**: PHP handles 99%+ of memory reclamation via refcounting. GC only handles circular references â€” design code to minimize cycles.
- [ ] Document and follow through on architectural decision: Understanding when cyclic GC runs
- [ ] Document and follow through on architectural decision: Mitigating cyclic GC impact
- [ ] Ensure architecture aligns with core concept: **Root buffer**: Array of `zend_refcounted*` pointers tracking potential cycle roots. Default size: 10,000. When full, GC is triggered automatically.
- [ ] Ensure architecture aligns with core concept: **Mark-Grey phase**: Walk all children of each root, decrement their refcounts by 1 (simulating removal of the root's reference). Nodes with refcount > 0 after this are still reachable from outside the cycle.
- [ ] Ensure architecture aligns with core concept: **Scan phase**: Walk all children again, incrementing refcounts of reachable nodes (restoring them). Nodes that remain refcount=0 are unreachable cycle members.
- [ ] Ensure architecture aligns with core concept: **Sweep phase**: Free all unreachable cycle members. These are the actual garbage.
- [ ] Ensure architecture aligns with core concept: **gc_status()**: Returns `{ 'running', 'protected', 'root_buffer_size', 'root_buffer_entries', 'collectable', 'collected' }`.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Monitor gc_status() in production**: Track `root_buffer_entries` and `collected` to detect cycle accumulation
- [ ] **Call gc_collect_cycles() strategically**: At batch boundaries in long-running processes, not per-iteration
- [ ] **Use WeakReference to prevent cycles**: Cache-like patterns should not create circular references
- [ ] **Set pm.max_requests**: Recycle FPM workers every 500-1000 requests to prevent cycle accumulation
- [ ] Monitor GC activity: `gc_status()` shows runs, collected, threshold, roots
- [ ] The GC algorithm: purple nodes (possible cycle roots) are stored in the root buffer
- [ ] When root buffer reaches threshold (default 10000), GC runs: marks all nodes grey, then scans for cycles using purple/grey/white algorithm
- [ ] Nodes in a true cycle remain white after scanning â€” these are collected
- [ ] Nodes reachable from outside the cycle become grey/black â€” these are kept
- [ ] After collection, freed memory is returned to the Zend MM
- [ ] To optimize: minimize the number of buffer entries by avoiding unnecessary cycles
- [ ] For batch operations: call `gc_collect_cycles()` after the batch to clean up before the buffer auto-triggers
- [ ] For long-running workers: monitor root_buffer_length â€” if it stays high, investigate cycle sources
- [ ] Document the GC algorithm behavior relevant to the application

# Performance Checklist (from 04/06)
- [ ] Full GC cycle: 50-500Âµs depending on number of roots and depth of structures
- [ ] GC pauses: The algorithm runs inline (stop-the-world) during the sweep phase
- [ ] PHP 8.5 improvements: Skip static fake closures (first-class callables) and Enum singletons â€” common false positives that wasted GC cycles
- [ ] Root buffer overflow: When buffer fills mid-request, GC triggers inline, adding latency
- [ ] gc_disable()
- [ ] Persistent memory (Octane)
- [ ] Per-request cleanup (FPM)
- [ ] WeakReference

# Security Checklist (from 04/06 - only if relevant)
- [ ] GC state leaks between requests in Octane: Cumulative root buffer entries can expose allocation patterns
- [ ] Never disable GC permanently in long-running processes â€” unbounded root buffer growth leads to OOM

# Reliability Checklist (from 04/05/06)
- [ ] **Circular reference leak**: Long-running process accumulates cycles that GC can't collect efficiently. Symptom: Memory grows linearly with request count. Mitigation: Call gc_collect_cycles() periodically, check WeakReference usage.
- [ ] **GC pause storm**: Root buffer fills frequently, causing repeated stop-the-world GC cycles. Symptom: Latency spikes every N requests. Mitigation: Increase GC threshold, or strategically disable/re-enable GC around critical sections.
- [ ] **Reference counting overflow**: refcount wraps on extremely shared values (rare, >4 billion references). Symptom: Memory corruption or segfault. Mitigation: Avoid sharing the same zval across millions of containers.
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- [ ] **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

# Testing Checklist (from 04/06)
- [ ] GC algorithm phases understood (Mark-Grey, Scan, Sweep)
- [ ] Root buffer monitoring configured in production
- [ ] Strategic gc_collect_cycles() calls implemented for long-running processes
- [ ] WeakReference used for cache-like patterns to prevent cycles
- [ ] RSS monitoring alerts configured for >10% growth over 1000 requests
- [ ] PHP 8.5 GC improvements evaluated for reduced false positives
- [ ] GC algorithm (purple/grey/white) understood
- [ ] Root buffer size monitored and managed
- [ ] gc_collect_cycles() used strategically, not profligately
- [ ] Cycle prevention reduces unnecessary GC runs
- [ ] GC behavior documented for team reference
- [ ] GC activity monitored (runs, collected, threshold, roots)
- [ ] Purple/grey/white algorithm understood
- [ ] Root buffer entries minimized through cycle prevention
- [ ] gc_collect_cycles() used strategically after batch operations
- [ ] Long-running workers monitored for buffer accumulation
- [ ] GC behavior documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Monitor gc_status() in production**: Track `root_buffer_entries` and `collected` to detect cycle accumulation
- [ ] **Call gc_collect_cycles() strategically**: At batch boundaries in long-running processes, not per-iteration
- [ ] **Use WeakReference to prevent cycles**: Cache-like patterns should not create circular references
- [ ] **Set pm.max_requests**: Recycle FPM workers every 500-1000 requests to prevent cycle accumulation

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Assuming unset() immediately frees memory
- [ ] Avoid: Not calling gc_collect_cycles() in long-running processes
- [ ] Avoid: Using static properties for request-scoped data
- [ ] Avoid: Ignoring copy-on-write in loops
- [ ] Avoid: Not monitoring worker RSS
- [ ] Avoid anti-pattern: **Permanent GC disable in Octane workers**: Eliminates pauses but causes unbounded root buffer growth. Always re-enable after critical sections.
- [ ] Avoid anti-pattern: **gc_collect_cycles() per request**: Wastes CPU. Call at batch boundaries (every 100 requests) instead.
- [ ] Avoid anti-pattern: **Ignoring GC telemetry**: In FPM, GC resets per request so telemetry seems flat. In Octane, monotonic root buffer growth signals a leak.
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
**Core Concepts:** **Root buffer**: Array of `zend_refcounted*` pointers tracking potential cycle roots. Default size: 10,000. When full, GC is triggered automatically., **Mark-Grey phase**: Walk all children of each root, decrement their refcounts by 1 (simulating removal of the root's reference). Nodes with refcount > 0 after this are still reachable from outside the cycle., **Scan phase**: Walk all children again, incrementing refcounts of reachable nodes (restoring them). Nodes that remain refcount=0 are unreachable cycle members., **Sweep phase**: Free all unreachable cycle members. These are the actual garbage., **gc_status()**: Returns `{ 'running', 'protected', 'root_buffer_size', 'root_buffer_entries', 'collectable', 'collected' }`.
**Rules:**
- General: Use gc_status to Monitor GC Activity, Not Just Memory Usage
**Skills:** GC Threshold Tuning, GC Telemetry and Root Buffer, Circular Reference Detection, WeakReference API Usage
**Decision Trees:** Understanding when cyclic GC runs, Mitigating cyclic GC impact
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Root Buffer Dynamics and Threshold Tuning, gc_collect_cycles() Strategic Calling, GC Enable/Disable Patterns, Memory Leak Detection Patterns

