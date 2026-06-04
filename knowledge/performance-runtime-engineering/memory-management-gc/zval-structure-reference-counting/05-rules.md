---
## Rule Name

Minimize Variable Copying in Hot Loops

## Category

Performance

## Rule

Avoid unnecessary variable assignments of compound types (arrays, objects, strings) inside hot loops that execute more than 100K iterations.

## Reason

Each assignment of a compound type increments the refcount (~5–15ns). While individually cheap, cumulative refcount manipulation in loops with millions of iterations becomes a measurable CPU bottleneck.

## Bad Example

```php
// Unnecessary chain of refcount increments
$temp = $data;
$temp2 = $temp;
$temp3 = $temp2;
// Each assignment is a refcount++ on the same zval
```

## Good Example

```php
// Use the original variable directly
process($data);  // Single refcount increment via function call
```

## Exceptions

Code where readability and maintainability require intermediate variables, and the loop is not performance-critical (<100K iterations).

## Consequences Of Violation

Measurable CPU overhead in hot code paths from unnecessary refcount manipulation, reduced throughput in tight loops.

---

## Rule Name

Always Unset Reference Variables After Foreach by Reference

## Category

Maintainability

## Rule

Always call `unset($value)` after a `foreach` loop that uses `&$value` reference.

## Reason

The reference variable persists after the loop ends, still pointing to the last element of the array. Any subsequent write to that variable name modifies the array, causing subtle and hard-to-find bugs.

## Bad Example

```php
foreach ($array as &$value) {
    $value *= 2;
}
// $value still references $array[last]!
$value = 'oops';  // Modifies the original array
```

## Good Example

```php
foreach ($array as &$value) {
    $value *= 2;
}
unset($value);  // Reference removed — safe
$value = 'oops';  // Does NOT modify the array
```

## Exceptions

No common exceptions. Always unset after reference foreach.

## Consequences Of Violation

Subtle bugs where the original array is unexpectedly modified after the loop, data corruption, hard-to-trace production issues.

---

## Rule Name

Use Typed Properties to Reduce Opcode Count and Refcount Overhead

## Category

Performance

## Rule

Declare explicit types on all class properties to enable the Zend Engine to generate fewer opcodes and reduce refcount manipulation.

## Reason

Typed properties allow the engine to use specialized opcodes (`ASSIGN_OBJ_OP_DATA` variants) that skip the refcount and type-check logic that untyped properties require. This reduces both opcode count and refcount overhead.

## Bad Example

```php
class Item {
    public $id;    // Untyped — general opcodes, refcount manipulation
    public $name;  // Untyped — same
}
```

## Good Example

```php
class Item {
    public int $id;       // Typed — specialized opcodes
    public string $name;  // Typed — engine skips refcount on scalar guard
}
```

## Exceptions

Legacy codebases undergoing migration where adding types would break existing contracts.

## Consequences Of Violation

Higher opcode count, unnecessary refcount operations, 5–15% slower property access in property-heavy code.

---

## Rule Name

Call gc_collect_cycles After unset in Long-Running Processes

## Category

Reliability

## Rule

Call `gc_collect_cycles()` after `unset()` on objects that are part of circular references in long-running processes (Octane, Swoole, queue workers).

## Reason

`unset()` only decrements the refcount. If the object is part of a circular reference, the refcount will not reach zero and the memory will not be freed until the GC runs. Calling `gc_collect_cycles()` immediately reclaims this memory deterministically.

## Bad Example

```php
function processBatch(): void {
    $parent = new Node();
    $child = new Node();
    $parent->child = $child;
    $child->parent = $parent;
    unset($parent, $child);
    // Memory NOT freed — cycle still exists until next GC run
}
```

## Good Example

```php
function processBatch(): void {
    $parent = new Node();
    $child = new Node();
    $parent->child = $child;
    $child->parent = $parent;
    unset($parent, $child);
    gc_collect_cycles();  // Memory freed immediately
}
```

## Exceptions

PHP-FPM short-lived requests where the entire heap is destroyed at request end regardless.

## Consequences Of Violation

Memory accumulates from uncollected cycles in long-running processes, gradual RSS growth, eventual OOM worker termination.

---

## Rule Name

Do Not Use References for Performance Optimization

## Category

Performance

## Rule

Never use by-reference (`&`) passing or assignment as a performance optimization. Use references only for deliberate aliasing.

## Reason

Copy-on-Write already provides zero-cost read sharing for pass-by-value. Adding references creates a `zend_reference` container with its own overhead, prevents CoW from operating, and increases complexity. References do not improve performance over CoW.

## Bad Example

```php
// Unnecessary reference — CoW already handles read sharing
function processData(array &$data): void {
    // Only reads $data — no modification
    $total = array_sum($data);
}
```

## Good Example

```php
// Pass by value — CoW ensures zero copy for read-only access
function processData(array $data): void {
    $total = array_sum($data);  // Zero copy — refcount++ only
}
```

## Exceptions

Functions that must modify the original array in-place (deliberate aliasing, not performance).

## Consequences Of Violation

Added complexity from zend_reference containers, prevented CoW sharing, potential for subtle bugs from unintended aliasing.
