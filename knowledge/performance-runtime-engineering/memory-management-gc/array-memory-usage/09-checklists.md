# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** # Array Memory Usage â€” HashTable Structure, Bucket Overhead, Packed vs Hash Arrays, Memory-Efficient Patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Compare memory: packed array vs hash array with the same number of elements.
- [ ] Compare memory: regular array vs SplFixedArray for 100K integers.
- [ ] Verify packed-to-hash transition: add a non-sequential key and check memory increase.
- [ ] Measure array resize cost: build a 10K-element array incrementally vs pre-allocated.
- [ ] Test `array_values()` restoration of packed mode after unset.
- [ ] Array memory usage reduced by 20-40% on targeted structures
- [ ] Packed arrays used where possible; hash arrays minimized
- [ ] SplFixedArray applied for appropriate use cases
- [ ] Intermediate array allocations reduced
- [ ] Memory reduction measured and documented
- [ ] Largest arrays identified and memory measured
- [ ] Packed vs hash array distinction understood
- [ ] Sparse arrays restructured for packed representation
- [ ] SplFixedArray used for fixed-size numeric arrays
- [ ] Copy-on-write duplication avoided
- [ ] Memory reduction measured
- [ ] Patterns documented
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Packed-to-hash transition**: A packed array becomes a hash array when: 1) you set a non-sequential integer key (`$arr[100] = 'x'` after sequentially filling 0â€“50), 2) you unset an element creating a gap, or 3) you add a string key. Once transitioned, it can't go back without `array_values()`.
- [ ] **HashTable bucket overflow**: When load factor exceeds ~70â€“80%, the HashTable is resized (bucket count doubled). This reallocates all buckets and rehashes all keys. For large arrays, this is an O(n) operation.
- [ ] **Memory fragmentation**: HashTable allocation uses Zend MM's segregated storage. Buckets are allocated individually, leading to fragmentation over time. SplFixedArray's contiguous allocation avoids this.
- [ ] **Reference-counted values**: Each array element is a zval. For compound types (strings, arrays, objects), the zval holds a pointer to the heap-allocated value. The zval itself is 16 bytes; the value's memory is separate.
- [ ] **Array copy on write**: `$b = $a` increments the array's refcount. `$b[] = 'new'` triggers separation â€” the entire array is duplicated. For a 1M-element array, this duplicates all buckets, keys, and zvals.
- [ ] Document and follow through on architectural decision: Reducing array memory overhead
- [ ] Ensure architecture aligns with core concept: **zend_array structure (HashTable)**: `nTableSize` (bucket count, rounded to power of 2), `nNumOfElements`, `nNextFreeElement`, `pListHead` (doubly-linked list pointer), `arBuckets` (pointer to bucket array).
- [ ] Ensure architecture aligns with core concept: **Packed array**: Sequential integer keys (0, 1, 2, ...). Stored as a contiguous C array of `zval`s. No key storage, no hash computation. ~50% less memory than hash array.
- [ ] Ensure architecture aligns with core concept: **Hash array**: Non-sequential integer keys or string keys. Uses buckets with `nKeySize` and `arKey` (string key storage). Hash computed for each lookup. Higher memory overhead per element.
- [ ] Ensure architecture aligns with core concept: **Bucket structure**: Each bucket is 32â€“40 bytes (depending on key type): `h` (hash value, 8 bytes), `key` (string key pointer or NULL for integer), `val` (zval, 16 bytes), `next` (pointer to next bucket in collision chain).
- [ ] Ensure architecture aligns with core concept: **nTableSize rounding**: HashTable capacity is always rounded up to the next power of 2. An array with 1000 elements uses nTableSize = 1024. An array with 1025 elements uses nTableSize = 2048. This causes up to 50% waste at boundary values.
- [ ] Ensure architecture aligns with core concept: **Doubly-linked list**: Each array maintains a linked list of its elements in insertion order. Used for `foreach` iteration. Adds 2 pointers (prev/next) per element during iteration state management.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Profile the largest arrays: measure memory with `memory_get_usage()` before and after creating each array
- [ ] For sequential numeric arrays with dense indices: the array is "packed" (C array internally) â€” no optimization needed
- [ ] For sparse numeric arrays (indices with gaps): restructure to use a continuous range or SplFixedArray to maintain packed representation
- [ ] For associative arrays with many entries: ensure keys are interned strings (class names, method names, literals) for memory efficiency
- [ ] For arrays that are built once and read-only: consider using SplFixedArray if numeric indices
- [ ] For arrays that are modified after being shared (refcount > 1): avoid modification to prevent copy-on-write duplication
- [ ] For large filter/map operations: use array_filter/array_map which allocate new arrays â€” consider processing in-place with foreach
- [ ] Benchmark memory before and after array optimizations
- [ ] Document the memory-efficient array patterns

# Performance Checklist (from 04/06)
- [ ] Packed array iteration: ~50% faster than hash array because elements are contiguous in memory (CPU cache-friendly).
- [ ] Packed array element access: O(1) direct indexing (pointer arithmetic). Hash array access: O(1) average, O(n) worst-case (hash collision chain).
- [ ] Power-of-2 waste: An array with 1025 elements uses 2048 bucket slots â€” ~50% waste. At 1030 (next power of 2 = 2048), waste is still ~50%. At 2048 elements, waste is 0%.
- [ ] HashTable resize cost: ~10Âµs for a 10K-element array. ~1ms for a 1M-element array. Pre-allocating avoids this cost.
- [ ] Memory break-even for SplFixedArray vs packed array: For 10K elements, packed array uses ~320KB (10K Ã— 32 bytes). SplFixedArray uses ~160KB. Break-even is ~5K elements for meaningful savings.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Array key injection: If user input is used as array keys, an attacker could create a hash collision attack (CVE-2011-4885 â€” PHP 5.3, fixed by seeding the hash function). PHP 8.x uses randomized hash seeding to prevent this.
- [ ] Memory exhaustion: An attacker can craft a request that creates a massive array (e.g., via JSON parsing of deeply nested structures). Set `max_input_vars` and `memory_limit` to mitigate.
- [ ] Reference leaks in arrays: Arrays holding references to large objects prevent those objects from being freed. Clear arrays explicitly when done.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Compare memory: packed array vs hash array with the same number of elements.
- [ ] Compare memory: regular array vs SplFixedArray for 100K integers.
- [ ] Verify packed-to-hash transition: add a non-sequential key and check memory increase.
- [ ] Measure array resize cost: build a 10K-element array incrementally vs pre-allocated.
- [ ] Test `array_values()` restoration of packed mode after unset.
- [ ] Document array patterns used in memory-critical code paths.
- [ ] Array memory usage reduced by 20-40% on targeted structures
- [ ] Packed arrays used where possible; hash arrays minimized
- [ ] SplFixedArray applied for appropriate use cases
- [ ] Intermediate array allocations reduced
- [ ] Memory reduction measured and documented
- [ ] Largest arrays identified and memory measured
- [ ] Packed vs hash array distinction understood
- [ ] Sparse arrays restructured for packed representation
- [ ] SplFixedArray used for fixed-size numeric arrays
- [ ] Copy-on-write duplication avoided
- [ ] Memory reduction measured
- [ ] Patterns documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using non-sequential keys for large collections
- [ ] Avoid: Creating gaps by unsetting elements
- [ ] Avoid: Not pre-allocating known-size arrays
- [ ] Avoid: Copying large arrays unnecessarily
- [ ] Avoid: Using array functions on packed arrays that return hash arrays
- [ ] Avoid anti-pattern: **Using arrays as sets**: `$set[$item] = true;` with string keys. Use `SplObjectStorage` (for objects) or sort + binary search for large sets.
- [ ] Avoid anti-pattern: **Incremental array building in loops**: `$arr[] = $value` for millions of items. Consider generators or stream writing for large-scale data processing.
- [ ] Avoid anti-pattern: **Nested loops creating 2D arrays**: 1000 Ã— 1000 nested arrays = 1M elements, ~32MB for a packed array or ~64MB for hash arrays. Use SplFixedArray for known-size 2D data.
- [ ] Avoid anti-pattern: **JSON encoding large in-memory arrays**: `json_encode()` on a large array creates a string representation in memory before output. Use `json_encode()` with `JSON_INVALID_UTF8_SUBSTITUTE` and stream output for large responses.
- [ ] Guard against anti-pattern: Ignoring zval Memory Overhead for Scalars vs Compounds
- [ ] Guard against anti-pattern: Copy-On-Write Violation - Unnecessary Array Duplication
- [ ] Guard against anti-pattern: Ignoring Cyclic Garbage Collection Overhead
- [ ] Guard against anti-pattern: Memory Leak in Long-Running Workers
- [ ] Guard against anti-pattern: Oversized Memory Limit Masking Waste

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
**Core Concepts:** **zend_array structure (HashTable)**: `nTableSize` (bucket count, rounded to power of 2), `nNumOfElements`, `nNextFreeElement`, `pListHead` (doubly-linked list pointer), `arBuckets` (pointer to bucket array)., **Packed array**: Sequential integer keys (0, 1, 2, ...). Stored as a contiguous C array of `zval`s. No key storage, no hash computation. ~50% less memory than hash array., **Hash array**: Non-sequential integer keys or string keys. Uses buckets with `nKeySize` and `arKey` (string key storage). Hash computed for each lookup. Higher memory overhead per element., **Bucket structure**: Each bucket is 32â€“40 bytes (depending on key type): `h` (hash value, 8 bytes), `key` (string key pointer or NULL for integer), `val` (zval, 16 bytes), `next` (pointer to next bucket in collision chain)., **nTableSize rounding**: HashTable capacity is always rounded up to the next power of 2. An array with 1000 elements uses nTableSize = 1024. An array with 1025 elements uses nTableSize = 2048. This causes up to 50% waste at boundary values.
**Rules:**
- General: Avoid Array Copy-on-Write Modification of Large Arrays
**Skills:** PHP Memory Model, Efficient Data Structures, String Memory Usage, Copy-on-Write Mechanics
**Decision Trees:** Reducing array memory overhead
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Efficient Data Structures â€” SplFixedArray, SplObjectStorage, String Memory Usage â€” zend_string structure, Object Memory Usage â€” zend_object structure, Copy-on-Write Mechanics, Generators and Yield

