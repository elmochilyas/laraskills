---
## Rule Name

Use SplFixedArray for Large Sequential Integer Collections

## Category

Performance

## Rule

Use `SplFixedArray` for collections with more than 10,000 elements that use sequential integer keys.

## Reason

SplFixedArray uses a contiguous C array with no HashTable overhead. For 1M integers, it uses ~16MB versus ~32MB for a packed PHP array — a 50% memory savings. Iteration is ~20% faster due to CPU cache locality.

## Bad Example

```php
$data = range(1, 1000000);  // ~32MB — packed array
```

## Good Example

```php
$data = new SplFixedArray(1000000);
for ($i = 0; $i < 1000000; $i++) {
    $data[$i] = $i + 1;  // ~16MB — contiguous C array
}
```

## Exceptions

Data that requires string keys, dynamic resizing, or array functions that don't support SplFixedArray.

## Consequences Of Violation

2× memory usage for large datasets, increased CPU cache misses, slower iteration.

---

## Rule Name

Use DTOs Instead of Associative Arrays for Structured Data

## Category

Performance

## Rule

Use typed DTOs (plain objects with typed public properties) instead of associative arrays for structured data transfer.

## Reason

DTOs store properties as direct zval slots (~16 bytes each). Associative arrays store values as HashTable buckets (~40+ bytes including string key allocation). DTOs use ~50% less memory and property access is ~10× faster (direct offset vs hash lookup).

## Bad Example

```php
$user = ['id' => 1, 'name' => 'Alice'];  // ~400+ bytes for 3 properties
```

## Good Example

```php
readonly class UserDTO {
    public function __construct(
        public int $id,
        public string $name,
    ) {}
}
$user = new UserDTO(1, 'Alice');  // ~200 bytes + type safety
```

## Exceptions

Data with truly dynamic keys (not known at design time) or codebases targeting PHP < 8.0.

## Consequences Of Violation

2× memory overhead for data structures, slower property access, no type safety.

---

## Rule Name

Use Generators Instead of Building Large Arrays

## Category

Performance

## Rule

Use generators with `yield` for processing large datasets instead of building arrays in memory.

## Reason

A generator uses O(1) memory (~200 bytes) regardless of how many items it yields. Building an array of 1M items uses ~32MB. For sequential iteration, generators eliminate this memory cost entirely.

## Bad Example

```php
$rows = [];
foreach (getLargeDataset() as $item) {
    $rows[] = process($item);  // 1M items = 32MB array
}
```

## Good Example

```php
function processItems(): Generator {
    foreach (getLargeDataset() as $item) {
        yield process($item);  // O(1) memory
    }
}
foreach (processItems() as $result) {
    // Memory stays flat
}
```

## Exceptions

Data that must be accessed multiple times or in random order (generators are single-pass).

## Consequences Of Violation

OOM for large datasets, high memory pressure, unnecessary garbage collection.

---

## Rule Name

Use SplQueue Instead of array_shift for Queue Operations

## Category

Performance

## Rule

Use `SplQueue` when implementing FIFO queue operations. Never use `array_shift()` on large arrays.

## Reason

`array_shift()` re-indexes all remaining elements — O(n) per call. Processing 100K elements with `array_shift()` is O(n²). `SplQueue` provides O(1) dequeue operations.

## Bad Example

```php
while ($item = array_shift($queue)) {  // O(n) per shift — O(n²) total
    process($item);
}
```

## Good Example

```php
$queue = new SplQueue();
foreach ($items as $item) { $queue->enqueue($item); }
while (!$queue->isEmpty()) {
    process($queue->dequeue());  // O(1) per dequeue
}
```

## Exceptions

Small queues (<100 elements) where the cost difference is negligible.

## Consequences Of Violation

O(n²) runtime for queue processing, significant performance degradation for large queues.

---

## Rule Name

Use SplObjectStorage for Object-Indexed Data

## Category

Performance

## Rule

Use `SplObjectStorage` when storing data indexed by object identity. Never serialize objects to use as array keys.

## Reason

`SplObjectStorage` uses the object's internal ID (integer) as the key — no string serialization, no string key allocation, no hash computation for the key. It is ~30% faster and more memory-efficient than `spl_object_hash()` based array keys.

## Bad Example

```php
$scores = [];
foreach ($users as $user) {
    $scores[spl_object_hash($user)] = computeScore($user);  // String key overhead
}
```

## Good Example

```php
$scores = new SplObjectStorage();
foreach ($users as $user) {
    $scores[$user] = computeScore($user);  // Object ID as key
}
```

## Exceptions

Data that must be serialized or transferred (SplObjectStorage cannot be serialized with objects).

## Consequences Of Violation

Unnecessary string key allocation and hash computation, higher memory usage.

---

## Rule Name

Do Not Prematurely Optimize with Specialized Structures

## Category

Maintainability

## Rule

Use standard PHP arrays for collections under 1000 elements. Adopt specialized structures (SplFixedArray, SplObjectStorage, SplQueue) only when profiling confirms memory pressure.

## Reason

Standard arrays are simpler, more flexible, and support the full range of array functions. For small collections, the memory difference is negligible while the loss of flexibility (no `array_map`, no string keys, no dynamic resizing) adds complexity.

## Bad Example

```php
// SplFixedArray for 50 elements — unnecessary complexity
$items = new SplFixedArray(50);
```

## Good Example

```php
// Standard array for small collections
$items = [];
for ($i = 0; $i < 50; $i++) {
    $items[] = process($i);
}
```

## Exceptions

Memory-constrained environments where every byte matters regardless of collection size.

## Consequences Of Violation

Unnecessary code complexity, reduced flexibility, negligible performance gain for small datasets.
