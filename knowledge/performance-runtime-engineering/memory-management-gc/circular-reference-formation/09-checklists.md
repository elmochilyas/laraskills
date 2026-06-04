# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** Circular Reference Formation â€” Parent-Child Back-Pointers, Event Listener Accumulation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Audit codebase for closure listeners that capture parent scope.
- [ ] Check for self-references in singletons.
- [ ] Verify WeakReference usage in parent-child relationships.
- [ ] Monitor root buffer growth in long-running workers.
- [ ] Circular reference formation prevented at design level
- [ ] All bidirectional relationships mapped and structured correctly
- [ ] GC root buffer shows no accumulation from resolved cycles
- [ ] Relationship design rules documented and enforced in code reviews
- [ ] All bidirectional object relationships mapped
- [ ] Owner-dependent relationship clarified for each cycle
- [ ] WeakReference or ID-based lookup used on non-owner side
- [ ] Observer pattern uses weak references
- [ ] Tree structures use weak parent references
- [ ] ORM bidirectional relations structured correctly
- [ ] Closure $this capture cycles eliminated
- [ ] GC root buffer stabilized
- [ ] Relationship design rules documented
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Reference counting vs cycle collection**: Reference counting provides immediate, deterministic memory reclamation for linear structures. Cycle collection is deferred, non-deterministic, and only handles the minority case (cycles). PHP correctly prioritizes RC for performance.
- [ ] **Per-request heap vs shared heap**: PHP-FPM's per-request allocation ensures complete memory isolation and automatic cleanup at request end. Octane's persistent memory trades this safety for performance Ã¢â‚¬â€ requiring explicit memory management via sandbox patterns and WeakReference.
- [ ] Cycles are only a problem in long-running processes (Octane, queue workers).
- [ ] In PHP-FPM, cycles are moot because all memory is freed at request end.
- [ ] WeakReference allows parent references without creating cycles.
- [ ] Document and follow through on architectural decision: How to handle circular references
- [ ] Document and follow through on architectural decision: Weak references vs explicit break
- [ ] Ensure architecture aligns with core concept: Direct cycle: $parent->child = $child; $child->parent = $parent; both objects have refcount=1 even after unset. GC must collect them.
- [ ] Ensure architecture aligns with core concept: Self-reference: $obj->self = $obj; refcount never drops below 1. Common in singleton patterns.
- [ ] Ensure architecture aligns with core concept: Event listener accumulation: $subject->listeners[] = function() use ($subject); closure captures $subject, creating a cycle. Accumulates over time in long-running processes.
- [ ] Ensure architecture aligns with core concept: SplObjectStorage cycles: Storing objects as keys that reference the storage container creates undetected cycles.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Map all bidirectional object relationships in the application
- [ ] For each bidirectional relationship, designate one side as the "owner" (controls lifetime)
- [ ] On the non-owner side, use a weak reference (WeakReference) or a simple ID-based lookup instead of a direct object reference
- [ ] For observer patterns: have the subject maintain a list of weak references to observers, not strong references
- [ ] For tree structures: parent holds strong references to children; children hold WeakReference (or parent ID) back to parent
- [ ] For ORM bidirectional relations: the owning side (with foreign key) holds the strong reference; the inverse side uses a lazy lookup
- [ ] For callback closures: avoid `$this` capture in closures that are stored as class properties (creates $thisâ†’closureâ†’$this cycle)
- [ ] After restructuring, verify GC root buffer no longer accumulates from the resolved cycles
- [ ] Document the relationship design rules for the team

# Performance Checklist (from 04/06)
- [ ] GC collection pauses for 1-10ms when root buffer fills.
- [ ] Cycle accumulation in long-running processes increases GC cost over time.
- [ ] gc_collect_cycles() at boundaries prevents unpredictable pauses.
- [ ] gc_disable()
- [ ] Persistent memory (Octane)
- [ ] Per-request cleanup (FPM)
- [ ] WeakReference

# Security Checklist (from 04/06 - only if relevant)
- [ ] Memory exhaustion from accumulated cycles is a denial-of-service risk.
- [ ] Monitor worker RSS in production to detect cycle accumulation.

# Reliability Checklist (from 04/05/06)
- [ ] **Circular reference leak**: Long-running process accumulates cycles that GC can't collect efficiently. Symptom: Memory grows linearly with request count. Mitigation: Call gc_collect_cycles() periodically, check WeakReference usage.
- [ ] **GC pause storm**: Root buffer fills frequently, causing repeated stop-the-world GC cycles. Symptom: Latency spikes every N requests. Mitigation: Increase GC threshold, or strategically disable/re-enable GC around critical sections.
- [ ] **Reference counting overflow**: refcount wraps on extremely shared values (rare, >4 billion references). Symptom: Memory corruption or segfault. Mitigation: Avoid sharing the same zval across millions of containers.
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- [ ] **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

# Testing Checklist (from 04/06)
- [ ] Audit codebase for closure listeners that capture parent scope.
- [ ] Check for self-references in singletons.
- [ ] Verify WeakReference usage in parent-child relationships.
- [ ] Monitor root buffer growth in long-running workers.
- [ ] Circular reference formation prevented at design level
- [ ] All bidirectional relationships mapped and structured correctly
- [ ] GC root buffer shows no accumulation from resolved cycles
- [ ] Relationship design rules documented and enforced in code reviews
- [ ] All bidirectional object relationships mapped
- [ ] Owner-dependent relationship clarified for each cycle
- [ ] WeakReference or ID-based lookup used on non-owner side
- [ ] Observer pattern uses weak references
- [ ] Tree structures use weak parent references
- [ ] ORM bidirectional relations structured correctly
- [ ] Closure $this capture cycles eliminated
- [ ] GC root buffer stabilized
- [ ] Relationship design rules documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Assuming unset() frees all memory
- [ ] Avoid anti-pattern: Ignoring cycles in Octane workers: Can lead to OOM over time.
- [ ] Avoid anti-pattern: Using strong references for observer/cache patterns when WeakReference would work.
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
**Core Concepts:** Direct cycle: $parent->child = $child; $child->parent = $parent; both objects have refcount=1 even after unset. GC must collect them., Self-reference: $obj->self = $obj; refcount never drops below 1. Common in singleton patterns., Event listener accumulation: $subject->listeners[] = function() use ($subject); closure captures $subject, creating a cycle. Accumulates over time in long-running processes., SplObjectStorage cycles: Storing objects as keys that reference the storage container creates undetected cycles.
**Rules:**
- General: Avoid Self-References in Singleton Patterns
**Skills:** WeakReference API Usage, GC Algorithm and Cycle Collection, Memory Leak Detection Patterns, Reference Counting and Refcount Lifecycle
**Decision Trees:** How to handle circular references, Weak references vs explicit break
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Cyclic GC Algorithm, WeakReference API Usage, Memory Leak Pattern Catalog

