# Standardized Knowledge: WeakReference API Usage

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | WeakReference API Usage — Cycle Prevention Through Weak Back-References |
| Difficulty | Intermediate |
| Lifecycle | Implement, Debug |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

PHP 7.4+ introduces `WeakReference` — a non-owning reference to an object that does not increase its refcount. Weak references allow building parent-child (or observer-subject) relationships without creating circular references. When the only remaining references to an object are WeakReferences, the object is freed immediately and `WeakReference::get()` returns null.

## Core Concepts

- **WeakReference::create($obj)**: Creates a weak reference. The underlying object's refcount is NOT incremented.
- **WeakReference::get()**: Returns the object if it still exists, or null if it was freed. Always check for null before dereferencing.
- **Cache pattern**: `WeakReference` is ideal for caches where objects should be freed if no other references exist (avoiding memory leaks from cache maps).
- **Event listener pattern**: Instead of `$subject->listeners[] = $listener;` (strong ref → cycle), store `WeakReference::create($listener)`.

## When To Use

- Observer/subject patterns where subjects hold references to many listeners
- Cache implementations where cached objects should be freed when no longer needed
- Parent-child relationships in object graphs (child should not prevent parent's collection)
- Any pattern where you'd otherwise create a circular reference

## When NOT To Use

- When you need a guaranteed reference to the object (use strong reference instead)
- For simple linear references that will be explicitly nullified
- When the overhead of null-checking (get() !== null) is unacceptable in hot paths
- As a replacement for all static property usage (solve the architectural problem first)

## Best Practices

- **Always null-check**: `$obj = $weakRef->get(); if ($obj !== null) { $obj->doSomething(); }`. The object can be freed between create() and get().
- **Clean up null entries**: Periodically remove WeakReferences where get() returns null, especially from long-running caches.
- **Use in cache maps**: Cache values should be WeakReference-wrapped to avoid preventing object collection.
- **Prefer WeakReference over explicit lifecycle management**: Manual nullification is error-prone. WeakReference provides automatic cleanup.

## Architecture Guidelines

- **Observer without cycles**: Subject stores WeakReferences to observers. Observers are freed when no longer referenced externally. Subject's `notify()` checks `WeakReference::get()` and removes null entries.
- **Cache with WeakReference**: `spl_object_id($obj) => WeakReference::create($obj)`. The cache doesn't prevent object collection. On get(), check null and remove stale entries.
- **Combined with service container**: In Octane, use WeakReference for services that should be garbage-collected between requests but re-created on demand.

## Performance Considerations

- WeakReference::get() overhead: ~20ns — negligible
- WeakReference::create() overhead: ~50ns — lightweight
- Alternative: manual nullification (setting `$parent->child = null`) is free but error-prone. WeakReference provides automatic cleanup.
- Hash table lookup in WeakReference resolution: ~0.1µs — negligible for occasional use

## Security Considerations

- WeakReference can lead to dangling references if application logic assumes the object always exists
- In multi-tenant systems, freed objects could theoretically be replaced by new objects with different data
- Always validate that $weakRef->get() !== null before operating on the returned object

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using WeakReference without null-checking | Assuming object exists | Null pointer errors | Always check get() !== null |
| Storing WeakReference in a permanent cache | No eviction strategy | Accumulated null entries waste memory | Periodically clean stale WeakReferences |
| Using WeakReference for mandatory dependencies | Wrong pattern | Object freed unexpectedly | Use strong references for required dependencies |
| Not understanding WeakReference vs WeakMap | Confusing APIs | Different semantics | WeakReference for single objects, WeakMap for maps |

## Anti-Patterns

- **Using WeakReference as a magic "fix memory leak" button**: If you don't understand why the cycle forms, WeakReference may mask the underlying architectural issue.
- **Storing WeakReferences without cleanup strategy**: Accumulated null entries in long-running caches become memory leaks themselves.
- **Wrapping everything in WeakReference**: Most references should be strong. WeakReference is for specific cycle-prevention patterns.

## Examples

```php
<?php
// Observer pattern without cycles
class EventSubject {
    private array $observers = [];
    
    public function attach(object $observer): void {
        $this->observers[] = WeakReference::create($observer);
    }
    
    public function notify(): void {
        foreach ($this->observers as $key => $weakRef) {
            $observer = $weakRef->get();
            if ($observer === null) {
                unset($this->observers[$key]); // Clean up
                continue;
            }
            $observer->handleEvent($this);
        }
    }
}

// Cache with WeakReference
class WeakCache {
    private array $cache = [];
    
    public function set(object $value): string {
        $id = spl_object_id($value);
        $this->cache[$id] = WeakReference::create($value);
        return $id;
    }
    
    public function get(string $id): ?object {
        if (!isset($this->cache[$id])) return null;
        $obj = $this->cache[$id]->get();
        if ($obj === null) unset($this->cache[$id]); // Clean up
        return $obj;
    }
}
```

## Related Topics

- Circular Reference Formation
- Memory Leak Pattern Catalog
- Persistent vs Per-Request Allocators
- Copy-on-Write Mechanics

## AI Agent Notes

- WeakReference does NOT increment refcount — object can be freed immediately when all strong refs are gone.
- Always check WeakReference::get() !== null before using the object.
- Ideal for observer/subject patterns, caches, and parent-child relationships.
- Clean up null WeakReferences periodically in long-running caches.
- WeakReference != WeakMap. WeakReference wraps a single object. WeakMap is a map with weak-key semantics (PHP 8.0+).
- In Octane, WeakReference helps prevent memory leaks from cross-request object retention.

## Verification

- [ ] WeakReference API understood (create, get, null-checking)
- [ ] Observer/subject patterns use WeakReference for listeners
- [ ] Cache implementations wrap values in WeakReference where appropriate
- [ ] Stale WeakReference cleanup strategy implemented
- [ ] No WeakReference used for required dependencies (strong refs used)
- [ ] WeakReference vs WeakMap distinction understood
