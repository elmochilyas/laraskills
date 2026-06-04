# Architectural Decision Rules: When Repositories Hurt

---

## Rule 1: Do not create a repository when only one storage backend exists and will ever exist
---
## Category
Architecture
---
## Rule
Do not add a repository interface or class when the only storage backend is a single SQL database using Eloquent. Add the abstraction only when a second storage backend is actually needed, not hypothetically.
---
## Reason
The repository pattern's primary benefit is storage backend abstraction. With a single MySQL/PostgreSQL database, the interface adds indirection without enabling any capability that direct Eloquent usage does not provide. YAGNI applies.
---
## Bad Example
```php
// Three files that add zero capability
interface UserRepository { /* ... */ }
class EloquentUserRepository implements UserRepository { /* ... */ }
// Service provider binding: UserRepository::class => EloquentUserRepository::class
// Only one backend exists. No plan for another.
```
---
## Good Example
```php
// Direct Eloquent — one file, same capability
User::find($id);
User::create($data);
```
---
## Exceptions
When building a package or library that must support multiple storage backends for customers. In that case, the interface is a required feature.
---
## Consequences Of Violation
Unnecessary file overhead (interface + implementation + binding); development velocity slows from indirection; developers ignore the pattern and inject Eloquent directly anyway.

---

## Rule 2: Never create a repository whose interface mirrors Eloquent's API exactly
---
## Category
Architecture
---
## Rule
If a repository interface method signature exactly mirrors an Eloquent method (`save()`, `find()`, `findOrFail()`, `create()`), delete the interface and use Eloquent directly.
---
## Reason
A repository that mirrors Eloquent's API provides no abstraction value — callers already know what queries execute. The interface hides nothing and adds no new capability. It is pure ceremony.
---
## Bad Example
```php
// Three-file ceremony that mirrors Eloquent exactly
interface UserRepository
{
    public function find(int $id): ?User;       // Same as User::find()
    public function save(User $user): bool;      // Same as $user->save()
    public function create(array $data): User;   // Same as User::create()
}
```
---
## Good Example
```php
// Direct Eloquent — less code, same contract
$user = User::find($id);
$user->save();
User::create($data);
```
---
## Exceptions
When compliance or audit requirements mandate that all data access goes through a single instrumented layer for logging. In that rare case, the repository serves as an audit boundary, not a storage abstraction.
---
## Consequences Of Violation
Three files where one method call suffices; developers bypass the abstraction when it adds friction; code review must maintain the redundant layer indefinitely.

---

## Rule 3: Test with real databases and model factories, not repository mocks
---
## Category
Testing
---
## Rule
Use `RefreshDatabase` trait with SQLite in-memory testing and model factories for tests that involve data access. Do not mock repositories in tests that exercise domain logic.
---
## Reason
Mocking a repository hides SQL errors in the Eloquent implementation. Tests pass with mocks but fail against the real database because of missing columns, wrong casts, or constraint violations. Real database tests catch these issues.
---
## Bad Example
```php
public function test_register_user(): void
{
    $repo = $this->createMock(UserRepository::class);
    $repo->method('save')->willReturn(true);
    // Mock passes, but real Eloquent save might fail with SQL error
}
```
---
## Good Example
```php
use RefreshDatabase;

public function test_register_user(): void
{
    $user = User::factory()->create(['email' => 'test@example.com']);
    $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
}
```
---
## Exceptions
When testing a service that communicates with external APIs (payment gateways, email services). In those cases, mock at the HTTP client level, not the repository level.
---
## Consequences Of Violation
Test false positives — tests pass but production code fails with SQL errors; developer confidence in the test suite erodes; time wasted debugging issues that real database tests would catch immediately.

---

## Rule 4: Delete unused repository interfaces that have only one implementation
---
## Category
Maintainability
---
## Rule
Actively audit the codebase for repository interfaces with exactly one implementation. Delete the interface and use the implementation class (or Eloquent directly) everywhere the interface was injected.
---
## Reason
Unused or single-implementation interfaces add maintenance cost: every developer must find the binding, understand the indirection, and maintain both files. Removing them reduces cognitive load without losing capability.
---
## Bad Example
```php
// Interface with one implementation and no plan for a second
interface LookupTableRepository { /* ... */ }
class EloquentLookupTableRepository implements LookupTableRepository { /* ... */ }
```
---
## Good Example
```php
// Direct class usage — same capability, less indirection
class LookupService
{
    public function __construct(
        private EloquentLookupTableRepository $repo, // No interface needed
    ) {}
}
```
---
## Exceptions
When the interface serves as a test seam with an in-memory implementation actively used in tests. In that case, keep both as long as the test fake provides value beyond SQLite testing.
---
## Consequences Of Violation
Dead code accumulates; developers are afraid to delete interfaces; the codebase grows without corresponding capability; new team members must learn unnecessary abstractions.

---

## Rule 5: Prefer direct Eloquent usage in actions — queries should be visible and explicit
---
## Category
Maintainability
---
## Rule
Write queries directly in action classes using Eloquent models. Avoid hiding queries behind repository method calls that obscure what SQL actually executes.
---
## Reason
When a query lives directly in the action, any developer can read the action and immediately see what queries run. Repository methods hide the query behind an interface, requiring the reader to open the implementation file to understand the actual SQL.
---
## Bad Example
```php
class BillCustomersAction
{
    public function __construct(private InvoiceRepository $invoices) {}

    public function __invoke(): void
    {
        $invoices = $this->invoices->findDue(); // What query does this run?
    }
}
```
---
## Good Example
```php
class BillCustomersAction
{
    public function __invoke(): void
    {
        $invoices = Invoice::with('customer')
            ->where('status', InvoiceStatus::Sent)
            ->where('due_at', '<=', now())
            ->get(); // Query visible directly
    }
}
```
---
## Exceptions
When the query is complex enough (3+ joins, window functions, subqueries) that inlining it in the action would make the action hard to read. In that case, extract to a named Query Object.
---
## Consequences Of Violation
Queries are hidden behind abstractions, making performance reviews harder; developers cannot tell if an N+1 exists without opening multiple files; query tuning requires navigating indirection layers.

---

## Rule 6: If the only reason for a repository is "testing," remove the repository
---
## Category
Testing
---
## Rule
If the sole justification for a repository interface is swapping databases for testing, delete the repository. Laravel's `RefreshDatabase` + SQLite in-memory testing already solves this without an abstraction layer.
---
## Reason
Laravel's testing infrastructure provides database swapping at the connection level without any code changes. Creating a repository solely for test database swapping duplicates built-in framework capability and adds unnecessary indirection.
---
## Bad Example
```php
// Repository justified only by "we need to test without hitting the real DB"
interface ReportRepository { /* ... */ }
class MySqlReportRepository implements ReportRepository { /* ... */ }
// When RefreshDatabase + SQLite already handles this
```
---
## Good Example
```php
// Direct Eloquent — .env.testing sets DB_CONNECTION=sqlite
class WeeklyReportAction
{
    public function __invoke(): array
    {
        return Report::query()
            ->selectRaw('...')
            ->get()
            ->toArray();
    }
}

// Test uses RefreshDatabase with SQLite
class WeeklyReportActionTest extends TestCase
{
    use RefreshDatabase;
    // Tests the real query against SQLite in-memory
}
```
---
## Exceptions
When the repository also provides an in-memory fake that enables tests to run without any database at all (including SQLite). In that case, evaluate whether the fake's speed benefit outweighs the maintenance cost.
---
## Consequences Of Violation
Unnecessary abstraction layer that duplicates framework capability; developers maintain two code paths (interface + implementation) when the framework already handles variation.

---

## Rule 7: Extract to a Query Object when queries become complex, not to a Repository
---
## Category
Code Organization
---
## Rule
When a query grows beyond 2-3 conditions or is reused across multiple callers, extract it to a Query Object, not a repository. Repositories are for aggregate persistence; Query Objects are for reusable read operations.
---
## Reason
Repository finder methods accumulate over time, turning the repository into a dumping ground for unrelated queries. Query Objects are single-responsibility classes named after the result they return, making them discoverable and independently testable.
---
## Bad Example
```php
// Repository accumulating finder methods
interface OrderRepository
{
    public function store(Order $order): void;
    public function findRecentByCustomer(int $customerId): array;
    public function findTopSelling(int $limit): array;
    public function findMonthlyReport(int $year, int $month): array;
    // 10 more finder methods
}
```
---
## Good Example
```php
// Repository — only aggregate persistence
interface OrderRepository
{
    public function store(Order $order): void;
    public function findById(int $id): ?Order;
}

// Query Objects — one per distinct read
class RecentOrdersByCustomerQuery { /* ... */ }
class TopSellingProductsQuery { /* ... */ }
class MonthlyReportQuery { /* ... */ }
```
---
## Exceptions
When the query is so tightly coupled to the aggregate root's internal structure that separating it would create coupling in the opposite direction.
---
## Consequences Of Violation
Repository grows to 20+ methods with mixed read/write concerns; queries are hard to find among the persistence methods; optimizing reads requires modifying the same class responsible for writes.

---

## Rule 8: Never nest transactions — ensure repositories do not create their own
---
## Category
Reliability
---
## Rule
Ensure no repository method begins its own database transaction. The use-case layer (action/controller) manages the transaction boundary. Nested transactions cause partial commits that cannot be rolled back.
---
## Reason
Laravel's `DB::transaction()` creates savepoints for nested calls, but if the inner "transaction" commits while the outer transaction fails, the inner changes are not automatically rolled back. This leads to data inconsistency.
---
## Bad Example
```php
class EloquentUserRepository implements UserRepository
{
    public function save(User $user): void
    {
        DB::transaction(function () use ($user) {
            $user->save();
        }); // Inner transaction — causes nesting issues
    }
}

// Caller also uses a transaction
DB::transaction(function () {
    $user = new User(/* ... */);
    $repo->save($user); // Nested: inner commit may survive outer rollback
    throw new \Exception('Rollback');
    // User already committed from inner transaction!
});
```
---
## Good Example
```php
class EloquentUserRepository implements UserRepository
{
    public function save(User $user): void
    {
        $user->save(); // No transaction — caller manages scope
    }
}

// Caller manages the transaction boundary
DB::transaction(function () {
    $user = new User(/* ... */);
    $repo->save($user);
    throw new \Exception('Rollback');
    // User is rolled back with the outer transaction
});
```
---
## Exceptions
When the repository method performs multiple internal writes that must be atomic independently of the caller. Even then, document that the method manages its own transaction and cannot be composed.
---
## Consequences Of Violation
Partial commits on failures; data inconsistency that is hard to trace; debugging nightmare when nested savepoints behave unexpectedly in production.
