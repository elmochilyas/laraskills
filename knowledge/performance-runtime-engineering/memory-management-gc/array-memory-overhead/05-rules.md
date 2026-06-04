## Never load full Eloquent result sets into arrays
---
Category: Performance
---
Use `chunk()`, `cursor()`, or `LazyCollection` instead of `get()` or `all()` when processing datasets larger than 1,000 records.
---
Reason: Eloquent models are objects — each has zval overhead + property heap allocations. Loading 10,000 models into an array uses 50-200MB memory.
---
Bad Example:
```php
$users = User::all(); // 50k users → heavy memory
foreach ($users as $user) { ... }
```

Good Example:
```php
User::chunk(1000, function ($users) {
    foreach ($users as $user) { ... }
}); // Max 1000 models in memory at once
```
---
Exceptions: Operations requiring random access to the full dataset (e.g., multi-pass aggregation).
---
Consequences Of Violation: OOM on large datasets, unnecessary memory pressure on small ones.

## Use SplFixedArray for known-size indexed collections over 10k elements
---
Category: Performance
---
Replace `range()` and `array_fill()` with `SplFixedArray` when the size is predetermined and elements are numerically indexed.
---
Reason: SplFixedArray uses contiguous C array storage without HashTable bucket overhead — 30-50% less memory for the same data.
---
Bad Example:
```php
$indices = range(0, 49999); // HashTable overhead
```

Good Example:
```php
$indices = SplFixedArray::fromArray(range(0, 49999));
```
---
Exceptions: Arrays requiring associative keys, dynamic resizing, or array functions (map, filter, reduce).
---
Consequences Of Violation: 2-3× memory consumption for large fixed-size collections.

## Reindex arrays after destructive unset() operations
---
Category: Performance
---
Call `array_values()` on an array that has had elements removed via `unset()` in non-sequential order.
---
Reason: `unset()` creates holes in packed arrays, converting them to hash mode and degrading access speed. `array_values()` rebuilds packed layout.
---
Bad Example:
```php
unset($items[3]); // Creates hole
unset($items[7]); // More holes — array is now hash mode
```

Good Example:
```php
unset($items[3]);
unset($items[7]);
$items = array_values($items); // Rebuild as packed array
```
---
Exceptions: Small arrays (< 100 elements) where hash mode overhead is negligible.
---
Consequences Of Violation: Array access degrades from O(1) (packed) to O(n) worst-case (hash collision chains).

## Use generators over intermediate arrays for data pipelines
---
Category: Architecture
---
Return a `Generator` (using `yield`) instead of building and returning a full array when producing a sequence of values.
---
Reason: Generators produce one value at a time, consuming memory only for the current item. Array pipelines allocate memory for all items simultaneously.
---
Bad Example:
```php
function getReportData(): array {
    $data = [];
    foreach ($source as $row) {
        $data[] = transform($row); // Full array in memory
    }
    return $data;
}
```

Good Example:
```php
function getReportData(): Generator {
    foreach ($source as $row) {
        yield transform($row); // One item at a time
    }
}
```
---
Exceptions: When the caller needs random access or multiple passes over the data.
---
Consequences Of Violation: Memory usage proportional to dataset size instead of constant.
