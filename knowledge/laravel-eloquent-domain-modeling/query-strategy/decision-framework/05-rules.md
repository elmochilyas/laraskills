# Phase 5: Rules — Decision Framework

## Rule 1: Default to Eloquent for All New Queries; Optimize Only When Profiling Proves It Matters
---
## Category
Performance
---
## Rule
Always start with Eloquent ORM for any new query. Only switch to Query Builder, `toBase()`, or raw SQL after profiling confirms a measurable bottleneck.
---
## Reason
Premature optimization adds complexity without measurable benefit. Eloquent provides scopes, relationships, events, serialization, and security features that must be manually recreated with Query Builder. For typical web requests (1-50 records), the overhead is ~0.1-0.25ms — invisible to users.
---
## Bad Example
```php
// Premature QB — 3 queries/day on a table with < 100 rows
DB::table('users')->where('active', true)->get();
```
---
## Good Example
```php
// Default — Eloquent
User::where('active', true)->get();
```
---
## Exceptions
Bulk operations (inserting 10k+ rows), reporting queries on large datasets (50k+ rows), and raw SQL features not available in Eloquent (CTEs, window functions, full-text).
---
## Consequences Of Violation
Increased code complexity; loss of model features (events, casts, relationships); harder-to-maintain codebase; optimization effort wasted on non-bottlenecks.

## Rule 2: Use `toBase()` as the First Optimization Step Before Switching to `DB::table()`
---
## Category
Performance
---
## Rule
When hydration is confirmed as a bottleneck, apply `toBase()` as the first optimization step. Only drop to `DB::table()` if `toBase()` is insufficient.
---
## Reason
`toBase()` preserves the Eloquent builder API (scopes, where clauses, ordering) while removing hydration overhead. It provides ~80% of the performance benefit of raw `DB::table()` but with significantly less code change and risk.
---
## Bad Example
```php
// Jumped directly to DB::table, losing all scopes and builder features
$users = DB::table('users')->where('active', true)->get();
```
---
## Good Example
```php
// First optimization — toBase() preserves scopes and constraints
$users = User::where('active', true)->toBase()->get();
```
---
## Exceptions
When the query uses database-specific features (CTEs, full-text, JSON operators) that are only accessible via `DB::table()` or when eager loads (`with()`) are essential and cannot be replaced.
---
## Consequences Of Violation
Code duplication from manually reimplementing scope logic in every `DB::table()` call; missed scope-based security boundaries; more complex refactoring when requirements change.

## Rule 3: Use Eloquent for All Writes; Use Query Builder or `toBase()` for Read-Heavy Paths
---
## Category
Architecture
---
## Rule
Always use Eloquent for create, update, and delete operations. Use Query Builder or `toBase()` only for read queries after profiling.
---
## Reason
Eloquent fires model events (`created`, `saved`, `deleted`, `updated`) that trigger cache invalidation, audit logs, notifications, and other side effects. Query Builder bypasses all events, causing stale caches, missing audit trails, and broken business logic.
---
## Bad Example
```php
// QB update — no events fired, cache not invalidated, audit not logged
DB::table('users')->where('id', $id)->update(['email' => $email]);
```
---
## Good Example
```php
// Eloquent update — events fire, cache invalidates, audit logs
$user = User::findOrFail($id);
$user->update(['email' => $email]);
```
---
## Exceptions
Bulk updates on 10k+ rows where firing individual events would be too expensive. In that case, use a job that processes records in chunks with Eloquent.
---
## Consequences Of Violation
Stale cache entries; missing audit logs; broken downstream integrations depending on model events; compliance violations from missed audit trails.

## Rule 4: Never Use Query Builder on Models with Security-Critical Global Scopes
---
## Category
Security
---
## Rule
Do not use `DB::table()` on any table whose model has global scopes that enforce security boundaries (multi-tenant isolation, soft deletes, access control).
---
## Reason
Query Builder bypasses ALL Eloquent global scopes. A `DB::table('users')` query returns soft-deleted records, cross-tenant data, and records the user should not see. This is a data breach vulnerability.
---
## Bad Example
```php
// Bypasses TenantScope — returns ALL tenants' data
$users = DB::table('users')->where('active', true)->get();
```
---
## Good Example
```php
// Eloquent applies TenantScope automatically
$users = User::where('active', true)->get();
```
---
## Exceptions
Admin-only exports and internal tools where all data access is explicitly permission-gated and documented. Even then, consider `withoutGlobalScope()` with permission checking instead of `DB::table()`.
---
## Consequences Of Violation
Critical data breach via multi-tenant data leakage; soft-deleted records appearing in user-facing interfaces; compliance violations (GDPR, SOC2); legal liability.

## Rule 5: Audit N+1 with `Model::preventLazyLoading()` in Development
---
## Category
Performance
---
## Rule
Call `Model::preventLazyLoading()` in the `AppServiceProvider` or a service provider in local/development environments. Monitor lazy loading violations in production.
---
## Reason
N+1 is the dominant performance problem in Eloquent applications. Eagerly preventing lazy loading in development surfaces hidden N+1 queries immediately as exceptions, forcing developers to fix them before deployment.
---
## Bad Example
```php
// No lazy loading prevention — N+1 hidden until production
class AppServiceProvider extends ServiceProvider {
    public function boot(): void {
        // prevention not configured
    }
}
```
---
## Good Example
```php
class AppServiceProvider extends ServiceProvider {
    public function boot(): void {
        Model::preventLazyLoading(!$this->app->isProduction());
    }
}
```
---
## Exceptions
Production environments should not throw exceptions for lazy loading but should log violations. Use `Model::handleLazyLoadingViolationUsing()` to route violations to a logger.
---
## Consequences Of Violation
N+1 queries deployed to production causing slow page loads; database server overload from excessive queries; poor user experience on list/show pages.

## Rule 6: Abstract Data Access Behind Interfaces or Query Objects for Critical Query Paths
---
## Category
Architecture
---
## Rule
Encapsulate query logic for critical or complex data access paths behind interfaces, repositories, or query object classes. Do not hardcode the choice between Eloquent and Query Builder in consuming code.
---
## Reason
Abstracting data access makes the decision between Eloquent, `toBase()`, and Query Builder reversible without changing callers. When profiling reveals a bottleneck, swapping the implementation is a single-class change, not a multi-file refactor.
---
## Bad Example
```php
// Controller directly couples to Eloquent — changing strategy requires editing the controller
class UserReportController {
    public function export() {
        return User::where('active', true)->get(); // hardcoded Eloquent
    }
}
```
---
## Good Example
```php
// Query object — strategy change is isolated
class ActiveUsersReportQuery {
    public function get() {
        return User::where('active', true)->toBase()->get();
    }
}

class UserReportController {
    public function export(ActiveUsersReportQuery $query) {
        return $query->get();
    }
}
```
---
## Exceptions
Simple CRUD operations with no performance requirements and no expected strategy change. One-off scripts and migrations.
---
## Consequences Of Violation
Difficult performance optimization requiring changes across many files; inconsistent query strategies across the codebase; high refactoring cost to switch between Eloquent and QB.

## Rule 7: Document When and Why Query Builder Is Chosen Over Eloquent in Code Comments
---
## Category
Maintainability
---
## Rule
Add a code comment explaining the performance justification whenever `DB::table()` is used instead of Eloquent for a query. Include the profiling evidence that drove the decision.
---
## Reason
Query Builder is a deliberate optimization choice. Without documentation, future developers may "fix" it back to Eloquent, revert the optimization, or be confused about why QB is used. Documentation prevents churn and preserves institutional knowledge.
---
## Bad Example
```php
// No context — why QB?
$orders = DB::table('orders')
    ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as revenue'))
    ->groupBy(DB::raw('DATE(created_at)'))
    ->get();
```
---
## Good Example
```php
// QB: Reporting endpoint, 15k+ rows/day. Profiled at 1.2s with Eloquent,
// 40ms with QB (Debugbar, 2024-03-15). Model features not needed.
$orders = DB::table('orders')
    ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as revenue'))
    ->groupBy(DB::raw('DATE(created_at)'))
    ->get();
```
---
## Exceptions
Obvious cases (bulk inserts, batch updates) where the performance requirement is universally understood by the team.
---
## Consequences Of Violation
Optimization reverted by uninformed developers; repeated profiling to rediscover the same bottlenecks; inconsistent optimization decisions across the team.
