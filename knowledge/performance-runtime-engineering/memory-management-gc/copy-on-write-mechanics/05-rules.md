---
## Rule Name

Pass Large Arrays by Value to Read-Only Functions

## Category

Performance

## Rule

Always pass large arrays by value to functions that only read the data. Do not use `&` references for performance.

## Reason

Copy-on-Write ensures that passing a large array by value incurs zero copy overhead for read-only access — only the refcount is incremented (~5ns). Using `&` bypasses CoW and creates unnecessary indirect overhead.

## Bad Example

```php
// Unnecessary reference — CoW already provides zero-cost sharing
function processData(array &$data): int {
    return array_sum($data);  // Read-only — no copy needed
}
```

## Good Example

```php
// Pass by value — CoW shares the array until modification
function processData(array $data): int {
    return array_sum($data);  // Zero copy — refcount increment only
}
```

## Exceptions

Functions that must modify the original array in-place (deliberate aliasing).

## Consequences Of Violation

Unnecessary zend_reference overhead, loss of CoW optimization, added complexity for zero performance benefit.

---

## Rule Name

Avoid Modifying Shared Arrays in Hot Paths

## Category

Performance

## Rule

Do not modify arrays that are shared via assignment or pass-by-value inside hot loops.

## Reason

Modifying a shared array triggers a full separation (duplication) of the entire array. For a 1M-element array, this copies all elements — O(n) time and memory. This is orders of magnitude more expensive than reading the shared array.

## Bad Example

```php
$large = range(1, 1000000);
$shared = $large;  // CoW sharing — no copy
$shared[] = 'new';  // Separation! Full 1M-element copy triggered
```

## Good Example

```php
$large = range(1, 1000000);
processReadOnly($large);  // Read-only — no separation
```

## Exceptions

When the original reference can be discarded after modification (no need to preserve the original).

## Consequences Of Violation

Unexpected memory spikes when shared arrays are modified, OOM from array duplication, performance degradation in hot code paths.

---

## Rule Name

Unset Reference Variables After Foreach by Reference

## Category

Maintainability

## Rule

Always call `unset($value)` after a `foreach` loop that uses `&$value`.

## Reason

The `$value` reference persists after the loop, pointing to the last array element. Any subsequent assignment to `$value` modifies the original array. This bypasses CoW because the reference forces aliasing.

## Bad Example

```php
foreach ($arr as &$val) { $val *= 2; }
$val = 'oops';  // Modifies $arr[last] — reference still active
```

## Good Example

```php
foreach ($arr as &$val) { $val *= 2; }
unset($val);  // Reference removed — CoW works normally
```

## Exceptions

No common exceptions. Always unset after reference foreach.

## Consequences Of Violation

Subtle bugs where the original array is unexpectedly modified, data corruption in downstream code.

---

## Rule Name

Use [...$array] for Shallow Copy When Modification Is Needed

## Category

Performance

## Rule

Use the spread operator (`[...$array]`) for shallow array copies that will be modified. Avoid `unserialize(serialize($array))` for shallow copies.

## Reason

The spread operator creates a shallow copy by incrementing refcounts of each element — O(n) but cheap. `unserialize(serialize($array))` creates a deep copy with full element duplication — O(n) but much more expensive and memory-intensive.

## Bad Example

```php
$copy = unserialize(serialize($data));  // Deep copy — expensive
```

## Good Example

```php
$copy = [...$data];  // Shallow copy — refcount increments only
```

## Exceptions

When a true deep copy is required (nested objects must be independent).

## Consequences Of Violation

Unnecessary CPU and memory for deep copies when shallow copies suffice.
