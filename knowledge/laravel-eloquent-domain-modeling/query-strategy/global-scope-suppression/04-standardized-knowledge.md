# Global Scope Suppression — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Global Scope Suppression
- **ECC Version:** 1.0

## Overview
Global scope suppression temporarily removes global scopes from a query using `withoutGlobalScope()` and `withoutGlobalScopes()` methods. This is essential for admin panels (showing soft-deleted records), data exports (including all tenants' data), and any operation that must bypass standard query filters. Suppression is a sharp tool — it removes constraints that may enforce security boundaries or data integrity. Understanding when and how to suppress scopes safely is critical.

## Core Concepts
- `withoutGlobalScope($scope)`: removes a single global scope by class name, key, or instance
- `withoutGlobalScopes($scopes = null)`: removes all (if null) or specified (if array) global scopes
- Scope Removal: the scope is removed from the builder's scope array before execution
- Temporary: suppression only affects the current builder instance; subsequent queries still apply the scope
- `$scopesApplied` reset: set to `false` so scopes are re-applied with the removed scope excluded

## When To Use
- Admin panels showing soft-deleted records (`withoutGlobalScope(SoftDeletingScope::class)`)
- Data exports including all tenants' data (admin-only, permission-gated)
- Selective feature bypassing a specific constraint for edge cases
- Testing — verifying behavior both with and without a global scope
- Temporary override in scheduled jobs that need to process all records

## When NOT To Use
- Do NOT use `withoutGlobalScopes()` (all scopes) when you need only one scope suppressed
- Do NOT use suppression for regular user-facing queries — use local scopes instead
- Do NOT use suppression without a permission check for scope that enforces security
- Do NOT suppress scopes on stored/reused builder instances — the scope stays suppressed
- Do NOT suppress scopes in library/package code without documentation

## Best Practices (WHY)
- Always specify which scope to suppress: `withoutGlobalScope(ClassName::class)` over `withoutGlobalScopes()`
- Gate suppression behind permissions: `$query->when($user->isAdmin(), fn($q) => $q->withoutGlobalScope(...))`
- Document WHY the scope is suppressed in a comment (the business reason)
- Test suppressed queries — verify they return the expected expanded results
- Log suppression events in audit trails for compliance
- Use `withTrashed()` instead of `withoutGlobalScope(SoftDeletingScope::class)` for soft deletes

## Architecture Guidelines
- Encapsulate scope suppression in query objects or repository methods, not inline in controllers
- Create named methods for common suppression patterns: `$query->includeSoftDeletes()`
- Never suppress scopes in base repository methods — suppress in specific query methods only
- Review all suppression calls in code review — they are high-risk operations
- Use `withoutGlobalScopes(['scope1', 'scope2'])` (array) over the variadic form for clarity

## Performance
- Suppression itself is negligible — simple array removal
- Removing a scope may remove an index-friendly WHERE clause, causing full table scans
- Test query plans before and after suppression to ensure performance is acceptable
- Suppression affects the Query Builder clone internally — no additional query cost

## Security
- **CRITICAL**: suppressing a multi-tenant scope exposes all tenants' data
- **CRITICAL**: suppressing without permission check is a data breach vector
- Suppression is per-builder-instance — but if the builder is reused, the scope stays suppressed
- Auditing: log all suppression events with user ID and reason
- Code review: every suppression call should have an explicit permission check

## Common Mistakes
- Calling `withoutGlobalScopes()` (all scopes) when only one scope is intended — removes security scopes too
- Suppressing the wrong scope class name (case-sensitive, must match exactly)
- Suppressing scope after execution — calling `withoutGlobalScope()` on an already-executed query
- Assuming suppression applies to related queries — suppress on the relationship builder separately
- Forgetting `SoftDeletingScope` inheritance — a model with `SoftDeletes` always has this scope
- Storing a suppressed builder and reusing it — the scope remains suppressed

## Anti-Patterns
- **Nuclear Option**: `withoutGlobalScopes()` without specifying which scopes to remove
- **Unchecked Suppression**: suppressing a scope without verifying the user has permission
- **Hidden Suppression**: suppressing scopes deep in a repository without documentation
- **Reused Suppression**: storing a builder with suppressed scopes and using it for multiple queries
- **Suppression Sprawl**: 20+ places in the codebase suppressing the same scope without centralization

## Examples
```php
// Single scope suppression (preferred)
$users = User::withoutGlobalScope(SoftDeletingScope::class)->get();

// withTrashed() is syntactic sugar for the above
$users = User::withTrashed()->get();

// Permission-gated suppression
$users = User::query()
    ->when(
        $request->user()->isAdmin(),
        fn($q) => $q->withoutGlobalScope(TenantScope::class)
    )
    ->get();

// Suppress multiple specific scopes
$users = User::withoutGlobalScopes([TenantScope::class, PublishedScope::class])->get();

// Suppression on relationship builder
$user->posts()->withoutGlobalScope(PublishedScope::class)->get();

// Encapsulated suppression
class UserRepository {
    public function includeSoftDeleted(): Builder {
        return User::withoutGlobalScope(SoftDeletingScope::class);
    }
}

// With audit logging
$users = User::query()
    ->when($isAdmin, function ($q) use ($user) {
        Log::info("Tenant scope suppressed by {$user->id}");
        return $q->withoutGlobalScope(TenantScope::class);
    })
    ->get();
```

## Related Topics
- Global Scopes — understanding what is being suppressed
- Soft Deletes — `SoftDeletingScope` is the most commonly suppressed scope
- Local Scopes — opt-in alternative to suppressed global scopes
- Decision Framework — when suppression vs Query Builder vs `withTrashed()`

## AI Agent Notes
- Always prefer `withoutGlobalScope(ClassName::class)` over `withoutGlobalScopes()`
- Gate suppression behind a permission check for security-related scopes
- Test that suppressed queries return the expected expanded results
- Document why suppression is needed
- Use `withTrashed()` for soft-delete scope suppression — it's clearer
- Suppression on relationship builders is independent of the parent builder

## Verification
- [ ] All suppression calls specify which scope(s) to suppress, not `withoutGlobalScopes()` blanket
- [ ] Suppression gated behind permission checks for security scopes
- [ ] Suppression reason documented in code comments
- [ ] Suppressed queries tested for correct expanded results
- [ ] No suppressed builder instances stored and reused across requests
- [ ] Audit trail captures suppression events
- [ ] Relationship builder suppression handled independently of parent builder
