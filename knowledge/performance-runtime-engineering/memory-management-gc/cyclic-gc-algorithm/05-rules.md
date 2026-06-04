---
## Rule Name

Design Object Graphs to Minimize Circular References

## Category

Architecture

## Rule

Design object graphs to be acyclic whenever possible. Use `WeakReference` for parent-child back-references and observer patterns.

## Reason

PHP's reference counting handles 99%+ of memory reclamation deterministically. Circular references require the GC to intervene with a stop-the-world cycle collection that pauses execution for 50–500µs. Acyclic graphs are freed immediately when refcount reaches zero.

## Bad Example

```php
$parent->child = $child;
$child->parent = $parent;  // Cycle — requires GC
```

## Good Example

```php
$parent->child = $child;
$child->parentRef = WeakReference::create($parent);  // No cycle
```

## Exceptions

ORM entity relationships where both directions are required for the domain model (use explicit detaching on cleanup).

## Consequences Of Violation

GC-dependent memory reclamation with unpredictable pause times, potential for unbounded accumulation if GC is disabled or overrun.

---

## Rule Name

Call gc_collect_cycles Strategically in Long-Running Processes

## Category

Reliability

## Rule

Call `gc_collect_cycles()` at strategic batch boundaries (every 100–500 requests) in Octane, Swoole, and FrankenPHP workers.

## Reason

Without strategic collection, the root buffer accumulates until it reaches the default threshold (10,000), triggering an automatic GC run at an unpredictable time. Strategic collection at known boundaries provides deterministic timing and prevents the buffer from ever filling.

## Bad Example

```php
// No strategic collection — relies entirely on automatic threshold trigger
```

## Good Example

```php
static $requestCount = 0;
if (++$requestCount % 100 === 0) {
    gc_collect_cycles();
}
```

## Exceptions

PHP-FPM processes where the heap is destroyed per request.

## Consequences Of Violation

Unpredictable GC pauses triggered by root buffer overflow, CPU spikes at random times, variable latency.

---

## Rule Name

Upgrade to PHP 8.5+ for Reduced False-Positive GC Runs

## Category

Performance

## Rule

Upgrade to PHP 8.5+ to benefit from reduced false-positive GC runs from static closures and Enum singletons.

## Reason

PHP 8.5 skips static closures (first-class callables) and Enum singletons during root buffer detection — these were the most common false-positive roots, causing ~30% of unnecessary GC runs in framework-heavy apps. Eliminating them reduces CPU wasted on scanning non-garbage.

## Bad Example

```bash
# PHP 8.4 — GC runs 30% more often than necessary
# Static closures and Enums trigger false-positive collections
```

## Good Example

```bash
# PHP 8.5+ — GC runs 30% less frequently
# CPU saved from unnecessary mark-grey/scan/sweep cycles
```

## Exceptions

Applications that do not use first-class callable syntax or Enums extensively.

## Consequences Of Violation

Unnecessary CPU consumption from false-positive GC runs, higher GC time ratio without actual memory benefit.

---

## Rule Name

Do Not Assume unset Immediately Frees Memory

## Category

Maintainability

## Rule

Never assume `unset()` frees memory for objects that may be part of circular references. Call `gc_collect_cycles()` when deterministic cleanup is required.

## Reason

`unset()` decrements the refcount of a zval. If the zval is part of a circular reference, the refcount never reaches zero (each object in the cycle holds references to others), and the memory remains allocated until the GC runs.

## Bad Example

```php
unset($parent, $child);
// Assuming memory is freed — but cycle prevents it
```

## Good Example

```php
unset($parent, $child);
gc_collect_cycles();  // Memory freed now
```

## Exceptions

PHP-FPM processes where the heap is destroyed at request end regardless.

## Consequences Of Violation

Memory appears to leak after unset calls, confusion about PHP's memory model, uninformed debugging.

---

## Rule Name

Use gc_status to Monitor GC Activity, Not Just Memory Usage

## Category

Performance

## Rule

Always use `gc_status()` to monitor GC activity in long-running processes — not just `memory_get_usage()`.

## Reason

`memory_get_usage()` only reports current memory allocation. It does not distinguish between active data and GC-deferred cycles. `gc_status()` provides root buffer entries, collection counts, and GC time ratio — the specific signals needed to diagnose cycle problems.

## Bad Example

```php
// Only checking memory — no GC insight
$mem = memory_get_usage(true);
```

## Good Example

```php
// GC insight + memory
$gc = gc_status();
$mem = memory_get_usage(true);
// If roots grow while mem grows, cycles are the likely cause
```

## Exceptions

No common exceptions. Always pair memory monitoring with GC telemetry.

## Consequences Of Violation

Undetected cycle accumulation that appears as "mysterious memory growth," inability to distinguish cycle leaks from static leaks.
