---
## Rule Name

Do Not Use References for Performance

## Category

Performance

## Rule

Never use by-reference (`&`) passing or assignment as a performance optimization. Use references only for deliberate aliasing.

## Reason

Copy-on-Write already provides zero-cost read sharing for pass-by-value values. References introduce a `zend_reference` container with its own overhead and completely bypass CoW, meaning they can actually reduce sharing efficiency in read-heavy code paths.

## Bad Example

```php
function processData(array &$data): int {  // Unnecessary reference
    return array_sum($data);  // Read-only — CoW handles this
}
```

## Good Example

```php
function processData(array $data): int {  // Pass by value
    return array_sum($data);  // Zero copy — CoW shares the array
}
```

## Exceptions

Functions that must modify the original array in-place and return the result via the parameter.

## Consequences Of Violation

Unnecessary `zend_reference` container allocation, CoW bypass preventing read sharing, added complexity with zero performance benefit.

---

## Rule Name

Always Unset After Foreach by Reference

## Category

Maintainability

## Rule

Always call `unset($value)` immediately after any `foreach` loop that uses `&$value`.

## Reason

PHP retains the reference after the loop terminates. The `$value` variable continues referencing the last element of the array. Any subsequent write to `$value` silently modifies the original array, creating hard-to-detect bugs.

## Bad Example

```php
foreach ($items as &$item) {
    $item = strtolower($item);
}
// $item still references $items[last]
$item = 'new';  // Silently modifies $items!
```

## Good Example

```php
foreach ($items as &$item) {
    $item = strtolower($item);
}
unset($item);  // Reference removed
$item = 'new';  // Does NOT modify $items
```

## Exceptions

No common exceptions. Always unset after reference foreach.

## Consequences Of Violation

Silent data corruption, difficult-to-reproduce bugs, downstream code receiving modified arrays unexpectedly.

---

## Rule Name

Avoid Returning References from Functions

## Category

Architecture

## Rule

Never declare a function return type as `&` (return by reference).

## Reason

Returning by reference breaks caller expectations — assignments to the return value silently modify internal state. It prevents CoW optimization and makes code harder to reason about. PHP's CoW already handles the use cases where references might seem beneficial.

## Bad Example

```php
class Container {
    private array $data = [];
    
    public function &get(string $key): mixed {
        return $this->data[$key];  // Return by reference — caller can modify internal state
    }
}
$container->get('key') = 'new';  // Silently modifies $data
```

## Good Example

```php
class Container {
    private array $data = [];
    
    public function get(string $key): mixed {
        return $this->data[$key] ?? null;  // Return by value
    }
    
    public function set(string $key, mixed $value): void {
        $this->data[$key] = $value;  // Explicit setter
    }
}
```

## Exceptions

Array access interfaces (ArrayAccess) or similar PHP internals that require reference return semantics.

## Consequences Of Violation

Unintended state modification from callers, unexpected behavior, debugging difficulty, reduced code maintainability.

---

## Rule Name

Avoid References in Long-Running Process Object Graphs

## Category

Architecture

## Rule

Minimize use of references in Octane, Swoole, and FrankenPHP workers. References can create unexpected memory retention chains.

## Reason

References prevent CoW separation and create `zend_reference` wrappers that can keep large structures alive across requests. A reference chain that prevents reference count from reaching zero can cause memory leaks that are invisible to the cyclic GC.

## Bad Example

```php
class Worker {
    private array $sharedData;
    
    public function process(): void {
        $ref = &$this->sharedData;  // Reference to internal state
        // $this->sharedData cannot be freed while any reference exists
    }
}
```

## Good Example

```php
class Worker {
    private array $sharedData;
    
    public function process(): void {
        $copy = $this->sharedData;  // CoV — shared until modification
        // Read-only processing — no references
    }
}
```

## Exceptions

Deliberate aliasing where two variables must always point to the same value throughout the worker lifetime.

## Consequences Of Violation

Unexpected memory retention, difficult-to-debug memory leaks in persistent workers.

---

## Rule Name

Use array_values Instead of Reference Foreach for Modification

## Category

Performance

## Rule

When you need to modify array elements, prefer `array_values()` or array functions (`array_map`) over `foreach (&$value)` for clarity and safety.

## Reason

Reference foreach has hidden pitfalls (persistent reference, difficult debugging) and is not actually faster than alternative patterns in modern PHP. `array_map` creates a new array without side effects.

## Bad Example

```php
foreach ($items as &$item) {
    $item = process($item);
}
unset($item);  // Easy to forget
```

## Good Example

```php
$items = array_map(fn ($item) => process($item), $items);
// No references, no side effects, no unset needed
```

## Exceptions

Very large arrays (>100K elements) where the memory cost of creating a new array via array_map is prohibitive.

## Consequences Of Violation

Forgotten unset calls, subtle bugs from persistent references, increased cognitive load during code review.
