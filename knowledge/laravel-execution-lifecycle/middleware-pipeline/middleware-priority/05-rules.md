# Middleware Priority — Rules

## Use Priority Sparingly — Prefer Group Array Ordering First
---
## Category
Architecture
---
## Rule
Resolve middleware ordering within a single source (global, group, route) by ordering the array correctly. Use priority only when ordering must cross source boundaries.
---
## Reason
Priority is a global override that affects every route. Changing it for one route's needs affects all other routes unnecessarily. Group array ordering is localized, visible in the definition, and easier to reason about.
---
## Bad Example
```php
// Priority used to fix ordering that should be resolved in group array
$middleware->priority([
    \App\Http\Middleware\StartSession::class,
    \App\Http\Middleware\Authenticate::class, // Both in same group — order array instead
]);
```
---
## Good Example
```php
// Group array ordering — localized, explicit
$middleware->group('web', [
    \App\Http\Middleware\StartSession::class,
    \App\Http\Middleware\Authenticate::class, // After session — explicit in group
]);
```
---
## Exceptions
When middleware comes from different sources (global vs group vs route) and must maintain a specific relative order.
---
## Consequences Of Violation
Unnecessary global ordering constraints; unintended ordering changes on other routes; harder to reason about middleware flow.

---

## Always Place Middleware That Depends on Route Bindings After `SubstituteBindings`
---
## Category
Reliability
---
## Rule
Ensure middleware that accesses route model bindings runs after `Illuminate\Routing\Middleware\SubstituteBindings` in the priority list.
---
## Reason
Middleware before `SubstituteBindings` receives raw route parameters (string IDs), not model instances. Accessing `$request->route('user')` returns the ID string — any method calls on it fail with null-reference errors.
---
## Bad Example
```php
// Priority puts custom middleware before SubstituteBindings
$middleware->priority([
    \App\Http\Middleware\CheckResourceOwner::class, // Runs before binding — $post is string ID
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
]);
```
---
## Good Example
```php
$middleware->priority([
    \Illuminate\Routing\Middleware\SubstituteBindings::class, // Binding runs first
    \App\Http\Middleware\CheckResourceOwner::class,          // Then resource check — $post is model
]);
```
---
## Exceptions
Middleware that intentionally works with raw route parameters (e.g., validating ID format before binding).
---
## Consequences Of Violation
Null model references; 500 errors on all protected routes; silent return of raw IDs instead of models.

---

## Never Remove or Reorder Default Priority Entries — Only Extend
---
## Category
Maintainability
---
## Rule
Do not modify existing entries in the default middleware priority list. Add custom middleware entries at the appropriate position to extend it.
---
## Reason
The default priority list encodes the dependency chain: `EncryptCookies` → `StartSession` → `Authenticate` → `SubstituteBindings`. Reordering or removing entries breaks framework middleware ordering and causes subtle, hard-to-debug failures in auth, session, and binding.
---
## Bad Example
```php
$middleware->priority([
    // Reordered — Authenticate before StartSession
    \Illuminate\Auth\Middleware\Authenticate::class,
    \Illuminate\Session\Middleware\StartSession::class,
    // Session middleware runs after auth — auth never sees authenticated user
]);
```
---
## Good Example
```php
$middleware->priority([
    // Default entries remain as-is (implicitly inherited)
    // Add custom entries only
    \App\Http\Middleware\CustomTenantMiddleware::class,
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
]);
```
---
## Exceptions
When intentionally overriding framework behavior with full understanding and comprehensive testing.
---
## Consequences Of Violation
Broken authentication; session middleware never sets user before auth check; route model binding fails; hours debugging "impossible" auth issues.

---

## Add Middleware to the Priority List at the Same Time as Registration
---
## Category
Maintainability
---
## Rule
Add middleware to the priority list in the same code change (same commit, same deploy) as the middleware registration.
---
## Reason
A middleware registered without priority runs in its natural merge position, which may be before its dependencies. Adding priority later requires a separate deploy, leaving a window where the middleware runs in the wrong order.
---
## Bad Example
```php
// Deploy 1: Register middleware — no priority
$middleware->web(append: [\App\Http\Middleware\VerifyTenant::class]);

// Deploy 2: Add priority — VerifyTenant ran in wrong order for entire Deploy 1 window
$middleware->priority([\App\Http\Middleware\VerifyTenant::class]);
```
---
## Good Example
```php
// Single change: Register AND set priority
$middleware->web(append: [\App\Http\Middleware\VerifyTenant::class]);
$middleware->priority([\App\Http\Middleware\VerifyTenant::class]);
```
---
## Exceptions
Middleware that has no ordering dependencies and runs correctly in its natural position.
---
## Consequences Of Violation
Ordering bugs in production between deploys; middleware runs before critical dependencies; data integrity issues.

---

## Understand That Priority Affects All Routes Globally
---
## Category
Architecture
---
## Rule
Consider the global impact of every priority change — it alters middleware ordering on every route, not just the route you are working on.
---
## Reason
Priority is a single, application-wide array. Adding your custom middleware to the priority list changes its position relative to all framework middleware on all routes — potentially causing ordering issues for other features.
---
## Bad Example
```php
// Adding CheckFeatureFlag to priority seems safe — but it shifts on ALL routes
$middleware->priority([
    \App\Http\Middleware\CheckFeatureFlag::class,
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
]);
// Now CheckFeatureFlag runs before SubstituteBindings on every route
```
---
## Good Example
```php
// Use group array ordering for route-specific needs
// Only use priority when the ordering must be global
```
---
## Exceptions
When the ordering requirement genuinely applies to all routes (e.g., custom session handler must run before auth everywhere).
---
## Consequences Of Violation
Unintended ordering changes on unrelated routes; subtle feature interactions; increased testing burden.

---

## Audit the Priority List During Framework Upgrades
---
## Category
Maintainability
---
## Rule
Review the custom priority list against the new framework version's default priority when upgrading Laravel.
---
## Reason
Framework updates may add, remove, or reorder default priorities. An outdated custom priority list can conflict with new defaults, causing middleware to run in unexpected order or creating gaps in the dependency chain.
---
## Bad Example
```php
// Laravel 11 custom priority — carried over to Laravel 12 without review
// Laravel 12 added a new middleware between Authenticate and SubstituteBindings
// Custom priority skips it — new middleware runs in wrong position
```
---
## Good Example
```php
// After upgrade: compare old priority with new framework defaults
// php artisan vendor:publish --tag=laravel-middleware (review)
// Update custom priority to account for new framework middleware
```
---
## Exceptions
No common exceptions — always review priority during major version upgrades.
---
## Consequences Of Violation
New framework middleware runs in wrong position; security middleware bypassed; session/binding order disrupted.

---

## Do Not Create Circular Priority Dependencies
---
## Category
Reliability
---
## Rule
Never add two middleware entries where each requires the other to run first — the priority list does not validate circular dependencies.
---
## Reason
Laravel's `sortMiddleware()` does not detect or prevent circular priority definitions. A before B and B before A creates ambiguous ordering — the algorithm produces non-deterministic or unexpected results.
---
## Bad Example
```php
$middleware->priority([
    \App\Http\Middleware\CheckSession::class,    // A before B
    \App\Http\Middleware\ValidateToken::class,   // B before A — circular!
    \Illuminate\Session\Middleware\StartSession::class,
]);
```
---
## Good Example
```php
// Remove one of the circular entries — only one ordering constraint
$middleware->priority([
    \Illuminate\Session\Middleware\StartSession::class,
    \App\Http\Middleware\CheckSession::class,    // Runs after session
    \App\Http\Middleware\ValidateToken::class,   // Runs after session
]);
```
---
## Exceptions
No common exceptions — circular priority is always a design error.
---
## Consequences Of Violation
Non-deterministic middleware order; intermittent bugs that are environment-dependent; impossible to reproduce locally.
