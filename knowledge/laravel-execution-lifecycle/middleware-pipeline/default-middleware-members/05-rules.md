# Default Middleware Members — Rules

## Never Remove `SubstituteBindings` from Any Group
---
## Category
Reliability
---
## Rule
Keep `Illuminate\Routing\Middleware\SubstituteBindings` in all route groups that use route model binding.
---
## Reason
`SubstituteBindings` is the mechanism that replaces route parameters with Eloquent model instances. Removing it breaks every controller that type-hints models in route parameters — controllers receive raw IDs instead of models, causing null reference errors or logic failures.
---
## Bad Example
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(remove: [
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ]);
})
// All controllers with model type-hints now receive IDs, not models
```
---
## Good Example
```php
// Keep SubstituteBindings in both web and api groups
// Route model binding continues to work as expected
```
---
## Exceptions
API-only applications that resolve models manually in controllers and never use route model binding.
---
## Consequences Of Violation
All route model binding fails; controllers receive raw IDs; authorization gates that depend on models (e.g., `can:update,post`) fail silently.

---

## Do Not Modify Default Groups Without Understanding the Dependency Chain
---
## Category
Maintainability
---
## Rule
Before adding or removing middleware from default groups (`web`, `api`), trace the full dependency chain to ensure no breakage.
---
## Reason
The default order satisfies a dependency chain: `EncryptCookies` → `AddQueuedCookiesToResponse` → `StartSession` → `ShareErrorsFromSession` → `VerifyCsrfToken` → `SubstituteBindings`. Disrupting this order breaks framework functionality silently.
---
## Bad Example
```php
// Moving EncryptCookies after StartSession — session ID is in encrypted cookie
// Session cookie cannot be decrypted; session data lost
$middleware->web(prepend: [
    \Illuminate\Session\Middleware\StartSession::class, // Wrong: before decryption
]);
```
---
## Good Example
```php
// Add custom middleware after the dependency chain is complete
$middleware->web(append: [
    \App\Http\Middleware\Localize::class, // After session — can access locale from session
]);
```
---
## Exceptions
When fully understanding the implications and testing every affected route.
---
## Consequences Of Violation
Broken sessions; CSRF failures; authentication loops; hours of debugging an "impossible" bug.

---

## Audit Default Middleware for API-Only Applications
---
## Category
Performance
---
## Rule
Remove session, cookie, and CSRF default middleware for API-only applications.
---
## Reason
The default stack includes `EncryptCookies`, `StartSession`, `ShareErrorsFromSession`, and `VerifyCsrfToken` — all designed for stateful web apps. API-only apps use tokens, not sessions; these middleware perform I/O on every request with zero benefit.
---
## Bad Example
```php
// API-only app with default web group — session I/O on every API call
// $middleware->use() applies both web and api groups with full defaults
```
---
## Good Example
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(append: [
        \App\Http\Middleware\Authenticate::class,
    ]);
    $middleware->web(remove: [
        \Illuminate\Session\Middleware\StartSession::class,
        \App\Http\Middleware\EncryptCookies::class,
        \App\Http\Middleware\VerifyCsrfToken::class,
    ]);
})
```
---
## Exceptions
API applications that also serve web views from the same Laravel instance — keep the `web` group intact for those routes.
---
## Consequences Of Violation
Unnecessary I/O on every API request; session storage pressure; cookie encryption overhead; increased TTFB by 5-20ms.

---

## Understand Each Default Middleware's Purpose Before Customization
---
## Category
Maintainability
---
## Rule
Research the purpose of every default middleware before modifying or removing it — document the rationale in code comments.
---
## Reason
Default middleware names do not always reveal their full impact. `ShareErrorsFromSession` also flashes old input; `TrimStrings` affects JSON API payloads. Removing without understanding causes subtle application-wide breakage.
---
## Bad Example
```php
// Removed without understanding — now validation errors never show in views
->withMiddleware(function (Middleware $middleware) {
    $middleware->remove(\Illuminate\View\Middleware\ShareErrorsFromSession::class);
})
```
---
## Good Example
```php
// Documented rationale for removal
->withMiddleware(function (Middleware $middleware) {
    // API-only: no Blade views, so ShareErrorsFromSession has no purpose
    $middleware->remove(\Illuminate\View\Middleware\ShareErrorsFromSession::class);
})
```
---
## Exceptions
No common exceptions — every default middleware removal requires documented justification.
---
## Consequences Of Violation
Broken form validation feedback; non-functional file uploads; incorrect IP logging; silent data corruption from unexpected input transformations.

---

## Do Not Add Custom Middleware to Default Groups as a Shortcut
---
## Category
Architecture
---
## Rule
Create custom middleware groups for application-specific middleware instead of appending to default `web` or `api` groups.
---
## Reason
Appending custom middleware to default groups affects every route in that group, including routes added by packages, future developers, or auto-generated scaffolding. Custom groups make the intent explicit and contain the blast radius.
---
## Bad Example
```php
// Custom middleware applied to ALL web routes — including future routes
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        \App\Http\Middleware\TrackPageViews::class,
    ]);
})
```
---
## Good Example
```php
// Custom group for routes that need tracking
->withMiddleware(function (Middleware $middleware) {
    $middleware->group('analytics', [
        \App\Http\Middleware\TrackPageViews::class,
    ]);
})

Route::middleware('analytics')->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
});
```
---
## Exceptions
When the middleware genuinely applies to every route in that group by design (e.g., adding localization to all web routes).
---
## Consequences Of Violation
Unanticipated middleware on new routes; harder to reason about per-route middleware; increased coupling between custom logic and framework defaults.

---

## Review Default Middleware Changes During Framework Upgrades
---
## Category
Maintainability
---
## Rule
Check the Laravel upgrade guide for changes to default middleware before upgrading between major versions.
---
## Reason
Laravel may add, remove, or reorder default middleware between versions. Copying old defaults into new projects (or assuming defaults remain the same) causes unexpected behavior — new security middleware may be missing, or new infrastructure middleware may conflict with custom code.
---
## Bad Example
```php
// Laravel 10 project upgraded to Laravel 11 — still using Kernel properties
// New middleware added in Laravel 11 (e.g., TrustHosts) never applied
protected $middleware = [ /* old list from Laravel 10 */ ];
```
---
## Good Example
```php
// After upgrade: use the new bootstrap/app.php approach with defaults
// Review https://laravel.com/docs/11.x/upgrade for middleware changes
->withMiddleware(function (Middleware $middleware) {
    // Only customize what differs from new defaults
})
```
---
## Exceptions
No common exceptions — always verify middleware changes during upgrades.
---
## Consequences Of Violation
Missing security middleware; incorrect middleware order; unexpected behavior after upgrade; hours spent debugging "nothing changed" problems.

---

## Use Route Model Binding Only Where `SubstituteBindings` Is Present
---
## Category
Reliability
---
## Rule
Only use route model binding (implicit or explicit) on routes that pass through middleware containing `SubstituteBindings`.
---
## Reason
Without `SubstituteBindings`, route parameters remain raw strings or IDs. Controllers that type-hint models receive `null` or the wrong type, causing binding errors or silent logic failures.
---
## Bad Example
```php
// Route in a custom group without SubstituteBindings
Route::get('/users/{user}', function (User $user) {
    return $user; // $user is null or string ID — model not bound
});
```
---
## Good Example
```php
// Custom group that includes SubstituteBindings
->withMiddleware(function (Middleware $middleware) {
    $middleware->group('api-with-binding', [
        'throttle:60,1',
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ]);
});
```
---
## Exceptions
When manually resolving models in the controller using `$request->route('id')` and `User::findOrFail()`.
---
## Consequences Of Violation
Null model instances; 404 errors on valid routes; authorization gates failing because bound model is unavailable.
