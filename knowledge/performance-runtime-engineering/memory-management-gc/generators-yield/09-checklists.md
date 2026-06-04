# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** # Generators and Yield â€” Memory-Efficient Iteration, IteratorAggregate, Async Patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Write a generator that reads a large file and verify memory stays flat regardless of file size.
- [ ] Compare memory: array version vs generator version for returning 100K items.
- [ ] Test `yield from` delegation: chain 3 generators and verify memory remains O(1).
- [ ] Verify generator cannot be rewound: test calling `rewind()`.
- [ ] Test `getReturn()`: verify return values are accessible after iteration completes.
- [ ] Large datasets processed with O(1) memory using generators
- [ ] Database cursors used instead of loading all rows
- [ ] File streaming used instead of loading entire files
- [ ] Memory usage reduction measured (typically 50-90% for targeted operations)
- [ ] Generator patterns documented for team use
- [ ] Large array collections identified (candidates for generator conversion)
- [ ] Generator function(s) created
- [ ] Database cursor iteration used instead of loading all rows
- [ ] File streaming used instead of file() or file_get_contents()
- [ ] API pagination handled with lazy fetching
- [ ] Generator chaining applied for processing pipelines
- [ ] Memory usage measured (should show O(1) memory)
- [ ] Pattern documented
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Pipeline pattern**: Generator â†’ Filter Generator â†’ Transform Generator â†’ Consumer. Each step yields modified values without intermediate storage. Memory scales with the pipeline depth, not the data size.
- [ ] **Generator for streams**: When reading a CSV file, the generator reads one line at a time, yields it, and the consumer processes it. The file handle is held open but only one line is in memory.
- [ ] **Generator for database cursors**: Yield rows from a Dbal `fetchOne()` or Eloquent `chunk()` cursor. Each row is yielded one at a time without buffering all results.
- [ ] **Generator for API pagination**: Yield items from a paginated API, fetching the next page only when all items from the current page have been yielded and consumed.
- [ ] **Coroutine pattern**: Use `$gen->send()` to push data into a generator that maintains state across iterations. Useful for streaming parsers, rate limiters, or running totals.
- [ ] **Generator rewind**: A Generator cannot be rewound. Calling `rewind()` after iteration starts throws an exception. Create a new generator by calling the generator function again.
- [ ] Document and follow through on architectural decision: Generator vs array for large datasets
- [ ] Ensure architecture aligns with core concept: **Generator function**: Any function containing `yield`. Returns a `Generator` object instead of a value. The function body executes lazily â€” code runs only when the generator is iterated.
- [ ] Ensure architecture aligns with core concept: **yield**: Pauses execution and returns a value. The generator resumes from the same point when the next value is requested.
- [ ] Ensure architecture aligns with core concept: **yield from**: Delegates to another generator, traversable, or array. Syntactic sugar for nested iteration without manual looping.
- [ ] Ensure architecture aligns with core concept: **Generator object**: Implements `Iterator` â€” `current()`, `next()`, `key()`, `valid()`, `rewind()`. Can also be used as a coroutine: `send()` sends a value back to the generator, `throw()` throws an exception into the generator.
- [ ] Ensure architecture aligns with core concept: **Generator return**: A generator can `return` a final value (accessible via `getReturn()`), separate from yielded values. Useful for aggregation results.
- [ ] Ensure architecture aligns with core concept: **Memory O(1)**: A generator yielding 10 values or 10 million values uses approximately the same memory (~200 bytes for the Generator object).
- [ ] Ensure architecture aligns with core concept: **Fibers (PHP 8.1+)**: Built on generator-like suspension mechanics. Fibers provide full coroutines with the ability to suspend from nested function calls.
- [ ] Ensure architecture aligns with core concept: **yield as coroutine**: `$generator->send($value)` passes a value back into the generator, updating `$value` at the yield expression.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Identify array collections that accumulate the entire dataset before processing â€” these are candidates for generators
- [ ] Create a generator function that yields elements one at a time instead of building an array
- [ ] For database queries: use `yield $row` inside a cursor-based iteration, avoiding `->get()->all()` which loads all rows
- [ ] For file processing: use `yield $line` with `fgets()` to stream lines instead of `file()` which loads the entire file
- [ ] For API pagination: yield each page's items and fetch the next page only when the current page is exhausted
- [ ] For computation pipelines: chain generators (filter generator -> transform generator -> output) for zero-copy processing
- [ ] Replace the original foreach over the array with foreach over the generator
- [ ] Measure memory usage before and after â€” should be O(1) instead of O(n)
- [ ] Document the generator pattern for future dataset processing

# Performance Checklist (from 04/06)
- [ ] Generator overhead: ~200ns per `yield` (function call + state save/restore). Array iteration: ~100ns per element (no function call).
- [ ] Memory savings: For 1M items, a generator uses ~200 bytes vs ~32MB for an array. The memory savings (32MB) far outweigh the CPU overhead (200ns Ã— 1M = 200ms).
- [ ] Generator function compilation: The generator function is compiled once, not per-call. Repeated calls reuse the compiled opcode array.
- [ ] Generator object GC: When a generator is no longer referenced, it's GC'd along with its internal state. If the generator holds large resources (file handles), closing early is important.
- [ ] Nesting with `yield from`: Each level adds ~100ns overhead per yield. For deep pipelines (3+ levels), consider flattening.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Generator resource leaks: If a generator holds file handles or database cursors and is not fully consumed, the resources remain open until the Generator object is destroyed. Always `unset()` generators or ensure they complete.
- [ ] Generator sandboxing: A generator's yield can throw exceptions from the consumer via `$gen->throw()`. Handle exceptions inside generators.
- [ ] Generator state persistence: A stored Generator object preserves its execution state. Used intentionally for coroutines, but if stored accidentally, it holds references to all variables in its scope.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Write a generator that reads a large file and verify memory stays flat regardless of file size.
- [ ] Compare memory: array version vs generator version for returning 100K items.
- [ ] Test `yield from` delegation: chain 3 generators and verify memory remains O(1).
- [ ] Verify generator cannot be rewound: test calling `rewind()`.
- [ ] Test `getReturn()`: verify return values are accessible after iteration completes.
- [ ] Test `send()` pattern: implement a simple coroutine and verify bidirectional communication.
- [ ] Document generator usage patterns in your application.
- [ ] Large datasets processed with O(1) memory using generators
- [ ] Database cursors used instead of loading all rows
- [ ] File streaming used instead of loading entire files
- [ ] Memory usage reduction measured (typically 50-90% for targeted operations)
- [ ] Generator patterns documented for team use
- [ ] Large array collections identified (candidates for generator conversion)
- [ ] Generator function(s) created
- [ ] Database cursor iteration used instead of loading all rows
- [ ] File streaming used instead of file() or file_get_contents()
- [ ] API pagination handled with lazy fetching
- [ ] Generator chaining applied for processing pipelines
- [ ] Memory usage measured (should show O(1) memory)
- [ ] Pattern documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using `iterator_to_array()` on large generators
- [ ] Avoid: Creating infinite generators without a break condition
- [ ] Avoid: Assuming generators can be rewound
- [ ] Avoid: Not `unset()`-ing generators holding resources
- [ ] Avoid: Using yield for small datasets
- [ ] Avoid anti-pattern: **Generator inside hot loops**: If a generator function is called 1M times (creating 1M Generator objects), the overhead of object creation dominates. Use generators for the values, not for the calling structure.
- [ ] Avoid anti-pattern: **Deeply nested `yield from` chains**: Each delegation adds overhead and complexity. 1â€“2 levels of delegation is ideal. 5+ levels is hard to debug.
- [ ] Avoid anti-pattern: **Generator for data that must be sorted**: Generators yield in order. If the consumer needs sorted data, the entire dataset must be in memory. Generators are not suitable for sort-based operations.
- [ ] Avoid anti-pattern: **Generator as a replacement for all arrays**: Arrays are simpler, faster for small datasets, and support random access. Generators are a tool for specific memory-constrained scenarios.
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
**Core Concepts:** **Generator function**: Any function containing `yield`. Returns a `Generator` object instead of a value. The function body executes lazily â€” code runs only when the generator is iterated., **yield**: Pauses execution and returns a value. The generator resumes from the same point when the next value is requested., **yield from**: Delegates to another generator, traversable, or array. Syntactic sugar for nested iteration without manual looping., **Generator object**: Implements `Iterator` â€” `current()`, `next()`, `key()`, `valid()`, `rewind()`. Can also be used as a coroutine: `send()` sends a value back to the generator, `throw()` throws an exception into the generator., **Generator return**: A generator can `return` a final value (accessible via `getReturn()`), separate from yielded values. Useful for aggregation results.
**Rules:**
- General: Use Generators for Large Datasets, Arrays for Small
**Skills:** Efficient Data Structures, Array Memory Usage, Object Memory Usage, Octane Memory Management
**Decision Trees:** Generator vs array for large datasets
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Efficient Data Structures for Memory, Array Memory Usage, Copy-on-Write Mechanics, Fibers and Coroutine Patterns, Iterator and Traversable Interfaces

