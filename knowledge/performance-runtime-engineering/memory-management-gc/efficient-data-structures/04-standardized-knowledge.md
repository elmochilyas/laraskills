# Efficient Data Structures — SplFixedArray, SplObjectStorage, DTOs, Memory-Efficient Collection Patterns

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Efficient Data Structures — SplFixedArray, SplObjectStorage, DTOs, Memory-Efficient Collection Patterns |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

PHP's standard array (`zend_array`/HashTable) is flexible but memory-inefficient for fixed-size or homogeneous data. Specialized data structures like `SplFixedArray`, `SplObjectStorage`, and plain-old-PHP-objects (POPOs/DTOs) can reduce memory usage by 30–80% in specific use cases. Choosing the right data structure for the job — considering access patterns, mutability, and cardinality — is a key memory optimization technique, especially in memory-constrained environments (containers, Octane workers) or data-intensive workloads.

## Core Concepts

- **SplFixedArray**: Uses a C array internally — dense, contiguous memory. No HashTable overhead. Fixed size (can be resized, but not dynamically). 30–50% less memory than regular arrays for large collections.
- **SplObjectStorage**: Maps objects to data. Uses object identity (spl_object_id) rather than hashing string keys. More memory-efficient than using objects as array keys.
- **SplMinHeap / SplMaxHeap / SplPriorityQueue**: Heap data structures for ordered processing. Lower overhead than maintaining sorted arrays.
- **SplDoublyLinkedList / SplStack / SplQueue**: Linked list structures. Efficient for insertion/removal at ends. Higher per-element overhead than arrays.
- **DTOs / POPOs**: Plain objects with typed public properties. Less memory overhead than arrays with string keys. Each property access is direct (no hash lookup).
- **SplFixedArray vs array**: `new SplFixedArray(1000000)` uses ~16MB. `array_fill(0, 1000000, null)` uses ~32MB (HashTable bucket overhead).
- **Generators**: Yield values on-demand instead of building arrays. Memory usage is O(1) regardless of dataset size.

## When To Use

- You are working with large datasets (100K+ elements) where memory matters.
- You are running in memory-constrained environments (containers with 128–512MB limits).
- You have Octane/Swoole workers where memory accumulates across requests.
- You are processing large CSV, JSON, or log files.
- You need ordered collections with specific access patterns (LIFO, FIFO, priority).
- You are building data-intensive APIs or batch processing jobs.

## When NOT To Use

- Your datasets are small (<1000 elements) — overhead differences are negligible.
- You need the full HashTable feature set (string keys, dynamic resizing, arbitrary key types).
- You don't have measured memory pressure. Premature optimization adds complexity without benefit.
- You are using PHP-FPM with small requests — memory resets per request.
- Readability and maintainability matter more than memory in the specific code path.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Use `SplFixedArray` for large, fixed-size numeric-indexed collections | Eliminates HashTable bucket overhead (8 bytes per bucket). Saves 30–50% memory for large arrays. |
| Use `SplObjectStorage` when mapping objects to data | Uses object identity (integer) for keys instead of serializing objects as strings. More memory-efficient and faster. |
| Use DTOs with typed properties instead of associative arrays | Array access requires hash lookup. Property access is direct offset → faster and lower memory. Promotes type safety. |
| Use generators for large datasets that are processed once | Generator uses O(1) memory regardless of iteration count. `range(1, 1000000)` creates a 32MB array; a generator uses 1KB. |
| Use `yield` instead of `array_push` in loops | Building arrays incrementally allocates growing memory. Yielding returns values one at a time. |
| Use `SplQueue` and `SplStack` for LIFO/FIFO patterns | More memory-efficient than using `array_shift()` (which re-indexes the entire array) or `array_pop()`. |
| Pre-allocate with `SplFixedArray::fromArray()` for known-size conversions | Converting a regular array to SplFixedArray after building it still incurs the overhead. Use SplFixedArray from the start. |

## Architecture Guidelines

- **Array vs SplFixedArray memory**: PHP arrays store elements in buckets within a HashTable. Each bucket has overhead for the key, hash, and pointer. SplFixedArray stores elements in a contiguous C array — one pointer per element, no key storage, no hash.
- **DTO heap allocation**: Each DTO instance is a zend_object with a vtable pointer and property slots. For 10 properties, a DTO uses ~200 bytes (object header + 10 zval slots). An equivalent array uses ~400+ bytes (HashTable + 10 buckets + 10 string keys).
- **Generator memory**: A generator function's internal state is stored in a single `Generator` object (~200 bytes). Each `yield` pauses execution without holding all values in memory. For iterating a 1M-row CSV, the generator uses ~200 bytes instead of ~200MB.
- **SplObjectStorage internals**: Stores objects in a hash table keyed by object ID (an integer). No string key allocation. Object insertion is O(1) amortized. Retrieval is O(1).
- **SplFixedArray resizing**: `setSize()` reallocates the internal C array. O(n) operation. Avoid frequent resizing — set the final size once.

## Performance Considerations

- `SplFixedArray` iteration: ~20% faster than regular array (no hash lookup, contiguous memory → CPU cache friendly).
- `SplFixedArray` access: O(1) direct pointer arithmetic. Regular array: O(1) hash lookup (hashing function + bucket traversal).
- `SplObjectStorage` access: ~30% faster than associative array with object keys.
- DTO property access: direct offset read (~5ns). Associative array access: hash + bucket walk (~50–100ns).
- Generator overhead: ~200ns per yield iteration. Higher per-element cost than array iteration but zero upfront memory allocation.
- SplQueue/SplStack: O(1) enqueue/dequeue. `array_shift()`: O(n) (re-indexes all elements).
- Memory fragmentation: SplFixedArray's contiguous allocation reduces fragmentation compared to HashTable's bucket-based allocation.

## Security Considerations

- SplFixedArray bounds checking: accessing an out-of-bounds index throws `RuntimeException`. Always validate indexes before access.
- SplObjectStorage: stored objects are held as hard references — they won't be GC'd while in storage. Clear storage when objects are no longer needed.
- Generator state: a Generator object holds a reference to the current execution state. If not freed, it can leak memory. Always allow generators to complete or explicitly close them.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Using `SplFixedArray` for string-keyed data | SplFixedArray only supports integer indexes. | Not understanding the data structure's constraints. | Runtime error or implicit conversion to regular array. | Use arrays for string keys. Use SplFixedArray only for numeric indexes. |
| Creating large arrays in loops | `$items[] = $value` inside a loop that runs 1M+ times. | Not considering memory accumulation. | Array grows to 100s of MB, eventually hitting memory_limit. | Use generators (yield) or write to a stream. |
| Using `array_shift()` on large arrays | `array_shift()` re-indexes all remaining elements — O(n) per call. | Using arrays as FIFO queues with shift/pop. | Processing 100K elements takes O(n²) time. | Use SplQueue for FIFO operations. |
| Not sizing SplFixedArray upfront | `setSize()` on every iteration or small incremental resizes. | Not knowing the final size at creation. | Repeated O(n) reallocations. | Collect data first or estimate the final size. |
| Holding large data in memory longer than needed | Loading entire file into array, processing, then freeing. | Convenience of array access. | Memory peaks at file size even if data is processed sequentially. | Use generators or streaming. |

## Anti-Patterns

- **Using objects when arrays suffice**: Creating complex object hierarchies for simple data storage. A simple associative array may be more memory-efficient than 10,000 DTO instances.
- **Array-as-queue with shift**: `array_shift()` on a 100K-element array forces PHP to re-index all elements. Always use SplQueue for queue semantics.
- **String-keyed arrays for machine-generated data**: If keys are sequential integers generated by code, use integer keys. String keys are only useful for human-readable data.
- **Premature optimization with SplFixedArray**: Using SplFixedArray for small collections (<1000 elements) adds negligible benefit and reduces flexibility. Measure first.

## Examples

```php
// SplFixedArray for large fixed-size collection
$count = 1000000;
$array = new SplFixedArray($count);
for ($i = 0; $i < $count; $i++) {
    $array[$i] = processItem($i);
}
// Memory: ~16MB for 1M integers

// Generator for sequential processing
function processItems(iterable $source): Generator {
    foreach ($source as $item) {
        yield expensiveOperation($item);
    }
}
foreach (processItems(getLargeDataset()) as $result) {
    // Memory: O(1)
}

// SplObjectStorage for object-indexed data
$storage = new SplObjectStorage();
foreach ($users as $user) {
    $storage[$user] = calculateScore($user);
}
// Memory: object ID → integer keys, no string allocation

// DTO vs associative array
// Array: $data = ['id' => 1, 'name' => 'Alice', 'email' => 'alice@example.com'];
// DTO:
class UserDTO {
    public int $id;
    public string $name;
    public string $email;
}
// DTO uses ~60% less memory and access is ~10× faster
```

## Related Topics

- Generators and Yield — Memory-efficient iteration
- String Memory Usage
- Array Memory Usage
- Object Memory Usage
- Copy-on-Write Mechanics

## AI Agent Notes

- SplFixedArray is the single most impactful data structure for memory reduction. A 1M-element SplFixedArray uses ~16MB vs ~32MB for a regular array — a 50% savings.
- Generators are the best tool for memory-constrained data processing. They trade a small per-iteration overhead for massive memory savings.
- DTOs are the modern PHP pattern for API responses. Laravel's Spatie DTO, native readonly classes (PHP 8.1+), and PHP 8.4's property hooks all support DTO-based memory optimization.
- For most web applications (>90%), standard arrays are fine. Reach for specialized structures only when you have measured memory pressure.

## Verification

- [ ] Compare memory of SplFixedArray vs regular array for 100K elements.
- [ ] Benchmark SplFixedArray iteration vs regular array iteration.
- [ ] Measure generator memory: process 100K records with array vs generator.
- [ ] Compare memory of DTO vs associative array with the same data.
- [ ] Test SplObjectStorage with 10K objects vs associative array with spl_object_hash.
- [ ] Verify SplQueue performance for 10K FIFO operations vs array_shift.
- [ ] Document the data structure choices in memory-critical code paths.
