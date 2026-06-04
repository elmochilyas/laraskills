# Array Memory Overhead

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Array Memory Overhead |
| Difficulty | Intermediate |
| Last Updated | 2026-06-04 |

## Overview

PHP arrays are not simple lists — they are ordered hash maps (HashTables) with significant memory overhead per element. Each entry in a regular PHP array carries a zval (16 bytes), a bucket structure (~36 bytes), and hash table metadata. This means a 10,000-element integer array uses 5-10× more memory than the raw data would suggest. SplFixedArray uses a contiguous C array internally, reducing overhead to ~10% over the raw data. Understanding array memory overhead is critical for applications handling large in-memory datasets: API responses, report generation, CSV processing, and Eloquent collection operations.

## Core Concepts

- **zend_array (HashTable)**: Interned structure with `nTableSize` (power-of-2 bucket count), `nNumOfElements`, `arBuckets` (pointer array), and `arData` (packed or hash-ordered bucket slots).
- **Per-element overhead**: Each element stores a zval (16 bytes) + bucket metadata (~36 bytes for hash order, ~8 bytes for packed) + key storage for associative arrays.
- **Packed arrays**: Integer-indexed arrays with contiguous 0-based keys use a packed layout — no hash lookup needed. Still have zval overhead but no per-key storage.
- **SplFixedArray**: C array of zvals — fixed size, no hash table, no bucket overhead. Each element is exactly 16 bytes (zval pointer).
- **Memory doubling**: When a HashTable runs out of slots, it doubles its bucket count (power of 2) and rehashes all entries. This temporarily doubles memory for the resize operation.
- **Unset holes**: `unset()` on a middle element creates a hole in the HashTable. Holes are not reclaimed until the array is rehashed.

## When To Use

- Applications handling datasets > 10,000 elements in memory (reports, exports, batch processing).
- API response formatting where large collections are transformed in memory.
- Eloquent chunking / lazy collections where intermediate arrays accumulate.
- Octane workers where array memory persists across requests (cache data, configuration).
- Statistical computations (analytics dashboards, aggregations) on in-memory arrays.

## When NOT To Use

- Small arrays (< 1000 elements) — overhead is negligible.
- Code where SplFixedArray's limited API (no array_map, no push/pop) would force conversions.
- Quick scripts or one-off data processing where array convenience is more important than memory.
- Associative-key-dominated data where the hash map is the correct structure.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Use SplFixedArray for > 10,000 indexed elements | SplFixedArray eliminates bucket overhead, saving 30-50% memory for large fixed-size collections. |
| Avoid unset() in the middle of large arrays | Creating holes prevents packed layout, forcing hash-based lookup and wasting slots. Use array_splice or filter-and-reindex. |
| Prefer packed arrays (contiguous 0-based integer keys) | Packed arrays use less memory and O(1) indexed access. Non-contiguous or string keys trigger hash mode. |
| Use array_values() after heavy unset() operations | Re-indexes the array back to packed layout, reclaiming hole overhead. |
| Use generators instead of intermediate arrays | A generator yields values one at a time — no array memory allocated for intermediate results. |

## Architecture Guidelines

- **Large collection handling**: Load data in chunks (Eloquent chunk() or lazy collections) and process each chunk independently. Never load 100k Eloquent models into a single array.
- **API resource formatting**: Use API Resources or Fractal transformers that iterate a cursor/generator instead of building a full array response in memory.
- **Cache storage**: Store serialized SplFixedArray (or a Generator-sourced collection) in cache instead of re-building large arrays on every request.
- **CSV/Excel export**: Stream rows directly to output — never build the full 100k-row array in memory.
- **Data pipeline transformation**: Use `LazyCollection` (Laravel) to chain transformations without intermediate arrays.

## Performance Considerations

- Packed array (10,000 integers): ~160KB for zvals + ~80KB bucket overhead = ~240KB.
- Hash array (10,000 string keys): ~160KB for zvals + ~280KB bucket+key overhead = ~440KB.
- SplFixedArray (10,000 integers): ~160KB total — no bucket overhead.
- HashTable resize: When size reaches capacity, resize doubles memory (2× current allocation) temporarily.
- foreach iteration on packed array: ~20ns per element. foreach on hash array: ~35ns per element (hash lookup overhead).
- Copy-on-write of large arrays: Only refcount inc (~5ns) until the array is modified. Full array copy is O(n).

## Security Considerations

- Unvalidated input that deserializes into a large array (e.g., JSON with deeply nested arrays) can exhaust memory. Always limit input size at the deserialization boundary.
- Array injection via malformed serialized data: PHP's `unserialize()` with large array structures is a known DoS vector. Use `max_depth` and `allowed_classes` restrictions.
- Sensitive data in cached arrays: If an array containing PII is cached, its memory is retained until evicted. Ensure cache keys for large arrays are properly scoped and expire.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Building the entire collection in memory | Loading 100k Eloquent models into an array for iteration or transformation. | Habit of using `Model::all()` or `get()` without chunking. | Memory usage spikes to 100s of MB, OOM on constrained hosts. | Use `chunk()`, `cursor()`, or `LazyCollection`. |
| Modifying arrays inside foreach with unset() | `unset($array[$key])` in a loop creates many holes. | Not understanding packed vs hash array layout. | Array performance degrades from packed to hash mode. | Collect keys to remove, then use `array_diff_key()` or rebuild. |
| Not choosing SplFixedArray for known fixed-size data | Using `range(0, 50000)` where the size is known and fixed. | Familiarity with array API, not considering alternatives. | 2-3× memory for the dataset than necessary. | Use `SplFixedArray::fromArray()`. |

## Anti-Patterns

- **Array as DTO**: Using associative arrays as ad-hoc data transfer objects instead of typed DTOs. Each string key is stored separately — overhead grows per field.
- **Nested array explosion**: Loading deeply nested relationships into arrays without limiting depth. Each nesting level multiplies memory via HashTable overhead.
- **Caching entire large arrays**: Storing a 500KB array in Redis/cache is fine; storing a 50MB array in local memory (file cache, APCu) exhausts PHP memory.
- **json_encode on massive arrays**: Encoding a 100MB array to JSON requires ~200MB peak (array + JSON string). Stream encode or chunk the data.

## Examples

```php
<?php
// Prefer SplFixedArray for large fixed-size data
$size = 50000;
$start = memory_get_usage();

$plain = range(1, $size);
echo 'Plain array: ' . (memory_get_usage() - $start) . ' bytes';
unset($plain);

$start = memory_get_usage();
$fixed = SplFixedArray::fromArray(range(1, $size));
echo 'SplFixedArray: ' . (memory_get_usage() - $start) . ' bytes';
```

```php
<?php
// Streaming CSV export — no full array in memory
$stream = fopen('php://output', 'w');
User::cursor()->each(function (User $user) use ($stream) {
    fputcsv($stream, [$user->id, $user->name, $user->email]);
});
fclose($stream);
```

## Related Topics

- **Prerequisites**: PHP Memory Model, Zval Structure, Copy-on-Write Mechanics
- **Closely Related**: Array Memory Usage, SplFixedArray Patterns, Generators and Yield
- **Advanced Follow-Up**: Object Memory Usage, String Memory Usage
- **Cross-Domain Connections**: Eloquent Chunking/Lazy Collections, API Resource Optimization

## AI Agent Notes

- The most impactful memory optimization for Laravel apps is not switching to SplFixedArray — it is avoiding loading all rows into memory in the first place. Always chunk, cursor, or stream.
- SplFixedArray has a surprising limitation: it cannot be serialized with `var_export()`. Use `serialize()` or convert to/from array for cache storage.
- Array resizing (doubling) is the hidden memory spike. A 65,536-element array that resizes jumps to 131,072 capacity, using twice the memory temporarily. Pre-allocate with `SplFixedArray($size)` when the size is known.
- Eloquent collections (`Collection` class) use plain arrays internally. When processing millions of records, `.cursor()` (generator) or raw DB queries with chunking bypass collection overhead entirely.
