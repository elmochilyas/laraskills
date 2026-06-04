## Rule 1: Decorator adds responsibilities to an object dynamically without modifying its class
---
## Category
Architecture
---
## Rule
Wrap an object with one or more Decorator classes that implement the same interface, adding behavior before/after delegating to the wrapped object.
---
## Reason
Decorator allows adding behavior at runtime without subclassing, keeping each decorator focused on a single concern.
---
## Bad Example
```php
class LoggingCachingOrderRepository extends EloquentOrderRepository
{
    public function find($id): ?Order
    {
        Log::info('Finding order');
        $result = Cache::remember("order.$id", 3600, fn() =>
            parent::find($id)
        );
        return $result;
    }
}
// Every combination needs a new subclass
```
---
## Good Example
```php
interface OrderRepository { public function find(OrderId $id): ?Order; }

class LoggingDecorator implements OrderRepository
{
    public function __construct(private OrderRepository $inner) {}
    public function find(OrderId $id): ?Order
    {
        Log::info("Finding order: $id");
        return $this->inner->find($id);
    }
}

class CachingDecorator implements OrderRepository
{
    public function __construct(private OrderRepository $inner) {}
    public function find(OrderId $id): ?Order
    {
        return Cache::remember("order.$id", 3600, fn() =>
            $this->inner->find($id)
        );
    }
}

// Compose at runtime:
$repo = new LoggingDecorator(new CachingDecorator(new EloquentOrderRepository()));
```
---
## Exceptions
When the behavior added is part of the core domain logic (should be in the class itself).
---
## Consequences Of Violation
Class explosion (every combination needs a subclass), SRP violation.
---
## Rule 2: Decorator implements the same interface as the component it wraps
---
## Category
Architecture
---
## Rule
The Decorator must implement the same interface as the object it decorates so that clients don't know they're using a decorated object.
---
## Reason
Transparency allows clients to use decorated and non-decorated objects interchangeably.
---
## Bad Example
```php
class LoggingOrderRepository
{
    // Does not implement OrderRepository
    public function findLogged(int $id): ?Order { /* ... */ }
}
```
---
## Good Example
```php
class LoggingDecorator implements OrderRepository
{
    public function __construct(private OrderRepository $inner) {}
    public function find(OrderId $id): ?Order { /* same interface */ }
}
```
---
## Exceptions
When the Decorator explicitly exposes information about its decoration (e.g., cache hit/miss indicators).
---
## Consequences Of Violation
Client knows about decoration, cannot transparently swap.
---
## Rule 3: Keep Decorators focused on a single cross-cutting concern
---
## Category
Architecture
---
## Rule
Each Decorator should add exactly one responsibility (logging, caching, timing, auth). Combine Decorators for multiple concerns.
---
## Reason
Multi-concern Decorators violate SRP and cannot be composed independently.
---
## Bad Example
```php
class MonitoringDecorator implements OrderRepository
{
    public function find(OrderId $id): ?Order
    {
        // Does both logging AND timing AND caching
    }
}
```
---
## Good Example
```php
$repo = new LoggingDecorator(
    new TimingDecorator(
        new CachingDecorator(
            new EloquentOrderRepository()
        )
    )
);
```
---
## Exceptions
When two concerns are intrinsically linked (e.g., timing always requires logging).
---
## Consequences Of Violation
SRP violation, cannot compose concerns independently.
---
## Rule 4: Use Decorator for infrastructure concerns around domain boundaries
---
## Category
Architecture
---
## Rule
Apply Decorators at the application/infrastructure boundary (wrapping repositories, services, command buses) for cross-cutting infrastructure concerns.
---
## Reason
Infrastructure concerns (logging, caching, transactions) should not be in domain code; Decorators keep them separate and composable.
---
## Bad Example
```php
class PlaceOrderHandler
{
    public function handle(PlaceOrder $command): void
    {
        DB::beginTransaction(); // infrastructure in application
        Log::info('Placing order'); // infrastructure
        // domain logic
        DB::commit();
    }
}
```
---
## Good Example
```php
// Decorators wrap the handler
$handler = new TransactionDecorator(
    new LoggingDecorator(
        new PlaceOrderHandler($repo, $events)
    )
);
```
---
## Exceptions
When the infrastructure concern is a domain requirement (audit logging that is a business rule).
---
## Consequences Of Violation
Domain mixed with infrastructure, untestable domain logic.
