# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** Zval Type/Value Representation â€” Scalar vs Compound Type Differences
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Prefer scalar types where possible**: Scalar operations are CPU-register-speed (~5-15ns). Compound operations require heap allocation and refcounting.
- [ ] **Use SplFixedArray for large fixed-size arrays**: Avoids HashTable overhead for integer-indexed sequential data. ~30% less memory, faster iteration.
- [ ] **Leverage typed properties**: `public int $x` tells the engine the value is a scalar, enabling inline storage and eliminating refcount overhead.
- [ ] **Be aware of string representation**: Short strings may be interned (shared). Long strings always allocate new memory. Concatenation creates a new string.
- [ ] Inline scalar vs pointer-based compound type distinction understood
- [ ] zend_string structure and precomputed hash feature understood
- [ ] Packed vs hash mode array differences understood
- [ ] SplFixedArray evaluated for large sequential datasets
- [ ] Typed properties used to enable inline scalar storage
- [ ] Inline vs pointer-based type representation understood
- [ ] Hot-path code optimized to prefer inline scalars where appropriate
- [ ] Performance improvement measured and documented
- [ ] Type representation knowledge applied to new code design
- [ ] Hot-path variables classified as inline or pointer-based
- [ ] Inline scalars preferred for flags, counters, simple state
- [ ] Array/object wrapping avoided for scalar-only data
- [ ] Performance difference measured and documented
- [ ] Type representation patterns documented
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Reference counting vs cycle collection**: Reference counting provides immediate, deterministic memory reclamation for linear structures. Cycle collection is deferred, non-deterministic, and only handles the minority case (cycles). PHP correctly prioritizes RC for performance.
- [ ] **Per-request heap vs shared heap**: PHP-FPM's per-request allocation ensures complete memory isolation and automatic cleanup at request end. Octane's persistent memory trades this safety for performance Ã¢â‚¬â€ requiring explicit memory management via sandbox patterns and WeakReference.
- [ ] **Type encoding in zval**: The `type_info` field encodes type (low byte), type_flags (next byte), const_flags, and reserved bytes. This packing allows fast type checking via bitmask operations.
- [ ] **zend_string precomputed hash**: The `h` field stores the hash value after first computation. Subsequent hash lookups (array keys, switch statements) skip re-hashing â€” a significant optimization for string-heavy code.
- [ ] **zend_array packed vs hash mode**: Sequential integer keys use packed mode (C array of zvals). Non-sequential/mixed keys use hash mode (buckets with hash collision chains). Packed is ~2x faster for iteration.
- [ ] Document and follow through on architectural decision: Value type selection for memory efficiency
- [ ] Ensure architecture aligns with core concept: **Inline scalars (no refcount)**: `IS_UNDEF`, `IS_NULL`, `IS_TRUE`, `IS_FALSE`, `IS_LONG`, `IS_DOUBLE` â€” values stored directly in the zval union. No heap allocation. No refcount needed. Assignment copies the value.
- [ ] Ensure architecture aligns with core concept: **Pointer-based types (refcounted)**: `IS_STRING`, `IS_ARRAY`, `IS_OBJECT`, `IS_RESOURCE`, `IS_REFERENCE` â€” zval stores a pointer to a heap-allocated `zend_string`, `zend_array`, or `zend_object`. These have refcount semantics.
- [ ] Ensure architecture aligns with core concept: **zend_string structure**: 32 bytes header (refcount, hash, length) + variable-length character data. Hash pre-computed for faster string lookups.
- [ ] Ensure architecture aligns with core concept: **zend_array (HashTable)**: Buckets array with `uint32_t nTableSize`, `nNumOfElements`, `nNextFreeElement`, `pListHead` pointer, and `arBuckets` pointer to packed or hash-ordered bucket slots.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Prefer scalar types where possible**: Scalar operations are CPU-register-speed (~5-15ns). Compound operations require heap allocation and refcounting.
- [ ] **Use SplFixedArray for large fixed-size arrays**: Avoids HashTable overhead for integer-indexed sequential data. ~30% less memory, faster iteration.
- [ ] **Leverage typed properties**: `public int $x` tells the engine the value is a scalar, enabling inline storage and eliminating refcount overhead.
- [ ] **Be aware of string representation**: Short strings may be interned (shared). Long strings always allocate new memory. Concatenation creates a new string.
- [ ] For each variable in the hot path, determine if it is inline (IS_UNDEF, IS_NULL, IS_TRUE, IS_FALSE, IS_LONG, IS_DOUBLE) or pointer-based (IS_STRING, IS_ARRAY, IS_OBJECT, IS_RESOURCE, IS_REFERENCE)
- [ ] Inline scalars: stored directly in the 16-byte zval â€” no heap allocation, no refcount, CPU register speed
- [ ] Pointer-based types: zval stores a pointer to a heap-allocated structure â€” requires dereferencing, has refcount semantics
- [ ] For hot-path flags and counters: prefer int or bool (inline) over string (pointer-based)
- [ ] For hot-path data transfer: if data fits in a scalar (int, float, bool), avoid wrapping in an array or object
- [ ] For configuration values accessed frequently: store as scalars rather than array lookups where possible
- [ ] Benchmark the performance difference between inline and pointer-based representations for the specific use case
- [ ] Document the type representation insights for the team

# Performance Checklist (from 04/06)
- [ ] Scalar operations: 5-15ns per assignment/copy (CPU register speed)
- [ ] String copy (refcount): refcount increment only â€” ~5ns. String modification (separation): allocate new string + copy characters â€” proportional to string length.
- [ ] Array copy: refcount increment only until modification. Full copy is O(n) where n is number of elements.
- [ ] zend_string header overhead: 32 bytes per string regardless of content length. Short strings have proportionally higher overhead.
- [ ] gc_disable()
- [ ] Persistent memory (Octane)
- [ ] Per-request cleanup (FPM)
- [ ] WeakReference

# Security Checklist (from 04/06 - only if relevant)
- [ ] Type confusion bugs (exploiting incorrect type_info flags) have been patched in PHP â€” always keep PHP updated
- [ ] zend_string precomputed hash is read-only after first computation â€” safe from tampering

# Reliability Checklist (from 04/05/06)
- [ ] **Circular reference leak**: Long-running process accumulates cycles that GC can't collect efficiently. Symptom: Memory grows linearly with request count. Mitigation: Call gc_collect_cycles() periodically, check WeakReference usage.
- [ ] **GC pause storm**: Root buffer fills frequently, causing repeated stop-the-world GC cycles. Symptom: Latency spikes every N requests. Mitigation: Increase GC threshold, or strategically disable/re-enable GC around critical sections.
- [ ] **Reference counting overflow**: refcount wraps on extremely shared values (rare, >4 billion references). Symptom: Memory corruption or segfault. Mitigation: Avoid sharing the same zval across millions of containers.
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- [ ] **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

# Testing Checklist (from 04/06)
- [ ] Inline scalar vs pointer-based compound type distinction understood
- [ ] zend_string structure and precomputed hash feature understood
- [ ] Packed vs hash mode array differences understood
- [ ] SplFixedArray evaluated for large sequential datasets
- [ ] Typed properties used to enable inline scalar storage
- [ ] String concatenation patterns optimized (avoid O(nÂ²) in loops)
- [ ] Inline vs pointer-based type representation understood
- [ ] Hot-path code optimized to prefer inline scalars where appropriate
- [ ] Performance improvement measured and documented
- [ ] Type representation knowledge applied to new code design
- [ ] Hot-path variables classified as inline or pointer-based
- [ ] Inline scalars preferred for flags, counters, simple state
- [ ] Array/object wrapping avoided for scalar-only data
- [ ] Performance difference measured and documented
- [ ] Type representation patterns documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Prefer scalar types where possible**: Scalar operations are CPU-register-speed (~5-15ns). Compound operations require heap allocation and refcounting.
- [ ] **Use SplFixedArray for large fixed-size arrays**: Avoids HashTable overhead for integer-indexed sequential data. ~30% less memory, faster iteration.
- [ ] **Leverage typed properties**: `public int $x` tells the engine the value is a scalar, enabling inline storage and eliminating refcount overhead.
- [ ] **Be aware of string representation**: Short strings may be interned (shared). Long strings always allocate new memory. Concatenation creates a new string.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Modifying array in foreach by value
- [ ] Avoid: Assuming all types have refcount overhead
- [ ] Avoid: Using array for fixed-size integer-indexed data
- [ ] Avoid: String concatenation in loops
- [ ] Avoid anti-pattern: **Deep copying large arrays unnecessarily**: `$copy = unserialize(serialize($big))` â€” creates full O(n) copy. Use `array_slice` or array spread `[...$big]` for shallow copy.
- [ ] Avoid anti-pattern: **Modifying strings in hot loops**: Each modification creates a new zend_string. Build strings with arrays and implode() instead of repeated concatenation.
- [ ] Avoid anti-pattern: **Type-juggling in hot paths**: `$a + $b` where $a is string and $b is int triggers type conversion overhead. Keep types consistent.
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
**Core Concepts:** **Inline scalars (no refcount)**: `IS_UNDEF`, `IS_NULL`, `IS_TRUE`, `IS_FALSE`, `IS_LONG`, `IS_DOUBLE` â€” values stored directly in the zval union. No heap allocation. No refcount needed. Assignment copies the value., **Pointer-based types (refcounted)**: `IS_STRING`, `IS_ARRAY`, `IS_OBJECT`, `IS_RESOURCE`, `IS_REFERENCE` â€” zval stores a pointer to a heap-allocated `zend_string`, `zend_array`, or `zend_object`. These have refcount semantics., **zend_string structure**: 32 bytes header (refcount, hash, length) + variable-length character data. Hash pre-computed for faster string lookups., **zend_array (HashTable)**: Buckets array with `uint32_t nTableSize`, `nNumOfElements`, `nNextFreeElement`, `pListHead` pointer, and `arBuckets` pointer to packed or hash-ordered bucket slots.
**Rules:**
- General: Use array_values After unset on Packed Arrays
**Skills:** PHP Memory Model, Zval Structure and Reference Counting, Copy-on-Write Mechanics, Type Inference and Guard Elimination
**Decision Trees:** Value type selection for memory efficiency
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Zval Structure and Reference Counting, Copy-on-Write Mechanics, Persistent vs Per-Request Allocators, Zend Memory Manager Chunked Allocator

