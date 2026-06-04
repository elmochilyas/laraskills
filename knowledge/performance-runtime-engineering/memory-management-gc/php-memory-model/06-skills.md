# Skill: Apply PHP Memory Model Knowledge to Optimize Memory Usage

## Purpose

Use understanding of the Zend Memory Manager, zval structure, and allocation tiers to write memory-efficient PHP code.

## When To Use

- Optimizing hot-path code where memory allocation is a bottleneck
- Debugging high memory usage in PHP applications
- Designing data structures for Octane/long-running workers
- Profiling shows significant time in memory allocation functions

## When NOT To Use

- For typical web requests where memory is freed at request end (PHP-FPM)
- When the application has no memory-related performance issues
- For beginners who should focus on application logic first

## Prerequisites

- Basic understanding of PHP variables and types
- Profiling data showing memory allocation hotspots
- PHP 7.4+ runtime (for typed properties and optimizations)

## Inputs

- Profiling call graphs showing allocation-heavy functions
- Current memory usage metrics (memory_get_usage)
- Data structure usage patterns (arrays, objects, strings)

## Workflow (numbered steps)

1. Profile the application to identify functions with high allocation counts or memory usage
2. For scalar-heavy code: verify scalars are stored inline (no heap allocation) — prefer int/float/bool over string/array for hot-path data
3. For string operations: avoid concatenation in loops — use arrays and implode() instead
4. For array operations: use SplFixedArray for fixed-size numeric arrays to reduce HashTable overhead
5. For object-heavy code: prefer DTOs with public typed properties over complex object graphs
6. For copy-heavy code: understand copy-on-write — avoid modifying arrays that have multiple references
7. For long-running workers: explicitly unset() large variables when no longer needed
8. Benchmark before/after each optimization to measure memory reduction
9. Document the memory-efficient patterns applied

## Validation Checklist

- [ ] Hot-path allocation functions identified
- [ ] Scalar types preferred over compound types in hot paths
- [ ] String concatenation in loops replaced with array+implode
- [ ] SplFixedArray used where appropriate
- [ ] Copy-on-write understood and applied
- [ ] unset() used for large variables in long-running processes
- [ ] Memory reduction measured and documented

## Common Failures

- **Premature optimization**: Optimizing memory for code paths executed once per request in PHP-FPM
- **Ignoring zval types**: Assuming all variables have the same memory cost — scalars are free, compounds are expensive
- **Over-optimizing array access**: Regular PHP arrays are already heavily optimized — SplFixedArray makes sense only for fixed-size numeric data
- **Not measuring**: Memory optimizations should be validated with before/after measurements

## Decision Points

- Scalar types (int, bool): inline in zval, no heap allocation — prefer for flags, counters, simple state
- String types: heap-allocated, 32+ bytes overhead — minimize temporary strings
- Array (HashTable): high overhead per element — prefer SplFixedArray for fixed numeric indices
- Object: 100-500ns allocation + refcount — use sparingly in hot loops

## Performance Considerations

- Scalar operations: 5-15ns per assignment
- String copy: refcount increment only (~5ns) until modification
- Array copy: refcount increment only; full copy O(n) on modification
- Object instantiation: ~100-500ns + heap allocation
- Zend MM allocation: free-list ~10-20ns, mmap ~1-5µs

## Security Considerations

- Heap inspection in Octane: data from previous requests may remain in freed memory
- PHP zeroes freed heap in debug builds but not in production
- Sensitive data in long-running workers should be explicitly cleared

## Related Rules (from 05-rules.md)

- Prefer Scalar Types for Frequently-Accessed Data
- Never Modify Arrays in Foreach by Reference
- Use unset() to Release Memory Early
- Use SplFixedArray for Fixed-Size Arrays

## Related Skills

- Zval Structure and Reference Counting
- Copy-on-Write Mechanics
- Reference Counting and Refcount Lifecycle
- Generators and Yield for Memory Efficiency

## Success Criteria

- Memory model (zval, Zend MM, allocation tiers) understood
- Hot-path memory optimizations applied and measured
- Memory usage reduced by 10-30% on optimized code paths
- Patterns documented for team adoption
