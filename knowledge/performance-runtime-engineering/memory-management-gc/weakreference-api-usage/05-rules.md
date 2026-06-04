---
## Rule Name

Always Null-Check WeakReference::get()

## Category

Reliability

## Rule

Always check that `WeakReference::get()` returns non-null before using the returned object.

## Reason

The object backing a WeakReference can be freed at any time when all strong references are gone. `WeakReference::get()` returns `null` if the object has been collected. Dereferencing without checking causes errors.

## Bad Example

```php
$weakRef = WeakReference::create($object);
$weakRef->get()->doSomething();  // Fatal error if object was freed
```

## Good Example

```php
$weakRef = WeakReference::create($object);
$obj = $weakRef->get();
if ($obj !== null) {
    $obj->doSomething();
}
```

## Exceptions

No common exceptions. The object can always be collected before get() is called.

## Consequences Of Violation

Unexpected null pointer errors, hard-to-reproduce crashes in production.

---

## Rule Name

Use WeakReference for Observer Patterns

## Category

Architecture

## Rule

Store observer/listener references as `WeakReference` in subject objects to prevent circular references that leak memory.

## Reason

Strong references from subject to observer create a reachability path that prevents garbage collection. WeakReference allows the subject to notify observers without preventing the observers from being freed when no longer needed.

## Bad Example

```php
class EventSubject {
    private array $observers = [];
    
    public function attach(object $observer): void {
        $this->observers[] = $observer;  // Strong ref — cycle risk
    }
}
```

## Good Example

```php
class EventSubject {
    private array $observers = [];
    
    public function attach(object $observer): void {
        $this->observers[] = WeakReference::create($observer);
    }
    
    public function notify(): void {
        foreach ($this->observers as $key => $weakRef) {
            $observer = $weakRef->get();
            if ($observer === null) {
                unset($this->observers[$key]);
                continue;
            }
            $observer->handleEvent($this);
        }
    }
}
```

## Exceptions

When the observer must be guaranteed to live as long as the subject (use strong references explicitly).

## Consequences Of Violation

Circular reference prevents object collection, memory accumulates in long-running processes, eventual OOM.

---

## Rule Name

Clean Up Stale WeakReferences Periodically

## Category

Maintainability

## Rule

Periodically remove WeakReference entries whose `get()` returns null, especially from long-running caches or observer lists.

## Reason

Accumulated null WeakReferences waste memory and iteration time. Each dead entry represents an object that was freed. Over time, these entries can grow unbounded in long-running processes.

## Bad Example

```php
// Never cleaned — entries accumulate over millions of requests
private array $cache = [];

public function set(object $value): void {
    $this->cache[] = WeakReference::create($value);
}
```

## Good Example

```php
public function set(object $value): void {
    $id = spl_object_id($value);
    $this->cache[$id] = WeakReference::create($value);
}

public function get(string $id): ?object {
    $ref = $this->cache[$id] ?? null;
    if ($ref === null) return null;
    $obj = $ref->get();
    if ($obj === null) {
        unset($this->cache[$id]);  // Clean up on access
    }
    return $obj;
}
```

## Exceptions

Short-lived caches that are themselves freed after a single request.

## Consequences Of Violation

Growing memory footprint from dead WeakReference entries, slower iteration over observer lists, wasted CPU on null-checks for collected objects.

---

## Rule Name

Use WeakReference for Caches, Not WeakMap Misapplications

## Category

Architecture

## Rule

Use `WeakReference` for caching a single object and `WeakMap` for mapping object keys to values. Do not use one as a substitute for the other.

## Reason

WeakReference wraps a single object with weak semantics — the reference does not prevent collection. WeakMap (PHP 8.0+) stores key-value pairs where the key is a weak object reference. Each has distinct semantics and use cases.

## Bad Example

```php
// Using WeakMap when a single WeakReference suffices
$map = new WeakMap();
$map[$object] = $data;
```

## Good Example

```php
// WeakReference for a single cached object
$cache = WeakReference::create($object);

// WeakMap for object-keyed data
$map = new WeakMap();
$map[$object] = $data;
```

## Exceptions

No common exceptions. Use the correct API for the use case.

## Consequences Of Violation

Unnecessary complexity in single-object caching, missing null-safety checks, or incorrect weak semantics.

---

## Rule Name

Do Not Use WeakReference for Required Dependencies

## Category

Architecture

## Rule

Never use WeakReference for dependencies that are required for correct operation (not optional caches or listeners).

## Reason

Required dependencies must be strong references that guarantee object availability. WeakReference makes the dependency optional — the object can be freed at any time, causing the depending code to fail.

## Bad Example

```php
class ReportGenerator {
    private WeakReference $db;  // Database connection could disappear!
    
    public function __construct(Connection $db) {
        $this->db = WeakReference::create($db);
    }
}
```

## Good Example

```php
class ReportGenerator {
    private Connection $db;  // Strong reference — always available
    
    public function __construct(Connection $db) {
        $this->db = $db;
    }
}
```

## Exceptions

No common exceptions. Required dependencies must use strong references.

## Consequences Of Violation

Intermittent failures when the backing object is freed, hard-to-reproduce bugs, unexpected null checks where null should never occur.
