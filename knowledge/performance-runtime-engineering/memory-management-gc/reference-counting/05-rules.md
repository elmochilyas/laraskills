---
## Rule Name

Minimize Variable Copying in Hot Loops

## Category

Performance

## Rule

Avoid unnecessary variable assignments of compound types inside hot loops with more than 100K iterations.

## Reason

Each assignment of a compound type (string, array, object) increments its refcount (~5–15ns). While cheap individually, cumulative refcount manipulation in loops with millions of iterations becomes a measurable CPU bottleneck.

## Bad Example

```php
for ($i = 0; $i < 1000000; $i++) {
    $temp = $large;  // refcount++ on $large
    $temp2 = $temp;  // refcount++ on $large
    process($temp2);
}
```

## Good Example

```php
for ($i = 0; $i < 1000000; $i++) {
    process($large);  // One refcount++ via function call
}
```

## Exceptions

Code where readability requires intermediate variables and the loop is not performance-critical.

## Consequences Of Violation

Measurable CPU overhead from unnecessary refcount operations, reduced throughput in tight loops.

---

## Rule Name

Unset Large Variables When No Longer Needed

## Category

Performance

## Rule

Call `unset()` on large arrays or objects when they are no longer needed within a request, especially before long-running operations.

## Reason

`unset()` decrements the refcount immediately. If the refcount reaches zero, the memory is freed right away — not at the end of the scope. This keeps peak memory usage lower.

## Bad Example

```php
function processFile(string $path): void {
    $content = file_get_contents($path);  // Large string
    $lines = explode("\n", $content);      // Large array
    // Both stay in memory until function ends
    otherExpensiveOperation();  // Peak memory includes $content AND $lines
}
```

## Good Example

```php
function processFile(string $path): void {
    $content = file_get_contents($path);
    $lines = explode("\n", $content);
    unset($content);  // Freed — peak memory reduced
    otherExpensiveOperation();  // $content is already freed
}
```

## Exceptions

Short-lived functions where peak memory is not a concern.

## Consequences Of Violation

Higher peak memory usage, unnecessary memory pressure, increased garbage collection frequency.

---

## Rule Name

Use Interned Strings and Enums for Repeated Values

## Category

Performance

## Rule

Use string literals (which are interned by default) and Enum singletons instead of dynamically created strings for repeated values in hot paths.

## Reason

Interned strings and Enum singletons use `GC_IMMUTABLE` flag — they skip refcount manipulation entirely via TRY semantics (PHP 8.1+). Dynamic strings created via `strtolower()` or concatenation require full refcounting.

## Bad Example

```php
$type = strtolower('ADMIN');  // Dynamic string — full refcount
```

## Good Example

```php
$type = 'admin';  // Interned string — no refcount overhead

enum UserType: string {
    case Admin = 'admin';
}
$type = UserType::Admin;  // Singleton — no allocation
```

## Exceptions

Values that are genuinely dynamic (user input, database content, API responses).

## Consequences Of Violation

Unnecessary refcount operations on repeated string values, higher CPU usage in hot code paths.

---

## Rule Name

Do Not Use References to "Save Memory" for Function Arguments

## Category

Performance

## Rule

Pass arguments by value unless the function must modify the original variable. Do not use `&` to avoid copying.

## Reason

PHP's CoW already provides zero-cost read sharing for pass-by-value. Adding `&` creates a `zend_reference` container that bypasses CoW and adds overhead, making reads — not just writes — more expensive.

## Bad Example

```php
function analyze(array &$data): array {  // "To save memory"
    return ['sum' => array_sum($data), 'avg' => average($data)];
    // Both functions only read — CoW would give zero-copy anyway
}
```

## Good Example

```php
function analyze(array $data): array {  // Pass by value
    return ['sum' => array_sum($data), 'avg' => average($data)];
    // CoW ensures zero copy for all read operations
}
```

## Exceptions

Functions that must modify the original array in-place.

## Consequences Of Violation

Unnecessary zend_reference overhead, prevented CoW sharing, increased complexity with zero performance benefit.

---

## Rule Name

Use foreach by Value for Read-Only Iteration

## Category

Performance

## Rule

Use `foreach ($array as $value)` for read-only array iteration. Do not add `&` unless modification of the original is intended.

## Reason

`foreach ($array as $value)` increments the array's refcount — no copy. The refcount decrement happens at loop end. Adding `&` prevents CoW sharing and introduces a persistent reference that must be explicitly unset.

## Bad Example

```php
foreach ($array as &$value) {  // Unnecessary reference
    echo $value;  // Read-only — no modification
}  // Reference persists — must remember unset($value)
```

## Good Example

```php
foreach ($array as $value) {  // By value — CoW shares the array
    echo $value;  // Read-only — zero copy
}
```

## Exceptions

Loops that must modify array elements in-place.

## Consequences Of Violation

Unnecessary reference overhead, forgotten unset calls causing subtle bugs, prevented CoW optimization.
