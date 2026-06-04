## Keep object reference trees shallower than 5 levels
---
Category: Architecture
---
Design object graphs with at most 5 levels of nested references. Flatten or denormalize beyond this threshold.
---
Reason: Each level adds pointer dereference cost, GC scanning overhead, and serialization complexity. Deep trees are hard to debug and optimize.
---
Bad Example:
```php
// 7 levels: Request → Controller→Service→Repository→Model→Relation→SubRelation
```

Good Example:
```php
// 3 levels: Controller→DTO→Collection (flat data)
```
---
Exceptions: Domain models in well-bounded contexts where deep trees are inherent (e.g., nested comment threads with lazy loading).
---
Consequences Of Violation: 2-5ms additional GC traversal, higher memory fragmentation, slower serialization.

## Use WeakReference to break intentional circular references
---
Category: Architecture
---
When two objects must reference each other (parent-child, observer-subject), use `WeakReference` on one side of the cycle.
---
Reason: Each circular reference adds an entry to the GC root buffer. WeakReference does not increment refcount, so the cycle is broken without the GC collector.
---
Bad Example:
```php
class ParentNode {
    public ChildNode $child; // Strong ref: cycle created
}
class ChildNode {
    public ParentNode $parent; // Strong ref: cycle completed
}
```

Good Example:
```php
class ChildNode {
    private WeakReference $parentRef;
    public function setParent(ParentNode $parent): void {
        $this->parentRef = WeakReference::create($parent);
    }
}
```
---
Exceptions: Short-lived objects in PHP-FPM where the cycle is freed at request end anyway.
---
Consequences Of Violation: GC root buffer growth, 1-5% CPU overhead from cycle detection in persistent runtimes.

## Return DTOs instead of entity objects across layer boundaries
---
Category: Architecture
---
Repositories, services, and controllers should return readonly DTOs or plain data structures, not full Eloquent models with all relationships loaded.
---
Reason: DTOs have no object references beyond their own properties. They decouple memory graphs between layers and eliminate reference tree depth.
---
Bad Example:
```php
class OrderController {
    public function show(Order $order): array {
        return $order->load('items.product.category'); // Deep reference tree returned
    }
}
```

Good Example:
```php
readonly class OrderDTO {
    public function __construct(
        public int $id,
        public float $total,
        public array $items,
    ) {}
}

class OrderController {
    public function show(Order $order): OrderDTO {
        return OrderDTO::fromModel($order); // Flat data, no references
    }
}
```
---
Exceptions: Internal service-to-service calls within the same bounded context where entity identity is required.
---
Consequences Of Violation: Memory leaks from retained entity references, unnecessary data exposure, serialization overhead.

## Nullify object references explicitly in Octane workers
---
Category: Performance
---
In `Laravel\Octane\Events\RequestHandled` listeners or tick hooks, explicitly set per-request object references to null.
---
Reason: Octane preserves the object heap across requests. References from request N prevent garbage collection of entire object trees in request N+1.
---
Bad Example:
```php
class ReportService {
    private array $cachedData = [];
    public function generate(): array {
        // $this->cachedData persists across requests in Octane
    }
}
```

Good Example:
```php
class ReportService {
    public function generate(): array {
        $data = []; // Local variable — freed after each request
        // ...
        return $data;
    }
}
```
---
Exceptions: Services designed as singletons with intentional cross-request caching and explicit lifecycle management.
---
Consequences Of Violation: Cumulative memory growth, worker OOM after hours or days of operation.
