# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** # Reference Counting â€” zval refcount Lifecycle, GC_ADDREF/GC_DELREF, TRY Semantics
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Use `xdebug_debug_zval()` or `debug_zval_refs()` to inspect refcount values.
- [ ] Verify the refcount lifecycle: assign â†’ increment, unset â†’ decrement.
- [ ] Test that interned strings skip refcount manipulation.
- [ ] Measure the CPU cost of RC in a hot loop with vs without variable copying.
- [ ] Document RC patterns relevant to your application's hot code paths.
- [ ] Reference counting understood and applied to code optimization
- [ ] Unnecessary copy-on-write duplications identified and eliminated
- [ ] Memory usage reduced on targeted code paths
- [ ] Reference patterns documented for team standards
- [ ] Large data structures identified
- [ ] Refcounts inspected at key modification points
- [ ] Unnecessary copy-on-write duplications eliminated
- [ ] foreach-by-reference anti-pattern removed
- [ ] Function signatures use pass-by-reference where appropriate
- [ ] Memory usage measured before/after
- [ ] Patterns documented
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **RC check points**: Every zval write operation checks refcount > 1 (is this zval shared?). If shared, the zval must be separated (duplicated) before modification. This is copy-on-write.
- [ ] **Zend_reference container**: When `$b = &$a` is executed, PHP creates a `zend_reference` wrapper with `refcount = 2` (both `$a` and `$b` point to it). The actual value is stored inside the reference container.
- [ ] **GC_IMMUTABLE flag**: Set on interned strings, some enum instances, and preloaded class metadata. These zvals skip RC entirely â€” they are never freed.
- [ ] **GC_PERSISTENT flag**: Set on allocations that survive request boundaries. These zvals are managed by the persistent allocator, not the per-request heap.
- [ ] **RC overflow protection**: refcount is a uint32_t. Overflow is virtually impossible (>4 billion references) and would indicate a bug.
- [ ] Document and follow through on architectural decision: Understanding zval refcount mechanism
- [ ] Document and follow through on architectural decision: Debugging refcount issues
- [ ] Ensure architecture aligns with core concept: **zend_refcounted_h header**: Common header for all reference-counted types. Contains `refcount` (uint32_t), type info, and GC flags.
- [ ] Ensure architecture aligns with core concept: **refcount lifecycle**: Assignment/copy â†’ refcount++. Unset/scope exit â†’ refcount--. refcount=0 â†’ immediate free.
- [ ] Ensure architecture aligns with core concept: **GC_ADDREF / GC_DELREF**: Internal macros for refcount manipulation. GC_ADDREF increments, GC_DELREF decrements. Returns the new refcount value.
- [ ] Ensure architecture aligns with core concept: **TRY semantics (PHP 8.1+)**: For known-immutable values (interned strings, enum singletons), the TRY version avoids atomic operations. Reduces refcount overhead by ~5â€“10% in hot paths.
- [ ] Ensure architecture aligns with core concept: **Immutable values**: Interned strings have a special flag. They are never freed during a request. GC_ADDREF/GC_DELREF are skipped for these.
- [ ] Ensure architecture aligns with core concept: **Reference counting is not garbage collection**: RC handles non-cyclic structures immediately and deterministically. GC only handles cycles that RC cannot resolve.
- [ ] Ensure architecture aligns with core concept: **is_ref flag**: Marks zvals that are referenced by a `&` reference. When is_ref is set, CoW separation behaves differently â€” the value must be duplicated on write.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Identify large data structures (>1MB) that are passed between functions or modified in place
- [ ] Use `xdebug_debug_zval()` or `debug_zval_refcounts()`(PHP 8.4+) to inspect refcounts at key points
- [ ] If refcount > 1 before modification, copy-on-write will duplicate the entire structure â€” refactor to avoid modification after sharing
- [ ] For arrays passed to functions: use pass-by-reference (`&$array`) if the function modifies the array in place
- [ ] For foreach loops: never use `foreach ($array as &$value)` if the array is used after the loop â€” use index-based modification instead
- [ ] For objects: they are always passed by handle (refcount on the handle, not the object data) â€” modification does not copy the object
- [ ] After refactoring, measure memory usage before and after to confirm the optimization
- [ ] Document the reference counting patterns applied

# Performance Checklist (from 04/06)
- [ ] RC operations: ~5â€“15ns per increment/decrement. Cache-line atomic on modern CPUs.
- [ ] RC is the dominant memory management cost in PHP. ~30â€“50% of CPU time in framework-heavy apps is spent on RC operations.
- [ ] PHP 8.1 TRY semantics reduce RC overhead by ~5â€“10% in hot paths by skipping atomic ops on known-immutable values.
- [ ] zend_reference container overhead: creates an additional heap allocation and indirection. Avoid excessive reference usage in performance-sensitive code.
- [ ] The `zend_refcounted_h` header adds 16 bytes overheard per reference-counted allocation. This is in addition to the zval itself.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Type confusion vulnerabilities: Manipulating refcount via extension bugs can cause use-after-free. PHP's type system prevents this in userland.
- [ ] Reference leaks: A reference chain that prevents cleanup can cause memory exhaustion. This is a stability risk, not a direct security issue.
- [ ] Debugging RC issues: Tools like `xdebug_debug_zval()` can inspect refcount for debugging never shared in production.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Use `xdebug_debug_zval()` or `debug_zval_refs()` to inspect refcount values.
- [ ] Verify the refcount lifecycle: assign â†’ increment, unset â†’ decrement.
- [ ] Test that interned strings skip refcount manipulation.
- [ ] Measure the CPU cost of RC in a hot loop with vs without variable copying.
- [ ] Document RC patterns relevant to your application's hot code paths.
- [ ] Reference counting understood and applied to code optimization
- [ ] Unnecessary copy-on-write duplications identified and eliminated
- [ ] Memory usage reduced on targeted code paths
- [ ] Reference patterns documented for team standards
- [ ] Large data structures identified
- [ ] Refcounts inspected at key modification points
- [ ] Unnecessary copy-on-write duplications eliminated
- [ ] foreach-by-reference anti-pattern removed
- [ ] Function signatures use pass-by-reference where appropriate
- [ ] Memory usage measured before/after
- [ ] Patterns documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Assuming `unset()` always frees memory
- [ ] Avoid: Excessive copying in loops
- [ ] Avoid: Forgetting that function parameters copy refcount
- [ ] Avoid: Using references in foreach on a shared array
- [ ] Avoid anti-pattern: **Deep reference chains**: `$a = &$b; $b = &$c; $c = &$d;` creates nested zend_reference containers. Each access traverses the chain.
- [ ] Avoid anti-pattern: **Cyclic assignment via references**: `$a = &$a` creates a self-reference that RC cannot resolve. The GC must collect this.
- [ ] Avoid anti-pattern: **Overusing `&` for performance**: References do not always improve performance. They prevent CoW sharing, often increasing memory and CPU overhead.
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
**Core Concepts:** **zend_refcounted_h header**: Common header for all reference-counted types. Contains `refcount` (uint32_t), type info, and GC flags., **refcount lifecycle**: Assignment/copy â†’ refcount++. Unset/scope exit â†’ refcount--. refcount=0 â†’ immediate free., **GC_ADDREF / GC_DELREF**: Internal macros for refcount manipulation. GC_ADDREF increments, GC_DELREF decrements. Returns the new refcount value., **TRY semantics (PHP 8.1+)**: For known-immutable values (interned strings, enum singletons), the TRY version avoids atomic operations. Reduces refcount overhead by ~5â€“10% in hot paths., **Immutable values**: Interned strings have a special flag. They are never freed during a request. GC_ADDREF/GC_DELREF are skipped for these.
**Rules:**
- General: Use foreach by Value for Read-Only Iteration
**Skills:** Zval Structure and Reference Counting, Copy-on-Write Mechanics, By-Reference Implications, PHP Memory Model
**Decision Trees:** Understanding zval refcount mechanism, Debugging refcount issues
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Zval Structure and Reference Counting, Copy-on-Write Mechanics, Cyclic GC Algorithm, Persistent vs Per-Request Allocators, Zend Memory Manager

