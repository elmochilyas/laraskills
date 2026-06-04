## Use Feature-Oriented Repositories, Not Generic CRUD
---
## Architecture
---
## Rule
If you use repositories at all, use feature-oriented repositories with business-specific query methods. Never use generic CRUD repositories that mirror Eloquent one-to-one.
---
## Reason
Generic CRUD repositories (find, all, create, update, delete) add ceremony without value. Feature-oriented methods like `findOverdueInvoices()` centralize meaningful query logic.
---
## Bad Example
```php
class UserRepository
{
    public function find(int $id): ?User { return User::find($id); }
    public function findAll(): Collection { return User::all(); }
    public function create(array $data): User { return User::create($data); }
    public function update(int $id, array $data): bool { return User::whereId($id)->update($data); }
    public function delete(int $id): bool { return User::destroy($id); }
}
// Mirrors Eloquent exactly — zero value added
```
---
## Good Example
```php
interface InvoiceRepository
{
    public function findOverdue(int $days): Collection;
    public function findPendingForUser(int $userId): Collection;
    public function getMonthlyRevenue(string $yearMonth): Money;
}

class EloquentInvoiceRepository implements InvoiceRepository
{
    public function findOverdue(int $days): Collection
    {
        return Invoice::where('status', 'pending')
            ->where('due_date', '<', now()->subDays($days))
            ->get();
    }

    public function getMonthlyRevenue(string $yearMonth): Money
    {
        return Money::of(
            Invoice::where('status', 'paid')
                ->whereRaw("DATE_FORMAT(paid_at, '%Y-%m') = ?", [$yearMonth])
                ->sum('total'),
            'USD'
        );
    }
}
```
---
## Exceptions
No common exceptions. If using repositories, they must be feature-oriented.
---
## Consequences Of Violation
Ceremony without value, repository is a pointless wrapper, team questions the value of the pattern.

## Skip The BaseRepository
---
## Architecture
---
## Rule
Never create a `BaseRepository` or generic repository with shared CRUD methods that every entity repository extends.
---
## Reason
Generic BaseRepository recreates the problem at the inheritance level. Each repository should have methods specific to its domain, not inherited CRUD.
---
## Bad Example
```php
abstract class BaseRepository
{
    public function find(int $id): ?Model { /* ... */ }
    public function findAll(): Collection { /* ... */ }
    public function create(array $data): Model { /* ... */ }
    public function update(int $id, array $data): bool { /* ... */ }
    public function delete(int $id): bool { /* ... */ }
}

class UserRepository extends BaseRepository { /* Inherits all CRUD, adds nothing */ }
class OrderRepository extends BaseRepository { /* Inherits all CRUD, adds nothing */ }
class ProductRepository extends BaseRepository { /* Inherits all CRUD, adds nothing */ }
```
---
## Good Example
```php
// No BaseRepository — each repository has domain-specific methods
class UserRepository
{
    public function findActiveSubscribers(): Collection { /* domain-specific */ }
    public function findByEmail(string $email): ?User { /* domain-specific */ }
}

class OrderRepository
{
    public function findOverdue(int $days): Collection { /* domain-specific */ }
    public function getMonthlyTotals(string $year): array { /* domain-specific */ }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Generic CRUD through inheritance, no domain-specific query methods, repos become pointless wrappers.

## Test Repository Methods With Integration Tests
---
## Testing
---
## Rule
Write integration tests for every repository method that contains non-trivial query logic. Test against a real database.
---
## Reason
A feature-oriented method with a wrong WHERE clause is a data retrieval bug that mocks won't catch. Integration tests verify the actual SQL works correctly.
---
## Bad Example
```php
class InvoiceRepository
{
    public function findOverdue(int $days): Collection
    {
        return Invoice::where('status', 'pending')
            ->where('due_date', '<', now()->subDays($days))
            ->get();
    }
}

// No test — bug in WHERE clause goes to production
// Mocked test passes because mock returns expected collection
```
---
## Good Example
```php
class InvoiceRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_finds_overdue_invoices(): void
    {
        $overdue = Invoice::factory()->create([
            'status' => 'pending',
            'due_date' => now()->subDays(40),
        ]);
        $notOverdue = Invoice::factory()->create([
            'status' => 'pending',
            'due_date' => now()->subDays(10),
        ]);
        $paid = Invoice::factory()->create([
            'status' => 'paid',
            'due_date' => now()->subDays(40),
        ]);

        $result = app(InvoiceRepository::class)->findOverdue(30);

        $this->assertTrue($result->contains($overdue));
        $this->assertFalse($result->contains($notOverdue));
        $this->assertFalse($result->contains($paid));
    }
}
```
---
## Exceptions
Simple find-by-id methods that test basic Eloquent behavior.
---
## Consequences Of Violation
Untested query logic, bugs discovered in production, false confidence from mocked tests.

## If "Swap The Database" Is Primary Justification, Skip The Repository
---
## Architecture
---
## Rule
Do not use the Repository pattern if the primary justification is "we might swap the database." Eloquent semantics permeate the application — a repository won't make a MongoDB switch trivial.
---
## Reason
Database swapping is rarely realized in practice. The effort to swap a database is dominated by Eloquent-specific query patterns, relationships, and migrations, not the repository interface.
---
## Bad Example
```php
// Repository added "just in case" to swap the database
interface UserRepository
{
    public function find(int $id): ?User;
    public function findByEmail(string $email): ?User;
    public function create(array $data): User;
}

class EloquentUserRepository implements UserRepository { /* Eloquent implementation */ }

// When trying to swap to MongoDB, find that:
// 1. Eloquent relationships and lazy loading are everywhere
// 2. Query builder patterns are deeply embedded
// 3. Mutators, accessors, casts use Eloquent-specific features
// 4. The repository abstraction barely helps
```
---
## Good Example
```php
// Skip repository — use Eloquent directly
class UserService
{
    public function register(array $data): User
    {
        return User::create($data);
    }
}

// If database swap becomes real, then add abstraction
// (Almost never happens)
```
---
## Exceptions
Projects that genuinely need multiple data sources (e.g., Eloquent + external API) where the repository abstracts the source, not the storage engine.
---
## Consequences Of Violation
Unnecessary abstraction for a justification that rarely materializes in practice.

## Repository Should Not Leak Eloquent Types
---
## Architecture
---
## Rule
Repository methods should not return raw Eloquent types (`Builder`, `LengthAwarePaginator`) as their primary return type. Return collections, domain objects, or DTOs.
---
## Reason
Leaking Eloquent types couples callers to the ORM. If the implementation changes, all callers must change too.
---
## Bad Example
```php
class InvoiceRepository
{
    public function findOverdueQuery(int $days): Builder // Returns query builder
    {
        return Invoice::where('status', 'pending')
            ->where('due_date', '<', now()->subDays($days));
    }
}

// Caller must complete the query:
$invoices = $this->invoices->findOverdueQuery(30)->get(); // Unfinished query
```
---
## Good Example
```php
class InvoiceRepository
{
    public function findOverdue(int $days): Collection // Returns domain objects
    {
        return Invoice::where('status', 'pending')
            ->where('due_date', '<', now()->subDays($days))
            ->get();
    }
}

// Caller gets ready-to-use collection
$invoices = $this->invoices->findOverdue(30);
```
---
## Exceptions
Query objects that are designed to be composable (builder pattern).
---
## Consequences Of Violation
ORM coupling leaked to action/service layer, callers must complete queries, inconsistent return types.

## Avoid Abandoned Repositories
---
## Maintainability
---
## Rule
If a repository is created, it must be used. If services bypass the repository and call Eloquent directly, remove the unused repository.
---
## Reason
Abandoned repositories become dead code that confuses developers. New team members see the repository and think it's the data access path, but the actual code bypasses it.
---
## Bad Example
```php
// Repository exists but is never used
interface OrderRepository { /* ... */ }
class EloquentOrderRepository implements OrderRepository { /* ... */ }

// Services bypass it:
class OrderService
{
    public function getOrders(int $userId): Collection
    {
        return Order::where('user_id', $userId)->get(); // Direct Eloquent, bypasses repo
    }
}
```
---
## Good Example
```php
// Either use the repository consistently:
class OrderService
{
    public function __construct(private OrderRepository $orders) {}

    public function getOrders(int $userId): Collection
    {
        return $this->orders->findByUser($userId);
    }
}

// Or remove the unused repository:
class OrderService
{
    public function getOrders(int $userId): Collection
    {
        return Order::where('user_id', $userId)->get();
    }
}
```
---
## Exceptions
Repositories that are partially adopted (being migrated to or from) with a documented deprecation plan.
---
## Consequences Of Violation
Dead code, confusion about data access patterns, mixed conventions, code review noise.
