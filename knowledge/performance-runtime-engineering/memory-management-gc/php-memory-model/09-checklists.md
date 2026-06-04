# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** # PHP Memory Model â€” Zend Engine Memory Manager, zval Structure, Allocation Tiers
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Use `memory_get_usage()` to measure memory for different data types (scalar, string, array, object).
- [ ] Compare memory of SplFixedArray vs regular array for a fixed-size dataset.
- [ ] Measure the difference between inline scalar ops and compound type copy operations.
- [ ] Verify heap growth in long-running workers â€” track baseline RSS over 1000 requests.
- [ ] Document the memory model characteristics relevant to your application.
- [ ] Memory model (zval, Zend MM, allocation tiers) understood
- [ ] Hot-path memory optimizations applied and measured
- [ ] Memory usage reduced by 10-30% on optimized code paths
- [ ] Patterns documented for team adoption
- [ ] Hot-path allocation functions identified
- [ ] Scalar types preferred over compound types in hot paths
- [ ] String concatenation in loops replaced with array+implode
- [ ] SplFixedArray used where appropriate
- [ ] Copy-on-write understood and applied
- [ ] unset() used for large variables in long-running processes
- [ ] Memory reduction measured and documented
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Zend MM chunk allocation**: The memory manager allocates 256KB chunks from the OS via mmap. Within each chunk, blocks are allocated from segregated storage bins. Free blocks are cached for reuse.
- [ ] **Per-request vs persistent**: PHP-FPM destroys the entire heap at request end â€” no memory leaks possible. Octane preserves the heap across requests â€” explicit cleanup is required.
- [ ] **Interned strings**: Common strings (class names, function names, constant strings) are stored in an interned strings table. They are never freed. This saves memory by deduplication.
- [ ] **Persistent allocator flags**: `GC_IMMUTABLE` and `GC_PERSISTENT` flags mark memory that should survive request boundaries. Used for interned strings and preloaded classes.
- [ ] Document and follow through on architectural decision: Memory allocation strategy for workload
- [ ] Document and follow through on architectural decision: Understanding per-request vs persistent memory
- [ ] Ensure architecture aligns with core concept: **zval struct (16 bytes)**: `zend_value` (8 bytes union) + type_info (4 bytes) + extra (4 bytes). Inline for scalars, pointer to heap for compounds.
- [ ] Ensure architecture aligns with core concept: **Inline scalars**: `IS_UNDEF`, `IS_NULL`, `IS_TRUE`, `IS_FALSE`, `IS_LONG`, `IS_DOUBLE` â€” values stored directly in the zval. No heap allocation. No refcount.
- [ ] Ensure architecture aligns with core concept: **Pointer-based types**: `IS_STRING`, `IS_ARRAY`, `IS_OBJECT`, `IS_RESOURCE`, `IS_REFERENCE` â€” zval stores a pointer to a heap-allocated `zend_string`, `zend_array`, or `zend_object`. These have refcount semantics.
- [ ] Ensure architecture aligns with core concept: **Zend Memory Manager**: mmaps 256KB chunks from the OS. Uses three-tier allocation: large (>3072 bytes) via mmap, small via segregated storage bins (2^n from 8 to 3072), cached via free lists.
- [ ] Ensure architecture aligns with core concept: **Per-request heap**: Each PHP-FPM worker has its own zend_mm_heap, destroyed at request end. Octane workers share the heap across requests.
- [ ] Ensure architecture aligns with core concept: **zend_string structure**: 32 bytes header (refcount, hash, length) + variable-length character data. Hash pre-computed for faster string lookups.
- [ ] Ensure architecture aligns with core concept: **zend_array (HashTable)**: Buckets array with `nTableSize`, `nNumOfElements`, `arBuckets` pointer to packed or hash-ordered bucket slots.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Profile the application to identify functions with high allocation counts or memory usage
- [ ] For scalar-heavy code: verify scalars are stored inline (no heap allocation) â€” prefer int/float/bool over string/array for hot-path data
- [ ] For string operations: avoid concatenation in loops â€” use arrays and implode() instead
- [ ] For array operations: use SplFixedArray for fixed-size numeric arrays to reduce HashTable overhead
- [ ] For object-heavy code: prefer DTOs with public typed properties over complex object graphs
- [ ] For copy-heavy code: understand copy-on-write â€” avoid modifying arrays that have multiple references
- [ ] For long-running workers: explicitly unset() large variables when no longer needed
- [ ] Benchmark before/after each optimization to measure memory reduction
- [ ] Document the memory-efficient patterns applied

# Performance Checklist (from 04/06)
- [ ] Scalar operations: 5â€“15ns per assignment/copy (CPU register speed, no heap allocation).
- [ ] String copy: refcount increment only (~5ns) until modification. Full copy: proportional to string length.
- [ ] Array copy: refcount increment only. Full copy is O(n) where n is number of elements. Modifying an array with references in foreach causes massive duplication.
- [ ] Object instantiation: ~100â€“500ns for a simple object (heap allocation + vtable setup + refcount).
- [ ] Zend MM allocation: free-list allocation ~10â€“20ns. mmap allocation for large blocks: ~1â€“5Âµs.
- [ ] Heap destruction per request (PHP-FPM): ~50â€“200Âµs depending on allocation count.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Heap inspection: In persistent workers, data from previous requests may remain in freed memory. PHP zeroes freed heap, but sensitive data may persist during its lifetime.
- [ ] Buffer overflow: PHP's memory manager is type-safe. Buffer overflows in userland code are rare, but extensions may have vulnerabilities.
- [ ] Out-of-memory: When the Zend MM cannot allocate, PHP throws an `OutOfMemoryException` (PHP 8.3+) or fatal error. Monitor worker RSS to prevent OOM.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Use `memory_get_usage()` to measure memory for different data types (scalar, string, array, object).
- [ ] Compare memory of SplFixedArray vs regular array for a fixed-size dataset.
- [ ] Measure the difference between inline scalar ops and compound type copy operations.
- [ ] Verify heap growth in long-running workers â€” track baseline RSS over 1000 requests.
- [ ] Document the memory model characteristics relevant to your application.
- [ ] Memory model (zval, Zend MM, allocation tiers) understood
- [ ] Hot-path memory optimizations applied and measured
- [ ] Memory usage reduced by 10-30% on optimized code paths
- [ ] Patterns documented for team adoption
- [ ] Hot-path allocation functions identified
- [ ] Scalar types preferred over compound types in hot paths
- [ ] String concatenation in loops replaced with array+implode
- [ ] SplFixedArray used where appropriate
- [ ] Copy-on-write understood and applied
- [ ] unset() used for large variables in long-running processes
- [ ] Memory reduction measured and documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Assuming all zvals are the same
- [ ] Avoid: Modifying arrays in foreach by reference
- [ ] Avoid: Creating deep object graphs
- [ ] Avoid: Not recycling workers in Octane
- [ ] Avoid anti-pattern: **Creating millions of short-lived objects**: Each instance allocates heap, initializes refcount, and later frees. Use value objects sparingly in hot loops.
- [ ] Avoid anti-pattern: **String concatenation in loops**: Each `$str .= $part` allocates a new string and copies both parts. For large iterations, use arrays and `implode()`.
- [ ] Avoid anti-pattern: **Storing serialized objects in sessions**: `session_start()` deserializes all session data into memory. Only store what you need.
- [ ] Avoid anti-pattern: **Assume `memory_get_usage()` shows the full picture**: It reports zend_mm_heap usage. External libraries (libxml, libcurl) allocate outside the Zend MM.
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
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **zval struct (16 bytes)**: `zend_value` (8 bytes union) + type_info (4 bytes) + extra (4 bytes). Inline for scalars, pointer to heap for compounds., **Inline scalars**: `IS_UNDEF`, `IS_NULL`, `IS_TRUE`, `IS_FALSE`, `IS_LONG`, `IS_DOUBLE` â€” values stored directly in the zval. No heap allocation. No refcount., **Pointer-based types**: `IS_STRING`, `IS_ARRAY`, `IS_OBJECT`, `IS_RESOURCE`, `IS_REFERENCE` â€” zval stores a pointer to a heap-allocated `zend_string`, `zend_array`, or `zend_object`. These have refcount semantics., **Zend Memory Manager**: mmaps 256KB chunks from the OS. Uses three-tier allocation: large (>3072 bytes) via mmap, small via segregated storage bins (2^n from 8 to 3072), cached via free lists., **Per-request heap**: Each PHP-FPM worker has its own zend_mm_heap, destroyed at request end. Octane workers share the heap across requests.
**Skills:** Zval Structure and Reference Counting, Copy-on-Write Mechanics, Reference Counting and Refcount Lifecycle, Generators and Yield for Memory Efficiency
**Decision Trees:** Memory allocation strategy for workload, Understanding per-request vs persistent memory
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Reference Counting â€” zval refcount lifecycle, Copy-on-Write Mechanics, Zval Type/Value Representation, Persistent vs Per-Request Allocators, Zend Memory Manager Chunked Allocator

