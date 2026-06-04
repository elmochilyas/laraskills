# Middleware vs Route Binding Ordering — Rules

## Place Model-Accessing Middleware After `SubstituteBindings` in the Group Array
---
## Category
Reliability
---
## Rule
Position custom middleware that inspects route model bindings after `Illuminate\Routing\Middleware\SubstituteBindings` in middleware group arrays.
---
## Reason
`SubstituteBindings` replaces route parameters (`{user}`) with Eloquent model instances. Middleware that runs before it receives raw string IDs — attempting to call model methods on them causes null-reference errors or silent failures.
---
## Bad Example
```php
$middleware->group('web', [
    \App\Http\Middleware\CheckPostOwner::class, // Runs before binding — $post is string ID
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
]);
```
---
## Good Example
```php
$middleware->group('web', [
    \Illuminate\Routing\Middleware\SubstituteBindings::class, // Binding runs first
    \App\Http\Middleware\CheckPostOwner::class,               // Then ownership check
]);
```
---
## Exceptions
Middleware that intentionally validates or transforms raw route parameter IDs before binding occurs.
---
## Consequences Of Violation
Null model references; silent acceptance of raw IDs as models; authorization gates that always fail.

---

## Never Assume `$request->route('param')` Is a Model Instance
---
## Category
Reliability
---
## Rule
Always check whether route binding has occurred before treating a route parameter as a model instance, or ensure ordering guarantees it.
---
## Reason
Before `SubstituteBindings` executes, `$request->route('user')` returns the raw string ID from the URL. Code that assumes a model instance will throw `Error: Call to a member function on string` or silently produce incorrect results.
---
## Bad Example
```php
public function handle($request, $next)
{
    $post = $request->route('post');
    if ($post->user_id !== auth()->id()) { // Fatal error if $post is still a string
        abort(403);
    }
    return $next($request);
}
```
---
## Good Example
```php
public function handle($request, $next)
{
    // Either guarantee order (middleware after SubstituteBindings)
    // Or check type before accessing
    $post = $request->route('post');
    if (is_string($post)) {
        $post = \App\Models\Post::findOrFail($post);
    }
    if ($post->user_id !== auth()->id()) {
        abort(403);
    }
    return $next($request);
}
```
---
## Exceptions
Middleware that is guaranteed to run after `SubstituteBindings` via priority or group position.
---
## Consequences Of Violation
500 errors on all routes using the middleware; data corruption from treating strings as models.

---

## Keep Auth Middleware Before `SubstituteBindings` for Performance
---
## Category
Performance
---
## Rule
Place authentication middleware before `SubstituteBindings` in the priority list so unauthenticated requests skip model loading.
---
## Reason
Placing auth before binding means unauthenticated requests are rejected before any model binding queries execute. This saves one or more database queries per rejected request — significant for high-traffic applications.
---
## Bad Example
```php
$middleware->priority([
    \Illuminate\Routing\Middleware\SubstituteBindings::class, // Binding runs first
    \Illuminate\Auth\Middleware\Authenticate::class,          // Then auth — models loaded for rejected requests
]);
```
---
## Good Example
```php
$middleware->priority([
    \Illuminate\Auth\Middleware\Authenticate::class,          // Auth first — reject before loading
    \Illuminate\Routing\Middleware\SubstituteBindings::class, // Then bind — only for authenticated users
]);
```
---
## Exceptions
Middleware that requires route model bindings to determine authentication state (rare — e.g., token-bound auth).
---
## Consequences Of Violation
Unnecessary database queries on every unauthenticated request; increased server load; degraded performance under attack.

---

## Test Binding-Aware Middleware with Both Authenticated and Unauthenticated Requests
---
## Category
Testing
---
## Rule
Write tests that verify binding-aware middleware behaves correctly for both authenticated and unauthenticated requests.
---
## Reason
Auth middleware before `SubstituteBindings` means authenticated requests bind models, while unauthenticated requests skip binding entirely. Middleware that assumes binding always occurred fails when auth rejects the request early — and middleware that assumes binding never occurred fails when auth passes.
---
## Bad Example
```php
// Only testing authenticated path
public function test_middleware_checks_ownership(): void
{
    $this->actingAs($user)
        ->get('/posts/1')
        ->assertOk();
    // Unauthenticated path untested — middleware may crash
}
```
---
## Good Example
```php
public function test_middleware_checks_ownership_authenticated(): void
{
    $this->actingAs($user)
        ->get('/posts/1')
        ->assertOk();
}

public function test_middleware_rejects_unauthenticated(): void
{
    $this->get('/posts/1')
        ->assertRedirect('/login');
    // Auth middleware redirects before binding — no model query
}
```
---
## Exceptions
No common exceptions — both paths require testing.
---
## Consequences Of Violation
Undiscovered crashes on unauthenticated requests; security bypasses on authenticated requests; false sense of security coverage.

---

## Do Not Manually Resolve Bindings in Middleware — Fix the Order Instead
---
## Category
Architecture
---
## Rule
Do not duplicate `SubstituteBindings` logic in your middleware. Ensure correct ordering instead.
---
## Reason
Manually calling `Route::binding()` or `Route::resolveRouteBinding()` in middleware duplicates framework logic, couples middleware to binding details, and bypasses explicit binding callbacks. Proper ordering is simpler and more maintainable.
---
## Bad Example
```php
public function handle($request, $next)
{
    // Manually resolving binding because order is wrong
    $id = $request->route('post');
    $post = \App\Models\Post::findOrFail($id);
    $request->route()->setParameter('post', $post);
    return $next($request);
}
```
---
## Good Example
```php
// Fix priority so SubstituteBindings runs first
// Then middleware can assume bindings are resolved
public function handle($request, $next)
{
    $post = $request->route('post'); // Already a model
    return $next($request);
}
```
---
## Exceptions
When accessing bindings that are explicitly resolved in a non-standard way (custom binding resolvers).
---
## Consequences Of Violation
Duplicated framework logic; bypassed explicit binding callbacks; harder to maintain; inconsistent binding behavior.

---

## Place Authorization (`can:`) Middleware After, Not Before, `SubstituteBindings`
---
## Category
Reliability
---
## Rule
Ensure policy-based authorization middleware (`can:update,post`) runs after `SubstituteBindings` so the bound model is available for policy evaluation.
---
## Reason
Laravel's `Authorize` middleware (`can:`) extracts bound models from route parameters for policy methods. If it runs before `SubstituteBindings`, the model parameter is still a raw ID — the policy receives `null` or the wrong argument, causing authorization to fail or pass incorrectly.
---
## Bad Example
```php
Route::put('/posts/{post}', [PostController::class, 'update'])
    ->middleware('can:update,post');
// If 'can' runs before SubstituteBindings, $post is null in policy
```
---
## Good Example
```php
// Default priority satisfies this: SubstituteBindings before Authorize
// Verify with: php artisan route:list -v
// If custom priority reorders, ensure Authorize is AFTER SubstituteBindings
$middleware->priority([
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
    \Illuminate\Auth\Middleware\Authorize::class,
]);
```
---
## Exceptions
Policy methods that do not depend on the bound model (e.g., `create` which has no model parameter).
---
## Consequences Of Violation
Authorization always fails with null model; all update/delete routes return 403; authorization gates silently bypassed.
