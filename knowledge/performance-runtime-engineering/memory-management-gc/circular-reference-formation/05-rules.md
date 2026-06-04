---
## Rule Name

Use WeakReference for Parent-Child Back-References

## Category

Architecture

## Rule

Use `WeakReference` for parent back-references in object graphs (child referencing parent). Never use strong references for back-pointers.

## Reason

A strong parent back-reference creates a circular reference (parent->child->parent). Reference counting cannot resolve this — both objects show refcount=1 even when no external references exist. The cyclic GC must intervene, and until it does, memory is unreclaimable.

## Bad Example

```php
$parent->child = $child;
$child->parent = $parent;  // Strong back-reference — circular
```

## Good Example

```php
$parent->child = $child;
$child->parentRef = WeakReference::create($parent);  // No cycle
// Access: $child->parentRef->get() — null if parent is gone
```

## Exceptions

ORM entity relationships where bidirectional navigation is essential and lifecycle is explicitly managed.

## Consequences Of Violation

Circular references that require GC to reclaim memory, unpredictable memory accumulation in long-running processes.

---

## Rule Name

Unregister Event Listeners Explicitly in Long-Running Processes

## Category

Reliability

## Rule

Always unregister event listeners that capture scope variables when the listener or subject is no longer needed in Octane/Swoole workers.

## Reason

Event listeners that capture `$this`, `$subject`, or other objects via Closure `use` create hidden circular references. Each listener that captures the dispatcher or subject prevents both from being freed. In short-lived FPM processes, this is harmless. In persistent workers, listeners accumulate and leak memory.

## Bad Example

```php
// Listener captures $subject — cycle formed
Event::listen(OrderShipped::class, function ($event) use ($subject) {
    $subject->notify($event);
});  // Listener accumulates, $subject cannot be freed
```

## Good Example

```php
// Register once at boot — never per-request
Octane::booted(function () {
    Event::listen(OrderShipped::class, SendNotification::class);
});  // No Closure, no cycle
```

## Exceptions

PHP-FPM processes where memory is reset per request.

## Consequences Of Violation

Accumulated listeners consume memory, captured objects cannot be freed, worker RSS grows linearly with request count.

---

## Rule Name

Monitor Root Buffer Growth as a Cycle Leak Indicator

## Category

Performance

## Rule

Track `gc_status()['roots']` over time in long-running processes. Monotonic growth in root buffer entries signals that cycles are forming faster than collection resolves them.

## Reason

A healthy worker shows stable or cycling root buffer entries — roots increase, GC runs, roots drop. Monotonic growth means the root buffer is filling between GC runs, indicating cycle accumulation that eventually overwhelms the collector.

## Bad Example

```bash
# Ignoring roots = 8500 after 5000 requests (started at 200)
# GC threshold is 10000 — near overflow
```

## Good Example

```bash
# Roots stable at 200-500 over 5000 requests
# GC is collecting cycles faster than they form — healthy
```

## Exceptions

No common exceptions. Monotonic root growth always indicates a cycle leak.

## Consequences Of Violation

GC root buffer overflow triggers automatic collection at unpredictable times, latency spikes, eventual OOM.

---

## Rule Name

Clear SplObjectStorage Entries When Objects Are No Longer Needed

## Category

Maintainability

## Rule

Explicitly remove entries from `SplObjectStorage` when the stored objects are no longer needed.

## Reason

`SplObjectStorage` holds strong references to its keys. As long as an object is in the storage, it cannot be freed, even if no other references exist. This creates a reference chain that prevents GC.

## Bad Example

```php
static $cache = new SplObjectStorage();
$cache[$object] = $data;
// $object still referenced by $cache — cannot be freed
```

## Good Example

```php
static $cache = new SplObjectStorage();
$cache[$object] = $data;
// When object is no longer needed:
$cache->detach($object);
// Or use WeakMap (PHP 8.0+) for automatic cleanup
```

## Exceptions

Short-lived caches that are themselves freed after each request.

## Consequences Of Violation

Objects pinned in memory by SplObjectStorage references, gradual memory growth in long-running processes.

---

## Rule Name

Avoid Self-References in Singleton Patterns

## Category

Architecture

## Rule

Never create self-referencing properties in singleton or long-lived objects.

## Reason

`$this->self = $this` creates a circular reference where an object holds a reference to itself. The refcount never drops below 1, and the object cannot be freed even with `gc_collect_cycles()` until the self-reference is explicitly removed.

## Bad Example

```php
class Registry {
    public static Registry $instance;
    public ?Registry $self = null;
    
    public static function getInstance(): Registry {
        if (!isset(self::$instance)) {
            self::$instance = new self();
            self::$instance->self = self::$instance;  // Self-reference — never freed
        }
        return self::$instance;
    }
}
```

## Good Example

```php
class Registry {
    public static Registry $instance;
    // No self-reference — normal singleton
}
```

## Exceptions

No common exceptions. Self-references are never necessary in well-designed code.

## Consequences Of Violation

Object is permanently pinned in memory, cannot be garbage collected, causes unreclaimable memory leak.
