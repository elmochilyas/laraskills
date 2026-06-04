## Use Feature-Oriented Repositories Always If Using Repositories
---
## Architecture
---
## Rule
If you use repositories at all, always use feature-oriented repositories with business-specific query methods. Never create generic CRUD repositories.
---
## Reason
Feature-oriented methods like `findOverdueInvoices()` centralize meaningful query logic. Generic CRUD methods like `findAll()` add ceremony without business value.
---
## Bad Example
```php
class UserRepository
{
    public function find(int $id): ?User { return User::find($id); }
    public function findAll(): Collection { return User::all(); }
    public function create(array $data): User { return User::create($data); }
    public function update(int $id, array $data): int { return User::whereId($id)->update($data); }
    public function delete(int $id): bool { return (bool) User::destroy($id); }
}
// All methods mirror Eloquent — no business value
```
---
## Good Example
```php
class InvoiceRepository
{
    public function findOverdue(int $days): Collection
    {
        return Invoice::where('status', 'pending')
            ->where('due_date', '<', now()->subDays($days))
            ->get();
    }

    public function getMonthlyTotals(string $year): Collection
    {
        return Invoice::whereYear('created_at', $year)
            ->select(DB::raw('MONTH(created_at) as month, SUM(total) as total'))
            ->groupBy('month')
            ->get();
    }
}
// Feature-oriented methods centralize real query logic
```
---
## Exceptions
No common exceptions. If using repositories, they must be feature-oriented.
---
## Consequences Of Violation
Ceremony without value, developers question the pattern's purpose, wasted maintenance.

## Name Methods After Business Queries, Not Data Operations
---
## Maintainability
---
## Rule
Name repository methods after business queries, not data operations. Use `findOverdueInvoices()` instead of `findAll()`. Use `getTopCustomersByRevenue()` instead of `getAll()`.
---
## Reason
Business-oriented method names communicate what the query does in domain terms. Data-oriented names hide the business purpose.
---
## Bad Example
```php
class InvoiceRepository
{
    public function findAll(): Collection { /* What does "all" mean? */ }
    public function findWhere(array $conditions): Collection { /* What conditions? */ }
    public function getSome(): Collection { /* Which ones? */ }
}
```
---
## Good Example
```php
class InvoiceRepository
{
    public function findOverdue(int $days): Collection { /* Clear business purpose */ }
    public function findPendingForCustomer(int $customerId): Collection { /* Clear business purpose */ }
    public function getMonthlyRevenue(string $yearMonth): Money { /* Clear business purpose */ }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unclear query purpose, requires reading the method body to understand what it does, violates self-documenting code.

## Return The Right Type Per Method
---
## Architecture
---
## Rule
Each repository method should return the most appropriate type for that specific query. Not every method needs to return Eloquent models — return DTOs, value objects, or primitives where appropriate.
---
## Reason
Forcing all methods to return Eloquent models leaks ORM coupling and prevents using the most efficient representation (e.g., returning a Money value object for revenue queries).
---
## Bad Example
```php
class InvoiceRepository
{
    // Returns model collection even for aggregated data
    public function getMonthlyRevenue(string $yearMonth): Collection
    {
        return Invoice::where('status', 'paid')
            ->whereRaw("DATE_FORMAT(paid_at, '%Y-%m') = ?", [$yearMonth])
            ->get(); // Returns invoices, not revenue
    }
}
// Caller must sum manually
$revenue = $this->invoices->getMonthlyRevenue('2024-01')->sum('total');
```
---
## Good Example
```php
class InvoiceRepository
{
    public function getMonthlyRevenue(string $yearMonth): Money
    {
        $total = Invoice::where('status', 'paid')
            ->whereRaw("DATE_FORMAT(paid_at, '%Y-%m') = ?", [$yearMonth])
            ->sum('total');

        return Money::of($total, 'USD');
    }
}
// Returns the right type — caller gets ready-to-use data
```
---
## Exceptions
Repository methods that return full entities for modification (write operations need models).
---
## Consequences Of Violation
ORM coupling leaked to callers, inefficient data retrieval, wrong abstraction level.

## Avoid Repository With 50+ Methods
---
## Maintainability
---
## Rule
Keep the number of methods on a single repository under 50. If it exceeds this, split into multiple repositories by concern.
---
## Reason
A repository with 50+ methods becomes a data access god object. It violates the Single Responsibility Principle and is hard to test, navigate, and maintain.
---
## Bad Example
```php
class OrderRepository
{
    public function findById(int $id): ?Order {}
    public function findByUser(int $userId): Collection {}
    public function findOverdue(int $days): Collection {}
    public function findPending(): Collection {}
    public function findShipped(): Collection {}
    public function findCancelled(): Collection {}
    public function findByDateRange(string $from, string $to): Collection {}
    public function findByStatusAndDate(string $status, string $from, string $to): Collection {}
    // 55+ methods — god repository
}
```
---
## Good Example
```php
class OrderQueryRepository { /* Query-related methods */ }
class OrderReportRepository { /* Reporting-related methods */ }
class OrderSearchRepository { /* Search-related methods */ }
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
God repository, difficult testing, navigation challenges, unclear responsibility.

## Repository Per Aggregate Root, Not Per Table
---
## Architecture
---
## Rule
Create repositories per aggregate root, not per database table. Group related data access for a domain aggregate in one repository.
---
## Reason
Aggregate roots (Order, User) are the transactional boundaries in domain-driven design. A repository per table fragments data access that should be coordinated.
---
## Bad Example
```php
// Repository per table — fragments related data
class OrdersTableRepository { /* order table queries */ }
class OrderItemsTableRepository { /* order_items table queries */ }
class OrderPaymentsTableRepository { /* order_payments table queries */ }
// Transaction involving order + items + payments needs 3 repositories
```
---
## Good Example
```php
// Repository per aggregate root — groups related data
class OrderRepository
{
    public function findById(int $id): Order { /* eager loads items, payments */ }
    public function create(array $data): Order { /* creates order + items + payment */ }
}
// One repository handles the entire Order aggregate
```
---
## Exceptions
Simple tables that are not part of any aggregate (lookup tables, configuration).
---
## Consequences Of Violation
Fragmented data access, difficult to maintain transactional consistency across related tables.

## Do Not Use Generic Base Repository
---
## Architecture
---
## Rule
Never create a generic `BaseRepository` with shared CRUD methods that all entity repositories extend. Each repository should stand alone with its domain-specific methods.
---
## Reason
Generic base repositories recreate the generic CRUD problem at the inheritance level. They force all repositories to have methods they don't need and prevent per-repository type specialization.
---
## Bad Example
```php
abstract class BaseRepository
{
    public function find(int $id): ?Model { return $this->model->find($id); }
    public function findAll(): Collection { return $this->model->all(); }
    public function create(array $data): Model { return $this->model->create($data); }
    public function update(int $id, array $data): bool { /* ... */ }
    public function delete(int $id): bool { /* ... */ }
    public function paginate(int $perPage): LengthAwarePaginator { /* ... */ }
    public function count(): int { /* ... */ }
    // 15 shared CRUD methods
}

class UserRepository extends BaseRepository { /* Inherits all CRUD */ }
class OrderRepository extends BaseRepository { /* Inherits all CRUD */ }
class ProductRepository extends BaseRepository { /* Inherits all CRUD */ }
```
---
## Good Example
```php
// No base — each repository has only what it needs
class UserRepository
{
    public function findActiveSubscribers(): Collection { /* domain-specific */ }
    public function findInactiveSince(Carbon $date): Collection { /* domain-specific */ }
}

class OrderRepository
{
    public function findOverdue(int $days): Collection { /* domain-specific */ }
    public function getMonthlyRevenue(string $yearMonth): Money { /* domain-specific */ }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Generic CRUD through inheritance, no domain-specific methods, repos become pointless wrappers.
