# Array Memory Usage — HashTable Structure, Bucket Overhead, Packed vs Hash Arrays, Memory-Efficient Patterns

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Array Memory Usage — HashTable Structure, Bucket Overhead, Packed vs Hash Arrays, Memory-Efficient Patterns |
| Difficulty | Advanced |
| Last Updated | 2026-06-02 |

## Overview

PHP arrays (`zend_array`/HashTable) are the most versatile but also the most memory-intensive data structure in the language. Each array has a HashTable header, a bucket array, and per-element key storage. PHP 8.x introduced a **packed array** optimization — sequential integer-keyed arrays use a compact C array internally, reducing memory by ~50% compared to hash-indexed arrays. Understanding the packed vs hash distinction, bucket overhead, and memory-efficient array patterns is essential for optimizing memory in data-intensive PHP applications.

## Core Concepts

- **zend_array structure (HashTable)**: `nTableSize` (bucket count, rounded to power of 2), `nNumOfElements`, `nNextFreeElement`, `pListHead` (doubly-linked list pointer), `arBuckets` (pointer to bucket array).
- **Packed array**: Sequential integer keys (0, 1, 2, ...). Stored as a contiguous C array of `zval`s. No key storage, no hash computation. ~50% less memory than hash array.
- **Hash array**: Non-sequential integer keys or string keys. Uses buckets with `nKeySize` and `arKey` (string key storage). Hash computed for each lookup. Higher memory overhead per element.
- **Bucket structure**: Each bucket is 32–40 bytes (depending on key type): `h` (hash value, 8 bytes), `key` (string key pointer or NULL for integer), `val` (zval, 16 bytes), `next` (pointer to next bucket in collision chain).
- **nTableSize rounding**: HashTable capacity is always rounded up to the next power of 2. An array with 1000 elements uses nTableSize = 1024. An array with 1025 elements uses nTableSize = 2048. This causes up to 50% waste at boundary values.
- **Doubly-linked list**: Each array maintains a linked list of its elements in insertion order. Used for `foreach` iteration. Adds 2 pointers (prev/next) per element during iteration state management.

## When To Use

- You are working with large datasets (100K+ elements) in memory.
- You are running in memory-constrained environments.
- You need to optimize array-heavy code paths.
- You are deciding between arrays and SplFixedArray for a specific use case.
- You are debugging high memory usage and want to understand array allocation patterns.

## When NOT To Use

- Your arrays are small (<1000 elements) — the absolute memory savings are negligible.
- You need the full flexibility of PHP arrays (mixed keys, arbitrary key types, dynamic resizing).
- You are optimizing without measuring — array overhead is rarely the primary memory consumer.
- You use PHP-FPM — per-request heap reset makes array memory management less critical.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Use sequential integer keys for large collections | Sequential integer keys trigger the packed array optimization — no key storage, no hash overhead. |
| Use `array_values()` to re-index after filtering | After `unset()` on a packed array, it becomes a hash array (gaps in keys). `array_values()` re-indexes and restores packed mode. |
| Use `SplFixedArray` for large fixed-size collections | SplFixedArray has no HashTable overhead at all — just a C array. For 1M integers: SplFixedArray uses ~16MB, packed array uses ~32MB. |
| Pre-allocate with `array_fill()` when size is known | Pre-allocating prevents repeated resize-rehash cycles as the array grows. Also avoids the power-of-2 waste from incremental growth. |
| Remove unused array elements to free memory | Each element holds a zval (16 bytes) plus potential key storage. Unused elements waste memory and slow iteration. |
| Use `array_slice()` instead of `unset()` on packed arrays | `unset($array[$key])` on a packed array creates a gap, turning it into a hash array. `array_slice()` re-indexes. |
| Use generators instead of arrays for data that's iterated once | Generators don't allocate any array memory. For large datasets, the memory savings are massive. |

## Architecture Guidelines

- **Packed-to-hash transition**: A packed array becomes a hash array when: 1) you set a non-sequential integer key (`$arr[100] = 'x'` after sequentially filling 0–50), 2) you unset an element creating a gap, or 3) you add a string key. Once transitioned, it can't go back without `array_values()`.
- **HashTable bucket overflow**: When load factor exceeds ~70–80%, the HashTable is resized (bucket count doubled). This reallocates all buckets and rehashes all keys. For large arrays, this is an O(n) operation.
- **Memory fragmentation**: HashTable allocation uses Zend MM's segregated storage. Buckets are allocated individually, leading to fragmentation over time. SplFixedArray's contiguous allocation avoids this.
- **Reference-counted values**: Each array element is a zval. For compound types (strings, arrays, objects), the zval holds a pointer to the heap-allocated value. The zval itself is 16 bytes; the value's memory is separate.
- **Array copy on write**: `$b = $a` increments the array's refcount. `$b[] = 'new'` triggers separation — the entire array is duplicated. For a 1M-element array, this duplicates all buckets, keys, and zvals.

## Performance Considerations

- Packed array iteration: ~50% faster than hash array because elements are contiguous in memory (CPU cache-friendly).
- Packed array element access: O(1) direct indexing (pointer arithmetic). Hash array access: O(1) average, O(n) worst-case (hash collision chain).
- Power-of-2 waste: An array with 1025 elements uses 2048 bucket slots — ~50% waste. At 1030 (next power of 2 = 2048), waste is still ~50%. At 2048 elements, waste is 0%.
- HashTable resize cost: ~10µs for a 10K-element array. ~1ms for a 1M-element array. Pre-allocating avoids this cost.
- Memory break-even for SplFixedArray vs packed array: For 10K elements, packed array uses ~320KB (10K × 32 bytes). SplFixedArray uses ~160KB. Break-even is ~5K elements for meaningful savings.

## Security Considerations

- Array key injection: If user input is used as array keys, an attacker could create a hash collision attack (CVE-2011-4885 — PHP 5.3, fixed by seeding the hash function). PHP 8.x uses randomized hash seeding to prevent this.
- Memory exhaustion: An attacker can craft a request that creates a massive array (e.g., via JSON parsing of deeply nested structures). Set `max_input_vars` and `memory_limit` to mitigate.
- Reference leaks in arrays: Arrays holding references to large objects prevent those objects from being freed. Clear arrays explicitly when done.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Using non-sequential keys for large collections | `$arr[1000] = 'a'; $arr[2000] = 'b';` forces hash array mode. | Not knowing about the packed array optimization. | 2× memory usage, slower iteration and access. | Use sequential keys or SplFixedArray. |
| Creating gaps by unsetting elements | `unset($arr[5])` in a packed array creates a gap → transitions to hash. | Not knowing that gaps trigger packed-to-hash transition. | Memory doubles for the remaining elements. | Use `array_values()` after bulk unset to re-index. |
| Not pre-allocating known-size arrays | `for ($i = 0; $i < 10000; $i++) $arr[] = $i;` causes multiple re-allocations. | Not thinking about HashTable resize cost. | ~5–10 resize cycles for 10K elements, each O(n). | Use `$arr = array_fill(0, 10000, null)` or `new SplFixedArray(10000)`. |
| Copying large arrays unnecessarily | `$copy = $original;` then modifying both. | Not knowing that modification triggers full duplication. | Memory doubles (or more if multiple copies are made). | Use references or SplFixedArray for large read-only arrays. |
| Using array functions on packed arrays that return hash arrays | `array_unique()`, `array_diff()`, etc. return arrays that may not be packed. | Not checking return type after array operations. | Unexpected memory usage increase. | Check with `var_dump()` whether the result is packed. Re-index if needed. |

## Anti-Patterns

- **Using arrays as sets**: `$set[$item] = true;` with string keys. Use `SplObjectStorage` (for objects) or sort + binary search for large sets.
- **Incremental array building in loops**: `$arr[] = $value` for millions of items. Consider generators or stream writing for large-scale data processing.
- **Nested loops creating 2D arrays**: 1000 × 1000 nested arrays = 1M elements, ~32MB for a packed array or ~64MB for hash arrays. Use SplFixedArray for known-size 2D data.
- **JSON encoding large in-memory arrays**: `json_encode()` on a large array creates a string representation in memory before output. Use `json_encode()` with `JSON_INVALID_UTF8_SUBSTITUTE` and stream output for large responses.

## Examples

```php
// Packed vs hash array memory
$packed = [0, 1, 2, 3, 4];                      // Packed (sequential int keys)
$hash = [0 => 'a', 100 => 'b', 200 => 'c'];     // Hash (non-sequential int keys)

// Memory comparison for 100K integers
$packed = range(0, 99999);       // ~3.2MB (packed optimization applies)
$hash = [];
for ($i = 0; $i < 100000; $i++) {
    $hash["key_$i"] = $i;       // ~6.4MB (hash — string keys + buckets)
}

// Pre-allocating arrays
$size = 100000;
$array = array_fill(0, $size, null);  // Single allocation, no resize cycles

// Re-indexing after unset
$data = range(0, 10000);
unset($data[5000], $data[5001]);        // Now hash array (gaps)
$data = array_values($data);            // Re-indexed, back to packed
```

## Related Topics

- Efficient Data Structures — SplFixedArray, SplObjectStorage
- String Memory Usage — zend_string structure
- Object Memory Usage — zend_object structure
- Copy-on-Write Mechanics
- Generators and Yield

## AI Agent Notes

- The packed array optimization is PHP 8.x's most impactful memory optimization. Using sequential integer keys automatically enables it — no code changes needed for the 50% memory savings.
- The power-of-2 rounding is a downside: an array with 1025 elements wastes ~50% of its bucket slots because it rounds to 2048. If you know the size, pre-allocate at the next power of 2.
- SplFixedArray is the best choice for truly large collections (>100K elements), large 2D matrices, or when memory is extremely constrained. For most applications, packed arrays are sufficient.
- A common Octane memory leak pattern: accumulating data in a static array across requests. Each request adds entries, and the array grows unbounded. Always size-limit static collections.

## Verification

- [ ] Compare memory: packed array vs hash array with the same number of elements.
- [ ] Compare memory: regular array vs SplFixedArray for 100K integers.
- [ ] Verify packed-to-hash transition: add a non-sequential key and check memory increase.
- [ ] Measure array resize cost: build a 10K-element array incrementally vs pre-allocated.
- [ ] Test `array_values()` restoration of packed mode after unset.
- [ ] Document array patterns used in memory-critical code paths.
