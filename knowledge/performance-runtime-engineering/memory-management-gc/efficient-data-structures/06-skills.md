# Skill: Select and Implement Memory-Efficient Data Structures

## Purpose

Choose the optimal PHP data structure (array, SplFixedArray, SplObjectStorage, SplHeap, generator) for each use case based on memory and access pattern requirements.

## When To Use

- Working with large datasets (>100K elements)
- Profiling shows high memory usage from data structures
- Optimizing Octane workers where memory accumulates across requests
- Batch processing jobs that iterate over millions of records

## When NOT To Use

- For typical web requests with small datasets (<1000 elements) — overhead of special structures may exceed benefit
- When readability and maintainability outweigh the memory savings
- Without first profiling to confirm data structures are a significant memory consumer

## Prerequisites

- Understanding of PHP's built-in array implementation (HashTable)
- Knowledge of the data access patterns (sequential, random, key-value, unique values)
- Profiling showing data structure memory usage

## Inputs

- Dataset size (element count and per-element size)
- Access patterns (sequential read, random access, key lookup, iteration with modification)
- Uniqueness requirements (unique keys, unique values, duplicates allowed)
- Memory constraints

## Workflow (numbered steps)

1. Profile the current data structure usage: measure memory of the largest arrays/objects in the application
2. Check access pattern: sequential, random access, key-value lookup, or set membership
3. For sequential numeric arrays without modification: replace with SplFixedArray (30-50% memory savings)
4. For object-keyed maps: replace associative array with SplObjectStorage
5. For priority queue operations: use SplPriorityQueue instead of sorting arrays
6. For unique value sets: use SplObjectStorage or array keys (not array values with in_array())
7. For large datasets that need non-blocking iteration: use generators to yield one element at a time
8. For string-keyed lookup tables: regular arrays (HashTable) are optimal — SplFixedArray does not support string keys
9. Benchmark memory before and after data structure changes
10. Document the selected structures and the rationale

## Validation Checklist

- [ ] Current largest data structures identified
- [ ] Access pattern determined for each
- [ ] SplFixedArray applied for fixed-size numeric arrays
- [ ] SplObjectStorage applied for object-keyed maps
- [ ] Generators used for large dataset iteration
- [ ] Memory reduction measured and documented
- [ ] Data structure documentation created

## Common Failures

- **Using SplFixedArray for associative arrays**: SplFixedArray only supports numeric indices — use for sequential-only data
- **Using SplObjectStorage for string-keyed maps**: SplObjectStorage uses objects as keys — use regular arrays for strings
- **Over-optimizing small structures**: Converting a 100-element array to SplFixedArray saves ~1KB — not worth the code complexity
- **Not considering generators**: Loading 100K database rows into an array consumes 10-50MB — use generators to stream results

## Decision Points

- Sequential numeric data, known size: SplFixedArray
- Sequential numeric data, unknown or growing size: array (SplFixedArray is fixed-size)
- Object-keyed mapping: SplObjectStorage
- Unique object set: SplObjectStorage
- String-keyed mapping: regular array (HashTable)
- Priority queue: SplPriorityQueue
- Large dataset streaming: Generator (yield)

## Performance Considerations

- Regular array (HashTable): flexible but 30-50% more memory than SplFixedArray for numeric data
- SplFixedArray: contiguous C array, lower memory, faster sequential access, fixed size
- SplObjectStorage: O(1) lookup by object identity, efficient for object-keyed maps
- Generators: O(1) memory — only one element in memory at a time
- SplPriorityQueue: O(log n) insertion/extraction vs O(n log n) for array sort

## Security Considerations

- Data structures do not have direct security implications
- Large datasets in memory may include sensitive data — ensure proper cleanup after processing
- Generators that yield database rows must handle connection timeouts gracefully

## Related Rules (from 05-rules.md)

- Use SplFixedArray for Fixed-Size Arrays
- Use Generators for Large Dataset Processing
- Prefer Scalar Types for Frequently-Accessed Data

## Related Skills

- PHP Memory Model
- Array Memory Usage Analysis
- Generators and Yield for Memory Efficiency
- Object Memory Usage Analysis

## Success Criteria

- Memory-efficient data structures selected for each use case
- Memory usage reduced by 30-50% for targeted structures
- Access patterns match structure capabilities
- Large datasets processed with generators to limit memory
- Data structure choices documented
