# Global Scopes

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Last Updated:** 2026-06-02

## Executive Summary
Global scopes are query constraints that are automatically applied to every query on a given Eloquent model. They are defined via classes implementing the `Scope` interface and registered in the model's `booted()` method (or using the `#[ScopedBy]` attribute in Laravel 11+). The most prominent example is Laravel's `SoftDeletingScope`, which automatically adds `WHERE deleted_at IS NULL` to all queries on a soft-deleting model. Global scopes are the right tool for cross-cutting query concerns like multi-tenant filtering, soft deletes, published-only content, or any constraint that must always be applied.

## Core Concepts
- **`Scope` Interface** — defines `apply(Builder $builder, Model $model)` method
- **Registration** — via `$model->addGlobalScope(new MyScope)` in `booted()`, or the `#[ScopedBy]` attribute (Laravel 11+)
- **Automatic Application** — scopes are applied when the builder executes; they are invisible to calling code
- **`SoftDeletingScope`** — the built-in scope that adds `deleted_at IS NULL` to queries
- **`#[ScopedBy]` Attribute** — PHP 8 attribute-based scope registration: `#[ScopedBy(MyScope::class)]`
- **Scope Suppression** — scopes can be temporarily removed via `withoutGlobalScope(s)` methods

## Mental Models
- **Invisible Filter** — a global scope is an invisible WHERE clause that is always present; developers must know it exists to understand the query's behavior
- **Query Interceptor** — scopes intercept every query and inject their constraints before execution
- **Trait-Attached Behavior** — many global scopes are associated with traits (e.g., `SoftDeletes` trait adds `SoftDeletingScope`); using the trait automatically registers the scope
- **Tenant Partition** — in multi-tenant systems, a global scope that filters by `tenant_id` is the simplest partitioning mechanism

## Internal Mechanics
Global scope application happens in `Illuminate\Database\Eloquent\Builder::applyScopes()`:

```php
public function applyScopes()
{
    if (!$this->scopesApplied) {
        foreach ($this->globalScopes as $key => $scope) {
            $scope->apply($this, $this->model);
        }
        $this->scopesApplied = true;
    }
    return $this;
}
```

`applyScopes()` is called at the beginning of terminal methods (`get()`, `first()`, `count()`, etc.) and before certain builder operations like `toSql()`. The `$scopesApplied` flag prevents double application.

Scopes implement the `Scope` interface with a single `apply()` method:
```php
interface Scope
{
    public function apply(Builder $builder, Model $model);
}
```

The `$builder` passed is the Eloquent Builder; scopes can add constraints, joins, selects, or any builder operation. The `$model` is the model instance, providing access to table name, connection, and other metadata.

## Patterns
- **Soft Deletes** — `SoftDeletingScope` adds `WHERE deleted_at IS NULL` and modifies `delete()` behavior
- **Multi-Tenant Partitioning** — `TenantScope::apply()` adds `WHERE tenant_id = ?` using the current tenant context
- **Published Content** — `PublishedScope::apply()` adds `WHERE published_at IS NOT NULL AND published_at <= NOW()`
- **User-Specific Data** — `UserScope::apply()` filters to records owned by or accessible to the current user
- **Language/Locale Filter** — `LocaleScope::apply()` adds `WHERE locale = ?` for multilingual applications
- **Archived/Status Filter** — automatically filter to non-archived or active records

## Architectural Decisions
- **Global Scopes vs Local Scopes** — global scopes are always applied; local scopes must be explicitly called. Use global scopes for mandatory constraints; use local scopes for optional filters.
- **Global Scopes vs Query Builder** — Query Builder bypasses all global scopes. This is sometimes desired (e.g., admin panel showing soft-deleted records) and sometimes dangerous (e.g., bypassing tenant isolation).
- **Global Scopes vs Middleware** — tenant filtering can be done in middleware by modifying the session/context, but the actual query constraint must be in a scope or explicitly applied.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Enforces constraints consistently | Invisible to calling code; surprise filtering | Document all global scopes on each model |
| Soft deletes, multi-tenancy built-in | Must suppress for admin/edge cases | Use `withoutGlobalScope()` explicitly |
| Trait-based scope auto-registration | Scopes from traits can conflict | Test scope interactions |
| `#[ScopedBy]` attribute is declarative | Attribute-based registration is new (Laravel 11) | Prefer `booted()` for compatibility |
|  |  |  |

## Performance Considerations
- Global scopes execute `apply()` on every query for the model — the `apply()` method should be fast (no database queries inside `apply()`)
- Scopes that use joins or subqueries add cost to EVERY query on the model
- `SoftDeletingScope` is extremely lightweight (single WHERE clause)
- Complex scopes (multi-tenant with subqueries) should be optimized to avoid index-skipping

## Production Considerations
- **Document every global scope** — maintain a list of all global scopes per model; include them in the model's docblock for IDE support
- **Test scope suppression paths** — every `withoutGlobalScope()` call should have a test verifying the scope is removed and the query returns the expected wider result set
- **Audit scope impact** — periodically review global scopes to ensure they're still necessary and correctly implemented
- **Beware of scope accumulation** — multiple global scopes on one model can produce unexpected combined filters; test scope interactions
- **Log scope application** — in development, log which global scopes were applied to each query for debugging

## Common Mistakes
- **Forgetting to register scopes** — defining a scope class but not registering it in `booted()` or via attribute
- **Unintentional scope suppression** — calling `withoutGlobalScopes()` without specifying which scopes, removing ALL global scopes (including SoftDeletes)
- **Scope on wrong model** — registering a scope on the wrong model (e.g., putting a tenant scope on a related model instead of the main model)
- **Scope injection in `apply()`** — running database queries inside `apply()` (e.g., looking up tenant ID from a database table) — this adds a query to every model query
- **Assuming Query Builder uses scopes** — `DB::table('users')` does NOT apply any Eloquent global scopes

## Failure Modes
- **Data leak from suppressed scope** — if a global scope enforces multi-tenant isolation, accidentally calling `withoutGlobalScopes()` exposes all tenants' data
- **Soft-delete restoration bypass** — if a global scope filters out soft-deleted records, using Query Builder to update records may unintentionally modify soft-deleted records
- **Scope registration order dependency** — if one global scope depends on another being applied first, the order of registration matters
- **Infinite recursion** — a scope that calls `$builder->get()` inside `apply()` triggers `applyScopes()` again, causing infinite recursion

## Ecosystem Usage
- **Laravel SoftDeletes** — the canonical global scope example; `SoftDeletingScope` is part of the core framework
- **Spatie/Laravel-Translatable** — uses global scopes to automatically filter translations by locale
- **Spatie/Laravel-Multitenancy** — uses global scopes for tenant isolation on shared-database multi-tenant setups
- **Stancl/Tenancy** — uses global scopes for tenant-aware queries in the `tenancyforlaravel` package
- **Laravel Nova** — respects global scopes on resource models; can suppress them via `withoutGlobalScopes()` in resource queries

## Related Knowledge Units

### Prerequisites
Builder Fundamentals, Local Scopes

### Related Topics
Global Scope Suppression, Soft Deletes, Custom Builder Pattern

### Advanced Follow-up Topics
Domain-Specific Query Methods, Decision Framework, Hybrid Strategies

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Scope` interface, `Illuminate\Database\Eloquent\Builder::applyScopes()`, and `Illuminate\Database\Eloquent\SoftDeletingScope` are the core implementations. Scopes are stored in `$builder->globalScopes` as an array keyed by class name or alias.
- **Key Insight:** Global scopes are powerful but dangerous because they are invisible. A developer reading a controller that calls `User::all()` sees no filter, but a global scope applies silently. Always document and make scopes visible through model docblocks.
- **Version-Specific Notes:** Laravel 11 introduced the `#[ScopedBy]` attribute as an alternative to `booted()` registration. `#[ScopedBy(MyScope::class)]` on the model class achieves the same as `$this->addGlobalScope(new MyScope())` in `booted()`. The attribute approach is preferred for its declarative nature and static analysis compatibility. Laravel 10+ ensures scopes are not double-applied with the `$scopesApplied` flag guard.
