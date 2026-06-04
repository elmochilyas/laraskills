# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** Copy-on-Write Mechanics — Sharing Until Mutation, Separation Trigger Points
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Verify no unnecessary & in function signatures for performance reasons.
- [ ] Check hot loops for unnecessary array modifications.
- [ ] Profile memory usage patterns with CoW-heavy operations.
- [ ] Copy-on-write mechanism understood and applied
- [ ] Unnecessary full copies identified and eliminated
- [ ] References used only where modification is necessary
- [ ] Memory usage reduced on targeted code paths
- [ ] COW patterns documented for team
- [ ] Large shared data structures identified (arrays, strings)
- [ ] Modification points after sharing identified
- [ ] Pass-by-reference used where modification is necessary
- [ ] foreach-by-reference anti-pattern removed
- [ ] Read-only sharing left as-is (no copy cost)
- [ ] Memory reduction measured
- [ ] COW patterns documented
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- [ ] **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Reference counting vs cycle collection**: Reference counting provides immediate, deterministic memory reclamation for linear structures. Cycle collection is deferred, non-deterministic, and only handles the minority case (cycles). PHP correctly prioritizes RC for performance.
- [ ] **Per-request heap vs shared heap**: PHP-FPM's per-request allocation ensures complete memory isolation and automatic cleanup at request end. Octane's persistent memory trades this safety for performance â€” requiring explicit memory management via sandbox patterns and WeakReference.
- [ ] Large array copy: CoW avoids copy until modification. Reading 10MB array as argument costs ~0ns.
- [ ] Modification triggers full copy: $arr[] = 'new' on shared 10MB array copies entire array (~1ms).
- [ ] PHP 8.1 array unpacking: [...$arr1, ...$arr2] uses CoW sharing where possible.
- [ ] Document and follow through on architectural decision: Whether COW separation is a performance concern
- [ ] Ensure architecture aligns with core concept: Sharing: $b = $a creates a new zval pointing to the same zend_string or zend_array as $a. Refcount incremented. No data copied.
- [ ] Ensure architecture aligns with core concept: Separation: Modification triggers copy. New zend_string allocated for modified variable. Refcount decremented on original.
- [ ] Ensure architecture aligns with core concept: Separation trigger points: Any write operation - assignment ($b[0] = 'x'), string concatenation, array push, object property set.
- [ ] Ensure architecture aligns with core concept: by-reference bypass: $b = &$a creates zend_reference wrapper. CoW never triggers.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Identify places where large arrays/strings (>100KB) are assigned to multiple variables or passed to functions
- [ ] Check if any of the variables are modified after assignment â€” COW only triggers on modification
- [ ] If modification occurs after multiple references exist, the data is fully duplicated at that point
- [ ] To avoid the copy: use references (`&`) for variables that will be modified, or refactor to avoid modifying shared data
- [ ] For foreach loops that modify array values: use index-based modification instead of `foreach ($array as &$value)`
- [ ] For function parameters that are modified: use pass-by-reference (`&$param`)
- [ ] For read-only sharing: no action needed â€” COW means zero cost until modification
- [ ] After restructuring, measure memory before/after to confirm COW avoidance
- [ ] Document the COW patterns applied

# Performance Checklist (from 04/06)
- [ ] CoW avoids copying until write. Read sharing is free.
- [ ] Modification of shared arrays is expensive (full copy).
- [ ] PHP 8.1+ improves CoW efficiency for array operations.
- [ ] gc_disable()
- [ ] Persistent memory (Octane)
- [ ] Per-request cleanup (FPM)
- [ ] WeakReference

# Security Checklist (from 04/06 - only if relevant)
- [ ] No direct security implications.
- [ ] CoW is a memory management optimization, transparent to application code.

# Reliability Checklist (from 04/05/06)
- [ ] **Circular reference leak**: Long-running process accumulates cycles that GC can't collect efficiently. Symptom: Memory grows linearly with request count. Mitigation: Call gc_collect_cycles() periodically, check WeakReference usage.
- [ ] **GC pause storm**: Root buffer fills frequently, causing repeated stop-the-world GC cycles. Symptom: Latency spikes every N requests. Mitigation: Increase GC threshold, or strategically disable/re-enable GC around critical sections.
- [ ] **Reference counting overflow**: refcount wraps on extremely shared values (rare, >4 billion references). Symptom: Memory corruption or segfault. Mitigation: Avoid sharing the same zval across millions of containers.
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- [ ] **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

# Testing Checklist (from 04/06)
- [ ] Verify no unnecessary & in function signatures for performance reasons.
- [ ] Check hot loops for unnecessary array modifications.
- [ ] Profile memory usage patterns with CoW-heavy operations.
- [ ] Copy-on-write mechanism understood and applied
- [ ] Unnecessary full copies identified and eliminated
- [ ] References used only where modification is necessary
- [ ] Memory usage reduced on targeted code paths
- [ ] COW patterns documented for team
- [ ] Large shared data structures identified (arrays, strings)
- [ ] Modification points after sharing identified
- [ ] Pass-by-reference used where modification is necessary
- [ ] foreach-by-reference anti-pattern removed
- [ ] Read-only sharing left as-is (no copy cost)
- [ ] Memory reduction measured
- [ ] COW patterns documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using &$var to "avoid copying"
- [ ] Avoid anti-pattern: Adding & to function parameters for performance: CoW already provides zero-copy read sharing.
- [ ] Avoid anti-pattern: Assuming assignment copies data: It doesn't until modification.
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
**Core Concepts:** Sharing: $b = $a creates a new zval pointing to the same zend_string or zend_array as $a. Refcount incremented. No data copied., Separation: Modification triggers copy. New zend_string allocated for modified variable. Refcount decremented on original., Separation trigger points: Any write operation - assignment ($b[0] = 'x'), string concatenation, array push, object property set., by-reference bypass: $b = &$a creates zend_reference wrapper. CoW never triggers.
**Rules:**
- General: Use [...$array] for Shallow Copy When Modification Is Needed
**Skills:** Zval Structure and Reference Counting, By-Reference Implications, Reference Counting and Refcount Lifecycle, Array Memory Usage
**Decision Trees:** Whether COW separation is a performance concern
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** By-Reference Implications, Zval Structure and Reference Counting, Zval Type/Value Representation

