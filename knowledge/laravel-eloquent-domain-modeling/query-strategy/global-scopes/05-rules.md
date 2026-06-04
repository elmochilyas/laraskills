# Phase 5: Rules — Global Scopes

## Rule 1: Keep `apply()` Methods Lightning Fast — No Database Queries or External Calls
---
## Category
Performance
---
## Rule
Never execute database queries, API calls, HTTP requests, file I/O, or any blocking operation inside a global scope's `apply()` method. Restrict `apply()` to adding query constraints only.
---
## Reason
Global scopes execute on EVERY query for the model — every `get()`, `first()`, `count()`, `update()`, `delete()`, and relationship query. A single database call inside `apply()` adds one query to every model operation, multiplying overhead across the entire request.
---
## Bad Example
```php
class TenantScope implements Scope {
    public function apply(Builder $builder, Model $model): void {
        $tenant = DB::table('tenants')->find(auth()->user()->tenant_id); // EXTRA QUERY every time
        $builder->where('tenant_id', $tenant->id);
    }
}
```
---
## Good Example
```php
class TenantScope implements Scope {
    public function apply(Builder $builder, Model $model): void {
        $builder->where('tenant_id', auth()->user()->tenant_id);
    }
}
```
---
## Exceptions
No common exceptions. If a scope needs data from external sources, resolve that data before the query is built (e.g., in middleware or a service provider) and pass it via a context container.
---
## Consequences Of Violation
N+1 queries added to every model operation; massive query count increase; severe performance degradation on pages with many model queries.

## Rule 2: Use `#[ScopedBy]` Attribute Over `booted()` for Scope Registration (Laravel 11+)
---
## Category
Framework Usage
---
## Rule
Use the `#[ScopedBy]` PHP attribute to register global scopes on models in Laravel 11+. Fall back to `booted()` only for Laravel 10 or earlier, or when dynamic registration logic is required.
---
## Reason
`#[ScopedBy]` is declarative, visible on the model class itself (not hidden in `booted()`), and enables static analysis and IDE discovery. Developers can see all applied scopes immediately from the model docblock.
---
## Bad Example
```php
class Post extends Model {
    protected static function booted(): void {
        static::addGlobalScope(new PublishedScope());
    }
}
```
---
## Good Example
```php
#[ScopedBy(PublishedScope::class)]
class Post extends Model {
    //
}
```
---
## Exceptions
Scopes that require dynamic registration based on runtime conditions (e.g., conditional tenant scope based on authentication state). Use `booted()` only when attribute-based registration cannot express the logic.
---
## Consequences Of Violation
Scopes hidden from developers reading the model class; harder code review; reliance on searching `booted()` to understand what scopes apply.

## Rule 3: Test Each Suppression Path — Every `withoutGlobalScope()` Needs a Verification Test
---
## Category
Testing
---
## Rule
Write a test for every path that suppresses a global scope. Verify that suppressed queries return the expanded result set and that unsuppressed queries still apply the scope.
---
## Reason
Scope suppression is a high-risk operation with security implications. Testing both the suppressed and unsuppressed paths ensures suppression works correctly and does not accidentally extend to other queries.
---
## Bad Example
```php
// Only tests normal behavior — suppression path untested
public function test_global_scope_filters_active(): void
{
    ActiveScope::class; // registered on model
    Active::factory()->create(['active' => false]);
    $this->assertCount(0, Active::all());
}
```
---
## Good Example
```php
public function test_suppressed_scope_returns_inactive_records(): void
{
    $record = Active::factory()->create(['active' => false]);
    $result = Active::withoutGlobalScope(ActiveScope::class)->find($record->id);
    $this->assertNotNull($result);
}

public function test_scope_applies_when_not_suppressed(): void
{
    $record = Active::factory()->create(['active' => false]);
    $result = Active::find($record->id);
    $this->assertNull($result);
}
```
---
## Exceptions
No common exceptions. Suppression paths must always be tested due to their security implications.
---
## Consequences Of Violation
Scope suppression regression goes undetected; suppressed queries silently stop returning expected data in production; security incidents from unexpected scope behavior changes.

## Rule 4: One Scope Class Per Concern
---
## Category
Code Organization
---
## Rule
Create one scope class per distinct cross-cutting concern. Never combine multiple unrelated constraints into a single scope class.
---
## Reason
Single-responsibility scopes are testable, documentable, and suppressible by class name. A "god" scope that filters by tenant, status, and language cannot be suppressed partially — you must remove all or nothing.
---
## Bad Example
```php
class CombinedScope implements Scope {
    public function apply(Builder $builder, Model $model): void {
        $builder->where('tenant_id', auth()->user()->tenant_id)
            ->where('active', true)
            ->whereIn('language', ['en', 'fr']);
    }
}
```
---
## Good Example
```php
class TenantScope implements Scope { /* tenant isolation */ }
class ActiveScope implements Scope { /* active filter */ }
class LanguageScope implements Scope { /* language filter */ }
```
---
## Exceptions
Extremely simple constraints that are always suppressed together and are semantically part of the same concern. Even then, prefer separate classes for maximum flexibility.
---
## Consequences Of Violation
Inability to partially suppress scopes; testing overhead from combined concerns; unclear responsibilities; suppression at the `withoutGlobalScopes()` (nuclear) level instead of targeted suppression.

## Rule 5: Document Every Global Scope on the Model Class
---
## Category
Maintainability
---
## Rule
Document each global scope applied to a model in a class-level docblock or in a prominent section of the model file. Include the scope class name, what it filters, and any security implications.
---
## Reason
Global scopes are invisible to calling code — a `User::get()` call returns different results depending on which scopes are registered. Without documentation, developers are surprised by invisible filters and may write queries that produce wrong results.
---
## Bad Example
```php
// No documentation — invisible to developers
#[ScopedBy(TenantScope::class)]
#[ScopedBy(ActiveScope::class)]
class User extends Model { }
```
---
## Good Example
```php
/**
 * Global Scopes:
 * - TenantScope: filters by current user's tenant_id (security-critical)
 * - ActiveScope: filters active = true (business rule)
 */
#[ScopedBy(TenantScope::class)]
#[ScopedBy(ActiveScope::class)]
class User extends Model { }
```
---
## Exceptions
Scopes that are standard framework conventions (`SoftDeletingScope`) where documentation is provided by the framework itself. Even then, mention them in the docblock for completeness.
---
## Consequences Of Violation
Developers surprised by invisible filters; wasted debugging time; queries that return "wrong" results due to undocumented scopes; unintended scope suppression.

## Rule 6: Never Rely on Query Builder for Queries Needing Global Scope Constraints
---
## Category
Security
---
## Rule
Always use Eloquent for any query on a model that has global scopes enforcing security boundaries. Never use `DB::table()` for models with security-critical scopes.
---
## Reason
Query Builder bypasses all Eloquent global scopes. A `DB::table('users')` query will NOT apply `TenantScope`, `SoftDeletingScope`, or any other scope, returning all records including those that should be filtered for security.
---
## Bad Example
```php
// Bypasses TenantScope — returns all tenants' data
$users = DB::table('users')->where('active', true)->get();
```
---
## Good Example
```php
// Applies TenantScope automatically
$users = User::where('active', true)->get();
```
---
## Exceptions
When you intentionally need to bypass ALL scopes for admin exports (with explicit permission checks and audit logging). Document this decision with the business justification.
---
## Consequences Of Violation
Critical security vulnerability exposing protected data; multi-tenant data leakage; soft-deleted records appearing in results; compliance violations.

## Rule 7: Index the Columns Used in Global Scope WHERE Clauses
---
## Category
Performance
---
## Rule
Add a database index for every column used in a global scope's WHERE clause. Verify index usage with `EXPLAIN` for queries on models with global scopes.
---
## Reason
Global scope WHERE clauses execute on EVERY query for the model. An unindexed column in a global scope means every query performs a full table scan. Over 100 queries per request, this becomes a crippling bottleneck.
---
## Bad Example
```php
// No index on tenant_id — every query scans the entire table
class TenantScope implements Scope {
    public function apply(Builder $builder, Model $model): void {
        $builder->where('tenant_id', auth()->user()->tenant_id);
    }
}
```
---
## Good Example
```php
// Migration: adds index
Schema::table('users', function (Blueprint $table) {
    $table->index('tenant_id');
});
```
---
## Exceptions
Tables smaller than 1000 records where full table scans are cheaper than index maintenance. Document this exception with the table size rationale.
---
## Consequences Of Violation
Severe query performance degradation as table grows; database CPU saturation from full table scans on every query; timeouts on queries with multiple global scopes.
