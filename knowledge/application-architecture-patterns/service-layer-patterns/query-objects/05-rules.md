## Keep Query Objects Read-Only
---
## Architecture
---
## Rule
Keep query objects read-only. They must only encapsulate queries (SELECT). Do not add create, update, or delete methods.
---
## Reason
Query objects are for querying only. Adding write methods blurs the line between query objects and repositories, violating the single-responsibility principle and CQRS separation.
---
## Bad Example
```php
class OverdueInvoicesQuery
{
    public function execute(int $days): Collection
    {
        return Invoice::where('status', 'pending')
            ->where('due_date', '<', now()->subDays($days))
            ->get();
    }

    public function markAsOverdueNotified(int $id): void // Write method in query object
    {
        Invoice::whereId($id)->update(['overdue_notified' => true]);
    }
}
```
---
## Good Example
```php
class OverdueInvoicesQuery
{
    public function execute(int $days): Collection
    {
        return Invoice::where('status', 'pending')
            ->where('due_date', '<', now()->subDays($days))
            ->get();
    }
}

// Write operations stay in repository or service
class InvoiceRepository
{
    public function markAsOverdueNotified(int $id): void
    {
        Invoice::whereId($id)->update(['overdue_notified' => true]);
    }
}
```
---
## Exceptions
No common exceptions. Query objects must be read-only.
---
## Consequences Of Violation
Blurred read/write separation, query object becomes a hybrid, violates single responsibility.

## Return Arrays Or DTOs, Not Eloquent Models
---
## Architecture
---
## Rule
Query objects should return arrays or DTOs, not Eloquent models. Consumers of query objects are often read-only views that don't need ORM features.
---
## Reason
Returning arrays or DTOs decouples query consumers from the ORM, enables read-model optimization (select only needed columns), and prevents lazy loading N+1 problems.
---
## Bad Example
```php
class OverdueInvoicesQuery
{
    public function execute(int $days): Collection // Returns Eloquent models
    {
        return Invoice::where('status', 'pending')
            ->where('due_date', '<', now()->subDays($days))
            ->get();
    }
}

// Consumer has full Eloquent model with lazy-loading risk
$invoices = $query->execute(30);
foreach ($invoices as $invoice) {
    echo $invoice->customer->name; // Lazy load — N+1 problem
}
```
---
## Good Example
```php
class OverdueInvoiceData
{
    public function __construct(
        public readonly int $id,
        public readonly string $customerName,
        public readonly string $total,
        public readonly string $dueDate,
    ) {}
}

class OverdueInvoicesQuery
{
    public function execute(int $days): array // Returns DTOs
    {
        return Invoice::query()
            ->select('invoices.id', 'customers.name as customer_name',
                     'invoices.total', 'invoices.due_date')
            ->join('customers', 'invoices.customer_id', '=', 'customers.id')
            ->where('invoices.status', 'pending')
            ->where('invoices.due_date', '<', now()->subDays($days))
            ->get()
            ->map(fn($row) => new OverdueInvoiceData(
                id: $row->id,
                customerName: $row->customer_name,
                total: $row->total,
                dueDate: $row->due_date,
            ))
            ->all();
    }
}
```
---
## Exceptions
Query objects used within the same architectural layer where ORM coupling is acceptable (rare).
---
## Consequences Of Violation
ORM coupling to consumers, N+1 lazy loading, no read-model optimization, inefficient queries.

## Don't Create A Query Object For Every Query
---
## Architecture
---
## Rule
Create query objects only for complex or repeated queries. Simple one-liner queries like `User::find($id)` do not need extraction.
---
## Reason
Query objects for simple queries add unnecessary classes and indirection. Only extract when the query is complex enough to benefit from centralized logic or is repeated across multiple consumers.
---
## Bad Example
```php
// Query object for a trivial query
class FindUserByIdQuery
{
    public function execute(int $id): ?User
    {
        return User::find($id); // One-liner — no need for a class
    }
}

// Query object for another trivial query
class FindProductBySlugQuery
{
    public function execute(string $slug): ?Product
    {
        return Product::where('slug', $slug)->first(); // Also one-liner
    }
}
// 10 query objects for 10 one-liner queries — class explosion
```
---
## Good Example
```php
// Simple queries stay inline:
$user = User::find($id);
$product = Product::where('slug', $slug)->first();

// Complex query extracted to query object:
class OverdueInvoicesQuery
{
    public function execute(int $days): array
    {
        return Invoice::query()
            ->select('id', 'total', 'due_date')
            ->where('status', 'pending')
            ->where('due_date', '<', now()->subDays($days))
            ->orderBy('due_date')
            ->get()
            ->toArray();
    }
}
```
---
## Exceptions
Team conventions that use query objects for all queries (consistency over optimization — but be aware of class explosion).
---
## Consequences Of Violation
Class explosion, unnecessary indirection, reduced productivity from creating many small files.

## Avoid Duplication With Model Scopes
---
## Maintainability
---
## Rule
Do not duplicate query logic between model scopes and query objects. Choose one pattern: scopes for simple queries on the model, query objects for complex cross-entity queries.
---
## Reason
Duplicate query definitions create two sources of truth. Changes must be made in both places, leading to drift and bugs.
---
## Bad Example
```php
// Model scope defines the query
class Invoice extends Model
{
    public function scopeOverdue(Builder $query, int $days): Builder
    {
        return $query->where('status', 'pending')
            ->where('due_date', '<', now()->subDays($days));
    }
}

// Query object duplicates the same logic
class OverdueInvoicesQuery
{
    public function execute(int $days): array
    {
        return Invoice::where('status', 'pending')
            ->where('due_date', '<', now()->subDays($days))
            ->get()
            ->toArray();
    }
}
// Two sources of truth — both must be updated if query changes
```
---
## Good Example
```php
// Pick one pattern:
// Option A: Scope only (simple query)
class Invoice extends Model
{
    public function scopeOverdue(Builder $query, int $days): Builder
    {
        return $query->where('status', 'pending')
            ->where('due_date', '<', now()->subDays($days));
    }
}
// Usage: Invoice::overdue(30)->get();

// Option B: Query object only (complex query)
class OverdueInvoicesQuery
{
    public function execute(int $days): array
    {
        return Invoice::query()
            ->select('id', 'total', 'due_date')
            ->where('status', 'pending')
            ->where('due_date', '<', now()->subDays($days))
            ->orderBy('due_date')
            ->get()
            ->toArray();
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Duplicate query definitions, drifted logic between scopes and query objects, bugs from inconsistent updates.

## Prefer Query Objects Over Repositories For Read-Heavy Applications
---
## Architecture
---
## Rule
For read-heavy applications (reports, dashboards, search), prefer query objects over repositories. Query objects are lighter and more focused on read optimization.
---
## Reason
Query objects provide centralized query logic without the CRUD wrapper overhead of repositories. They are ideal for read-heavy scenarios where write operations are minimal.
---
## Bad Example
```php
// Using repository pattern for a read-heavy reporting app
class ReportRepository
{
    public function getMonthlyRevenue(string $yearMonth): array {}
    public function getTopCustomers(int $limit): array {}
    public function getSalesByRegion(string $region): array {}
    public function getProductPerformance(int $productId): array {}
    public function getInventoryAlerts(): array {}
    // 20+ read-only methods — repository that only reads
}
// Repository class with no benefit from the abstraction
```
---
## Good Example
```php
// Query objects for read-heavy app — focused, composable
class MonthlyRevenueQuery
{
    public function execute(string $yearMonth): array { /* ... */ }
}

class TopCustomersQuery
{
    public function execute(int $limit): array { /* ... */ }
}

class SalesByRegionQuery
{
    public function execute(string $region): array { /* ... */ }
}
// Each query object is independently testable and optimizable
```
---
## Exceptions
Applications where both read and write complexity justify the full repository pattern.
---
## Consequences Of Violation
Repository with many read-only methods, no read-model optimization, heavier abstraction than needed.

## Query Objects Must Respect Authorization Boundaries
---
## Security
---
## Rule
Query objects must respect authorization boundaries. Do not expose unfiltered data queries that bypass visibility rules.
---
## Reason
A query object that returns all records without filtering by user/tenant authorization creates a security vulnerability — unauthorized data access.
---
## Bad Example
```php
class AllCustomersQuery
{
    public function execute(): array
    {
        return Customer::all()->toArray(); // Returns ALL customers — no filtering
    }
}

// Used in controller without additional authorization:
$customers = $this->allCustomersQuery->execute();
// Returns all customers, including those the current user shouldn't see
```
---
## Good Example
```php
class CustomersForUserQuery
{
    public function execute(User $user): array
    {
        return Customer::where('account_manager_id', $user->id)
            ->orWhere('tenant_id', $user->tenant_id)
            ->get()
            ->toArray();
    }
}

// Or accept a visibility filter:
class AllCustomersQuery
{
    public function execute(?User $user = null, ?int $tenantId = null): array
    {
        return Customer::query()
            ->when($user, fn($q) => $q->where('account_manager_id', $user->id))
            ->when($tenantId, fn($q) => $q->where('tenant_id', $tenantId))
            ->get()
            ->toArray();
    }
}
```
---
## Exceptions
Query objects used exclusively in admin contexts where unfiltered access is intentional.
---
## Consequences Of Violation
Unauthorized data exposure, data leaks across tenants/users, security vulnerabilities.
