# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** # Object Memory Usage â€” zend_object Structure, Property Storage, Class Hierarchy, Memory-Efficient Object Patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Compare memory: DTO vs associative array with the same data.
- [ ] Measure object header overhead: compare objects with 1, 10, and 50 properties.
- [ ] Compare inheritance overhead: class with single level vs 3-level hierarchy.
- [ ] Test dynamic vs typed property access speed.
- [ ] Measure object allocation cost in a hot loop with vs without pooling.
- [ ] Object memory usage reduced by 15-30% on targeted classes
- [ ] Typed properties and constructor promotion applied consistently
- [ ] Object graphs flattened where appropriate
- [ ] Memory reduction measured and documented
- [ ] Largest object allocations identified
- [ ] Constructor property promotion applied (PHP 8.0+)
- [ ] Typed properties added to all property declarations
- [ ] Object graphs evaluated for unnecessary nesting
- [ ] ORM lazy loading configured
- [ ] unset() used for temporary objects in long-running workers
- [ ] Memory reduction measured
- [ ] Patterns documented
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Object header overhead**: Each object has a minimum ~40â€“80 byte header. For an object with 1 property, the overhead is ~70% of the total memory. For an object with 20 properties, the overhead is ~20%.
- [ ] **Inheritance property table**: Each class in the hierarchy stores its own property declarations. `class B extends A` with 5 properties each = 10 property zvals + 2 object headers. Flattening to a single class with 10 properties saves the extra header.
- [ ] **Dynamic properties cost**: `$obj->newProp = 'x'` adds the property to a HashTable inside the object. The key `'newProp'` is stored as a string (~40 bytes + zend_string for the key name) plus a zval (16 bytes). Total: ~60+ bytes vs 16 bytes for a typed property.
- [ ] **Anonymous classes**: Each anonymous class instance creates a unique `zend_class_entry`. 1000 anonymous class instances = 1000 class entries. Repeated anonymous class usage should be replaced with named classes.
- [ ] **Closure object cost**: Each Closure instance is an object (~80 bytes header) plus the captured `this` and `use` variables as properties. For frequently created closures (event listeners, callbacks), consider class-based strategies.
- [ ] Document and follow through on architectural decision: Object vs array for data transport
- [ ] Document and follow through on architectural decision: readonly properties for memory efficiency
- [ ] Ensure architecture aligns with core concept: **zend_object header**: `ce` (class entry pointer, 8 bytes), `handle` (resource ID, 4 bytes), `gc` (GC info, 16 bytes including refcount), `properties` (HashTable pointer or inline buffer). ~40â€“80 bytes overhead per object depending on PHP version.
- [ ] Ensure architecture aligns with core concept: **zend_class_entry**: Per-class structure holding the class definition â€” method table, property info, interfaces, constants. Stored once per class, not per instance.
- [ ] Ensure architecture aligns with core concept: **Property storage**: Property values stored as zvals (16 bytes each) in the object's properties table. For typed properties, the zval includes the expected type for enforcement.
- [ ] Ensure architecture aligns with core concept: **Dynamic properties**: Added via `$obj->newProp = value` at runtime. Stored in a separate HashTable attached to the object. Slower access (hash lookup) and higher memory (string key storage + bucket overhead).
- [ ] Ensure architecture aligns with core concept: **Inheritance overhead**: Each level of inheritance adds a property table for that class's declared properties. A child class with 10 own + 10 inherited properties stores 20 zvals + inheritance chain overhead.
- [ ] Ensure architecture aligns with core concept: **Readonly objects (PHP 8.4+)**: New `__construct()` property promotion with `readonly` on the class itself. Memory characteristics similar to readonly properties on a regular class.
- [ ] Ensure architecture aligns with core concept: **Lazy objects (PHP 8.4+)**: Objects that are not fully initialized until accessed. Uses a ghost or proxy pattern internally. Reduces memory for objects that may never be accessed.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Profile object memory usage: identify classes with the most instances or largest per-instance memory
- [ ] For DTOs/value objects: use PHP 8.0+ constructor property promotion â€” reduces boilerplate and improves memory layout
- [ ] Add typed properties to all objects â€” allows Zend Engine to optimize property storage
- [ ] For objects with many optional properties: consider using a single array property instead of many nullable typed properties
- [ ] For deeply nested object graphs: evaluate if all nesting is necessary â€” flattening reduces object count
- [ ] For ORM entities: use lazy loading for related entities that are not always accessed
- [ ] For long-running workers: explicitly unset() objects when no longer needed to allow GC
- [ ] Benchmark memory before and after object optimizations
- [ ] Document the memory-efficient object patterns

# Performance Checklist (from 04/06)
- [ ] Object allocation: ~100â€“500ns for a simple object (zend_object allocation + property slot initialization).
- [ ] Object with 10 typed properties: ~200 bytes (80 header + 10 Ã— 16 property zvals + alignment).
- [ ] Equivalent associative array: ~400+ bytes (HashTable + 10 buckets + 10 string keys + 10 zvals).
- [ ] DTO memory advantage: ~50% less memory than equivalent associative array. ~60% faster property access.
- [ ] Inheritance overhead: Each level adds ~40â€“80 bytes per instance plus method dispatch indirection.
- [ ] Dynamic property access: ~3â€“5Ã— slower than typed property access (hash lookup vs direct offset).
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Object injection vulnerabilities: `unserialize()` can create arbitrary objects (CVE-2016-7124). Use `unserialize()` with `allowed_classes` parameter or use JSON for untrusted data.
- [ ] Dynamic property spoofing: Allowing user input to set dynamic properties can overwrite expected properties. Always validate property names.
- [ ] Lazy object proxies: If a lazy object's initializer has side effects (e.g., database query), an attacker could trigger initialization at unexpected times. Ensure initializers are safe.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Compare memory: DTO vs associative array with the same data.
- [ ] Measure object header overhead: compare objects with 1, 10, and 50 properties.
- [ ] Compare inheritance overhead: class with single level vs 3-level hierarchy.
- [ ] Test dynamic vs typed property access speed.
- [ ] Measure object allocation cost in a hot loop with vs without pooling.
- [ ] Verify lazy objects (PHP 8.4+) defer initialization until property access.
- [ ] Document object patterns used in memory-critical code paths.
- [ ] Object memory usage reduced by 15-30% on targeted classes
- [ ] Typed properties and constructor promotion applied consistently
- [ ] Object graphs flattened where appropriate
- [ ] Memory reduction measured and documented
- [ ] Largest object allocations identified
- [ ] Constructor property promotion applied (PHP 8.0+)
- [ ] Typed properties added to all property declarations
- [ ] Object graphs evaluated for unnecessary nesting
- [ ] ORM lazy loading configured
- [ ] unset() used for temporary objects in long-running workers
- [ ] Memory reduction measured
- [ ] Patterns documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using arrays instead of DTOs for structured data
- [ ] Avoid: Deep inheritance for value objects
- [ ] Avoid: Using anonymous classes in loops
- [ ] Avoid: Not clearing object references
- [ ] Avoid: Storing metadata on entity objects
- [ ] Avoid anti-pattern: **Massive inheritance chains for business objects**: 5+ levels of inheritance for DTOs/value objects. Each level adds overhead with no benefit. Prefer composition.
- [ ] Avoid anti-pattern: **Object-as-array-replacement**: Creating objects with 50+ properties accessed dynamically. Either the class is doing too much, or an array would be more appropriate.
- [ ] Avoid anti-pattern: **Closures-in-loops**: Creating closures inside loops creates N Closure objects. Extract closures to private methods or static callbacks.
- [ ] Avoid anti-pattern: **Overusing __get/__set magic methods**: Magic methods intercept property access with hash lookups. 10â€“50Ã— slower than direct property access. Use typed properties instead.
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
**Core Concepts:** **zend_object header**: `ce` (class entry pointer, 8 bytes), `handle` (resource ID, 4 bytes), `gc` (GC info, 16 bytes including refcount), `properties` (HashTable pointer or inline buffer). ~40â€“80 bytes overhead per object depending on PHP version., **zend_class_entry**: Per-class structure holding the class definition â€” method table, property info, interfaces, constants. Stored once per class, not per instance., **Property storage**: Property values stored as zvals (16 bytes each) in the object's properties table. For typed properties, the zval includes the expected type for enforcement., **Dynamic properties**: Added via `$obj->newProp = value` at runtime. Stored in a separate HashTable attached to the object. Slower access (hash lookup) and higher memory (string key storage + bucket overhead)., **Inheritance overhead**: Each level of inheritance adds a property table for that class's declared properties. A child class with 10 own + 10 inherited properties stores 20 zvals + inheritance chain overhead.
**Rules:**
- General: Use Closure Reuse Instead of Inline Closures in Hot Paths
**Skills:** PHP Memory Model, Efficient Data Structures, Zval Structure and Reference Counting, Array Memory Usage
**Decision Trees:** Object vs array for data transport, readonly properties for memory efficiency
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** PHP Memory Model â€” zval and zend_object, Efficient Data Structures â€” SplObjectStorage, Array Memory Usage â€” HashTable overhead, Copy-on-Write Mechanics, Generators and Yield

