## Prefer scalar types for frequently-accessed data
---
Category: Performance
---
Use scalar types (int, float, bool) for hot-path data instead of strings, arrays, or objects whenever possible.
---
Reason: Scalars are stored inline in the 16-byte zval structure — no heap allocation, no refcount manipulation. Strings, arrays, and objects require pointer-based heap allocation, refcount management, and dereferencing overhead.
---
Bad Example:
```php
// String-based flag — heap allocation and refcount
public string $status = 'active'; // zend_string allocation
```

Good Example:
```php
// Integer flag — inline in zval, no allocation
public int $status = 1; // 16 bytes, no heap
```
---
Exceptions: Application-level readability and maintainability concerns override this micro-optimization for non-hot paths.
---
Consequences Of Violation: 5-100x more memory for hot-path data, unnecessary allocation overhead.

## Never modify arrays in foreach by reference — use indexes
---
Category: Performance
---
Avoid `foreach ($array as &$value)` patterns. Use indexes (`for` with `$i`) when modifying array values in place.
---
Reason: Using references in foreach causes the array to trigger copy-on-write duplication on the next write after the loop. Memory doubles on the first modification after the loop ends.
---
Bad Example:
```php
foreach ($array as &$value) {
    $value = strtoupper($value); // Reference modifies in place
}
// Next write to $array elsewhere duplicates entire array
```

Good Example:
```php
foreach ($array as $key => $value) {
    $array[$key] = strtoupper($value); // Direct index modification
}
```
---
Exceptions: Single-use arrays that are not modified after the foreach loop.
---
Consequences Of Violation: Memory doubles unexpectedly, unexplained high memory usage after loop exit.

## Use unset() to release memory early in long-running processes
---
Category: Performance
---
Call unset() on large variables when they are no longer needed, especially in Octane/Swoole workers.
---
Reason: In persistent workers, variables persist until they go out of scope. unset() decrements refcounts immediately, enabling earlier garbage collection and preventing memory accumulation across requests.
---
Bad Example:
```php
function processBatch() {
    $largeDataset = $this->loadHugeDataset(); // Persists until function end
    $result = $this->compute($largeDataset);
    // $largeDataset still in scope
}
```

Good Example:
```php
function processBatch() {
    $largeDataset = $this->loadHugeDataset();
    $result = $this->compute($largeDataset);
    unset($largeDataset); // Release memory immediately
}
```
---
Exceptions: PHP-FPM where memory is freed at request end naturally.
---
Consequences Of Violation: Memory holds large data longer than necessary, increasing peak RSS.

## Use SplFixedArray for fixed-size arrays to reduce memory overhead
---
Category: Performance
---
Replace regular PHP arrays with SplFixedArray when working with fixed-size, numerically-indexed datasets.
---
Reason: SplFixedArray uses a contiguous C array internally instead of PHP's zend_array (HashTable). This eliminates hash table bucket overhead and provides faster sequential access for known-size data.
---
Bad Example:
```php
$data = range(1, 10000); // HashTable overhead for sequential integers
```

Good Example:
```php
$data = SplFixedArray::fromArray(range(1, 10000)); // Contiguous C array
```
---
Exceptions: Arrays requiring associative keys, dynamic resizing, or array-specific functions (array_map, array_filter).
---
Consequences Of Violation: 30-50% higher memory usage for fixed-size sequential data than necessary.
