## Profile refcount overhead before optimizing
---
Category: Performance
---
Only apply refcount-specific optimizations when a profiler confirms `zend_refcount_inc` or `zend_refcount_del` appear in the top 10 functions by CPU time.
---
Reason: Refcount ops are ~5ns each. Optimizing without data risks maintainability cost for zero gain.
---
Bad Example:
```php
// Premature: passing by reference everywhere
function process(array &$data): void { ... } // Mutation risk for no proven gain
```

Good Example:
```php
// Profile first; only optimize if profiler confirms refcount bottleneck
// Profiler shows 3% CPU in zend_refcount_del → optimize the specific loop
```
---
Exceptions: Code executed > 1M times per request (e.g., template rendering engine).
---
Consequences Of Violation: Fragile, mutation-prone code with no measurable performance improvement.

## Use readonly typed properties to eliminate write barriers
---
Category: Performance
---
Declare DTOs and value objects as `readonly class` with public typed properties when their values are set once and never modified.
---
Reason: Readonly properties bypass the write barrier (PHP 7.4+ GC protection), removing ~2ns overhead per write. This compounds across object graphs.
---
Bad Example:
```php
class UserDTO {
    public function __construct(
        public string $name, // Write barrier active
        public int $age,     // Write barrier active
    ) {}
}
```

Good Example:
```php
readonly class UserDTO {
    public function __construct(
        public string $name, // No write barrier
        public int $age,     // No write barrier
    ) {}
}
```
---
Exceptions: Objects whose properties must be modified after construction.
---
Consequences Of Violation: 2ns overhead per property write across the object lifecycle.

## Prefer SplFixedArray over plain arrays for fixed-size indexed collections
---
Category: Performance
---
Use `SplFixedArray` when working with numerically-indexed, fixed-size datasets where array-specific functions (array_map, array_filter) are not needed.
---
Reason: SplFixedArray stores values in a contiguous C array, eliminating per-bucket zval overhead and refcount tracking from the hash table structure.
---
Bad Example:
```php
$points = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // HashTable overhead
```

Good Example:
```php
$points = SplFixedArray::fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
```
---
Exceptions: Collections requiring associative keys, dynamic resizing, or array functions.
---
Consequences Of Violation: 30-50% higher memory usage and refcount overhead for fixed-size collections.

## Minimize function calls in hot loops to reduce refcount churn
---
Category: Performance
---
In performance-critical loops with 10,000+ iterations, inline logic or use generators to reduce the refcount overhead of function call arguments and returns.
---
Reason: Each function call incs refcount for every argument and decs on return. For 10k iterations × 3 arguments = 60k refcount ops = ~0.3ms overhead.
---
Bad Example:
```php
for ($i = 0; $i < 10000; $i++) {
    $result[] = transform($items[$i]); // 30k refcount ops from call/return
}
```

Good Example:
```php
foreach ($items as &$item) {
    $item = strtoupper($item); // Inline, zero extra refcount ops
}
```
---
Exceptions: Code clarity and maintainability concerns override this for non-hot paths (< 1000 iterations).
---
Consequences Of Violation: Up to 1-2ms of avoidable refcount overhead per request in array-heavy hot paths.
