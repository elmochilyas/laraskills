# Reference Counting Bottlenecks

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Reference Counting Bottlenecks |
| Difficulty | Advanced |
| Last Updated | 2026-06-04 |

## Overview

PHP uses reference counting (refcount) to track every compound value's lifetime. Each assignment, function call argument, return value, and variable destruction increments or decrements the refcount of strings, arrays, and objects. On hot paths — loops iterating 10,000+ times, serialization-heavy operations, or array transformation pipelines — refcount operations become measurable CPU consumers. A single refcount inc/dec is ~5ns, but 500,000 operations add 2.5ms to request time. Understanding refcount bottlenecks means knowing when copy-on-write (COW) mitigates them, when immutability eliminates them, and when data structure choice (SplFixedArray, readonly properties) bypasses refcount entirely.

## Core Concepts

- **zval refcount**: Stored in the `zend_refcounted_h` header of every heap-allocated value. `gc_refcount` increments on assignment/function call, decrements on variable destruction/reassignment.
- **Copy-on-write (COW)**: When a value is assigned to a new variable, the refcount increments but the data is not copied. Only when one of the copies is modified does the separation (duplication) occur.
- **Refcount churn**: The rate of refcount inc/dec operations per unit time. High churn occurs in tight loops, heavy argument passing, and complex array operations.
- **Write barriers**: PHP 7.4+ typed properties use write barriers — additional refcount checks that protect against use-after-free in GC cycles. These add ~2ns per write.
- **readonly properties (PHP 8.1+)**: Once set in the constructor, readonly properties bypass write barriers entirely, eliminating refcount overhead on subsequent writes.

## When To Use

- Hot loops where profiling shows refcount operations (zend_refcount_inc, zend_refcount_del) in top functions.
- Array-heavy data pipelines where each element passes through multiple transformation steps.
- Octane workers where refcount churn accumulates across requests in shared state.
- Serialization/deserialization paths (JSON encode/decode) with large data volumes.

## When NOT To Use

- Typical CRUD routes with < 1000 allocations per request — refcount overhead is negligible.
- Non-performance-critical code paths executed once per user interaction.
- Situations where readability and maintainability are the primary concern — refcount optimization adds complexity.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Profile before optimizing refcounts | Refcount ops are ~5ns each. Only hot loops with 10k+ iterations make them meaningful. |
| Prefer readonly properties (PHP 8.1+) | readonly properties disable write barriers, eliminating refcount overhead on property writes. |
| Use SplFixedArray for fixed-size collections | Regular arrays are hash maps with per-element refcount overhead. SplFixedArray uses contiguous C arrays. |
| Minimize function calls in hot loops | Each function call copies arguments (refcount inc) and returns (refcount dec). Inline hot-path logic. |
| Pass by reference for large structures | Passing by reference (using &) avoids copy-on-write separation, reducing refcount churn for large arrays and objects. |

## Architecture Guidelines

- **Immutable DTOs**: Use readonly classes with typed properties for data that passes through multiple layers. Immutability eliminates write barriers entirely.
- **Generator pipelines**: Replace arrays of intermediate results with `yield` generators. Each yielded value is consumed immediately, avoiding refcount churn from large intermediate arrays.
- **Data transformers**: For array-heavy operations like API resource formatting, process data in-place (pass by reference) rather than creating new arrays at each transformation step.
- **Partition hot and cold paths**: Separate performance-critical data transformation code from general-purpose code. Apply refcount-friendly patterns only to the hot path.
- **Object pooling in Octane**: Reuse objects across requests to avoid allocation/refcount churn. But ensure proper reset to avoid cross-request state contamination.

## Performance Considerations

- Single refcount inc/dec: ~5ns (CPU register operation + cache line touch).
- Array refcount during copy: O(1) for the array zval itself — but the actual copy-on-write separation is O(n) per element.
- Function argument passing: Each argument incs the refcount of the zval. For functions called 100k times with 3 arguments, that is 300k refcount ops = ~1.5ms.
- Write barrier in typed properties: PHP 7.4+ adds ~2ns per write to non-readonly typed properties to guard against concurrent GC operations.
- SplFixedArray vs plain array: SplFixedArray stores values in a contiguous C array; plain arrays use zval buckets. SplFixedArray eliminates per-bucket refcount overhead.

## Security Considerations

- Refcount overflow (integer overflow on refcount) is a theoretical concern in PHP. In practice, PHP 7.0+ uses `gc_refcount` as a 32-bit unsigned int; overflow requires >4 billion references to a single zval — not feasible in real workloads.
- Resource exhaustion via refcount manipulation: An attacker cannot directly manipulate refcounts from userland PHP. However, triggering excessive refcount churn via algorithmic complexity attacks (e.g., sending deeply nested JSON) is a denial-of-service vector.
- By-ref parameter abuse: Using reference parameters (`&$var`) in internal methods can cause side effects that leak memory or corrupt state if not carefully managed.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Premature by-ref optimization | Using `&$var` everywhere to "save refcount overhead." | Assuming passing by value always copies. | Fragile code with hidden mutation side effects. | Profile first. Pass by value is fine for most cases. |
| Ignoring readonly property benefits | Using regular typed properties when values are set once and never change. | Not knowing PHP 8.1+ readonly eliminates write barriers. | 2ns overhead per write for the lifetime of the object. | Use `readonly` for immutable DTOs. |
| Refcount churn in tight loops without profiling | Optimizing refcounts in code that runs < 100 times per request. | Assuming all micro-optimizations matter equally. | Maintainability cost with no measurable benefit. | Always profile before applying refcount optimizations. |
| Overlooking SplFixedArray | Using plain arrays for large fixed-size numeric collections. | Familiarity with array functions and convenient API. | 30-50% higher memory and refcount overhead. | Use SplFixedArray for fixed-size indexed collections. |

## Anti-Patterns

- **Refcount cargo culting**: Applying `unset()` eagerly after every operation, assuming it helps. `unset()` decrements refcount — useful in long-running workers but noise in FPM.
- **Deep cloning**: Cloning large object graphs (via `clone` or serialization) triggers refcount inc/dec for every nested zval. Prefer immutable updates that reuse structures.
- **By-ref in public APIs**: Accepting `&$data` in public methods forces all callers to use variables (not expressions), complicates interfaces, and adds mutation risk.

## Examples

```php
<?php
// Hot path: refcount churn from function calls
function transform(array $items): array {
    $result = [];
    foreach ($items as $item) {
        // Each call: refcount inc on $item, dec on return, dec on unset
        $result[] = processItem($item); // 10k iterations = 30k refcount ops
    }
    return $result;
}

// Optimized: inline processing, reduce refcount churn
function transformOptimized(array &$items): void {
    foreach ($items as &$item) {
        $item = strtoupper($item); // In-place, no extra refcount overhead
    }
}
```

```php
<?php
// Readonly DTO eliminates write barrier overhead
readonly class UserDTO {
    public function __construct(
        public string $name,
        public int $age,
        public string $email,
    ) {}
}
```

## Related Topics

- **Prerequisites**: PHP Memory Model, Zval Structure, Copy-on-Write Mechanics
- **Closely Related**: Zval Structure Reference Counting, Copy-on-Write Violations
- **Advanced Follow-Up**: GC CPU Overhead, Array Memory Overhead
- **Cross-Domain Connections**: Octane Memory Management, Profiling Methodology

## AI Agent Notes

- Refcount bottlenecks are almost never the dominant cost. Profile first, optimize second. If the profiler does not show `zend_refcount_*` in top functions, refcount is not the problem.
- The single most impactful refcount optimization for Laravel apps is readonly DTOs with typed properties. This eliminates write barriers across the entire object lifecycle.
- SplFixedArray is underused in the PHP ecosystem. Most developers default to plain arrays even when the data is fixed-size and numerically indexed. Consider it for large-collection hot paths.
- Passing by reference (`&$var`) reduces refcount churn for large structures but introduces mutation side effects. Reserve it for clearly documented hot-path data transformers.
