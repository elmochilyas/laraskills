## Rule 1: Repository mediates between domain and data mapping layers using a collection-like interface
---
## Category
Architecture
---
## Rule
Repository provides a collection-like interface for accessing domain objects: `save()`, `find()`, `findAll()`, `delete()`. Domain logic uses Repository, not direct database access.
---
## Reason
Direct database access in domain logic couples the domain to persistence details, violating DIP and making testing impossible without a database.
---
## Bad Example
```php
class OrderService
{
    public function findOrder(OrderId $id): ?Order
    {
        return Order::find($id); // direct Active Record access
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private OrderRepository $orders // abstraction
    ) {}

    public function findOrder(OrderId $id): ?Order
    {
        return $this->orders->find($id);
    }
}
```
---
## Exceptions
Simple CRUD applications where Active Record is sufficient and the extra abstraction is not justified.
---
## Consequences Of Violation
Domain coupled to database, hard to test, difficult to swap storage.
---
## Rule 2: Repository interfaces belong in the domain layer
---
## Category
Architecture
---
## Rule
Define the Repository interface in the domain/persistence layer (hexagonal port); implement it in the infrastructure layer.
---
## Reason
DIP requires that high-level modules (domain) define the contracts that low-level modules (infrastructure) implement.
---
## Bad Example
```php
// Interface defined in infrastructure
namespace App\Infrastructure\Persistence;

interface OrderRepository {}
```
---
## Good Example
```php
// Interface defined in domain
namespace App\Domain\Order\Repositories;

interface OrderRepository
{
    public function save(Order $order): void;
    public function find(OrderId $id): ?Order;
}
```
---
## Exceptions
Repository interfaces for purely technical aggregations (e.g., a cache-backed report repository) that have no domain semantics.
---
## Consequences Of Violation
DIP violation, domain depends on infrastructure implementation detail.
---
## Rule 3: Repository methods should use domain types, not database types
---
## Category
Architecture
---
## Rule
Repository methods accept and return domain objects (e.g., `Order`, `CustomerId`), not database types (e.g., `array`, `Eloquent\Model`).
---
## Reason
Repository's purpose is to abstract persistence; using database types in the interface leaks persistence details to domain consumers.
---
## Bad Example
```php
interface OrderRepository
{
    public function save(array $data): void; // array — leaks DB representation
    public function find(int $id): ?EloquentModel; // Eloquent — leaks ORM
}
```
---
## Good Example
```php
interface OrderRepository
{
    public function save(Order $order): void; // domain type
    public function find(OrderId $id): ?Order; // domain type
}
```
---
## Exceptions
When the Repository is purely for read-optimized queries returning DTOs (CQRS read models).
---
## Consequences Of Violation
Persistence details leaked to domain, unable to swap implementations.
---
## Rule 4: Write Repository tests against a real database (integration test)
---
## Category
Testing
---
## Rule
Repository implementations should be tested with integration tests using a real (or test) database, not mocked.
---
## Reason
Repository implementation details (SQL, ORM) are the primary source of bugs; mocking them doesn't catch SQL errors, mapping bugs, or constraint violations.
---
## Bad Example
```php
class OrderRepositoryTest
{
    public function test_saves_order(): void
    {
        $repo = $this->createMock(OrderRepository::class); // tests nothing
    }
}
```
---
## Good Example
```php
class EloquentOrderRepositoryTest
{
    public function test_saves_and_retrieves_order(): void
    {
        $repo = new EloquentOrderRepository();
        $order = Order::create(/* ... */);
        $repo->save($order);
        $found = $repo->find($order->id());
        $this->assertTrue($found->id()->equals($order->id()));
    }
}
```
---
## Exceptions
When the Repository is an in-memory implementation (testing in isolation is fine for domain logic using it).
---
## Consequences Of Violation
Untested SQL/ORM logic, production bugs from repository implementation.
