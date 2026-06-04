# Phase 5: Rules — Subqueries

## Rule 1: Use Closure-Based Subqueries Over Raw SQL Strings
---
## Category
Security
---
## Rule
Use closure-based subquery syntax instead of raw SQL strings (`DB::raw("(SELECT ...)")`) whenever possible. Let the builder handle binding management automatically.
---
## Reason
Closure-based subqueries automatically merge bindings into the parent query's binding array in the correct order. Raw SQL strings require manual `?` placeholder management and binding merging, which is error-prone and risks SQL injection.
---
## Bad Example
```php
// Raw subquery string — manual binding management, error-prone
$users = User::select(DB::raw('(SELECT MAX(created_at) FROM orders WHERE user_id = users.id) as last_order'))
    ->get();
```
---
## Good Example
```php
// Closure-based — automatic binding management
$users = User::addSelect(['last_order' => Order::selectRaw('MAX(created_at)')
    ->whereColumn('user_id', 'users.id')
])->get();
```
---
## Exceptions
Database-specific SQL features not supported by the builder (window functions, CTEs in some databases). Even then, use `DB::raw()` with `?` placeholders for all user-provided values.
---
## Consequences Of Violation
SQL injection vulnerability from unescaped raw SQL strings; binding order mismatches causing data corruption; reduced portability across database drivers.

## Rule 2: Always Alias Subquery Selects
---
## Category
Reliability
---
## Rule
Always provide an alias for every subquery used in a SELECT clause using `addSelect(['alias' => $subQuery])` or the second argument of `selectSub()`. Never omit the alias.
---
## Reason
A subquery SELECT without an alias causes a SQL syntax error in most databases. The query will fail at execution time with an unhelpful error message like "Every derived table must have its own alias."
---
## Bad Example
```php
// No alias — SQL syntax error
$users = User::addSelect([Order::selectRaw('COUNT(*)')->whereColumn('user_id', 'users.id')])->get();
```
---
## Good Example
```php
// Aliased correctly
$users = User::addSelect(['order_count' => Order::selectRaw('COUNT(*)')
    ->whereColumn('user_id', 'users.id')
])->get();
```
---
## Exceptions
No common exceptions. Every subquery SELECT must have an alias.
---
## Consequences Of Violation
SQL syntax errors at query execution time; production outages; wasted debugging time identifying the missing alias.

## Rule 3: Add `->take(1)` to Scalar Subqueries to Prevent Multi-Row Errors
---
## Category
Reliability
---
## Rule
Always append `->take(1)` to any subquery used in a scalar context (SELECT column, WHERE comparison, ORDER BY). Ensure the subquery returns at most one row.
---
## Reason
A scalar subquery that returns multiple rows causes a database error ("Subquery returns more than 1 row"). Adding `->take(1)` or an aggregate function ensures single-row return and prevents production outages.
---
## Bad Example
```php
// Could return multiple rows if a user has multiple orders at the same time
$users = User::addSelect(['last_order_date' => Order::select('created_at')
    ->whereColumn('user_id', 'users.id')
    ->orderByDesc('created_at')
]);
```
---
## Good Example
```php
// take(1) ensures single-row return
$users = User::addSelect(['last_order_date' => Order::select('created_at')
    ->whereColumn('user_id', 'users.id')
    ->latest()
    ->take(1)
]);
```
---
## Exceptions
Subqueries using aggregate functions (`MAX()`, `MIN()`, `COUNT()`, `SUM()`) that always return exactly one row even with multiple matching records.
---
## Consequences Of Violation
Production database errors ("Subquery returns more than 1 row"); 500 errors for users; potential downtime if the subquery handles user-facing data.

## Rule 4: Always Include `whereColumn` in Correlated Subqueries
---
## Category
Reliability
---
## Rule
For correlated subqueries, always add a `whereColumn()` clause to link the inner query to the outer query. Never omit the correlation condition.
---
## Reason
A correlated subquery without `whereColumn()` is uncorrelated — it runs once and returns the same value for every row. This is almost always a logic error, producing incorrect results silently.
---
## Bad Example
```php
// Missing correlation — returns the same value for ALL users
$users = User::addSelect(['last_post' => Post::select('title')->latest()->take(1)]);
```
---
## Good Example
```php
// Correlated — returns the last post per user
$users = User::addSelect(['last_post' => Post::select('title')
    ->whereColumn('user_id', 'users.id')
    ->latest()
    ->take(1)
]);
```
---
## Exceptions
Subqueries that are intentionally uncorrelated (same value for all rows). Document this intent clearly in a comment.
---
## Consequences Of Violation
Silent incorrect results — every row shows the same value; data corruption in reports and exports; debugging time wasted on "impossible" results.

## Rule 5: Use `withCount()` and `withExists()` Before Writing Manual Subquery Selects
---
## Category
Maintainability
---
## Rule
Prefer `withCount()`, `withExists()`, `withSum()`, `withAvg()`, etc. for relationship aggregation before writing manual subquery SELECTs. Only write manual subqueries when these methods are insufficient.
---
## Reason
Eloquent's `with*()` methods handle binding management, alias generation, and edge cases automatically. Manual subqueries require explicit correlation, aliasing, and `take(1)` — more code with more surface area for bugs.
---
## Bad Example
```php
// Manual subquery — more code, more risk
$users = User::addSelect(['order_count' => Order::selectRaw('COUNT(*)')
    ->whereColumn('user_id', 'users.id')
])->get();
```
---
## Good Example
```php
// withCount — handles everything automatically
$users = User::withCount('orders')->get();
```
---
## Exceptions
Complex aggregations not covered by `with*()` (e.g., conditional counts, subqueries in WHERE or ORDER BY). Composite subqueries that combine multiple aggregations in one expression.
---
## Consequences Of Violation
Unnecessary complexity for simple aggregations; increased code review surface; higher maintenance burden for what could be a one-method call.

## Rule 6: Encapsulate Common Subquery Patterns as Scopes or Builder Methods
---
## Category
Code Organization
---
## Rule
Extract subquery logic used in 3+ places into named scope methods on a custom builder. Document the SQL intent and any performance implications.
---
## Reason
Subqueries are complex SQL constructs. Duplicating the same subquery logic across controllers, services, and jobs creates maintenance risk — any bug in the subquery must be fixed in multiple places.
---
## Bad Example
```php
// Duplicated across three controllers
$users = User::addSelect(['last_order' => Order::select('total')
    ->whereColumn('user_id', 'users.id')
    ->latest()
    ->take(1)
])->get();
```
---
## Good Example
```php
class UserBuilder extends Builder {
    public function withLastOrderAmount(): static
    {
        return $this->addSelect(['last_order_amount' => Order::select('total')
            ->whereColumn('user_id', 'users.id')
            ->latest()
            ->take(1)
        ]);
    }
}

// Single call everywhere
User::withLastOrderAmount()->get();
```
---
## Exceptions
One-off subqueries used in a single, isolated context (data migration, one-time report) that will not be reused.
---
## Consequences Of Violation
Duplicated subquery logic; bug fixes required in N places instead of one; inconsistent implementation across the codebase; higher testing burden.

## Rule 7: Verify Subquery SQL with `toSql()` Before Deploying
---
## Category
Reliability
---
## Rule
Always call `toSql()` on any query builder that contains a subquery before deploying. Verify the SQL matches expectations, particularly the binding order and correlation syntax.
---
## Reason
Subquery closures can generate surprising SQL — especially when combining multiple where conditions, joins, and nested subqueries. The SQL may be syntactically incorrect, produce wrong results, or have performance problems invisible in the PHP code.
---
## Bad Example
```php
// Deployed without SQL verification
$users = User::addSelect(['orders_total' => Order::selectRaw('SUM(amount)')
    ->whereColumn('user_id', 'users.id')
    ->where('status', 'completed')
])->get();
```
---
## Good Example
```php
// Verified during development
$sql = User::addSelect(['orders_total' => Order::selectRaw('SUM(amount)')
    ->whereColumn('user_id', 'users.id')
    ->where('status', 'completed')
])->toSql();
dump($sql); // Verify: SELECT "users".*, (SELECT SUM(amount) FROM "orders" WHERE "user_id" = "users"."id" AND "status" = ?) as "orders_total" FROM "users"

$users = User::addSelect(['orders_total' => Order::selectRaw('SUM(amount)')
    ->whereColumn('user_id', 'users.id')
    ->where('status', 'completed')
])->get();
```
---
## Exceptions
No common exceptions. Always verify subquery SQL before deployment.
---
## Consequences Of Violation
Incorrect query results deployed to production; SQL syntax errors causing 500 errors; performance issues from unoptimized subquery execution plans.
