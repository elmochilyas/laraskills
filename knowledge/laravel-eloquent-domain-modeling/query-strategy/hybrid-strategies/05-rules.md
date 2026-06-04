# Phase 5: Rules — Hybrid Strategies

## Rule 1: Prefer `toBase()` Over Raw `DB::table()` for Hybrid Queries
---
## Category
Framework Usage
---
## Rule
When using a hybrid approach, prefer `toBase()` over `DB::table()`. Only use `DB::table()` when `toBase()` cannot express the required query.
---
## Reason
`toBase()` preserves all Eloquent builder constraints (WHERE clauses, scopes, ordering) applied before it is called. `DB::table()` starts from scratch, requiring manual reimplementation of every constraint and scope. `toBase()` provides ~80% of the performance benefit with 10% of the code change.
---
## Bad Example
```php
// Raw table — loses all Eloquent scope and constraint logic
$users = DB::table('users')->where('active', true)->get();
```
---
## Good Example
```php
// toBase() — preserves scopes and constraints from Eloquent
$users = User::where('active', true)->toBase()->get();
```
---
## Exceptions
Queries using database-specific features (CTEs, full-text indexes, JSON operators) that are only available via `DB::table()`. When eager loads (`with()`) are essential and cannot be converted to joins/subqueries.
---
## Consequences Of Violation
Duplicated scope logic across codebase; missed scopes causing security or correctness issues; more complex refactoring when query requirements change.

## Rule 2: Encapsulate Hybrid Logic in Query Objects, Not Inline in Controllers
---
## Category
Code Organization
---
## Rule
Encapsulate all hybrid query logic (mixing Eloquent and Query Builder patterns) in dedicated query-object or repository classes. Never write inline `toBase()` or `getQuery()` calls in controllers.
---
## Reason
Hybrid patterns are optimization decisions with trade-offs. Scattering them across controllers makes them impossible to audit, measure, or refactor. Query objects centralize the pattern, enable testing, and document the optimization intent.
---
## Bad Example
```php
// Controller with inline hybrid logic
class UserExportController {
    public function csv() {
        return User::active()->verified()->toBase()->get();
    }
}
```
---
## Good Example
```php
// Query object encapsulating hybrid logic
class ActiveUsersExportQuery {
    public function get(): array {
        return User::active()->verified()->toBase()->get();
    }
}

class UserExportController {
    public function csv(ActiveUsersExportQuery $query) {
        return $query->get();
    }
}
```
---
## Exceptions
No common exceptions. Hybrid logic always belongs in query objects or repositories, not controllers.
---
## Consequences Of Violation
Scattered optimization logic impossible to audit; difficulty measuring performance impact; high refactoring cost when the hybrid strategy needs to change.

## Rule 3: Verify Global Scope Application When Using `toBase()`
---
## Category
Reliability
---
## Rule
Test that all global scopes are correctly applied when using `toBase()`. Compare the SQL produced with and without `toBase()` to ensure no scope is lost or misapplied.
---
## Reason
Some global scopes apply at different points in the builder lifecycle. A scope that applies during `applyScopes()` (called by `get()`) may not have been applied yet when `toBase()` transfers control to the Query Builder.
---
## Bad Example
```php
// Assumed scopes applied — never verified
$users = User::toBase()->where('active', true)->get();
```
---
## Good Example
```php
// Verify scope application
$sqlWithScopes = User::where('active', true)->toSql();
$hybridSql = User::where('active', true)->toBase()->toSql();
// Compare both SQL strings — scopes should be present in both
```
---
## Exceptions
Models with no global scopes. Verify this explicitly in documentation.
---
## Consequences Of Violation
Security-critical global scopes silently bypassed; multi-tenant data leakage; soft-deleted records appearing in output; compliance violations.

## Rule 4: Replace `with()` with Explicit Joins or Subqueries When Using `toBase()`
---
## Category
Framework Usage
---
## Rule
When using `toBase()`, replace all `with()` and eager loading calls with explicit JOINs or subqueries. Do not assume `with()` is preserved.
---
## Reason
`toBase()` does NOT preserve eager loads. The `with()` calls are silently ignored, and relationship data is not loaded. To include related data in `toBase()` results, you must add explicit JOINs or subqueries.
---
## Bad Example
```php
// Eager loads silently lost — posts not loaded
$users = User::with('posts')->active()->toBase()->get();
```
---
## Good Example
```php
// Explicit JOIN replaces with()
$users = User::select('users.*', 'posts.title as latest_post')
    ->leftJoin('posts', 'users.id', '=', 'posts.user_id')
    ->where('active', true)
    ->toBase()
    ->get();
```
---
## Exceptions
When `toBase()` is used only for aggregation (count, sum) where relationship data is not needed.
---
## Consequences Of Violation
Missing relationship data in results; callers receiving incomplete data without error; subtle bugs where developers assume relationship data is present.

## Rule 5: Never Manually Hydrate Large Result Sets
---
## Category
Performance
---
## Rule
Do not call `Model::hydrate()` on large result sets (1000+ rows). If you need models, use Eloquent directly. If you need performance, stay with `stdClass` results.
---
## Reason
Manual hydration with `hydrate()` calls all the same model instantiation, trait booting, and attribute casting logic as Eloquent. For large sets, the overhead is the same — defeating the purpose of the hybrid approach.
---
## Bad Example
```php
// Hydrates 10k rows manually — same cost as Eloquent
$raw = User::toBase()->get();
$models = User::hydrate($raw->toArray()); // hydration cost + stdClass overhead
```
---
## Good Example
```php
// Either stay with stdClass for performance
$raw = User::toBase()->get();

// Or use Eloquent directly if models are needed
$models = User::get();
```
---
## Exceptions
Selective hydration of individual rows from a `stdClass` result set (e.g., hydrating only the first record for a specific operation).
---
## Consequences Of Violation
Double overhead (stdClass + hydration) with no performance benefit; increased memory usage; confusion about whether the code path is optimized or not.

## Rule 6: Test Binding Order When Using `mergeBindings()`
---
## Category
Reliability
---
## Rule
Always test the compiled SQL with `toRawSql()` when using `mergeBindings()` to combine Eloquent and Query Builder bindings. Verify that parameter positions and values are in the correct order.
---
## Reason
`mergeBindings()` appends one binding array to another. If the parent query has 3 bindings and the merged subquery has 2, the merged bindings will be at positions 4 and 5 — which must match the SQL `?` placeholder order. A mismatch causes silent data corruption or SQL errors.
---
## Bad Example
```php
// Assumed correct — never verified
$query->mergeBindings($subQuery);
$results = $query->get();
```
---
## Good Example
```php
$query->mergeBindings($subQuery);
$sql = $query->toRawSql(); // reveals actual parameter positions
// Verify: "WHERE x = 'value1' AND y IN (?, ?)" — bindings in correct order
$results = $query->get();
```
---
## Exceptions
No common exceptions. `mergeBindings()` always requires SQL verification.
---
## Consequences Of Violation
Silent data corruption from wrong parameter values; SQL syntax errors from mismatched binding counts; hours of debugging time tracing incorrect query results.

## Rule 7: Document the Performance Rationale for Every Hybrid Approach
---
## Category
Maintainability
---
## Rule
Add a code comment explaining the performance requirement that drove the hybrid approach for every query using `toBase()`, `getQuery()`, or `mergeBindings()`. Include profiling evidence.
---
## Reason
Hybrid patterns are optimization trade-offs that add complexity. Without documented rationale, future developers may remove the optimization (thinking it premature) or leave it in place when it is no longer needed. Documentation preserves the business context.
---
## Bad Example
```php
// No rationale
$users = User::active()->toBase()->get();
```
---
## Good Example
```php
// Hybrid: CSV export returning 50k+ rows. Eloquent hydration: 2.3s, toBase: 0.4s.
// Measured with Debugbar 2024-03-15. Model features not needed for export.
$users = User::active()->toBase()->get();
```
---
## Exceptions
Obvious hybrid patterns that are standard conventions in the codebase (e.g., "all export queries use `toBase()`" documented in the team's conventions).
---
## Consequences Of Violation
Optimization reverted by developers who assume premature optimization; stale hybrid patterns that no longer serve a purpose; repeated profiling to rediscover the same bottlenecks.
