---
## Rule Name

Prefer Scalar Types Over Compound Types in Hot Paths

## Category

Performance

## Rule

Use scalar types (int, float, bool, null) instead of compound types (string, array, object) in performance-critical loops where possible.

## Reason

Scalar values are stored inline in the 16-byte zval structure — no heap allocation, no refcounting, no copy-on-write overhead. Compound types require heap allocation, refcount manipulation, and CoW separation.

## Bad Example

```php
// Compound type — heap allocation, refcounting
$items = ['1', '2', '3'];
```

## Good Example

```php
// Scalar type — inline storage, no overhead
$items = [1, 2, 3];
```

## Exceptions

Data that must be strings or objects due to domain requirements (e.g., UUIDs, user input, external API payloads).

## Consequences Of Violation

Unnecessary heap allocation and refcount overhead in hot code paths, measurable CPU cost in loops with millions of iterations.

---

## Rule Name

Use SplFixedArray for Large Sequential Data Collections

## Category

Performance

## Rule

Prefer `SplFixedArray` over standard PHP arrays for large (>10K elements) sequential integer-keyed datasets.

## Reason

SplFixedArray uses a contiguous C array with no HashTable overhead — approximately 30–50% less memory than packed arrays and 60–70% less than hash arrays. Iteration is ~20% faster due to CPU cache locality.

## Bad Example

```php
$data = range(1, 1000000);  // ~32MB — packed array with HashTable overhead
```

## Good Example

```php
$data = new SplFixedArray(1000000);
for ($i = 0; $i < 1000000; $i++) {
    $data[$i] = $i + 1;  // ~16MB — contiguous C array
}
```

## Exceptions

Data requiring string keys, dynamic resizing, or array functions (array_map, array_filter) that do not support SplFixedArray natively.

## Consequences Of Violation

2× memory usage for large sequential datasets, unnecessary CPU cache misses from bucket-based storage.

---

## Rule Name

Use Typed Properties to Enable Inline Scalar Storage

## Category

Performance

## Rule

Always declare explicit types on class properties to enable the Zend Engine to use inline scalar storage and eliminate refcount overhead.

## Reason

When a property is typed as `int`, the engine knows the value is a scalar and stores it directly in the zval without heap allocation or refcounting. Untyped properties force the engine to use general-purpose compound handling with refcount overhead.

## Bad Example

```php
public $id;      // Untyped — compound handling
public $count;   // Untyped — refcount overhead
```

## Good Example

```php
public int $id;     // Scalar — inline storage
public int $count;  // Scalar — no refcount
```

## Exceptions

Properties that genuinely hold multiple types at runtime (rare).

## Consequences Of Violation

Unnecessary heap allocation, refcount manipulation, and slower property access for values that could be stored inline.

---

## Rule Name

Prefer implode Over String Concatenation in Loops

## Category

Performance

## Rule

Use `implode()` to build large strings from arrays. Never use `.=` concatenation in loops with more than 100 iterations.

## Reason

Each `.=` concatenation allocates a new zend_string and copies the entire accumulated content — O(n²) time and memory. `implode()` calculates the total length once, allocates once, and copies each part — O(n).

## Bad Example

```php
$result = '';
for ($i = 0; $i < 100000; $i++) {
    $result .= "Line $i\n";  // O(n²) — hundreds of MB in temp allocations
}
```

## Good Example

```php
$parts = [];
for ($i = 0; $i < 100000; $i++) {
    $parts[] = "Line $i";
}
$result = implode("\n", $parts);  // O(n) — single allocation
```

## Exceptions

Small loops (<100 iterations) where the overhead difference is negligible.

## Consequences Of Violation

O(n²) memory allocation and CPU time, frequent GC collections triggering latency spikes, memory_limit fatal errors for large datasets.

---

## Rule Name

Use Sequential Integer Keys to Enable Packed Array Mode

## Category

Performance

## Rule

Always use sequential integer keys for large arrays to enable PHP's packed array optimization.

## Reason

Packed arrays store elements as a contiguous C array of zvals — no key storage, no hash computation, ~50% less memory than hash arrays, and ~50% faster iteration.

## Bad Example

```php
$data[0] = 'a';
$data[100] = 'b';  // Non-sequential — forces hash array mode
```

## Good Example

```php
$data[] = 'a';
$data[] = 'b';     // Sequential — packed array optimization active
```

## Exceptions

Data that inherently requires non-sequential or string keys (configuration maps, lookup tables).

## Consequences Of Violation

2× memory overhead for large arrays, slower access and iteration, increased CPU cache misses.

---

## Rule Name

Use array_values After unset on Packed Arrays

## Category

Performance

## Rule

Always call `array_values()` after bulk `unset()` operations on packed arrays to restore packed mode.

## Reason

`unset()` on a packed array creates gaps in the index sequence, forcing PHP to transition the array from packed mode to hash mode. This doubles memory usage. `array_values()` re-indexes and restores packed mode.

## Bad Example

```php
$data = range(0, 10000);
unset($data[5000], $data[5001]);  // Gaps created → hash array, 2× memory
```

## Good Example

```php
$data = range(0, 10000);
unset($data[5000], $data[5001]);
$data = array_values($data);  // Re-indexed → back to packed mode
```

## Exceptions

When the array is small (<1000 elements) where the memory difference is negligible.

## Consequences Of Violation

Silent 2× memory increase after remove operations, slower iteration on large remaining datasets.
