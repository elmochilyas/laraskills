# Domain Repositories — Rules

---

## Rule: Design Repository Interfaces Around Domain Concepts
---
## Category
Design
---
## Rule
Name repository methods using domain language that describes the business query, not database operations. Never include SQL-like terms such as `findWhere`, `findByAttributes`, or `getWhere` in repository interfaces.
---
## Reason
A repository should present an in-memory collection of domain objects, abstracting away the persistence mechanism. SQL-like method names leak persistence concerns into the interface and defeat the purpose of the abstraction.
---
## Bad Example
```php
interface OrderRepository
{
    public function findWhere(array $criteria): Collection;
    public function findByUserId(int $userId): Collection;
    public function getWhereStatus(string $status): Collection;
}
```
---
## Good Example
```php
interface OrderRepository
{
    public function findById(int $id): ?Order;
    public function findPendingOrders(): Collection;
    public function findOrdersByCustomer(int $customerId): Collection;
    public function findOverdueOrders(CarbonDate $since): Collection;
}
```
---
## Exceptions
Generic specification-based repositories that accept `Specification` objects. Still, use domain terms for the specifications.
---
## Consequences Of Violation
Leaky abstraction where persistence terms escape into domain code, defeating the repository's purpose and coupling domain logic to database concepts.

---

## Rule: One Repository per Aggregate Root, Not per Entity
---
## Category
Architecture
---
## Rule
Create repository interfaces only for aggregate roots. Do not create repositories for child entities, value objects, or simple read-only models.
---
## Reason
Child entities are always accessed and modified through their aggregate root. Adding repositories for non-root entities encourages bypassing the root, violating aggregate consistency boundaries.
---
## Bad Example
```php
// Unnecessary — OrderItem is a child entity of Order aggregate
interface OrderItemRepository { ... }

// Over-engineering — User is a simple model without aggregate complexity
interface UserRepository { ... }
```
---
## Good Example
```php
// Necessary — Order is an aggregate root with complex persistence needs
interface OrderRepository { ... }

// No repository for OrderItem — accessed through Order aggregate root
// No repository for User — use Eloquent directly for simple CRUD
```
---
## Exceptions
When a non-root entity serves as an aggregate root in a different context (e.g., `Product` is a root in Inventory context). Only per root.
---
## Consequences Of Violation
Unnecessary abstraction bloat, child entities accessed outside their aggregate, and violation of the aggregate consistency boundary.

---

## Rule: Never Manage Transactions Inside Repositories
---
## Category
Architecture
---
## Rule
Keep transaction management (begin, commit, rollback) out of repository methods. Transactions belong in the use-case or application service layer.
---
## Reason
Repositories that manage transactions cause nested transaction bugs when multiple repositories are called within a single use case. Transaction boundaries are a use-case concern, not a data-access concern.
---
## Bad Example
```php
class EloquentOrderRepository implements OrderRepository
{
    public function save(Order $order): void
    {
        DB::beginTransaction(); // Repository manages its own transaction!

        try {
            $order->push();
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
```
---
## Good Example
```php
class EloquentOrderRepository implements OrderRepository
{
    public function save(Order $order): void
    {
        $order->push(); // No transaction — caller manages it
    }
}

// Use case manages transactions:
DB::transaction(function () use ($orderRepo, $invoiceRepo) {
    $orderRepo->save($order);
    $invoiceRepo->save($invoice);
});
```
---
## Exceptions
No common exceptions. Transaction boundaries always belong to the caller.
---
## Consequences Of Violation
Nested transaction errors, inability to compose multiple repository calls in a single transaction, and silent data inconsistency when partial saves succeed.

---

## Rule: Return Domain Objects or Collections, Never Query Builders
---
## Category
Architecture
---
## Rule
Ensure repository methods always return hydrated domain objects, collections of domain objects, or null. Never return Eloquent query builders, raw arrays, or paginator instances from repository interfaces.
---
## Reason
Returning builders or raw data structures forces callers to deal with persistence framework types, coupling domain code to the ORM and defeating the repository's abstraction purpose.
---
## Bad Example
```php
interface OrderRepository
{
    public function findPending(): Builder; // Returns query builder!
}
```
---
## Good Example
```php
interface OrderRepository
{
    public function findPending(): Collection; // Returns domain objects
    public function findById(int $id): ?Order; // Returns domain object or null
}
```
---
## Exceptions
Pagination results — return a `LengthAwarePaginator` wrapping domain objects if pagination is a domain concept. Otherwise, accept pagination parameters and return `Collection`.
---
## Consequences Of Violation
Leaky abstraction where callers must construct queries from partial builders, domain logic coupled to Eloquent's query builder API, and inability to swap persistence implementations.

---

## Rule: Keep Repository Interface Free of Eloquent-Specific Types
---
## Category
Architecture
---
## Rule
Never reference Eloquent-specific types (`Model`, `Builder`, `EloquentCollection`, `HasMany`, `BelongsTo`) in repository interface signatures.
---
## Reason
Repository interfaces sit in the domain layer, which must be persistence-ignorant. Eloquent types in the interface require domain code to depend on the ORM, defeating the purpose of the abstraction and preventing alternate implementations.
---
## Bad Example
```php
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

interface OrderRepository
{
    public function findWithItems(Model $order): Collection;
    // Eloquent types in domain interface — coupling!
}
```
---
## Good Example
```php
use Illuminate\Support\Collection;

interface OrderRepository
{
    public function findById(int $id): ?Order;
    public function findPending(): Collection;
}
// Only domain types and Laravel's Support Collection (generic, not ORM-specific)
```
---
## Exceptions
No common exceptions. The interface must be pure domain.
---
## Consequences Of Violation
Domain layer depends on the ORM, repository pattern provides no real abstraction, and implementing a non-Eloquent persistence requires changing the interface.

---

## Rule: Prefer Direct Eloquent Usage Over Repositories for Simple CRUD
---
## Category
Code Organization
---
## Rule
Do not create a repository for simple CRUD models where the only data source is Eloquent with a single database. Use Eloquent models directly for simple read/write operations.
---
## Reason
Repositories add a layer of indirection with no benefit when there is no persistence variation to abstract. A repository that mirrors Eloquent's API exactly is a leaky abstraction that increases maintenance without providing value.
---
## Bad Example
```php
// Over-engineering — User is simple CRUD with one data source
interface UserRepository
{
    public function find(int $id): ?User;
    public function findAll(): Collection;
    public function save(User $user): void;
    public function delete(User $user): void;
}
```
---
## Good Example
```php
// Use Eloquent directly:
$user = User::find($id);
User::where('active', true)->get();
```
---
## Exceptions
Models that are aggregate roots with complex persistence requirements, multiple data sources, or a requirement for in-memory test implementations.
---
## Consequences Of Violation
Increased code volume with no benefit, maintenance burden of keeping repository and Eloquent APIs synchronized, and developer frustration with unnecessary abstraction.

---

## Rule: Make Repository Methods Explicit About Their Query Intent
---
## Category
Maintainability
---
## Rule
Define specific query methods on the repository interface rather than a generic `findBy()` or `matching()` method that accepts arbitrary criteria.
---
## Reason
Generic query methods obscure what queries are actually possible and require callers to construct criteria objects. Explicit method names like `findActiveSubscribers()` or `findOrdersPlacedBetween()` make the repository's query capabilities self-documenting.
---
## Bad Example
```php
interface OrderRepository
{
    public function matching(Criteria $criteria): Collection;
    // What criteria are supported? Unknown without reading implementation
}
```
---
## Good Example
```php
interface OrderRepository
{
    public function findPlacedAfter(Carbon $date): Collection;
    public function findPending(): Collection;
    public function findByCustomer(int $customerId): Collection;
    // Each method is self-documenting
}
```
---
## Exceptions
When the number of query variations is very large and a specification pattern provides genuine value. Measure first — avoid spec over-engineering for small gains.
---
## Consequences Of Violation
Repository interfaces that hide their query capabilities, forcing developers to read implementations to understand what queries are available.
