# Skill: Understand Zval Type/Value Representation for Optimization

## Purpose

Use knowledge of how PHP's zval stores different types (inline scalars vs pointer-based compounds) to write predictably performant code.

## When To Use

- Understanding why scalar operations are faster than string/array/object operations
- Optimizing code where variable type affects performance characteristics
- Designing data structures with awareness of memory layout
- Debugging unexpected performance differences between similar operations

## When NOT To Use

- For routine PHP development where the abstraction is sufficient
- Without profiling data confirming that type representation affects performance
- For PHP versions below 7.0 (zval structure was different)

## Prerequisites

- Understanding that zvals have two representations: inline (scalars) and pointer-based (compounds)
- PHP 7.0+ runtime

## Inputs

- Hot-path code with mixed scalar and compound types
- Profiling data showing type-dependent performance variation

## Workflow (numbered steps)

1. For each variable in the hot path, determine if it is inline (IS_UNDEF, IS_NULL, IS_TRUE, IS_FALSE, IS_LONG, IS_DOUBLE) or pointer-based (IS_STRING, IS_ARRAY, IS_OBJECT, IS_RESOURCE, IS_REFERENCE)
2. Inline scalars: stored directly in the 16-byte zval — no heap allocation, no refcount, CPU register speed
3. Pointer-based types: zval stores a pointer to a heap-allocated structure — requires dereferencing, has refcount semantics
4. For hot-path flags and counters: prefer int or bool (inline) over string (pointer-based)
5. For hot-path data transfer: if data fits in a scalar (int, float, bool), avoid wrapping in an array or object
6. For configuration values accessed frequently: store as scalars rather than array lookups where possible
7. Benchmark the performance difference between inline and pointer-based representations for the specific use case
8. Document the type representation insights for the team

## Validation Checklist

- [ ] Hot-path variables classified as inline or pointer-based
- [ ] Inline scalars preferred for flags, counters, simple state
- [ ] Array/object wrapping avoided for scalar-only data
- [ ] Performance difference measured and documented
- [ ] Type representation patterns documented

## Common Failures

- **Using string for boolean flags**: `$status = 'active'` (pointer-based, heap allocation) vs `$status = 1` (inline, no allocation)
- **Wrapping scalars in arrays**: `$result = ['count' => 1]` (array with HashTable overhead) vs `$result = 1` (inline)
- **Over-optimizing**: A single string flag used once per request is not worth optimizing — focus on hot paths with 1000+ accesses
- **Forgetting type coercion cost**: Casting between types (string to int) adds CPU — maintain consistent types

## Decision Points

- Flag/state that is compared frequently: prefer int (inline) over string (pointer-based)
- Identifier that is used for lookup: string (pointer-based but required for associative arrays)
- Numeric value used in calculations: int/float (inline, CPU register speed)
- Compound data with multiple fields: array or object (pointer-based but necessary for structure)
- Small fixed set of values: use int constants/enums (inline) over strings

## Performance Considerations

- Inline scalar read: ~3-5ns (CPU register)
- Pointer-based type read: ~5-10ns (dereference + type check)
- Inline scalar write: ~5-10ns (register + zval update)
- Pointer-based type write: ~10-500ns (allocation + refcount setup)
- String comparison: O(n) character comparison — int comparison: O(1)
- Array access: O(1) average but requires hash computation and dereferencing

## Security Considerations

- Type representation is internal — no direct security implications
- Type confusion (expecting scalar, receiving compound) is a logic error, not a security vulnerability with typed declarations
- Strict types (declare(strict_types=1)) ensures type consistency at function boundaries

## Related Rules (from 05-rules.md)

- Prefer Scalar Types for Frequently-Accessed Data
- Use Typed Properties for Hot-Path DTOs

## Related Skills

- PHP Memory Model
- Zval Structure and Reference Counting
- Copy-on-Write Mechanics
- Type Inference and Guard Elimination

## Success Criteria

- Inline vs pointer-based type representation understood
- Hot-path code optimized to prefer inline scalars where appropriate
- Performance improvement measured and documented
- Type representation knowledge applied to new code design
