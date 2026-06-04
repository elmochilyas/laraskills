# Architectural Decision Rules: Query Object Alternative

---

## Rule 1: Never call `save()`, `update()`, or `delete()` inside a query object
---
## Category
Architecture
---
## Rule
Query objects must never call any write method (`save()`, `update()`, `delete()`, `insert()`) or dispatch any event. They are strictly read-only.
---
## Reason
A query object's name and contract promise a read operation. Performing writes inside it violates the principle of least surprise, introduces side effects in read paths, and makes the query object unsafe to reuse in any context expecting idempotent reads.
---
## Bad Example
```php
class OverdueInvoicesQuery
{
    public function __invoke(): Collection
    {
        $invoices = Invoice::whereOverdue()->get();
        $invoices->each->update(['reminded_at' => now()]); // Side effect in query!
        return $invoices;
    }
}
```
---
## Good Example
```php
class OverdueInvoicesQuery
{
    public function __invoke(): Collection
    {
        return Invoice::with('user', 'lines')
            ->whereOverdue()
            ->orderBy('due_at')
            ->get();
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Hidden side effects in read paths; query objects cannot be safely cached; caller gets inconsistent behavior depending on when the query runs; testability is compromised.

---

## Rule 2: Accept explicit typed filter parameters, never raw request input
---
## Category
Security
---
## Rule
Query object constructors and methods must accept explicit typed parameters (scalars, DTOs, value objects) for filtering and sorting. Never pass `$request->all()` or raw arrays from user input.
---
## Reason
Raw request input couples the query object to HTTP and bypasses validation. Untrusted strings, unexpected keys, or SQL injection payloads can reach the query builder directly. Typed parameters ensure only valid, expected values control the query.
---
## Bad Example
```php
class InvoiceQuery
{
    public function __invoke(array $filters): Collection // Raw array from request
    {
        return Invoice::where('status', $filters['status'])
            ->where('total', '>', $filters['min_total'])
            ->get();
    }
}
```
---
## Good Example
```php
class InvoiceQuery
{
    public function __invoke(
        ?InvoiceStatus $status = null,
        ?Money $minTotal = null,
    ): Collection {
        return Invoice::query()
            ->when($status, fn ($q) => $q->where('status', $status->value))
            ->when($minTotal, fn ($q) => $q->where('total', '>=', $minTotal->toCents()))
            ->get();
    }
}
```
---
## Exceptions
When wrapping an existing search endpoint during refactoring. Tag with `@todo` and extract to typed parameters in the next iteration.
---
## Consequences Of Violation
Query object passes unvalidated user input to the database; SQL injection risk; query object cannot be reused from CLI or queues; controller must format data specifically for the query object's expected array shape.

---

## Rule 3: Prefer model local scopes for simple queries; extract to query objects at 3+ conditions
---
## Category
Maintainability
---
## Rule
Start with a model local scope when a query has 1-2 `where` clauses. Extract to a query object when the query grows to 3+ conditions, requires optional filtering, or is reused in three or more places.
---
## Reason
Model scopes keep the query close to the model definition, which is the natural place for simple filtering. Query objects add a file and indirection cost that is only justified when the query is complex enough that the scope would bloat the model.
---
## Bad Example
```php
// Query object for a trivial 1-condition filter — over-engineering
class ActiveUsersQuery
{
    public function __invoke(): Collection
    {
        return User::where('active', true)->get();
    }
}
```
---
## Good Example
```php
// Model scope for simple case
class User extends Model
{
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }
}

// Query object extracted when complexity grows
class OverdueInvoicesQuery
{
    public function __invoke(
        int $daysOverdue = 30,
        ?int $tenantId = null,
        ?string $sortBy = 'due_at',
    ): Collection {
        return Invoice::with('user')
            ->where('status', InvoiceStatus::Sent)
            ->where('due_at', '<', now()->subDays($daysOverdue))
            ->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
            ->orderBy($sortBy)
            ->get();
    }
}
```
---
## Exceptions
When the simple query is reused in 5+ places, extracting to a named query object can improve discoverability even with 1 condition.
---
## Consequences Of Violation
Query object proliferation for every trivial filter; each query is a separate file, making the codebase hard to navigate; model scopes underused; development velocity slows from unnecessary file creation.

---

## Rule 4: Always eager-load relations inside query objects
---
## Category
Performance
---
## Rule
Eager-load every relation the returned data will need directly in the query object's query builder. Never rely on lazy loading after the query object returns.
---
## Reason
Query objects are typically used in controllers and views where lazy loading triggers N+1 queries. Eager-loading inside the query object ensures efficient queries regardless of how the result is used downstream.
---
## Bad Example
```php
class OrderSummaryQuery
{
    public function __invoke(): Collection
    {
        return Order::where('status', 'completed')->get();
        // N+1: callers must loop to access $order->items
    }
}
```
---
## Good Example
```php
class OrderSummaryQuery
{
    public function __invoke(): Collection
    {
        return Order::with('items.product', 'payment')
            ->where('status', 'completed')
            ->get();
        // All relations loaded — no N+1
    }
}
```
---
## Exceptions
When the caller explicitly states they only need specific relations. In this case, accept an optional `$with` parameter for caller-specified eager loading.
---
## Consequences Of Violation
N+1 query explosions in views and controllers; performance degradation as callers add relation access; query objects appear performant in isolation but cause cascading queries in production.

---

## Rule 5: Default to pagination or limits — never return unbounded result sets
---
## Category
Performance
---
## Rule
Always apply a pagination or `->limit()` to query object results. Default to a reasonable page size (15-50) and require explicit opt-out for unbounded queries.
---
## Reason
Unbounded queries return all matching rows, causing memory exhaustion and slow response times as the dataset grows. A default pagination protects against production incidents when data size increases unexpectedly.
---
## Bad Example
```php
class RecentOrdersQuery
{
    public function __invoke(): Collection
    {
        return Order::with('items')
            ->where('created_at', '>=', now()->subDays(7))
            ->get(); // Potentially millions of rows
    }
}
```
---
## Good Example
```php
class RecentOrdersQuery
{
    public function __invoke(int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        return Order::with('items')
            ->where('created_at', '>=', now()->subDays(7))
            ->orderBy('created_at', 'desc')
            ->paginate(perPage: $perPage, page: $page);
    }
}
```
---
## Exceptions
When the query is guaranteed to return small result sets (e.g., lookup tables with fewer than 100 rows) and the caller explicitly documents why pagination is unnecessary.
---
## Consequences Of Violation
Memory exhaustion on large datasets; API responses timeout or crash; query objects become a performance liability; pagination must be retrofitted after production incidents.

---

## Rule 6: Keep business logic out of query objects — filter and sort only
---
## Category
Architecture
---
## Rule
Query objects must only apply filter conditions and sort orders. They must not apply business rules, calculate derived values, or make domain decisions based on query results.
---
## Reason
Business logic in query objects creates hidden domain rules in the read path, making them invisible to developers maintaining domain models. When the business rule changes, the update must be found across query objects rather than in a single domain method.
---
## Bad Example
```php
class PricingQuery
{
    public function __invoke(): Collection
    {
        return Product::query()
            ->get()
            ->filter(fn (Product $p) => $p->shouldApplyDiscount()) // Business logic!
            ->map(fn (Product $p) => [
                'name' => $p->name,
                'price' => $p->calculateDiscountedPrice(), // Business logic!
            ]);
    }
}
```
---
## Good Example
```php
class ProductListQuery
{
    public function __invoke(): Collection
    {
        return Product::with('category')
            ->where('active', true)
            ->orderBy('name')
            ->get();
    }
}
// Discount logic belongs in a Product model method or a PricingService
```
---
## Exceptions
When the query object is computing read-model projections (denormalized data for display). In that case, use database-level computation (SQL expressions, views) rather than PHP business logic.
---
## Consequences Of Violation
Business rules duplicated across query objects and domain models; rule changes require hunting through multiple query files; domain model invariants are silently bypassed by query objects that implement their own versions.

---

## Rule 7: Name query objects by what they return, not how they query
---
## Category
Code Organization
---
## Rule
Name query objects based on the result they produce: `OverdueInvoicesQuery`, `UsersByRoleQuery`. Avoid names that describe the query mechanism: `InvoiceWhereQuery`, `UserJoinQuery`.
---
## Reason
Name-by-result makes the class' purpose immediately clear when reading consuming code. Name-by-mechanism reveals implementation detail in the class name, which is irrelevant to callers and creates noise when the internal query changes.
---
## Bad Example
```php
class InvoiceWhereStatusQuery { /* ... */ }
class UserLeftJoinOrdersQuery { /* ... */ }
```
---
## Good Example
```php
class OverdueInvoicesQuery { /* ... */ }
class CustomersWithRecentOrdersQuery { /* ... */ }
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Query object names are not self-documenting; developers must open the file to understand what it returns; refactoring the internal query requires renaming the class.

---

## Rule 8: Cache query object results when the query is expensive and data is stale-tolerant
---
## Category
Performance
---
## Rule
Wrap expensive query objects (3+ joins, aggregations, or full-text searches) with caching. Derive the cache key from the class name and serialized parameters. Set appropriate TTL based on the data's staleness tolerance.
---
## Reason
Expensive queries running on every request waste database resources. Query objects are the natural unit for caching because they have explicit parameters and a single responsibility. Caching at this layer transparently improves performance without changing consuming code.
---
## Bad Example
```php
class MonthlyReportQuery
{
    public function __invoke(int $year, int $month): Collection
    {
        return DB::table('orders')
            ->selectRaw('...') // Expensive aggregation
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->get(); // Runs on every request
    }
}
```
---
## Good Example
```php
class MonthlyReportQuery
{
    public function __invoke(int $year, int $month): Collection
    {
        $cacheKey = "monthly_report_{$year}_{$month}";
        return Cache::remember($cacheKey, 3600, function () use ($year, $month) {
            return DB::table('orders')
                ->selectRaw('...')
                ->whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->get();
        });
    }
}
```
---
## Exceptions
Real-time queries where staleness is unacceptable (e.g., current inventory counts, user balance). Never cache queries where accuracy is time-sensitive.
---
## Consequences Of Violation
Unnecessary database load from repeated expensive queries; slow response times on dashboard/report endpoints; higher database infrastructure costs; caching retrofitted reactively after performance incidents.
