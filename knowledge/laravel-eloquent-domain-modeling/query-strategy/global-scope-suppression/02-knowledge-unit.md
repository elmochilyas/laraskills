# Global Scope Suppression

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Last Updated:** 2026-06-02

## Executive Summary
Global scope suppression is the mechanism for temporarily removing global scopes from a query. Laravel provides `withoutGlobalScope($className)` and `withoutGlobalScopes()` methods on the Eloquent Builder. This is essential for admin panels (showing soft-deleted records), data exports (including all tenants' data), and any operation that needs to bypass the standard query filters. Suppression is a sharp tool — it removes constraints that may enforce security boundaries (multi-tenant isolation) or data integrity (soft-delete filtering). Understanding when and how to suppress scopes safely is critical for production applications.

## Core Concepts
- **`withoutGlobalScope($scope)`** — removes a single global scope by class name or key
- **`withoutGlobalScopes($scopes = null)`** — removes all or specified global scopes when an array is passed
- **`$scopes = null` behavior** — passing null removes all global scopes
- **Scope removal vs suppression** — the scope is removed from the builder's scope array before execution; it is not merely ignored
- **Temporary scope** — the suppression only affects the current builder instance; subsequent queries will still apply the scope
- **Named scopes** — scopes registered with a string key can be suppressed by that key

## Mental Models
- **Scope Gate** — think of suppression as opening a gate that a scope normally keeps closed; all records flow through, including those the scope filters out
- **Temporary Bypass** — the suppression is a one-time bypass for a specific query; it does not disable the scope globally
- **Elevated Privilege** — scope suppression is analogous to running a query with elevated privileges (bypassing standard filters); treat it with the same caution

## Internal Mechanics
`withoutGlobalScope()` works by removing the scope from the builder's `$globalScopes` array:

```php
public function withoutGlobalScope($scope)
{
    if (is_string($scope)) {
        unset($this->globalScopes[$scope]);
    } elseif ($scope instanceof Scope) {
        $key = get_class($scope);
        unset($this->globalScopes[$key]);
    }

    $this->scopesApplied = false;
    return $this;
}
```

`withoutGlobalScopes(null)` clears the entire `$globalScopes` array. `withoutGlobalScopes(['tenant', 'published'])` removes only scopes with those keys.

The `$scopesApplied = false` flag ensures that if scopes were already applied (e.g., from a previous `toSql()` call), they will be re-applied — this time without the removed scope.

## Patterns
- **Show Soft-Deleted Records** — `User::withoutGlobalScope(SoftDeletingScope::class)->get()`
- **Admin with All Data** — `User::withoutGlobalScopes()->get()` — bypasses all scopes for admin users
- **Selective Scope Removal** — `User::withoutGlobalScopes(['tenant', 'published'])->get()`
- **Conditional Suppression** — `$query->when($isAdmin, fn($q) => $q->withoutGlobalScope(TenantScope::class))`
- **Scope Suppression in Relationships** — `$user->posts()->withoutGlobalScope(PublishedScope::class)->get()`
- **Temporary Scope with Backup** — capture the removed scope for restoration after the query

## Architectural Decisions
- **Why Suppression Exists** — without it, models with global scopes would be impossible to query without the scope's constraint; this is essential for admin functionality and edge-case operations
- **Why Per-Instance vs Global** — suppression is per-builder-instance, not global, to prevent accidentally leaving scopes disabled in other parts of the application
- **Why Null Means All** — `withoutGlobalScopes()` with no arguments removes all scopes; this is convenient but dangerous — prefer specifying which scopes to remove

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Bypass mandatory constraints when needed | Removes ALL scopes (if null), including security scopes | Always specify which scopes to suppress |
| Selective removal by scope class/key | Forgetting to suppress parallel scopes | Test that only intended scopes are suppressed |
| Available on relationship builders | Suppression must be remembered for each query path | Encapsulate suppression in query objects |
|  |  |  |

## Performance Considerations
- Suppression itself is negligible — it's a simple array removal
- The removed scope may have added a WHERE clause that improved performance through index usage; removing it may cause full table scans
- When suppressing a tenant scope, ensure the query still uses the tenant_id index (the scope might have been the only index usage)

## Production Considerations
- **Never unconditionally suppress all scopes** — `withoutGlobalScopes()` without argument is a security risk in multi-tenant applications; always specify which scopes to remove
- **Audit all suppression calls** — implement a code review rule: every `withoutGlobalScope` call must have a comment explaining why
- **Gate suppression behind permissions** — only allow scope suppression if the authenticated user has the appropriate permission (e.g., admin role)
- **Test suppressed queries** — write tests that verify suppressed queries return the expected expanded results (including soft-deleted or other-tenants' data)
- **Log suppression in audit trail** — for compliance, log when global scopes are suppressed in multi-tenant contexts

## Common Mistakes
- **Calling `withoutGlobalScopes()` for a single scope** — `withoutGlobalScopes()` removes ALL scopes; use `withoutGlobalScope($className)` for a single scope
- **Suppressing wrong scope class** — passing a scope class name that doesn't match the registered scope (case-sensitive; must match exactly)
- **Suppressing scope after execution** — calling `withoutGlobalScope()` on a query that has already executed has no effect
- **Assuming suppression applies to related queries** — suppressing a scope on the parent builder does NOT suppress it on relationship queries; suppress on the relationship builder separately
- **Forgetting `SoftDeletingScope` inheritance** — if a model uses `SoftDeletes`, it has a `SoftDeletingScope`; suppressing it returns soft-deleted records

## Failure Modes
- **Data exposure** — suppressing a multi-tenant scope returns data from all tenants, potentially exposing sensitive data to unauthorized users
- **Inconsistent query results** — suppressing a scope that enforces data consistency (e.g., "only active records") can return inactive records that break downstream logic
- **Unintentional permanent suppression** — if the suppressed builder is stored and reused, the scope remains suppressed for subsequent queries
- **Scope key collision** — using string keys for scopes can lead to unintentional suppression if the same key is used for different scopes

## Ecosystem Usage
- **Laravel Nova** — uses `withoutGlobalScopes()` on resource index queries when the user has permission to see all records
- **Laravel Filament** — offers "Show Soft Deleted" toggle that applies `withoutGlobalScope(SoftDeletingScope::class)`
- **Spatie/Laravel-Multitenancy** — provides helper methods for temporarily disabling tenant scopes in admin contexts
- **Laravel Telescope** — may suppress scopes when displaying query results to avoid tenant filtering in its own UI

## Related Knowledge Units

### Prerequisites
Global Scopes, Builder Fundamentals

### Related Topics
Soft Deletes, Multi-Tenancy, Custom Builder Pattern

### Advanced Follow-up Topics
Domain-Specific Query Methods, Decision Framework, Hybrid Strategies

## Research Notes
- **Source Analysis:** Methods defined in `Illuminate\Database\Eloquent\Builder`. `withoutGlobalScope()` accepts a class name (string), a Scope instance, or a string key. `withoutGlobalScopes()` accepts null (all), an array, or variadic strings.
- **Key Insight:** Scope suppression only affects the current builder instance. The `$scopesApplied` flag is reset to `false` so that if `applyScopes()` was already called, it will re-apply with the suppressed scopes removed.
- **Version-Specific Notes:** Laravel 9+ added variadic `withoutGlobalScopes(Scope::class, Scope::class)` support. Laravel 11 supports suppressing scopes registered via `#[ScopedBy]` attribute using the class name. The `withTrashed()` method on soft-deleting models is syntactic sugar for `withoutGlobalScope(SoftDeletingScope::class)`.
