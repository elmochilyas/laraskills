# Skill: Optimize Array Memory Usage in PHP

## Purpose

Reduce memory overhead from PHP arrays by understanding HashTable structure, packed vs hash arrays, and choosing the right array type for each use case.

## When To Use

- Profiling shows high memory usage from array variables
- Working with large datasets stored in arrays
- Optimizing Octane workers where array memory accumulates
- Serializing/caching large arrays (memory format affects cache size)

## When NOT To Use

- For small arrays (<100 elements) where overhead is negligible
- When array operations are not a significant memory consumer
- For code paths executed once per request in PHP-FPM

## Prerequisites

- Understanding of PHP's zend_array (HashTable) structure
- Knowledge of packed vs hash array distinction
- Profiling showing array memory allocation

## Inputs

- Largest arrays in the application (element count and types)
- Access pattern (sequential, associative, mixed)
- Modification pattern (append-only, modify-existing, sort, filter)

## Workflow (numbered steps)

1. Profile the largest arrays: measure memory with `memory_get_usage()` before and after creating each array
2. For sequential numeric arrays with dense indices: the array is "packed" (C array internally) — no optimization needed
3. For sparse numeric arrays (indices with gaps): restructure to use a continuous range or SplFixedArray to maintain packed representation
4. For associative arrays with many entries: ensure keys are interned strings (class names, method names, literals) for memory efficiency
5. For arrays that are built once and read-only: consider using SplFixedArray if numeric indices
6. For arrays that are modified after being shared (refcount > 1): avoid modification to prevent copy-on-write duplication
7. For large filter/map operations: use array_filter/array_map which allocate new arrays — consider processing in-place with foreach
8. Benchmark memory before and after array optimizations
9. Document the memory-efficient array patterns

## Validation Checklist

- [ ] Largest arrays identified and memory measured
- [ ] Packed vs hash array distinction understood
- [ ] Sparse arrays restructured for packed representation
- [ ] SplFixedArray used for fixed-size numeric arrays
- [ ] Copy-on-write duplication avoided
- [ ] Memory reduction measured
- [ ] Patterns documented

## Common Failures

- **Using SplFixedArray for dynamic arrays**: SplFixedArray has fixed size — use regular arrays if size changes
- **Forgetting about packed arrays**: PHP automatically uses packed representation for sequential numeric arrays — no manual optimization needed
- **Over-optimizing small arrays**: A 50-element associative array uses ~5KB — conversion to SplFixedArray saves <2KB
- **Creating unnecessary intermediate arrays**: `array_filter(array_map(...))` creates two arrays — use foreach with conditional logic

## Decision Points

- Sequential numeric, dense indices, fixed size: SplFixedArray (30-50% savings)
- Sequential numeric, dense indices, dynamic size: regular array (PHP will use packed representation)
- Sequential numeric, sparse indices: fill gaps or restructure to avoid sparsity
- Associative with interned string keys: regular array (optimal — no improvement possible)
- Mixed integer/string keys: regular array (required — SplFixedArray not applicable)

## Performance Considerations

- Packed array: 40 bytes per element + value storage — highly efficient
- Hash array: 40 bytes per element + value storage + hash table overhead — ~2x packed memory
- SplFixedArray: 40 bytes per element + value storage — no hash overhead
- Array copy: O(n) on first modification after refcount > 1
- array_filter/array_map/array_walk: each creates a new array — O(n) memory

## Security Considerations

- Array structure does not have direct security implications
- Large arrays in session data increase memory per request
- Serialized arrays in caches should be sized appropriately for the cache store

## Related Rules (from 05-rules.md)

- Use SplFixedArray for Fixed-Size Arrays
- Never Modify Arrays in Foreach by Reference
- Avoid Unnecessary Intermediate Arrays

## Related Skills

- PHP Memory Model
- Efficient Data Structures
- String Memory Usage
- Copy-on-Write Mechanics

## Success Criteria

- Array memory usage reduced by 20-40% on targeted structures
- Packed arrays used where possible; hash arrays minimized
- SplFixedArray applied for appropriate use cases
- Intermediate array allocations reduced
- Memory reduction measured and documented
