# Phase 5: Rules — Global Scope Suppression

## Rule 1: Always Use `withoutGlobalScope(Specific::class)` Instead of `withoutGlobalScopes()`
---
## Category
Security
---
## Rule
Always specify exactly which scope(s) to suppress using `withoutGlobalScope(ClassName::class)`. Never use `withoutGlobalScopes()` with no arguments to remove all scopes.
---
## Reason
`withoutGlobalScopes()` (no arguments) removes ALL global scopes from the builder, including security-critical scopes that enforce multi-tenant isolation, soft-delete filtering, and access control. One unintended call can expose all data.
---
## Bad Example
```php
// Nuclear option — removes ALL scopes including TenantScope and SoftDeletingScope
$users = User::withoutGlobalScopes()->get();
```
---
## Good Example
```php
// Precise — removes only the intended scope
$users = User::withoutGlobalScope(SoftDeletingScope::class)->get();
```
---
## Exceptions
Admin-only export jobs specifically designed to export all data (including deleted and cross-tenant), with explicit permission checks and audit logging. Even then, prefer listing each scope explicitly using the array form.
---
## Consequences Of Violation
Critical data breach exposing soft-deleted records, cross-tenant data, or records outside the user's access boundaries; compliance violations; legal liability.

## Rule 2: Gate Scope Suppression Behind Permission Checks
---
## Category
Security
---
## Rule
Always gate any global scope suppression behind an explicit permission or authorization check. Never allow scope suppression for unauthenticated or unauthorized users.
---
## Reason
Scope suppression removes constraints that may enforce data security. Suppressing a multi-tenant scope without a permission check exposes all tenants' data to any user who triggers the suppressed query path.
---
## Bad Example
```php
// No permission check — any user can bypass tenant isolation
$users = User::withoutGlobalScope(TenantScope::class)->get();
```
---
## Good Example
```php
$users = User::query()
    ->when(
        $request->user()?->isAdmin(),
        fn($q) => $q->withoutGlobalScope(TenantScope::class)
    )
    ->get();
```
---
## Exceptions
Suppression of non-security scopes (e.g., a sorting scope that has no data isolation impact). Even then, document that the scope has no security implications.
---
## Consequences Of Violation
Critical data breach; unauthorized access to protected data; inability to prove compliance requirements are met.

## Rule 3: Prefer `withTrashed()` over `withoutGlobalScope(SoftDeletingScope::class)` for Soft Deletes
---
## Category
Maintainability
---
## Rule
Use the `withTrashed()` method for including soft-deleted records. Do not use `withoutGlobalScope(SoftDeletingScope::class)` directly.
---
## Reason
`withTrashed()` is self-documenting, shorter, and is the standard Laravel convention. `SoftDeletingScope::class` requires knowing that the implementation class is internal to Laravel, and the call is less readable.
---
## Bad Example
```php
// Correct but non-standard — better alternatives exist
$users = User::withoutGlobalScope(SoftDeletingScope::class)->get();
```
---
## Good Example
```php
$users = User::withTrashed()->get();
```
---
## Exceptions
When you need to suppress the soft delete scope alongside other scopes in a single call. Use `withoutGlobalScopes([SoftDeletingScope::class, OtherScope::class])`.
---
## Consequences Of Violation
Less readable code that obscures the intent; non-standard approach that confuses team members.

## Rule 4: Encapsulate Suppression in Named Query Methods, Not Inline in Controllers
---
## Category
Code Organization
---
## Rule
Encapsulate scope suppression logic in named methods on query objects, repositories, or custom builders. Do not write inline `withoutGlobalScope()` calls directly in controllers.
---
## Reason
Inline suppression scatters the "why" across controllers, making it impossible to audit or review. Named methods centralize the suppression logic, document the business reason, and enable permission gating in one place.
---
## Bad Example
```php
// Scattered across controllers
class UserController {
    public function export() {
        return User::withoutGlobalScope(TenantScope::class)->get();
    }
}
```
---
## Good Example
```php
// Encapsulated and documented
class UserRepository {
    public function allWithTenants(): Builder
    {
        // Admin export: includes data from all tenants
        return User::withoutGlobalScope(TenantScope::class);
    }
}

class UserController {
    public function export(UserRepository $repo) {
        return $repo->allWithTenants()->get();
    }
}
```
---
## Exceptions
One-time suppression in a data migration or seeder where a dedicated method would be overhead.
---
## Consequences Of Violation
Hard-to-find suppression calls during security audit; inconsistent permission gating across suppression locations; increased risk of accidental suppression in controller code.

## Rule 5: Document Why Each Suppression Is Needed with a Code Comment
---
## Category
Maintainability
---
## Rule
Add a code comment explaining the business reason for every `withoutGlobalScope()` or `withoutGlobalScopes()` call. Include what scope is suppressed and why it is necessary to bypass it.
---
## Reason
Scope suppression is always a trade-off between convenience and security/correctness. Without a documented reason, future developers cannot evaluate whether the suppression is still necessary or whether a better approach exists.
---
## Bad Example
```php
$users = User::withoutGlobalScope(TenantScope::class)->get();
```
---
## Good Example
```php
// Admin data export: generates CSV of all tenants for centralized billing.
// Suppressing TenantScope is required to include all records.
// Gated behind isAdmin() check above.
$users = User::withoutGlobalScope(TenantScope::class)->get();
```
---
## Exceptions
Obvious suppressions like `withTrashed()` where the method name itself documents the reason. Even then, consider documenting why soft-deleted records are needed in this specific context.
---
## Consequences Of Violation
Suppression calls that survive beyond their original purpose; code that is risky to refactor because the suppression reason is unknown; stale suppressions that should have been removed.

## Rule 6: Log All Scope Suppression Events for Audit Trails
---
## Category
Security
---
## Rule
Log every scope suppression event that affects security-related scopes (tenant isolation, access control). Include the user ID, the suppressed scope, the reason, and the timestamp.
---
## Reason
Security-critical scope suppression is a data access event. Without an audit trail, it is impossible to prove compliance, investigate data breaches, or identify unauthorized data access patterns.
---
## Bad Example
```php
// No audit trail
$users = User::withoutGlobalScope(TenantScope::class)->get();
```
---
## Good Example
```php
Log::channel('audit')->info('TenantScope suppressed', [
    'user_id' => $request->user()->id,
    'scope' => TenantScope::class,
    'reason' => 'Admin billing export',
    'timestamp' => now(),
]);
$users = User::withoutGlobalScope(TenantScope::class)->get();
```
---
## Exceptions
Suppression of non-security scopes (e.g., sorting or display-optimization scopes) that have no data isolation impact.
---
## Consequences Of Violation
Inability to audit data access for compliance; missing evidence during incident investigation; regulatory fines from insufficient audit trails.

## Rule 7: Never Suppress Scopes on Stored or Reused Builder Instances
---
## Category
Reliability
---
## Rule
Do not store a builder instance after calling `withoutGlobalScope()` on it and then reuse that builder for later queries. Suppression persists on the builder instance.
---
## Reason
Suppression is a mutation of the builder's internal state. A builder with a suppressed scope remains suppressed for all subsequent queries executed on that instance, including queries that should have the scope applied.
---
## Bad Example
```php
$builder = User::query();
$adminQuery = $builder->withoutGlobalScope(TenantScope::class); // mutated original
$users = $adminQuery->get(); // no tenant scope — correct

$regularUsers = $builder->where('active', true)->get(); // ALSO no tenant scope — BUG
```
---
## Good Example
```php
$adminQuery = User::withoutGlobalScope(TenantScope::class);
$users = $adminQuery->get();

$regularQuery = User::where('active', true); // fresh builder, scopes intact
$regularUsers = $regularQuery->get();
```
---
## Exceptions
No common exceptions. Always create a fresh builder if you need the scope to be applied.
---
## Consequences Of Violation
Intermittent security bugs where scope suppression leaks into unintended queries; data exposure in user-facing pages that should respect scope isolation.
