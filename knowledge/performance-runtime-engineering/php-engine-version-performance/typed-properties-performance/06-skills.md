# Skill: Optimize Hot-Path Code Using Typed Properties

## Purpose

Reduce opcode count, memory overhead, and CPU time by replacing dynamic properties with typed properties in frequently-executed code paths.

## When To Use

- Refactoring property-heavy classes that appear in profiling flame graphs
- Optimizing DTOs, value objects, and model attributes accessed thousands of times per request
- Preparing codebase for PHP 8.x where typed properties provide verification and performance benefits

## When NOT To Use

- For rarely-accessed properties where optimization impact is negligible
- In code paths that are already I/O-bound (bottleneck is database or API calls, not PHP execution)
- When the property type is genuinely dynamic and cannot be constrained

## Prerequisites

- Profiling data identifying property-heavy code paths
- PHP 7.4+ runtime (typed properties available)
- Understanding of the property's valid type range

## Inputs

- Hot-path classes identified from profiling
- Currently untyped property declarations
- Access patterns (read-heavy, write-heavy, or mixed) for each property

## Workflow (numbered steps)

1. Identify property-heavy classes from profiling call graphs — look for classes with 10+ property accesses per invocation
2. For each property, determine the correct type (int, float, string, bool, array, or custom class/interface)
3. Add type declarations to each property: `public int $count` instead of `public $count`
4. For nullable properties, use `?type` or `null` default: `public ?string $label = null`
5. For PHP 8.0+, consider promoted constructor properties for DTOs: `public function __construct(public int $id) {}`
6. Remove redundant docblock type hints if they duplicate the type declaration
7. Run existing tests to verify no type errors introduced
8. Benchmark the optimized code path using before/after comparison
9. Document the typed property conversions for team awareness

## Validation Checklist

- [ ] All hot-path properties converted to typed declarations
- [ ] Tests pass with typed properties
- [ ] No type errors in production after deployment
- [ ] Before/after benchmark shows improvement (typically 5-15% for property-heavy code)
- [ ] Docblocks cleaned up where redundant

## Common Failures

- **Over-typing dynamic properties**: Properties that genuinely hold multiple types cannot be typed — use union types (PHP 8.0+) instead
- **Breaking lazy-loading patterns**: ORM lazy-loaded properties may be null until accessed — use nullable types
- **Ignoring promoted constructor properties**: Constructor promotion reduces boilerplate AND improves performance for DTOs

## Decision Points

- If property is accessed >1000 times per request: high priority for typing
- If property is accessed <100 times: typing still beneficial for correctness but performance gain negligible
- If property holds mixed types: use union types (PHP 8.0+) or keep untyped with explicit getter validation

## Performance Considerations

- Typed properties reduce opcode count by eliminating runtime type checks
- 5-15% improvement on property-heavy code paths (microbenchmark), 1-3% on full request (typical)
- Constructor promotion reduces constructor method opcodes by ~30%
- Memory usage is unchanged — typed properties do not reduce zval size

## Security Considerations

- Typed properties enforce type contracts at runtime — prevents unexpected type-based bugs that could lead to security issues
- Strict types (declare(strict_types=1)) combined with typed properties provides strongest type safety

## Related Rules (from 05-rules.md)

- Prefer Scalar Types for Frequently-Accessed Data
- Use Typed Properties for Hot-Path DTOs
- Constructor Promotion for Value Objects

## Related Skills

- Profiling Callgraph Analysis
- JIT Guard Elimination Understanding
- Value Object Design Patterns

## Success Criteria

- Hot-path property accesses converted to typed declarations
- Before/after benchmark shows measurable improvement
- All tests pass and no type errors in production
- Team follows typed property conventions in new code
