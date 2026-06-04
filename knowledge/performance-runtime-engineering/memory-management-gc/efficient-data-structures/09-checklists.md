# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** # Efficient Data Structures â€” SplFixedArray, SplObjectStorage, DTOs, Memory-Efficient Collection Patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Compare memory of SplFixedArray vs regular array for 100K elements.
- [ ] Benchmark SplFixedArray iteration vs regular array iteration.
- [ ] Measure generator memory: process 100K records with array vs generator.
- [ ] Compare memory of DTO vs associative array with the same data.
- [ ] Test SplObjectStorage with 10K objects vs associative array with spl_object_hash.
- [ ] Memory-efficient data structures selected for each use case
- [ ] Memory usage reduced by 30-50% for targeted structures
- [ ] Access patterns match structure capabilities
- [ ] Large datasets processed with generators to limit memory
- [ ] Data structure choices documented
- [ ] Current largest data structures identified
- [ ] Access pattern determined for each
- [ ] SplFixedArray applied for fixed-size numeric arrays
- [ ] SplObjectStorage applied for object-keyed maps
- [ ] Generators used for large dataset iteration
- [ ] Memory reduction measured and documented
- [ ] Data structure documentation created
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Array vs SplFixedArray memory**: PHP arrays store elements in buckets within a HashTable. Each bucket has overhead for the key, hash, and pointer. SplFixedArray stores elements in a contiguous C array â€” one pointer per element, no key storage, no hash.
- [ ] **DTO heap allocation**: Each DTO instance is a zend_object with a vtable pointer and property slots. For 10 properties, a DTO uses ~200 bytes (object header + 10 zval slots). An equivalent array uses ~400+ bytes (HashTable + 10 buckets + 10 string keys).
- [ ] **Generator memory**: A generator function's internal state is stored in a single `Generator` object (~200 bytes). Each `yield` pauses execution without holding all values in memory. For iterating a 1M-row CSV, the generator uses ~200 bytes instead of ~200MB.
- [ ] **SplObjectStorage internals**: Stores objects in a hash table keyed by object ID (an integer). No string key allocation. Object insertion is O(1) amortized. Retrieval is O(1).
- [ ] **SplFixedArray resizing**: `setSize()` reallocates the internal C array. O(n) operation. Avoid frequent resizing â€” set the final size once.
- [ ] Document and follow through on architectural decision: Data structure selection for memory-sensitive code
- [ ] Ensure architecture aligns with core concept: **SplFixedArray**: Uses a C array internally â€” dense, contiguous memory. No HashTable overhead. Fixed size (can be resized, but not dynamically). 30â€“50% less memory than regular arrays for large collections.
- [ ] Ensure architecture aligns with core concept: **SplObjectStorage**: Maps objects to data. Uses object identity (spl_object_id) rather than hashing string keys. More memory-efficient than using objects as array keys.
- [ ] Ensure architecture aligns with core concept: **SplMinHeap / SplMaxHeap / SplPriorityQueue**: Heap data structures for ordered processing. Lower overhead than maintaining sorted arrays.
- [ ] Ensure architecture aligns with core concept: **SplDoublyLinkedList / SplStack / SplQueue**: Linked list structures. Efficient for insertion/removal at ends. Higher per-element overhead than arrays.
- [ ] Ensure architecture aligns with core concept: **DTOs / POPOs**: Plain objects with typed public properties. Less memory overhead than arrays with string keys. Each property access is direct (no hash lookup).
- [ ] Ensure architecture aligns with core concept: **SplFixedArray vs array**: `new SplFixedArray(1000000)` uses ~16MB. `array_fill(0, 1000000, null)` uses ~32MB (HashTable bucket overhead).
- [ ] Ensure architecture aligns with core concept: **Generators**: Yield values on-demand instead of building arrays. Memory usage is O(1) regardless of dataset size.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Profile the current data structure usage: measure memory of the largest arrays/objects in the application
- [ ] Check access pattern: sequential, random access, key-value lookup, or set membership
- [ ] For sequential numeric arrays without modification: replace with SplFixedArray (30-50% memory savings)
- [ ] For object-keyed maps: replace associative array with SplObjectStorage
- [ ] For priority queue operations: use SplPriorityQueue instead of sorting arrays
- [ ] For unique value sets: use SplObjectStorage or array keys (not array values with in_array())
- [ ] For large datasets that need non-blocking iteration: use generators to yield one element at a time
- [ ] For string-keyed lookup tables: regular arrays (HashTable) are optimal â€” SplFixedArray does not support string keys
- [ ] Benchmark memory before and after data structure changes
- [ ] Document the selected structures and the rationale

# Performance Checklist (from 04/06)
- [ ] `SplFixedArray` iteration: ~20% faster than regular array (no hash lookup, contiguous memory â†’ CPU cache friendly).
- [ ] `SplFixedArray` access: O(1) direct pointer arithmetic. Regular array: O(1) hash lookup (hashing function + bucket traversal).
- [ ] `SplObjectStorage` access: ~30% faster than associative array with object keys.
- [ ] DTO property access: direct offset read (~5ns). Associative array access: hash + bucket walk (~50â€“100ns).
- [ ] Generator overhead: ~200ns per yield iteration. Higher per-element cost than array iteration but zero upfront memory allocation.
- [ ] SplQueue/SplStack: O(1) enqueue/dequeue. `array_shift()`: O(n) (re-indexes all elements).
- [ ] Memory fragmentation: SplFixedArray's contiguous allocation reduces fragmentation compared to HashTable's bucket-based allocation.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] SplFixedArray bounds checking: accessing an out-of-bounds index throws `RuntimeException`. Always validate indexes before access.
- [ ] SplObjectStorage: stored objects are held as hard references â€” they won't be GC'd while in storage. Clear storage when objects are no longer needed.
- [ ] Generator state: a Generator object holds a reference to the current execution state. If not freed, it can leak memory. Always allow generators to complete or explicitly close them.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Compare memory of SplFixedArray vs regular array for 100K elements.
- [ ] Benchmark SplFixedArray iteration vs regular array iteration.
- [ ] Measure generator memory: process 100K records with array vs generator.
- [ ] Compare memory of DTO vs associative array with the same data.
- [ ] Test SplObjectStorage with 10K objects vs associative array with spl_object_hash.
- [ ] Verify SplQueue performance for 10K FIFO operations vs array_shift.
- [ ] Document the data structure choices in memory-critical code paths.
- [ ] Memory-efficient data structures selected for each use case
- [ ] Memory usage reduced by 30-50% for targeted structures
- [ ] Access patterns match structure capabilities
- [ ] Large datasets processed with generators to limit memory
- [ ] Data structure choices documented
- [ ] Current largest data structures identified
- [ ] Access pattern determined for each
- [ ] SplFixedArray applied for fixed-size numeric arrays
- [ ] SplObjectStorage applied for object-keyed maps
- [ ] Generators used for large dataset iteration
- [ ] Memory reduction measured and documented
- [ ] Data structure documentation created

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using `SplFixedArray` for string-keyed data
- [ ] Avoid: Creating large arrays in loops
- [ ] Avoid: Using `array_shift()` on large arrays
- [ ] Avoid: Not sizing SplFixedArray upfront
- [ ] Avoid: Holding large data in memory longer than needed
- [ ] Avoid anti-pattern: **Using objects when arrays suffice**: Creating complex object hierarchies for simple data storage. A simple associative array may be more memory-efficient than 10,000 DTO instances.
- [ ] Avoid anti-pattern: **Array-as-queue with shift**: `array_shift()` on a 100K-element array forces PHP to re-index all elements. Always use SplQueue for queue semantics.
- [ ] Avoid anti-pattern: **String-keyed arrays for machine-generated data**: If keys are sequential integers generated by code, use integer keys. String keys are only useful for human-readable data.
- [ ] Avoid anti-pattern: **Premature optimization with SplFixedArray**: Using SplFixedArray for small collections (<1000 elements) adds negligible benefit and reduces flexibility. Measure first.
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
**Core Concepts:** **SplFixedArray**: Uses a C array internally â€” dense, contiguous memory. No HashTable overhead. Fixed size (can be resized, but not dynamically). 30â€“50% less memory than regular arrays for large collections., **SplObjectStorage**: Maps objects to data. Uses object identity (spl_object_id) rather than hashing string keys. More memory-efficient than using objects as array keys., **SplMinHeap / SplMaxHeap / SplPriorityQueue**: Heap data structures for ordered processing. Lower overhead than maintaining sorted arrays., **SplDoublyLinkedList / SplStack / SplQueue**: Linked list structures. Efficient for insertion/removal at ends. Higher per-element overhead than arrays., **DTOs / POPOs**: Plain objects with typed public properties. Less memory overhead than arrays with string keys. Each property access is direct (no hash lookup).
**Rules:**
- General: Do Not Prematurely Optimize with Specialized Structures
**Skills:** PHP Memory Model, Array Memory Usage Analysis, Generators and Yield for Memory Efficiency, Object Memory Usage Analysis
**Decision Trees:** Data structure selection for memory-sensitive code
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Generators and Yield â€” Memory-efficient iteration, String Memory Usage, Array Memory Usage, Object Memory Usage, Copy-on-Write Mechanics

