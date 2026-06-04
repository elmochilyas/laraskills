# Weak Reference API Usage in Laravel

## Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** WeakReferenceApiUsage
**Difficulty:** Advanced
**Category:** Memory Optimization
**Last Updated:** 2026-06-04

## Overview

Weak Reference API Usage covers the application of PHP's `WeakReference` and `WeakMap` classes within the Laravel ecosystem. Introduced in PHP 7.4 (`WeakReference`) and PHP 8.0 (`WeakMap`), these primitives allow holding references to objects without preventing their garbage collection. In Laravel, they are useful for caching expensive operations, managing listeners, tracking objects in long-running processes (queues, Octane, Swoole), and preventing memory leaks in event-driven architectures.

A weak reference points to an object but does not increase its reference count. When all strong references to the object are removed, the object is garbage-collected, and the weak reference becomes invalid. `WeakMap` extends this concept to key-value mappings where keys are objects held as weak references — when the key object is GC'd, the entry is automatically removed.

Engineers should care because Laravel applications running under Octane, RoadRunner, or Swoole have long-lived processes where memory leaks accumulate. Using weak references for caches, listener registries, and deferred operations prevents unbounded memory growth. Additionally, background job processing and queue workers benefit from weak maps that clean themselves up automatically.

## Core Concepts

**WeakReference:** A PHP class that holds a weak reference to an object. Created via `WeakReference::create($object)`. The referenced object can be retrieved via `$weakRef->get()`, which returns `null` if the object has been garbage-collected.

**WeakMap:** An object-to-value mapping using weak references for keys. When the key object is destroyed, the entry is automatically removed. `WeakMap` implements `Map` interface and supports array-like access.

**Garbage Collection:** PHP's reference-counting garbage collector. An object is collected when its reference count drops to zero. Weak references do not contribute to the reference count.

**Long-Running Process Memory Management:** In Laravel Octane, Swoole, and queue workers, the PHP process lives across multiple requests/jobs. Objects that would normally be freed at request end persist unless explicitly unset. Weak references prevent these objects from anchoring larger object graphs.

**Cache Invalidation with Weak Maps:** Expensive computed data tied to an object's lifetime can be cached in a WeakMap. When the source object goes out of scope, the cached data is automatically evicted without manual invalidation.

**Listener Registries:** Event listeners or observers registered during a request in an Octane environment accumulate across requests. Weak maps can track listeners keyed by subscriber objects, automatically cleaning up when the subscriber is destroyed.

## When To Use

- Long-running Laravel processes (Octane, Swoole, RoadRunner)
- Queue workers processing thousands of jobs
- Event listener registries that grow over process lifetime
- Caching computed data tied to object lifetime
- Decorator or proxy patterns where the original object may be garbage-collected
- Preventing memory leaks in observer/subscriber patterns

## When NOT To Use

- Short-lived request lifecycle (traditional PHP-FPM) — objects are freed at request end
- When the referenced object must be kept alive (use strong references)
- Simple caching scenarios where TTL-based invalidation is sufficient (use Cache facade)
- When performance overhead of WeakReference lookup is unacceptable (micro-optimization context)

## Best Practices

**Use WeakMap for Caches:** Cache expensive computations tied to object lifetime. Example: caching a model's computed permissions in a WeakMap keyed by the model instance. When the model goes out of scope, the cache entry is automatically evicted.

**Use WeakReference for Optional Dependencies:** When an object optionally holds a reference to another object that should not prevent GC, use `WeakReference`. Common in proxy patterns and lazy initialization.

**Clean Up Weak References Immediately:** After `$weakRef->get()` returns `null`, remove any associated data structures. Don't rely solely on WeakMap auto-eviction for dependent data.

**Combine with Destructor Hooks:** Use `__destruct()` to trigger cleanups for non-weak data associated with the object. Weak references handle the GC aspect; destructors handle explicit teardown.

**Monitor Memory in Octane:** Profile Octane workers before and after implementing weak references. Tools like `memory_get_usage()` and Laravel's built-in memory reporting help validate improvements.

**Prefer WeakMap Over SplObjectStorage:** `WeakMap` (PHP 8.0+) is superior to `SplObjectStorage` for cache scenarios because it auto-evicts entries without manual `detach()` calls.

## Architecture Guidelines

**Service Layer Integration:** Use weak references in service classes that maintain caches or registries. Inject the WeakMap as a dependency rather than creating it inline — this allows testing and replacement.

**Singleton Safety:** WeakMaps used in singleton services (registered in the container with `singleton()`) must be carefully managed. The WeakMap itself persists for the process lifetime; only its entries (keyed by objects) are cleaned up automatically.

**Concurrency Considerations:** WeakMap is not thread-safe. In Swoole or coroutine environments, use proper synchronization when accessing shared WeakMaps. Octane's request-isolated context reduces this concern because each request operates on its own set of objects.

**Testing Weak References:** Create objects in test scopes, verify they are removed from WeakMaps after going out of scope. Use `gc_collect_cycles()` to force garbage collection during testing.

**Serialization:** WeakReference and WeakMap objects cannot be serialized. Do not store them in sessions, caches, or queue payloads. They are process-memory-only constructs.

## Performance Considerations

- WeakReference::get() is cheap (equivalent to a null check) — amortized O(1)
- WeakMap lookups are O(1) on average, similar to SplObjectStorage
- Auto-eviction in WeakMap is free — entries are removed when the key object's refcount hits zero during GC
- The GC cycle detection (for cyclic references) is unaffected by weak references
- In Octane, weak references prevent the accumulation pattern where each request leaves behind objects anchored by long-lived singletons

## Security Considerations

- Weak references cannot bypass access control — they only reference objects, not modify them
- A WeakMap holding sensitive data as values must be managed carefully: the values persist until the key object is GC'd, which could happen later than expected
- Do not use WeakReference for security-sensitive object tracking (authorization checks) — the object might be GC'd unpredictably
- Weak references do not protect against memory exhaustion from large value objects held in WeakMaps — the values themselves are strongly referenced

## Common Mistakes

**Using WeakReference to Prevent GC:** Believing WeakReference keeps the object alive.

**Why developers make it:** Confusing weak references with strong references. Developers think WeakReference is a "weaker" strong reference.

**Consequences:** Object is garbage collected earlier than expected. `$weakRef->get()` returns null.

**Better approach:** Understand that weak references are read-only pointers. The referenced object must be held by a strong reference elsewhere.

**Not Forcing GC in Tests:** Writing tests for weak reference behavior without calling `gc_collect_cycles()`.

**Why developers make it:** Assuming PHP garbage collection is immediate when variables go out of scope.

**Consequences:** Tests pass incorrectly. Weak references appear valid when they should be null.

**Better approach:** Call `gc_collect_cycles()` after the strong reference goes out of scope to force collection.

**Using WeakMap with Scalar Keys:** Attempting to use strings, integers, or arrays as WeakMap keys.

**Why developers make it:** Treating WeakMap like a regular array or SplObjectStorage.

**Consequences:** TypeError — WeakMap only accepts objects as keys.

**Better approach:** Wrap scalar values in an object, or use a regular array with manual cleanup.

**Storing WeakMaps in Sessions:** Trying to persist WeakMaps across requests.

**Why developers make it:** Not realizing WeakMaps are process-memory only.

**Consequences:** Serialization errors. Data loss across requests.

**Better approach:** Use Laravel Cache for cross-request storage. WeakMaps are for process-lifetime data only.

**Memory Leak from WeakMap Values:** The WeakMap key is weakly referenced, but the value is strongly referenced.

**Why developers make it:** Assuming both key and value are weakly referenced.

**Consequences:** The value object (potentially large) persists until the key is GC'd. If the key is never GC'd, the value leaks.

**Better approach:** Ensure the key object has a bounded lifetime. Consider the memory footprint of stored values.

## Anti-Patterns

**WeakReference as a Crutch:** Using weak references to compensate for unclear ownership semantics. Ownership should be explicit; weak references are an optimization, not a design tool.

**Global WeakMap Registries:** A single global WeakMap accumulating object-keyed entries across the entire process lifetime. This defeats the purpose of automatic cleanup — entries will accumulate if the key objects never go out of scope.

**Circular Weak References:** Object A holds a WeakReference to B, and B holds a WeakReference to A. This doesn't create a cycle (weak refs don't count), but it indicates confused ownership.

**WeakMap for Request-Scoped Data:** Using WeakMap to cache data within a single request when request-scoped arrays are simpler and faster. WeakMap should only be used when the cache spans process lifetime.

**Skipping Profiling:** Applying weak references without profiling memory usage first. Weak references add complexity; verify they solve a real memory problem.

## Examples

### Caching Computed Permissions
```php
class PermissionCache
{
    private WeakMap $cache;

    public function __construct()
    {
        $this->cache = new WeakMap();
    }

    public function getPermissions(User $user): array
    {
        if (isset($this->cache[$user])) {
            return $this->cache[$user];
        }

        $permissions = $this->computePermissions($user);
        $this->cache[$user] = $permissions;

        return $permissions;
    }

    private function computePermissions(User $user): array
    {
        return $user->roles
            ->flatMap(fn ($role) => $role->permissions)
            ->pluck('name')
            ->unique()
            ->values()
            ->toArray();
    }
}
```

### Event Listener Registry with WeakMap
```php
class ListenerRegistry
{
    private WeakMap $listeners;

    public function __construct()
    {
        $this->listeners = new WeakMap();
    }

    public function register(object $subscriber, string $event, callable $listener): void
    {
        if (!isset($this->listeners[$subscriber])) {
            $this->listeners[$subscriber] = [];
        }
        $this->listeners[$subscriber][$event] = $listener;
    }

    public function getListenersFor(string $event): array
    {
        $matched = [];
        foreach ($this->listeners as $subscriber => $events) {
            if (isset($events[$event])) {
                $matched[] = $events[$event];
            }
        }
        return $matched;
    }
}
```

### WeakReference for Lazy Proxies
```php
class LazyModelProxy
{
    private WeakReference $target;

    public function __construct(object $target)
    {
        $this->target = WeakReference::create($target);
    }

    public function getTarget(): ?object
    {
        return $this->target->get();
    }

    public function __call(string $method, array $args): mixed
    {
        $target = $this->target->get();
        if ($target === null) {
            throw new RuntimeException('Target has been garbage collected');
        }
        return $target->$method(...$args);
    }
}
```

## Related Topics

**Prerequisites:**
- PHP Object References and Garbage Collection
- PHP Memory Management
- Laravel Service Container

**Closely Related:**
- Memory Leak Debugging in PHP
- Laravel Octane Architecture
- Queue Worker Lifecycle

**Advanced Follow-Up:**
- PHP GC Cycle Detection and Collection
- WeakMap vs SplObjectStorage Benchmarks
- Reference Counting in Long-Running Processes

**Cross-Domain Connections:**
- PHP 8.0+ Language Features
- Flyweight Pattern
- Proxy Pattern
- Observer Pattern Memory Management

