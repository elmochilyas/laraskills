# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** Zval Structure and Reference Counting â€” refcount Increment/Decrement Lifecycle
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Minimize variable copying in hot loops**: Each assignment of a compound type increments refcount. Unnecessary copies waste CPU cycles.
- [ ] **Use references for large arrays**: `foreach ($array as &$value)` avoids copying each element. Be aware of the side effects on the original array.
- [ ] **Prefer typed properties**: `public int $x` uses fewer opcodes than untyped properties, reducing execution time in property-heavy code.
- [ ] **Be aware of refcount overhead**: In tight loops, refcount operations (~5-15ns each) can become a measurable bottleneck.
- [ ] zval structure understood (16 bytes, type_info, value union)
- [ ] refcount lifecycle understood (assignment++, unset--, free at 0)
- [ ] Difference between scalar (inline) and compound (pointer-based) types understood
- [ ] Immutable values and interned string behavior understood
- [ ] Copy-on-Write separation triggers understood
- [ ] Zval structure (type_info, refcount, value union) understood
- [ ] debug functions used correctly to diagnose memory issues
- [ ] Unnecessary copy-on-write duplications identified and resolved
- [ ] Knowledge applied to write memory-efficient code
- [ ] debug_zval_refcounts() or xdebug_debug_zval() used to inspect refcounts
- [ ] Unexpected copy-on-write duplications identified
- [ ] Code refactored to avoid unnecessary copies
- [ ] Memory usage verified after refactoring
- [ ] Zval structure characteristics documented
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Reference counting vs cycle collection**: Reference counting provides immediate, deterministic memory reclamation for linear structures. Cycle collection is deferred, non-deterministic, and only handles the minority case (cycles). PHP correctly prioritizes RC for performance.
- [ ] **Per-request heap vs shared heap**: PHP-FPM's per-request allocation ensures complete memory isolation and automatic cleanup at request end. Octane's persistent memory trades this safety for performance Ã¢â‚¬â€ requiring explicit memory management via sandbox patterns and WeakReference.
- [ ] **zend_refcounted_h TRY semantics (PHP 8.1+)**: Avoids atomic operations on known-immutable values, reducing refcount manipulation overhead by ~5-10% in hot code paths.
- [ ] **Copy-on-Write**: Compound types share memory until one reference modifies the value. At modification point, the value is separated (duplicated). This optimizes for read-heavy workloads.
- [ ] **Immutable value optimization**: Interned strings and some scalar arrays use special flags that bypass refcounting entirely.
- [ ] Document and follow through on architectural decision: Whether to optimize reference counting
- [ ] Document and follow through on architectural decision: Copy-on-write vs explicit copy strategy
- [ ] Ensure architecture aligns with core concept: **zval struct (16 bytes)**: `zend_value` (8 bytes union) + `union { uint32_t type_info; struct { zend_uchar type; zend_uchar type_flags; zend_uchar const_flags; zend_uchar reserved; } }` (4 bytes) + `uint32_t extra` (4 bytes).
- [ ] Ensure architecture aligns with core concept: **refcount store**: For reference-counted types (strings, arrays, objects), a `zend_refcounted_h` header is prepended, containing refcount (uint32_t), type info, and GC flags.
- [ ] Ensure architecture aligns with core concept: **refcount lifecycle**: Assignment â†’ refcount++ (for copy), unset/scope exit â†’ refcount--. When refcount=0 â†’ immediate free.
- [ ] Ensure architecture aligns with core concept: **Immutable values**: Interned strings have a special flag. They are never freed during a request. Common strings (class names, function names) are interned by default.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Minimize variable copying in hot loops**: Each assignment of a compound type increments refcount. Unnecessary copies waste CPU cycles.
- [ ] **Use references for large arrays**: `foreach ($array as &$value)` avoids copying each element. Be aware of the side effects on the original array.
- [ ] **Prefer typed properties**: `public int $x` uses fewer opcodes than untyped properties, reducing execution time in property-heavy code.
- [ ] **Be aware of refcount overhead**: In tight loops, refcount operations (~5-15ns each) can become a measurable bottleneck.
- [ ] For a suspicious variable, inspect its zval structure using `debug_zval_refcounts($var)` (PHP 8.4+) or `xdebug_debug_zval('varName')`
- [ ] Understand the output: refcount shows how many symbols/containers reference the same zval
- [ ] If refcount > 1 and the code modifies the variable, copy-on-write will trigger a full copy â€” verify by measuring memory before and after modification
- [ ] For arrays: if refcount > 1 before modification, the entire array is duplicated on write â€” consider using reference assignment
- [ ] For objects: refcount applies to the object handle, not the object data â€” modification does not copy the object
- [ ] For strings: refcount > 1 before modification triggers string duplication â€” use caution with large strings
- [ ] Use this knowledge to refactor code that triggers unexpected copy-on-write duplication
- [ ] Document the zval representation patterns for the team

# Performance Checklist (from 04/06)
- [ ] refcount operations are cache-line atomic: ~5-15ns per increment/decrement
- [ ] Excessive refcount manipulation (deep array copies, repeated assignments) can be a bottleneck in hot loops
- [ ] PHP 8.1's `zend_refcounted_h` uses TRY semantics for immutable values â€” avoids atomic operations on known-immutable values
- [ ] zval assignment is not free: even simple `$b = $a` triggers refcount manipulation for compound types
- [ ] gc_disable()
- [ ] Persistent memory (Octane)
- [ ] Per-request cleanup (FPM)
- [ ] WeakReference

# Security Checklist (from 04/06 - only if relevant)
- [ ] Refcount overflow (wrapping on >4 billion references) causes memory corruption â€” rare but possible in extreme sharing scenarios
- [ ] Immutable value flags can be manipulated by extensions â€” ensure extensions respect PHP's memory model

# Reliability Checklist (from 04/05/06)
- [ ] **Circular reference leak**: Long-running process accumulates cycles that GC can't collect efficiently. Symptom: Memory grows linearly with request count. Mitigation: Call gc_collect_cycles() periodically, check WeakReference usage.
- [ ] **GC pause storm**: Root buffer fills frequently, causing repeated stop-the-world GC cycles. Symptom: Latency spikes every N requests. Mitigation: Increase GC threshold, or strategically disable/re-enable GC around critical sections.
- [ ] **Reference counting overflow**: refcount wraps on extremely shared values (rare, >4 billion references). Symptom: Memory corruption or segfault. Mitigation: Avoid sharing the same zval across millions of containers.
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- [ ] **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

# Testing Checklist (from 04/06)
- [ ] zval structure understood (16 bytes, type_info, value union)
- [ ] refcount lifecycle understood (assignment++, unset--, free at 0)
- [ ] Difference between scalar (inline) and compound (pointer-based) types understood
- [ ] Immutable values and interned string behavior understood
- [ ] Copy-on-Write separation triggers understood
- [ ] PHP 8.1+ TRY semantics evaluated for hot code paths
- [ ] Zval structure (type_info, refcount, value union) understood
- [ ] debug functions used correctly to diagnose memory issues
- [ ] Unnecessary copy-on-write duplications identified and resolved
- [ ] Knowledge applied to write memory-efficient code
- [ ] debug_zval_refcounts() or xdebug_debug_zval() used to inspect refcounts
- [ ] Unexpected copy-on-write duplications identified
- [ ] Code refactored to avoid unnecessary copies
- [ ] Memory usage verified after refactoring
- [ ] Zval structure characteristics documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Minimize variable copying in hot loops**: Each assignment of a compound type increments refcount. Unnecessary copies waste CPU cycles.
- [ ] **Use references for large arrays**: `foreach ($array as &$value)` avoids copying each element. Be aware of the side effects on the original array.
- [ ] **Prefer typed properties**: `public int $x` uses fewer opcodes than untyped properties, reducing execution time in property-heavy code.
- [ ] **Be aware of refcount overhead**: In tight loops, refcount operations (~5-15ns each) can become a measurable bottleneck.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Assuming unset() immediately frees memory
- [ ] Avoid: Not calling gc_collect_cycles() in long-running processes
- [ ] Avoid: Using static properties for request-scoped data
- [ ] Avoid: Ignoring copy-on-write in loops
- [ ] Avoid: Not monitoring worker RSS
- [ ] Avoid anti-pattern: **Excessive variable copying**: `$a = $b; $c = $a; $d = $c;` â€” each assignment is cheap (refcount++) but unnecessary chains waste CPU.
- [ ] Avoid anti-pattern: **Modifying arrays in foreach by value**: `foreach ($array as $value) { $value = modify($value); }` â€” modifies a copy, not the original. Use reference or assign back.
- [ ] Avoid anti-pattern: **Deep array duplication**: `$copy = unserialize(serialize($array))` â€” creates full deep copy with O(n) refcount operations. Use array_slice or SplFixedArray for partial copies.
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
**Core Concepts:** **zval struct (16 bytes)**: `zend_value` (8 bytes union) + `union { uint32_t type_info; struct { zend_uchar type; zend_uchar type_flags; zend_uchar const_flags; zend_uchar reserved; } }` (4 bytes) + `uint32_t extra` (4 bytes)., **refcount store**: For reference-counted types (strings, arrays, objects), a `zend_refcounted_h` header is prepended, containing refcount (uint32_t), type info, and GC flags., **refcount lifecycle**: Assignment â†’ refcount++ (for copy), unset/scope exit â†’ refcount--. When refcount=0 â†’ immediate free., **Immutable values**: Interned strings have a special flag. They are never freed during a request. Common strings (class names, function names) are interned by default.
**Rules:**
- General: Do Not Use References for Performance Optimization
**Skills:** PHP Memory Model, Reference Counting Mechanics, Copy-on-Write Mechanics, Zval Type/Value Representation
**Decision Trees:** Whether to optimize reference counting, Copy-on-write vs explicit copy strategy
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Copy-on-Write Mechanics, Zval Type/Value Representation, Cyclic GC Algorithm, Reference Counting Internals

