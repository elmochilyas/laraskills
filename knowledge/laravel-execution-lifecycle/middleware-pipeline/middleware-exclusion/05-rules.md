# Middleware Exclusion — Rules

## Always Use FQCN in `withoutMiddleware()`, Never Aliases
---
## Category
Reliability
---
## Rule
Pass fully qualified class names (FQCN) to `withoutMiddleware()`, not alias strings.
---
## Reason
Exclusion uses class name resolution. An alias string that does not match the resolved class name causes silent exclusion failure — the middleware runs despite the `withoutMiddleware()` call, because the string comparison fails.
---
## Bad Example
```php
Route::post('/webhook', [WebhookController::class, 'handle'])
    ->withoutMiddleware('csrf'); // Alias — may not match resolved class name
```
---
## Good Example
```php
Route::post('/webhook', [WebhookController::class, 'handle'])
    ->withoutMiddleware([
        \App\Http\Middleware\VerifyCsrfToken::class,
    ]);
```
---
## Exceptions
When you have verified that the alias exactly matches the resolved class name via `route:list -v`.
---
## Consequences Of Violation
Silent exclusion failure — middleware still runs; CSRF errors on webhook routes; security bypass in the wrong direction.

---

## Document Every Middleware Exclusion with a Rationale Comment
---
## Category
Maintainability
---
## Rule
Add an inline comment explaining why each middleware is excluded from a route.
---
## Reason
Exclusion bypasses middleware that was intentionally assigned. Future developers need to understand the rationale to maintain safety — an undocumented exclusion is indistinguishable from an accidental one.
---
## Bad Example
```php
Route::post('/stripe/webhook', [WebhookController::class, 'handle'])
    ->withoutMiddleware([VerifyCsrfToken::class]); // Why?
```
---
## Good Example
```php
Route::post('/stripe/webhook', [WebhookController::class, 'handle'])
    ->withoutMiddleware([
        VerifyCsrfToken::class, // Stripe cannot provide CSRF tokens — verified via webhook signature
    ]);
```
---
## Exceptions
No common exceptions — every exclusion needs documented justification.
---
## Consequences Of Violation
Insecurity by obscurity; maintenance nightmare when exclusions accumulate; audit trail lost.

---

## Prefer Route-Specific Middleware Assignment Over Global-Plus-Exclude
---
## Category
Architecture
---
## Rule
Apply middleware directly to routes that need it instead of adding it globally and then excluding from most routes.
---
## Reason
The "global + exclude" pattern is error-prone — every new route must remember to exclude the global middleware, or it runs unintentionally. Route-specific assignment makes the intent explicit and prevents accidental middleware application.
---
## Bad Example
```php
// Global: session middleware on every route, then exclude from most
$middleware->append(\Illuminate\Session\Middleware\StartSession::class);
// 20 routes each with ->withoutMiddleware(StartSession::class)
// One new route forgets — session runs unintentionally
```
---
## Good Example
```php
// Group-specific: only routes that need sessions opt in
$middleware->group('web', [
    \Illuminate\Session\Middleware\StartSession::class,
]);
```
---
## Exceptions
When only 1-2 routes need to exclude a middleware that is otherwise universally required (e.g., health check endpoints).
---
## Consequences Of Violation
Middleware runs on unintended routes; security/performance issues from missing exclusions; fragile architecture.

---

## Verify Exclusions with `route:list -v` Before Deployment
---
## Category
Testing
---
## Rule
Run `php artisan route:list -v` and confirm excluded middleware is absent from the resolved middleware list before deploying.
---
## Reason
Exclusion is applied after middleware gathering. Class name mismatches, alias issues, or source confusion can cause `withoutMiddleware()` to silently fail. Visual verification catches these failures before they reach production.
---
## Bad Example
```php
// Developer assumes exclusion works — deploys without verification
Route::get('/health', fn() => ['ok'])
    ->withoutMiddleware('auth');
// If the resolved class name differs from 'auth', middleware still runs
```
---
## Good Example
```php
// Run: php artisan route:list -v
// Verify health route has no auth middleware in its resolved stack
// Then deploy
```
---
## Exceptions
No common exceptions — always verify exclusions.
---
## Consequences Of Violation
Middleware runs despite exclusion; performance overhead on health checks; auth failures on public endpoints.

---

## Do Not Exclude Security Middleware for Convenience During Development
---
## Category
Security
---
## Rule
Never exclude auth, CSRF, or session middleware from routes during development with the intention of restoring them before deployment.
---
## Reason
"Temporary" exclusions are frequently forgotten during deployment. Routes deployed without security middleware expose vulnerabilities until the next deploy, often discovered by external actors before developers notice.
---
## Bad Example
```php
// Development convenience — forgotten before deployment
Route::post('/admin/users', [UserController::class, 'store'])
    ->withoutMiddleware([
        \App\Http\Middleware\Authenticate::class,
        \App\Http\Middleware\VerifyCsrfToken::class,
    ]);
```
---
## Good Example
```php
// Use environment-based conditional middleware instead
Route::post('/admin/users', [UserController::class, 'store'])
    ->middleware(app()->environment('local') ? [] : ['auth', 'csrf']);
```
---
## Exceptions
When the excluded middleware cannot participate in the request protocol (e.g., CSRF on webhook routes) and is permanently excluded with documented rationale.
---
## Consequences Of Violation
Publicly accessible admin endpoints; missing authentication; data breach; compliance violation.

---

## Use `ShouldSkipMiddleware` for Conditional Production Skipping, Not for Convenience
---
## Category
Architecture
---
## Rule
Implement `ShouldSkipMiddleware` only when middleware must conditionally skip based on runtime state (environment, feature flag), not as a development convenience.
---
## Reason
`ShouldSkipMiddleware` adds a `shouldSkip()` call per request. Using it for development-only skipping adds unnecessary overhead in production and conflates conditional logic with permanent exclusion.
---
## Bad Example
```php
// Skip always in testing — better to just not assign middleware there
public function shouldSkip($request): bool
{
    return app()->environment('testing');
}
```
---
## Good Example
```php
// Skip based on feature flag — legitimate runtime conditional
public function shouldSkip($request): bool
{
    return !Feature::active('new-auth-flow');
}
```
---
## Exceptions
Testing-only middleware (e.g., debug bars) that should never run in production and are not assigned per-route.
---
## Consequences Of Violation
Unnecessary method calls per request; confusion between development shortcuts and intentional conditional behavior.

---

## Audit All `withoutMiddleware()` Calls Regularly
---
## Category
Security
---
## Rule
Periodically review every `withoutMiddleware()` call in the codebase to confirm each exclusion is still necessary and justified.
---
## Reason
Middleware exclusions are security-sensitive — they bypass checks intentionally placed on routes. Exclusions accumulate over time; a once-necessary exclusion (e.g., for an old third-party webhook) may become a vulnerability after the integration changes.
---
## Bad Example
```php
// No review process — exclusions from 3 years ago still present
// Old webhook endpoint still running without auth
```
---
## Good Example
```php
// Scheduled audit: grep for withoutMiddleware, verify each quarterly
// git grep 'withoutMiddleware'
```
---
## Exceptions
No common exceptions — regular audits are standard security hygiene.
---
## Consequences Of Violation
Accumulated security gaps; forgotten exclusions create vulnerabilities; compliance audit findings.
