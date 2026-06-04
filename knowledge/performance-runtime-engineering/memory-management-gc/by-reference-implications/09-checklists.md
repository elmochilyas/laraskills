# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** By-Reference Implications â€” Opt-Out of CoW, zend_reference Container, Unexpected Copies
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Audit codebase for foreach (&$ref) patterns without unset().
- [ ] Verify function signatures don't use &$param unnecessarily.
- [ ] Check for references in hot loops that could be bottleneck.
- [ ] Test Octane workers for reference-related memory leaks.
- [ ] Reference usage justified by data size and modification pattern
- [ ] Read-only parameters remain pass-by-value
- [ ] No functions return by reference
- [ ] Reference usage documented
- [ ] Side-effect risk managed through testing and audit
- [ ] Functions modifying large arrays updated to use pass-by-reference
- [ ] Object parameters confirmed as pass-by-handle (no change needed)
- [ ] No function returns by reference
- [ ] Reference usage documented in docblocks
- [ ] Tests confirm no side effects from reference changes
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- [ ] **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Reference counting vs cycle collection**: Reference counting provides immediate, deterministic memory reclamation for linear structures. Cycle collection is deferred, non-deterministic, and only handles the minority case (cycles). PHP correctly prioritizes RC for performance.
- [ ] **Per-request heap vs shared heap**: PHP-FPM's per-request allocation ensures complete memory isolation and automatic cleanup at request end. Octane's persistent memory trades this safety for performance Ã¢â‚¬â€ requiring explicit memory management via sandbox patterns and WeakReference.
- [ ] Reference bypasses CoW entirely. Both variables always share the same value.
- [ ] When arrays containing references are copied, PHP must deep-copy referenced elements.
- [ ] In Octane long-running processes, references can prevent garbage collection of large structures.
- [ ] Document and follow through on architectural decision: Pass-by-reference vs pass-by-value
- [ ] Document and follow through on architectural decision: Return-by-reference patterns
- [ ] Ensure architecture aligns with core concept: zend_reference: Intermediate container holding a zval with refcount tracking. Both $a and $b point to same zend_reference, which points to actual value.
- [ ] Ensure architecture aligns with core concept: CoW bypass: Both variables must always see changes. Separation never occurs.
- [ ] Ensure architecture aligns with core concept: Array separation with references: When array containing references is copied, PHP creates new references for each referenced element - expensive.
- [ ] Ensure architecture aligns with core concept: foreach with references: foreach ($arr as &$val) - $val reference persists after loop. Always unset($val) after reference foreach.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Identify functions that accept large arrays (>1MB) as parameters and modify them
- [ ] For arrays modified in-place: add `&` to the parameter to pass by reference â€” avoids copy-on-write duplication
- [ ] For objects: no change needed â€” objects are always passed by handle (reference-like without `&`)
- [ ] For strings that are modified in-place: add `&` for the parameter if the string is large (>100KB)
- [ ] Never use references for parameters that are only read â€” it introduces unnecessary side-effect risks
- [ ] Never return references from functions â€” it exposes internal state to callers
- [ ] Document reference usage in function docblocks: `@param array &$data The data to modify in-place`
- [ ] Test extensively after adding references â€” unintended side effects are the primary risk

# Performance Checklist (from 04/06)
- [ ] References add zend_reference container overhead.
- [ ] Array copy cost increases when array contains references (deep copy).
- [ ] In hot loops, refcount manipulation from references can be measurable.
- [ ] gc_disable()
- [ ] Persistent memory (Octane)
- [ ] Per-request cleanup (FPM)
- [ ] WeakReference

# Security Checklist (from 04/06 - only if relevant)
- [ ] References can accidentally expose sensitive data across scopes if not carefully managed.
- [ ] No direct security vulnerability, but state leaking between contexts is a correctness concern.

# Reliability Checklist (from 04/05/06)
- [ ] **Circular reference leak**: Long-running process accumulates cycles that GC can't collect efficiently. Symptom: Memory grows linearly with request count. Mitigation: Call gc_collect_cycles() periodically, check WeakReference usage.
- [ ] **GC pause storm**: Root buffer fills frequently, causing repeated stop-the-world GC cycles. Symptom: Latency spikes every N requests. Mitigation: Increase GC threshold, or strategically disable/re-enable GC around critical sections.
- [ ] **Reference counting overflow**: refcount wraps on extremely shared values (rare, >4 billion references). Symptom: Memory corruption or segfault. Mitigation: Avoid sharing the same zval across millions of containers.
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- [ ] **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

# Testing Checklist (from 04/06)
- [ ] Audit codebase for foreach (&$ref) patterns without unset().
- [ ] Verify function signatures don't use &$param unnecessarily.
- [ ] Check for references in hot loops that could be bottleneck.
- [ ] Test Octane workers for reference-related memory leaks.
- [ ] Reference usage justified by data size and modification pattern
- [ ] Read-only parameters remain pass-by-value
- [ ] No functions return by reference
- [ ] Reference usage documented
- [ ] Side-effect risk managed through testing and audit
- [ ] Functions modifying large arrays updated to use pass-by-reference
- [ ] Object parameters confirmed as pass-by-handle (no change needed)
- [ ] No function returns by reference
- [ ] Reference usage documented in docblocks
- [ ] Tests confirm no side effects from reference changes

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using references for function args to "save memory"
- [ ] Avoid anti-pattern: Reference foreach without unset: The $val reference persists and can corrupt subsequent loop variables.
- [ ] Avoid anti-pattern: Using references as a performance optimization: Nearly always unnecessary due to CoW.
- [ ] Avoid anti-pattern: Returning references from functions: Breaks caller expectations and can cause subtle bugs.
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
**Core Concepts:** zend_reference: Intermediate container holding a zval with refcount tracking. Both $a and $b point to same zend_reference, which points to actual value., CoW bypass: Both variables must always see changes. Separation never occurs., Array separation with references: When array containing references is copied, PHP creates new references for each referenced element - expensive., foreach with references: foreach ($arr as &$val) - $val reference persists after loop. Always unset($val) after reference foreach.
**Rules:**
- General: Use array_values Instead of Reference Foreach for Modification
**Skills:** Copy-on-Write Mechanics, Zval Structure and Reference Counting, Reference Counting and Refcount Lifecycle
**Decision Trees:** Pass-by-reference vs pass-by-value, Return-by-reference patterns
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Copy-on-Write Mechanics, Zval Structure and Reference Counting, Memory Leak Pattern Catalog

