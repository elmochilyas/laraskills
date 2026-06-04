# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** WeakReference API Usage — Cycle Prevention Through Weak Back-References
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always null-check**: `$obj = $weakRef->get(); if ($obj !== null) { $obj->doSomething(); }`. The object can be freed between create() and get().
- [ ] **Clean up null entries**: Periodically remove WeakReferences where get() returns null, especially from long-running caches.
- [ ] **Use in cache maps**: Cache values should be WeakReference-wrapped to avoid preventing object collection.
- [ ] **Prefer WeakReference over explicit lifecycle management**: Manual nullification is error-prone. WeakReference provides automatic cleanup.
- [ ] WeakReference API understood (create, get, null-checking)
- [ ] Observer/subject patterns use WeakReference for listeners
- [ ] Cache implementations wrap values in WeakReference where appropriate
- [ ] Stale WeakReference cleanup strategy implemented
- [ ] No WeakReference used for required dependencies (strong refs used)
- [ ] Circular references resolved using WeakReference
- [ ] null checks implemented for all WeakReference accesses
- [ ] GC root buffer stabilized (no accumulation from the resolved cycles)
- [ ] Pattern documented for team
- [ ] Circular reference pattern identified
- [ ] Owner-dependent relationship determined
- [ ] WeakReference applied on the non-owner side
- [ ] null check implemented on WeakReference::get()
- [ ] Cycle resolved: root buffer no longer accumulates
- [ ] Edge cases handled (null after collection)
- [ ] Usage documented

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Reference counting vs cycle collection**: Reference counting provides immediate, deterministic memory reclamation for linear structures. Cycle collection is deferred, non-deterministic, and only handles the minority case (cycles). PHP correctly prioritizes RC for performance.
- [ ] **Per-request heap vs shared heap**: PHP-FPM's per-request allocation ensures complete memory isolation and automatic cleanup at request end. Octane's persistent memory trades this safety for performance â€” requiring explicit memory management via sandbox patterns and WeakReference.
- [ ] **Observer without cycles**: Subject stores WeakReferences to observers. Observers are freed when no longer referenced externally. Subject's `notify()` checks `WeakReference::get()` and removes null entries.
- [ ] **Cache with WeakReference**: `spl_object_id($obj) => WeakReference::create($obj)`. The cache doesn't prevent object collection. On get(), check null and remove stale entries.
- [ ] **Combined with service container**: In Octane, use WeakReference for services that should be garbage-collected between requests but re-created on demand.
- [ ] Document and follow through on architectural decision: WeakReference for cache entries
- [ ] Ensure architecture aligns with core concept: **WeakReference::create($obj)**: Creates a weak reference. The underlying object's refcount is NOT incremented.
- [ ] Ensure architecture aligns with core concept: **WeakReference::get()**: Returns the object if it still exists, or null if it was freed. Always check for null before dereferencing.
- [ ] Ensure architecture aligns with core concept: **Cache pattern**: `WeakReference` is ideal for caches where objects should be freed if no other references exist (avoiding memory leaks from cache maps).
- [ ] Ensure architecture aligns with core concept: **Event listener pattern**: Instead of `$subject->listeners[] = $listener;` (strong ref â†’ cycle), store `WeakReference::create($listener)`.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always null-check**: `$obj = $weakRef->get(); if ($obj !== null) { $obj->doSomething(); }`. The object can be freed between create() and get().
- [ ] **Clean up null entries**: Periodically remove WeakReferences where get() returns null, especially from long-running caches.
- [ ] **Use in cache maps**: Cache values should be WeakReference-wrapped to avoid preventing object collection.
- [ ] **Prefer WeakReference over explicit lifecycle management**: Manual nullification is error-prone. WeakReference provides automatic cleanup.
- [ ] Identify circular reference patterns: parentâ†’child (strong) and childâ†’parent (candidate for WeakReference)
- [ ] Determine which side of the cycle is the "owner" â€” the owner holds a strong reference, the dependent uses WeakReference
- [ ] Create the WeakReference: `$weakRef = WeakReference::create($parentObject);`
- [ ] Access the referenced object: `$parent = $weakRef->get();` â€” returns null if the object was collected
- [ ] Always check for null before using the dereferenced object: `if ($parent = $weakRef->get()) { $parent->doSomething(); }`
- [ ] For collection mapping: use `spl_object_id()` as array keys instead of WeakReference for non-cyclical caches
- [ ] For event listener cleanup: WeakReference in listener to dispatcher allows dispatcher to be GC'd when no other references exist
- [ ] Test: verify the cycle no longer prevents GC â€” check root buffer size before and after
- [ ] Document the WeakReference usage pattern

# Performance Checklist (from 04/06)
- [ ] WeakReference::get() overhead: ~20ns â€” negligible
- [ ] WeakReference::create() overhead: ~50ns â€” lightweight
- [ ] Alternative: manual nullification (setting `$parent->child = null`) is free but error-prone. WeakReference provides automatic cleanup.
- [ ] Hash table lookup in WeakReference resolution: ~0.1Âµs â€” negligible for occasional use
- [ ] gc_disable()
- [ ] Persistent memory (Octane)
- [ ] Per-request cleanup (FPM)
- [ ] WeakReference

# Security Checklist (from 04/06 - only if relevant)
- [ ] WeakReference can lead to dangling references if application logic assumes the object always exists
- [ ] In multi-tenant systems, freed objects could theoretically be replaced by new objects with different data
- [ ] Always validate that $weakRef->get() !== null before operating on the returned object

# Reliability Checklist (from 04/05/06)
- [ ] **Circular reference leak**: Long-running process accumulates cycles that GC can't collect efficiently. Symptom: Memory grows linearly with request count. Mitigation: Call gc_collect_cycles() periodically, check WeakReference usage.
- [ ] **GC pause storm**: Root buffer fills frequently, causing repeated stop-the-world GC cycles. Symptom: Latency spikes every N requests. Mitigation: Increase GC threshold, or strategically disable/re-enable GC around critical sections.
- [ ] **Reference counting overflow**: refcount wraps on extremely shared values (rare, >4 billion references). Symptom: Memory corruption or segfault. Mitigation: Avoid sharing the same zval across millions of containers.
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- [ ] **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

# Testing Checklist (from 04/06)
- [ ] WeakReference API understood (create, get, null-checking)
- [ ] Observer/subject patterns use WeakReference for listeners
- [ ] Cache implementations wrap values in WeakReference where appropriate
- [ ] Stale WeakReference cleanup strategy implemented
- [ ] No WeakReference used for required dependencies (strong refs used)
- [ ] WeakReference vs WeakMap distinction understood
- [ ] Circular references resolved using WeakReference
- [ ] null checks implemented for all WeakReference accesses
- [ ] GC root buffer stabilized (no accumulation from the resolved cycles)
- [ ] Pattern documented for team
- [ ] Circular reference pattern identified
- [ ] Owner-dependent relationship determined
- [ ] WeakReference applied on the non-owner side
- [ ] null check implemented on WeakReference::get()
- [ ] Cycle resolved: root buffer no longer accumulates
- [ ] Edge cases handled (null after collection)
- [ ] Usage documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always null-check**: `$obj = $weakRef->get(); if ($obj !== null) { $obj->doSomething(); }`. The object can be freed between create() and get().
- [ ] **Clean up null entries**: Periodically remove WeakReferences where get() returns null, especially from long-running caches.
- [ ] **Use in cache maps**: Cache values should be WeakReference-wrapped to avoid preventing object collection.
- [ ] **Prefer WeakReference over explicit lifecycle management**: Manual nullification is error-prone. WeakReference provides automatic cleanup.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using WeakReference without null-checking
- [ ] Avoid: Storing WeakReference in a permanent cache
- [ ] Avoid: Using WeakReference for mandatory dependencies
- [ ] Avoid: Not understanding WeakReference vs WeakMap
- [ ] Avoid anti-pattern: **Using WeakReference as a magic "fix memory leak" button**: If you don't understand why the cycle forms, WeakReference may mask the underlying architectural issue.
- [ ] Avoid anti-pattern: **Storing WeakReferences without cleanup strategy**: Accumulated null entries in long-running caches become memory leaks themselves.
- [ ] Avoid anti-pattern: **Wrapping everything in WeakReference**: Most references should be strong. WeakReference is for specific cycle-prevention patterns.
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
**Core Concepts:** **WeakReference::create($obj)**: Creates a weak reference. The underlying object's refcount is NOT incremented., **WeakReference::get()**: Returns the object if it still exists, or null if it was freed. Always check for null before dereferencing., **Cache pattern**: `WeakReference` is ideal for caches where objects should be freed if no other references exist (avoiding memory leaks from cache maps)., **Event listener pattern**: Instead of `$subject->listeners[] = $listener;` (strong ref â†’ cycle), store `WeakReference::create($listener)`.
**Rules:**
- General: Do Not Use WeakReference for Required Dependencies
**Skills:** Circular Reference Detection and Resolution, GC Algorithm and Cycle Collection, Memory Leak Detection Patterns
**Decision Trees:** WeakReference for cache entries
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Circular Reference Formation, Memory Leak Pattern Catalog, Persistent vs Per-Request Allocators, Copy-on-Write Mechanics

