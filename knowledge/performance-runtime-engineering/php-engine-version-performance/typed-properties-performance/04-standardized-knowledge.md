# Standardized Knowledge: Typed Properties Performance

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Typed Properties Performance |
| Difficulty | Intermediate |
| Lifecycle | Optimize, Evaluate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Typed properties (PHP 7.4+) improve performance by enabling the Zend Engine to specialize property access at the opcode level. When types are declared, the engine eliminates runtime type checks for read/write operations, uses direct memory offsets instead of hash table lookups, and enables JIT guard elimination. The cumulative gain from typed properties across a codebase is typically 5-15% in execution time, with higher gains in property-heavy code paths.

## Core Concepts

- **Type specialization**: The Zend Engine generates optimized opcodes (`ASSIGN_OBJ` variants) when property types are known at compile time — integer assignments skip zval type conversion, string assignments skip reference counting overhead.
- **Guard elimination**: JIT compiler removes runtime type guards when typed properties guarantee type stability. A property declared as `int` never needs the "is this an int?" check that untyped properties require.
- **Memory layout optimization**: Typed properties use packed zval slots in the objects store, reducing cache misses compared to untyped property hash table lookups.
- **readonly optimization**: PHP 8.1 readonly properties further optimize by allowing the engine to skip write guards after initialization — the property can only be set once, eliminating subsequent write barriers.

## When To Use

- Always — typed properties should be the default for all new code
- Property-heavy classes (DTOs, models, value objects, configuration objects)
- Hot code paths with frequent property read/write access (serialization, mapping, aggregation)
- Codebases targeting PHP 8.0+ where JIT can leverage type information
- API response formatting and data transformation layers

## When NOT To Use

- Legacy codebases where adding types would require breaking changes (migrate incrementally)
- Dynamic property patterns (stdClass, magic __get/__set) — typed properties conflict with dynamic access
- When PHP version < 7.4 (typed properties not available)
- In code paths where property type is genuinely dynamic (union types still require runtime checks)

## Best Practices

- **Declare all properties with explicit types**: Every untyped property is a missed optimization opportunity. The engine cannot specialize on `mixed` — be as specific as possible.
- **Use nullable types sparingly**: `?string` requires additional null checks. Prefer `string` with a default empty value where semantically valid.
- **Combine with readonly where applicable**: PHP 8.1 readonly properties eliminate write barriers after construction — significant gain for immutable objects.
- **Prefer primitive types over object types**: `int`, `float`, `string`, `bool` enable the most aggressive specialization. Object-typed properties still benefit but with less opcode optimization.
- **Use typed properties with JIT**: The combination provides multiplicative gains — typed properties enable guard elimination, which is the primary source of JIT speedup.

## Architecture Guidelines

- **Property access opcodes**: Untyped `$obj->prop = $val` compiles to general `ASSIGN_OBJ`. Typed `$obj->prop = $val` compiles to `ASSIGN_OBJ_OP_DATA` with type-specific variants. The typed variant skips zval type conversion and refcount adjustment.
- **Object store layout**: PHP 8.1+ uses a packed objects store (`zend_object_store`) where typed properties are stored as consecutive zval slots. Access uses base + offset instead of hash lookup, reducing CPU cache misses.
- **JIT integration**: The JIT compiler traces typed property access and generates native code that directly reads/writes the typed slot without guard checks. Untyped properties force the JIT to emit runtime type guards, reducing optimization opportunities.
- **readonly property internals**: PHP 8.1 readonly properties use `IS_PROPERTY_READONLY` flag in the property info struct. The engine skips write barrier checks after the first write (during object construction), eliminating runtime overhead on subsequent read-only access.

## Performance Considerations

- Typed properties: 5-15% execution time reduction in property-heavy code vs untyped
- readonly properties: additional 3-8% gain over typed-only (eliminates write barrier)
- JIT + typed properties: 20-40% gain in hot property access loops vs untyped without JIT
- Memory: ~8 bytes per typed property slot (packed zval), comparable to untyped hash entries but with better cache locality
- Object hydration: Typed DTOs can be populated ~30% faster than untyped equivalents

## Security

- Typed properties provide type safety guarantees — prevents unexpected type injection from external input
- readonly properties prevent mutation after construction — useful for security-critical configuration objects
- Strict types (`declare(strict_types=1)`) combined with typed properties create a type-safe boundary at function/method entry points
- Property type violations throw `TypeError` at the point of assignment, not at point of use — catch assignment errors early

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Omitting types on frequently accessed properties | Habit, legacy patterns | Missed 5-15% performance gain | Type all properties; measure before/after |
| Using mixed type as default | Convenience | No type specialization possible | Use specific types; mixed only when truly necessary |
| Not combining with readonly | Unawareness of PHP 8.1 feature | Missed additional 3-8% gain | Add readonly to immutable properties |
| Dynamic property patterns with typed classes | Mixing typed and dynamic access | Runtime error (dynamic property deprecated in 8.2) | Use explicit declared properties only |
| Forgetting strict_types in files with typed properties | Partial strict mode adoption | Implicit type coercion bypasses type declarations | Add declare(strict_types=1) to all files |

## Anti-Patterns

- **Using arrays for typed data structures**: Arrays lose type information at runtime. Typed properties on DTOs or value objects maintain type guarantees and enable engine specialization.
- **Wrapping typed properties with getters that un-type**: Getters returning `mixed` instead of the declared type negate the optimization. Match getter return types to their property types.
- **Late type annotations via PHPDoc**: `@var int` in PHPDoc provides no runtime optimization — only declared typed properties (`public int $foo`) enable engine specialization.
- **Over-using nullable typed properties**: `?int` requires null guards. If null is a valid initial state, consider a default value (`int $foo = 0`) and a separate null sentinel.

## Examples

```php
<?php
declare(strict_types=1);

// Optimal — typed + readonly + primitive
class UserDTO {
    public readonly int $id;
    public readonly string $name;
    public readonly string $email;
    public readonly bool $active;

    public function __construct(int $id, string $name, string $email, bool $active) {
        $this->id = $id;
        $this->name = $name;
        $this->email = $email;
        $this->active = $active;
    }
}

// Suboptimal — untyped, no readonly
class UserDTO {
    public $id;
    public $name;
    public $email;
    public $active;
}
```

## Related Topics

- PHP 8.3 Optimizations
- PHP 8.4 Optimizations
- JIT Enabled Workloads
- Asymmetric Visibility
- First-Class Callable

## AI Agent Notes

- Typed properties are the foundation for JIT guard elimination — without them, JIT gains are significantly reduced
- readonly (8.1+) provides compounding performance benefits beyond typed alone
- The Zend Engine generates distinct opcodes for typed vs untyped property access — the typed variants skip zval type checks and refcount adjustments
- PHP 8.2 deprecates dynamic properties on classes — typed properties are the migration path
- Always use the most specific type possible: `int` over `string|int` over `mixed`
- Property type enforcement via TypeError is faster and safer than manual validation

## Verification

- [ ] All class properties have explicit type declarations
- [ ] Immutable properties use readonly keyword (PHP 8.1+)
- [ ] declare(strict_types=1) enabled in files with typed properties
- [ ] No dynamic property usage on typed classes (deprecated in 8.2)
- [ ] JIT enabled and leveraging typed property guard elimination
- [ ] Before/after benchmark shows measurable improvement from typing
- [ ] Getter return types match their corresponding property types
