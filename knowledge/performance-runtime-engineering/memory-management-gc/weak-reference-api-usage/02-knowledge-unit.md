# Weak Reference API Usage in Laravel

## Metadata
- **Domain:** Performance & Runtime Engineering
- **Subdomain:** Memory Management & Garbage Collection
- **Knowledge Unit:** WeakReferenceApiUsage
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Weak Reference API Usage covers the application of PHP's `WeakReference` and `WeakMap` classes within the Laravel ecosystem. Introduced in PHP 7.4 (`WeakReference`) and PHP 8.0 (`WeakMap`), these primitives allow holding references to objects without preventing their garbage collection. In Laravel, they are useful for caching expensive operations, managing listeners, tracking objects in long-running processes (queues, Octane, Swoole), and preventing memory leaks in event-driven architectures.

---

## Core Concepts

- **WeakReference:** A PHP class that holds a weak reference to an object. Created via `WeakReference::create($object)`. The referenced object can be retrieved via `$weakRef->get()`, which returns `null` if the object has been garbage-collected
- **WeakMap:** An object-to-value mapping using weak references for keys. When the key object is destroyed, the entry is automatically removed. `WeakMap` implements `Map` interface and supports array-like access
- **Garbage Collection:** PHP's reference-counting garbage collector. An object is collected when its reference count drops to zero. Weak references do not contribute to the reference count
- **Long-Running Process Memory Management:** In Laravel Octane, Swoole, and queue workers, the PHP process lives across multiple requests/jobs. Objects that would normally be freed at request end persist unless explicitly unset. Weak references prevent these objects from anchoring larger object graphs

---

## Mental Models

- **Post-It Note Model:** A weak reference is like a Post-It note pointing to a whiteboard drawing — it helps you find the drawing, but when someone erases the drawing (GC), the Post-It just points to empty space
- **Library Checkout Model:** WeakMap is like a library checkout system keyed by library card (object) — when the patron (object) leaves the library (is GC'd), their checkout record is automatically deleted
- **Self-Cleaning Cache Model:** Think of WeakMap as a cache that cleans itself — entries disappear when the key object goes out of scope. No manual invalidation or TTL management needed

---

## Internal Mechanics

PHP's `WeakReference` stores a pointer to an object without incrementing its `refcount`. When `zend_object` is destroyed (refcount reaches zero), the weak reference's pointer is set to null. `WeakMap` extends this by maintaining a hash table of `zend_weak_ref` entries — when a key object is destroyed, the corresponding entry is removed from the map during the next garbage collection cycle.

---

## Patterns

- **WeakMap as Computed Cache:** Cache expensive computations tied to object lifetime. Benefit: automatic cache eviction when source object is GC'd. Tradeoff: value objects are strongly referenced and persist until key is GC'd.
- **WeakMap as Listener Registry:** Track event listeners keyed by subscriber objects. Benefit: automatic cleanup when subscriber is destroyed. Tradeoff: iteration order is not guaranteed.
- **WeakReference for Lazy Proxies:** Hold optional references to objects that should not prevent GC. Benefit: proxies don't leak memory. Tradeoff: proxy target may be collected unexpectedly.

---

## Architectural Decisions

**Use WeakMap for process-lifetime caches in singleton services.** WeakMaps keyed by model instances automatically evict cache entries when models go out of scope.

**Prefer WeakMap over SplObjectStorage for cache scenarios.** WeakMap auto-evicts entries without manual `detach()` calls.

**Inject WeakMap as a dependency rather than creating inline.** This allows testing and replacement in different contexts.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Automatic memory management | WeakMap not serializable | Cannot persist to sessions or caches |
| Prevents memory leaks in Octane | WeakMap is not thread-safe | Requires synchronization in coroutine environments |
| No manual cache invalidation | Values are strongly referenced | Large value objects may persist until key is GC'd |

---

## Performance Considerations

`WeakReference::get()` is cheap (equivalent to a null check) — amortized O(1). WeakMap lookups are O(1) on average, similar to `SplObjectStorage`. Auto-eviction in WeakMap is free — entries are removed when the key object's refcount hits zero during GC. In Octane, weak references prevent the accumulation pattern where each request leaves behind objects anchored by long-lived singletons.

---

## Production Considerations

Weak references cannot bypass access control — they only reference objects, not modify them. A WeakMap holding sensitive data as values must be managed carefully: the values persist until the key object is GC'd, which could happen later than expected. Do not use WeakReference for security-sensitive object tracking — the object might be GC'd unpredictably.

---

## Common Mistakes

**Using WeakReference to prevent GC** — the object is collected earlier than expected. Weak references are read-only pointers; the object must be held by a strong reference elsewhere.

**Not forcing GC in tests** — tests pass incorrectly without `gc_collect_cycles()`.

**Using WeakMap with scalar keys** — TypeError: WeakMap only accepts objects as keys.

**Storing WeakMaps in sessions** — serialization errors; process-memory only.

**Memory leak from WeakMap values** — the value is strongly referenced; if the key is never GC'd, the value leaks.

---

## Failure Modes

**Premature GC of reference target:** The strongly referenced object goes out of scope unexpectedly, causing `WeakReference::get()` to return null. Detection: proxy method calls throw RuntimeException. Mitigation: ensure strong reference is held for required lifetime.

**WeakMap accumulation from long-lived keys:** Singleton services hold WeakMap entries keyed by short-lived objects, but some key objects persist. Detection: memory grows over process lifetime. Mitigation: monitor memory in Octane workers.

**Serialization errors:** WeakMap or WeakReference objects inadvertently stored in sessions. Detection: serialization exceptions. Mitigation: never store weak references outside process memory.

---

## Ecosystem Usage

Weak references integrate with Laravel's service container (singleton WeakMaps), Octane's request lifecycle (memory leak prevention), and queue workers (listener registry cleanup). They are primarily used in infrastructure-level code (caches, registries, proxies) rather than application-level business logic.

---

## Related Knowledge Units

### Prerequisites
- PHP Object References and Garbage Collection
- PHP Memory Management
- Laravel Service Container

### Related Topics
- Memory Leak Debugging in PHP
- Laravel Octane Architecture
- Queue Worker Lifecycle

### Advanced Follow-up Topics
- PHP GC Cycle Detection and Collection
- WeakMap vs SplObjectStorage Benchmarks
- Reference Counting in Long-Running Processes

---

## Research Notes

WeakReference is available since PHP 7.4; WeakMap since PHP 8.0. WeakMap is superior to SplObjectStorage for caches because it auto-evicts. WeakMap implements `Map` interface and supports array access. Weak references are not serializable. In Octane, profiling memory before and after implementing weak references is essential. Use `gc_collect_cycles()` to force garbage collection during testing.

