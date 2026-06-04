# Skill: Optimize Array Memory Usage in Large Datasets

## Purpose

Reduce memory consumption of PHP arrays in data-heavy operations by choosing the right data structure (SplFixedArray, generators, packed arrays) and avoiding HashTable overhead patterns.

## When To Use

- Processing collections > 10,000 records
- Generating reports, CSV exports, or API responses with large datasets
- Profiling shows high memory usage attributed to array allocations
- Octane workers where array memory must not accumulate across requests

## When NOT To Use

- Small arrays (< 1,000 elements) — overhead is not worth complexity
- Code requiring array-specific functions (map, filter, reduce, merge) frequently
- One-off scripts where memory is not constrained

## Prerequisites

- `memory_get_usage(true)` access for measuring
- Profiling output showing array allocation counts
- Understanding of packed vs hash array modes
- PHP 7.3+ for `is_php_array_packed()` check functionality

## Inputs

- Dataset size and structure (numeric vs associative keys)
- Array lifecycle (single-use pipeline vs multi-pass random access)
- Memory profiling data (allocation hotspots)
- Caller requirements (random access, iteration only, random key lookup)

## Workflow (numbered steps)

1. Identify array-heavy code paths via profiling. Look for `zend_array_create`, `zend_array_dup`, or high `memory_get_usage(true)` readings.
2. Determine array characteristics: size, key type (integer vs string), mutability pattern (build-once vs dynamic modification).
3. If the array is large (> 10k) and fixed-size with integer keys: convert to `SplFixedArray` or a pre-allocated `SplFixedArray` + offset access.
4. If the array is large and used in a single-pass pipeline: convert to a Generator (`yield`) to maintain constant memory.
5. If the array accumulates elements in a loop with known size: pre-allocate with `SplFixedArray($knownSize)` instead of `array_push`.
6. If the array has frequent `unset()` creating holes: switch to collecting keys and rebuilding, or convert to array_values() after modifications.
7. For associative arrays used as DTOs: convert to typed readonly classes. Each string key is stored as a full zend_string — typed properties eliminate key storage entirely.
8. Measure memory before and after each change using `memory_get_usage(true)` around the specific code path.
9. Document the chosen data structure and the rationale for future maintainers.

## Validation Checklist

- [ ] Array-heavy code path identified via profiling
- [ ] Large fixed-size integer arrays converted to SplFixedArray
- [ ] Single-pass pipelines converted to generators
- [ ] No unnecessary array intermediates in hot loops
- [ ] Associative DTOs converted to typed classes where applicable
- [ ] Before/after memory measurements documented
- [ ] Memory reduced by at least 30% on optimized paths

## Common Failures

- **Converting to SplFixedArray then using array functions**: SplFixedArray does not implement array_map, array_filter, etc. Converting back to plain array for one operation defeats the purpose.
- **Generating data twice**: A generator yields once — if the caller needs two passes (count + iterate), collect to array or use a shared buffer.
- **Premature SplFixedArray for small data**: Overhead of SplFixedArray for 100 elements is the same as plain array. Only switch at scale.
- **Forgetting about serialization**: SplFixedArray serializes differently than plain arrays. If you cache or session-store the data, verify serialization behavior.

## Decision Points

- Array size < 1,000 → Plain array. Overhead is negligible.
- Array size 1,000 - 10,000 → Packed array (integer keys). Only optimize if profiler shows it as a hotspot.
- Array size > 10,000, integer keys → SplFixedArray or generator.
- Array size > 10,000, associative keys → Consider DTO conversion or database aggregation.
- Single-pass → Generator. Memory constant regardless of dataset size.
- Multi-pass → SplFixedArray or packed array. Must hold all data in memory.

## Performance Considerations

- SplFixedArray memory: 16 bytes per element (zval pointer) vs ~56 bytes per element (packed array bucket) = 3.5× savings.
- Generator memory: 56 bytes for the Generator object + 16 bytes per yielded item (while alive). Peak memory is the largest single item, not the sum.
- HashTable resize spike: temporarily doubles memory. Pre-allocating avoids this.
- Packed array iteration: ~20ns/element. Hash array iteration: ~35ns/element (hash lookup per key).

## Security Considerations

- Deserializing user-supplied JSON into large arrays can exhaust memory. Limit payload size at the HTTP boundary.
- Generating arrays from user input without size limits is a DoS vector. Cap collection sizes in application logic.
- Cached arrays containing sensitive data persist in memory longer than request-scoped arrays. Clear sensitive caches after use.

## Related Rules (from 05-rules.md)

- Never load full Eloquent result sets into arrays
- Use SplFixedArray for known-size indexed collections over 10k elements
- Reindex arrays after destructive unset() operations
- Use generators over intermediate arrays for data pipelines

## Related Skills

- Array Memory Usage Patterns
- Generators and Yield for Memory Efficiency
- Eloquent Chunking and Lazy Collections
- Object Memory Usage

## Success Criteria

- Memory consumption reduced by > 30% on optimized array paths
- All large collections (> 10k) use SplFixedArray or generators
- No HashTable resize spikes in critical paths
- Data structure choices documented in code comments
