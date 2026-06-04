# Middleware Aliases — Rules

## Register Custom Aliases for All Application Middleware
---
## Category
Code Organization
---
## Rule
Register a short alias for every custom middleware class used in route definitions.
---
## Reason
Route files are cleaner and more scanable when using `'auth'` instead of `\App\Http\Middleware\Authenticate::class`. Aliases decouple route definitions from class locations — framework upgrades that move classes do not require route file changes.
---
## Bad Example
```php
Route::get('/admin', [AdminController::class, 'index'])
    ->middleware(\App\Http\Middleware\Authenticate::class);
```
---
## Good Example
```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias('auth', \App\Http\Middleware\Authenticate::class);
});

// routes/web.php
Route::get('/admin', [AdminController::class, 'index'])
    ->middleware('auth');
```
---
## Exceptions
Middleware used only once where the full class name is comparable in length to the alias.
---
## Consequences Of Violation
Verbose route files; class location changes require updating multiple route files; reduced readability.

---

## Follow Laravel's Aliasing Convention — Lowercase, Hyphenated
---
## Category
Maintainability
---
## Rule
Name middleware aliases in lowercase, using single words or hyphenated phrases (`'auth'`, `'log-requests'`, `'verify-tenant'`).
---
## Reason
Consistent naming prevents confusion; developers familiar with Laravel expect lowercase alias naming. Mixed-case or underscored aliases deviate from the framework convention and reduce discoverability.
---
## Bad Example
```php
$middleware->alias('CheckRole', \App\Http\Middleware\CheckRole::class);
$middleware->alias('verify_tenant', \App\Http\Middleware\VerifyTenant::class);
```
---
## Good Example
```php
$middleware->alias('role', \App\Http\Middleware\CheckRole::class);
$middleware->alias('verify-tenant', \App\Http\Middleware\VerifyTenant::class);
```
---
## Exceptions
Package aliases that follow the package's own naming convention.
---
## Consequences Of Violation
Inconsistent naming across the codebase; developer confusion about alias conventions; harder onboarding.

---

## Never Register Custom Aliases That Collide with Framework Defaults
---
## Category
Maintainability
---
## Rule
Check existing framework aliases before registering custom aliases to avoid silent overrides.
---
## Reason
Two aliases with the same key silently override one another — the last registration wins. Overriding `'auth'` or `'throttle'` changes framework behavior across all routes without warning.
---
## Bad Example
```php
// Overrides the framework 'throttle' alias — all throttle middleware now uses custom class
$middleware->alias('throttle', \App\Http\Middleware\CustomThrottle::class);
```
---
## Good Example
```php
// Use a distinct name for custom middleware
$middleware->alias('rate-limit', \App\Http\Middleware\CustomThrottle::class);

// Usage: ->middleware('rate-limit:100,1')
```
---
## Exceptions
Intentional replacement of framework middleware behavior, documented and tested across all affected routes.
---
## Consequences Of Violation
Silent behavior change across all routes using the overridden alias; hours of debugging "framework isn't working as expected."

---

## Re-Cache Routes After Adding or Changing Aliases
---
## Category
Performance
---
## Rule
Run `php artisan optimize` after registering new aliases or changing existing alias mappings.
---
## Reason
Route caching serializes resolved class names, not aliases. Adding a new alias after caching does not affect cached routes — the new alias is never resolved; removing an alias leaves stale class references in the cache.
---
## Bad Example
```php
// Step 1: Register new alias
$middleware->alias('new-feature', \App\Http\Middleware\NewFeature::class);
// Step 2: Route uses alias but cache still has old state
Route::get('/new', ...)->middleware('new-feature'); // Fails: alias not found in cache
```
---
## Good Example
```php
// Step 1: Register alias
$middleware->alias('new-feature', \App\Http\Middleware\NewFeature::class);
// Step 2: Re-cache
// php artisan optimize
// Step 3: Route works because cache knows 'new-feature'
```
---
## Exceptions
Development environments where route caching is disabled.
---
## Consequences Of Violation
Middleware not found errors on cached routes; stale alias references; production incidents after simple alias additions.

---

## Use the Full Class Name When Registering Aliases — Never Another Alias
---
## Category
Reliability
---
## Rule
Map each alias directly to a fully qualified class name (FQCN), not to another alias string.
---
## Reason
Alias resolution is a single-level array lookup. Chaining aliases (alias → alias → class) is not supported and causes resolution failures.
---
## Bad Example
```php
$middleware->alias('admin-auth', 'auth'); // Wrong: pointing to another alias
```
---
## Good Example
```php
$middleware->alias('admin-auth', \App\Http\Middleware\AuthenticateAdmin::class);
```
---
## Exceptions
No common exceptions — always use FQCN.
---
## Consequences Of Violation
Middleware not found error at runtime; alias resolution returns another alias string instead of a class.

---

## Do Not Use Cryptic Alias Names
---
## Category
Maintainability
---
## Rule
Choose alias names that clearly convey the middleware's purpose, not abbreviated or cryptic names.
---
## Reason
Aliases appear in route definitions that are read by all developers. `'m1'` or `'mw-auth'` obscure intent and require cross-referencing the alias registry — reducing the readability benefit aliases are meant to provide.
---
## Bad Example
```php
$middleware->alias('m1', \App\Http\Middleware\VerifySubscription::class);
// Route: ->middleware('m1') — what does 'm1' do?
```
---
## Good Example
```php
$middleware->alias('verify-subscription', \App\Http\Middleware\VerifySubscription::class);
// Route: ->middleware('verify-subscription') — intent is obvious
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Reduced code readability; developers must look up alias definitions constantly; onboarding friction.
