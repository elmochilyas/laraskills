# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP Engine & Version Performance
**Knowledge Unit:** Typed Properties Performance
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Declare all properties with explicit types**: Every untyped property is a missed optimization opportunity. The engine cannot specialize on `mixed` â€” be as specific as possible.
- [ ] **Use nullable types sparingly**: `?string` requires additional null checks. Prefer `string` with a default empty value where semantically valid.
- [ ] **Combine with readonly where applicable**: PHP 8.1 readonly properties eliminate write barriers after construction â€” significant gain for immutable objects.
- [ ] **Prefer primitive types over object types**: `int`, `float`, `string`, `bool` enable the most aggressive specialization. Object-typed properties still benefit but with less opcode optimization.
- [ ] **Use typed properties with JIT**: The combination provides multiplicative gains â€” typed properties enable guard elimination, which is the primary source of JIT speedup.
- [ ] All class properties have explicit type declarations
- [ ] Immutable properties use readonly keyword (PHP 8.1+)
- [ ] declare(strict_types=1) enabled in files with typed properties
- [ ] No dynamic property usage on typed classes (deprecated in 8.2)
- [ ] JIT enabled and leveraging typed property guard elimination
- [ ] Hot-path property accesses converted to typed declarations
- [ ] Before/after benchmark shows measurable improvement
- [ ] All tests pass and no type errors in production
- [ ] Team follows typed property conventions in new code
- [ ] All hot-path properties converted to typed declarations
- [ ] Tests pass with typed properties
- [ ] No type errors in production after deployment
- [ ] Before/after benchmark shows improvement (typically 5-15% for property-heavy code)
- [ ] Docblocks cleaned up where redundant
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Property access opcodes**: Untyped `$obj->prop = $val` compiles to general `ASSIGN_OBJ`. Typed `$obj->prop = $val` compiles to `ASSIGN_OBJ_OP_DATA` with type-specific variants. The typed variant skips zval type conversion and refcount adjustment.
- [ ] **Object store layout**: PHP 8.1+ uses a packed objects store (`zend_object_store`) where typed properties are stored as consecutive zval slots. Access uses base + offset instead of hash lookup, reducing CPU cache misses.
- [ ] **JIT integration**: The JIT compiler traces typed property access and generates native code that directly reads/writes the typed slot without guard checks. Untyped properties force the JIT to emit runtime type guards, reducing optimization opportunities.
- [ ] **readonly property internals**: PHP 8.1 readonly properties use `IS_PROPERTY_READONLY` flag in the property info struct. The engine skips write barrier checks after the first write (during object construction), eliminating runtime overhead on subsequent read-only access.
- [ ] Document and follow through on architectural decision: Typed vs untyped property declaration
- [ ] Document and follow through on architectural decision: readonly vs mutable property design
- [ ] Document and follow through on architectural decision: Specific vs union/mixed type selection
- [ ] Ensure architecture aligns with core concept: **Type specialization**: The Zend Engine generates optimized opcodes (`ASSIGN_OBJ` variants) when property types are known at compile time â€” integer assignments skip zval type conversion, string assignments skip reference counting overhead.
- [ ] Ensure architecture aligns with core concept: **Guard elimination**: JIT compiler removes runtime type guards when typed properties guarantee type stability. A property declared as `int` never needs the "is this an int?" check that untyped properties require.
- [ ] Ensure architecture aligns with core concept: **Memory layout optimization**: Typed properties use packed zval slots in the objects store, reducing cache misses compared to untyped property hash table lookups.
- [ ] Ensure architecture aligns with core concept: **readonly optimization**: PHP 8.1 readonly properties further optimize by allowing the engine to skip write guards after initialization â€” the property can only be set once, eliminating subsequent write barriers.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Declare all properties with explicit types**: Every untyped property is a missed optimization opportunity. The engine cannot specialize on `mixed` â€” be as specific as possible.
- [ ] **Use nullable types sparingly**: `?string` requires additional null checks. Prefer `string` with a default empty value where semantically valid.
- [ ] **Combine with readonly where applicable**: PHP 8.1 readonly properties eliminate write barriers after construction â€” significant gain for immutable objects.
- [ ] **Prefer primitive types over object types**: `int`, `float`, `string`, `bool` enable the most aggressive specialization. Object-typed properties still benefit but with less opcode optimization.
- [ ] **Use typed properties with JIT**: The combination provides multiplicative gains â€” typed properties enable guard elimination, which is the primary source of JIT speedup.
- [ ] Identify property-heavy classes from profiling call graphs â€” look for classes with 10+ property accesses per invocation
- [ ] For each property, determine the correct type (int, float, string, bool, array, or custom class/interface)
- [ ] Add type declarations to each property: `public int $count` instead of `public $count`
- [ ] For nullable properties, use `?type` or `null` default: `public ?string $label = null`
- [ ] For PHP 8.0+, consider promoted constructor properties for DTOs: `public function __construct(public int $id) {}`
- [ ] Remove redundant docblock type hints if they duplicate the type declaration
- [ ] Run existing tests to verify no type errors introduced
- [ ] Benchmark the optimized code path using before/after comparison
- [ ] Document the typed property conversions for team awareness

# Performance Checklist (from 04/06)
- [ ] Typed properties: 5-15% execution time reduction in property-heavy code vs untyped
- [ ] readonly properties: additional 3-8% gain over typed-only (eliminates write barrier)
- [ ] JIT + typed properties: 20-40% gain in hot property access loops vs untyped without JIT
- [ ] Memory: ~8 bytes per typed property slot (packed zval), comparable to untyped hash entries but with better cache locality
- [ ] Object hydration: Typed DTOs can be populated ~30% faster than untyped equivalents
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Typed properties provide type safety guarantees â€” prevents unexpected type injection from external input
- [ ] readonly properties prevent mutation after construction â€” useful for security-critical configuration objects
- [ ] Strict types (`declare(strict_types=1)`) combined with typed properties create a type-safe boundary at function/method entry points
- [ ] Property type violations throw `TypeError` at the point of assignment, not at point of use â€” catch assignment errors early

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] All class properties have explicit type declarations
- [ ] Immutable properties use readonly keyword (PHP 8.1+)
- [ ] declare(strict_types=1) enabled in files with typed properties
- [ ] No dynamic property usage on typed classes (deprecated in 8.2)
- [ ] JIT enabled and leveraging typed property guard elimination
- [ ] Before/after benchmark shows measurable improvement from typing
- [ ] Getter return types match their corresponding property types
- [ ] Hot-path property accesses converted to typed declarations
- [ ] Before/after benchmark shows measurable improvement
- [ ] All tests pass and no type errors in production
- [ ] Team follows typed property conventions in new code
- [ ] All hot-path properties converted to typed declarations
- [ ] Tests pass with typed properties
- [ ] No type errors in production after deployment
- [ ] Before/after benchmark shows improvement (typically 5-15% for property-heavy code)
- [ ] Docblocks cleaned up where redundant

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Declare all properties with explicit types**: Every untyped property is a missed optimization opportunity. The engine cannot specialize on `mixed` â€” be as specific as possible.
- [ ] **Use nullable types sparingly**: `?string` requires additional null checks. Prefer `string` with a default empty value where semantically valid.
- [ ] **Combine with readonly where applicable**: PHP 8.1 readonly properties eliminate write barriers after construction â€” significant gain for immutable objects.
- [ ] **Prefer primitive types over object types**: `int`, `float`, `string`, `bool` enable the most aggressive specialization. Object-typed properties still benefit but with less opcode optimization.
- [ ] **Use typed properties with JIT**: The combination provides multiplicative gains â€” typed properties enable guard elimination, which is the primary source of JIT speedup.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Omitting types on frequently accessed properties
- [ ] Avoid: Using mixed type as default
- [ ] Avoid: Not combining with readonly
- [ ] Avoid: Dynamic property patterns with typed classes
- [ ] Avoid: Forgetting strict_types in files with typed properties
- [ ] Avoid anti-pattern: **Using arrays for typed data structures**: Arrays lose type information at runtime. Typed properties on DTOs or value objects maintain type guarantees and enable engine specialization.
- [ ] Avoid anti-pattern: **Wrapping typed properties with getters that un-type**: Getters returning `mixed` instead of the declared type negate the optimization. Match getter return types to their property types.
- [ ] Avoid anti-pattern: **Late type annotations via PHPDoc**: `@var int` in PHPDoc provides no runtime optimization â€” only declared typed properties (`public int $foo`) enable engine specialization.
- [ ] Avoid anti-pattern: **Over-using nullable typed properties**: `?int` requires null guards. If null is a valid initial state, consider a default value (`int $foo = 0`) and a separate null sentinel.
- [ ] Guard against anti-pattern: Omitting Type Declarations on Frequently Accessed Properties
- [ ] Guard against anti-pattern: Using Mixed Type as Default
- [ ] Guard against anti-pattern: Wrapping Typed Properties with Getters That Un-Type
- [ ] Guard against anti-pattern: Late Type Annotations via PHPDoc Instead of Declared Types
- [ ] Guard against anti-pattern: Over-Using Nullable Typed Properties

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
**Core Concepts:** **Type specialization**: The Zend Engine generates optimized opcodes (`ASSIGN_OBJ` variants) when property types are known at compile time â€” integer assignments skip zval type conversion, string assignments skip reference counting overhead., **Guard elimination**: JIT compiler removes runtime type guards when typed properties guarantee type stability. A property declared as `int` never needs the "is this an int?" check that untyped properties require., **Memory layout optimization**: Typed properties use packed zval slots in the objects store, reducing cache misses compared to untyped property hash table lookups., **readonly optimization**: PHP 8.1 readonly properties further optimize by allowing the engine to skip write guards after initialization â€” the property can only be set once, eliminating subsequent write barriers.
**Rules:**
- General: Do Not Use Dynamic Properties on Typed Classes
**Skills:** Profiling Callgraph Analysis, JIT Guard Elimination Understanding, Value Object Design Patterns
**Decision Trees:** Typed vs untyped property declaration, readonly vs mutable property design, Specific vs union/mixed type selection
**Anti-Patterns:** Omitting Type Declarations on Frequently Accessed Properties, Using Mixed Type as Default, Wrapping Typed Properties with Getters That Un-Type, Late Type Annotations via PHPDoc Instead of Declared Types, Over-Using Nullable Typed Properties
**Related Topics:** PHP 8.3 Optimizations, PHP 8.4 Optimizations, JIT Enabled Workloads, Asymmetric Visibility, First-Class Callable

