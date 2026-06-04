# Circular Reference Formation - Parent-Child Back-Pointers, Event Listener Accumulation

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Circular Reference Formation - Parent-Child Back-Pointers, Event Listener Accumulation |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

A circular reference (cycle) forms when two or more objects reference each other - either directly (parent->child->parent) or through a chain. Reference counting alone cannot detect these cycles because every object has non-zero refcount even when no external references exist. The cyclic garbage collector (GC) is required to identify and free these structures.

## Core Concepts

- Direct cycle: $parent->child = $child; $child->parent = $parent; both objects have refcount=1 even after unset. GC must collect them.
- Self-reference: $obj->self = $obj; refcount never drops below 1. Common in singleton patterns.
- Event listener accumulation: $subject->listeners[] = function() use ($subject); closure captures $subject, creating a cycle. Accumulates over time in long-running processes.
- SplObjectStorage cycles: Storing objects as keys that reference the storage container creates undetected cycles.

## When To Use

- Understanding how garbage collection works in PHP.
- Debugging memory leaks in long-running processes.
- Designing object graphs that avoid cycles.

## When NOT To Use

- Short-lived PHP-FPM requests (cycles are cleaned up at request end regardless).
- Simple scripts with minimal object interactions.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Use WeakReference for parent back-pointers | Breaks cycles without losing functionality. |
| Unregister event listeners on cleanup | Prevents listener accumulation in long-running processes. |
| Call gc_collect_cycles() at batch boundaries | Frees cycle memory deterministically. |

## Architecture Guidelines

- Cycles are only a problem in long-running processes (Octane, queue workers).
- In PHP-FPM, cycles are moot because all memory is freed at request end.
- WeakReference allows parent references without creating cycles.

## Performance Considerations

- GC collection pauses for 1-10ms when root buffer fills.
- Cycle accumulation in long-running processes increases GC cost over time.
- gc_collect_cycles() at boundaries prevents unpredictable pauses.

## Security Considerations

- Memory exhaustion from accumulated cycles is a denial-of-service risk.
- Monitor worker RSS in production to detect cycle accumulation.

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|----------------|
| Assuming unset() frees all memory | unset() only decrements refcount. If part of a cycle, memory remains. | Memory grows until GC runs. | Call gc_collect_cycles() explicitly if deterministic cleanup needed. |

## Anti-Patterns

- Ignoring cycles in Octane workers: Can lead to OOM over time.
- Using strong references for observer/cache patterns when WeakReference would work.

## Examples

```php
// Cycle: parent holds child, child holds parent
$parent = new Node();
$child = new Node();
$parent->child = $child;
$child->parent = $parent;  // cycle formed
unset($parent, $child);    // memory not freed until GC runs

// No cycle: use WeakReference
$parent->child = $child;
$child->parentRef = WeakReference::create($parent);
```

## Related Topics

- Cyclic GC Algorithm
- WeakReference API Usage
- Memory Leak Pattern Catalog

## AI Agent Notes

- Cycles are harmless in PHP-FPM (per-request cleanup). They matter in Octane/Swoole.
- The most common cycle source: closures capturing $this or $that in event listeners.
- WeakReference is the best tool for preventing cycles.
- gc_collect_cycles() at request boundaries in Octane prevents accumulation.

## Verification

- [ ] Audit codebase for closure listeners that capture parent scope.
- [ ] Check for self-references in singletons.
- [ ] Verify WeakReference usage in parent-child relationships.
- [ ] Monitor root buffer growth in long-running workers.