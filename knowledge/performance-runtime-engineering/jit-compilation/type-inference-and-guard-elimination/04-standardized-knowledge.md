# Standardized Knowledge: Type Inference and Guard Elimination

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | Type Inference and Guard Elimination |
| Difficulty | Advanced |
| Lifecycle | Analyze, Debug |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Type inference is the JIT compiler's ability to deduce variable types at compile time by analyzing the code path. When types are known, the JIT eliminates runtime type checks (guard elimination), producing tighter native code. This is the single largest source of JIT's speedup. PHP 8.0+ typed properties significantly improve inference quality compared to docblock-only types.

## Core Concepts

- **Type Inference Sources**: Declared types (PHP 8.0+ property types, parameter types, return types), inferred types (deduced from assignments and operations), profile feedback (observed types during execution).
- **Guard Elimination**: If JIT can prove a variable is always int, it eliminates the is_long() guard. The native code uses integer addition without type checking.
- **Typed Property Advantage**: public int $count → JIT knows the type at compile time. /** @var int */ public $count → JIT must insert a guard because docblocks are not enforceable.
- **Guard Failure Bailout**: When a runtime value doesn't match the inferred type, JIT bails out to the interpreter. This is expensive (~1-5µs) and prevents future JIT compilation of that code path.

## When To Use

- Understanding why JIT provides or doesn't provide benefit for certain code
- Optimizing PHP code to maximize JIT compilation quality (typed properties, strict types)
- Debugging guard failures that prevent effective JIT compilation
- Evaluating the impact of type declarations on performance

## When NOT To Use

- Day-to-day JIT configuration (use standard presets)
- When types are already well-declared (PHP 8.x typed properties)
- For I/O-bound code where JIT benefit is minimal regardless of type inference

## Best Practices

- **Use typed properties everywhere**: public int $count vs /** @var int */ public $count — typed properties enable guard elimination. Docblock-only types do not.
- **Add return types to all methods**: Return types enable JIT to avoid guards at call sites. Without them, JIT must handle mixed return values.
- **Use strict_types=1**: Strict types mode improves type inference by preventing implicit type coercion that confuses the JIT analyzer.
- **Avoid mixed type hints**: mixed forces JIT to insert full guards because the type could be anything. Use Union types where possible.
- **Profile guard failure frequency**: High guard failure rates indicate type instability. Fix the underlying type issues to restore JIT optimization.

## Architecture Guidelines

- **SSA-Based Analysis**: JIT uses Static Single Assignment form to track variable types across the code graph. Each SSA variable has a type lattice — JIT propagates known types through the graph.
- **Profile Feedback**: In tracing mode (T=5), JIT collects profiling data on actual types encountered at runtime before compiling. This enables type inference where static analysis is insufficient.
- **Guard Types**: Integer (is_long), Float (is_double), String (is_string), Array (is_array), Object (is_object), Resource (is_resource). Each guard eliminated saves one type check per execution.
- **Bailout Cascade**: A guard failure at an early point in a function may cascade, causing the entire compiled trace or function to bail out to the interpreter. Fixing one type issue can restore optimization for an entire code path.

## Performance Considerations

- Typed properties reduce opcode count by 15-25% for property-heavy code
- Guard elimination accounts for ~40-60% of JIT's total speedup in CPU-bound benchmarks
- Guard failure cost: 1-5µs per failure, plus lost optimization for that code path
- PHP 8.4 lazy objects required JIT guard updates to handle lazily-initialized typed properties

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using docblock types instead of typed properties | Legacy PHP habits | JIT cannot eliminate guards for docblock-only properties | Convert docblock property types to PHP 8.0+ typed properties |
| Omitting return types | Not understanding JIT impact | JIT must insert guards at call sites | Add return types to all methods |
| Using mixed type unnecessarily | Convenience | Full guards required, JIT optimization limited | Use Union types or specific types instead of mixed |
| Ignoring guard failure monitoring | Not checking opcache_get_status | Unnoticed type instability negating JIT benefit | Monitor guard failure counts and fix root causes |

## Anti-Patterns

- **Adding types everywhere without benefit**: I/O-bound code where JIT provides minimal gain doesn't need stringent typing for JIT purposes. Focus type improvement on CPU-bound paths.
- **Expecting strict_types alone to fix type inference**: strict_types=1 helps but doesn't replace typed properties and return types.
- **Relying on PHPDoc for JIT optimization**: PHPDoc types are invisible to the JIT compiler. Only runtime-declared types are used for guard elimination.

## Examples

```php
<?php
// Good for JIT — typed property
class Product {
    public int $id;       // JIT eliminates cast guard
    public string $name;  // JIT eliminates string guard
}

// Bad for JIT — docblock-only types (JIT ignores)
class LegacyProduct {
    /** @var int */
    public $id;           // JIT inserts is_long() guard
    /** @var string */
    public $name;         // JIT inserts is_string() guard
}
```

## Related Topics

- DynASM Framework Internals
- JIT Concepts and Terminology
- JIT Configuration for Production
- JIT Workload Benefit Assessment

## AI Agent Notes

- Guard elimination is the single largest source of JIT speedup (40-60% of total).
- PHP 8.0+ typed properties are essential for JIT optimization. Docblock types are invisible to JIT.
- Guard failures cost 1-5µs each AND prevent future JIT compilation of that code path.
- The cascade effect of guard failures can negate JIT benefit for large code regions.
- strict_types=1 + typed properties + return types = maximum JIT compilation quality.

## Verification

- [ ] PHP 8.0+ typed properties used (not docblock-only)
- [ ] Return types added to all methods
- [ ] strict_types=1 enabled in application code
- [ ] Guard failure rate monitored (opcache_get_status)
- [ ] mixed type usage minimized (Union types preferred)
- [ ] Type improvements focused on CPU-bound code paths
