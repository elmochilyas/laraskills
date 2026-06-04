---
## Rule Name

Use Sequential Integer Keys for Packed Array Optimization

## Category

Performance

## Rule

Always use sequential integer keys (0, 1, 2, ...) for large arrays to enable PHP's packed array mode.

## Reason

Packed arrays store elements as a contiguous C array of zvals with no key storage and no hash overhead — ~50% less memory than hash arrays and ~50% faster iteration. Non-sequential or string keys force hash mode.

## Bad Example

```php
$data[0] = 'a';
$data[100] = 'b';  // Non-sequential — forces hash array (2× memory)
```

## Good Example

```php
$data[] = 'a';
$data[] = 'b';     // Sequential — packed array optimization active
```

## Exceptions

Data requiring string keys (configuration maps, lookup tables).

## Consequences Of Violation

2× memory overhead, slower access and iteration, increased CPU cache misses.

---

## Rule Name

Use array_values After Bulk unset

## Category

Performance

## Rule

Call `array_values()` after bulk `unset()` operations on packed arrays to restore packed mode.

## Reason

`unset()` on a packed array creates gaps, forcing a transition to hash mode. This doubles memory usage for the remaining elements. `array_values()` re-indexes and restores packed mode.

## Bad Example

```php
$data = range(0, 50000);
unset($data[10000], $data[10001]);  // Gaps → hash mode, 2× memory
```

## Good Example

```php
$data = range(0, 50000);
unset($data[10000], $data[10001]);
$data = array_values($data);  // Re-indexed → packed mode restored
```

## Exceptions

Arrays with fewer than 1000 elements where the memory difference is negligible.

## Consequences Of Violation

Silent 2× memory increase after element removal, no warning that packed mode was lost.

---

## Rule Name

Pre-allocate Arrays with array_fill When Size Is Known

## Category

Performance

## Rule

Use `array_fill(0, $size, null)` when the final array size is known in advance. Never build arrays with incremental `$arr[]` for known sizes.

## Reason

Incremental array building causes multiple HashTable resize-rehash cycles as the array grows beyond each power-of-2 boundary. For 10K elements, this can cause 10+ resize cycles, each O(n). Pre-allocation avoids all resizes.

## Bad Example

```php
$arr = [];
for ($i = 0; $i < 10000; $i++) {
    $arr[] = $i;  // Multiple resize cycles as array grows
}
```

## Good Example

```php
$arr = array_fill(0, 10000, null);
for ($i = 0; $i < 10000; $i++) {
    $arr[$i] = $i;  // No resizing — single allocation
}
```

## Exceptions

Arrays where the final size is not known at creation time.

## Consequences Of Violation

Multiple O(n) HashTable resize cycles, unnecessary CPU overhead, memory fragmentation.

---

## Rule Name

Use SplFixedArray for Large Fixed-Size Collections

## Category

Performance

## Rule

Use `SplFixedArray` for collections over 10,000 elements with sequential integer keys and fixed size.

## Reason

SplFixedArray uses a contiguous C array with no HashTable overhead — ~50% less memory than packed arrays, ~75% less than hash arrays. For 1M integers: SplFixedArray uses ~16MB, packed array uses ~32MB.

## Bad Example

```php
$items = range(1, 1000000);  // ~32MB
```

## Good Example

```php
$items = new SplFixedArray(1000000);
for ($i = 0; $i < 1000000; $i++) {
    $items[$i] = $i + 1;  // ~16MB
}
```

## Exceptions

Data requiring string keys, dynamic resizing, or array functions that don't support SplFixedArray.

## Consequences Of Violation

2× or more memory usage for large datasets, unnecessary HashTable overhead.

---

## Rule Name

Be Aware of Power-of-2 Waste in Large Arrays

## Category

Performance

## Rule

Account for HashTable power-of-2 rounding when estimating memory for large arrays. An array with 1025 elements uses 2048 bucket slots — ~50% waste.

## Reason

PHP HashTable capacity rounds up to the next power of 2. An array with `nTableSize = 2048` but only 1025 elements wastes 1023 empty bucket slots. Each empty slot still has bucket overhead (~40 bytes).

## Bad Example

```php
// nTableSize = 2048 for 1025 elements
$data = range(1, 1025);  // ~50% wasted bucket slots
```

## Good Example

```php
// nTableSize = 2048 for 2048 elements — 0% waste
$data = new SplFixedArray(2048);  // Or: array_fill(0, 2048, null)
```

## Exceptions

Arrays small enough that the wasted bucket memory is negligible (<1000 elements).

## Consequences Of Violation

Up to 50% memory waste at power-of-2 boundaries, unexpected memory consumption.

---

## Rule Name

Avoid Array Copy-on-Write Modification of Large Arrays

## Category

Performance

## Rule

Avoid modifying arrays that are shared via assignment when the array is large (>10K elements).

## Reason

Modifying a shared array triggers full separation (duplication) of all elements. For a 1M-element array, this copies every element — O(n) time and memory. The copy matches the original in size, doubling peak memory.

## Bad Example

```php
$original = range(1, 1000000);
$copy = $original;  // CoW — shared
$copy[] = 'new';    // Separation! Full 1M-element copy
```

## Good Example

```php
$original = range(1, 1000000);
// Read-only operations — no separation
$sum = array_sum($original);
```

## Exceptions

When the original reference can be discarded after modification (only one copy needed).

## Consequences Of Violation

Memory spikes from unexpected array duplication, OOM from doubling large arrays.
