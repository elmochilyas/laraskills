# Phase 5: Rules — Custom Middleware

---

## Rule Name

Implement Exactly One Concern Per Middleware Class

---

## Category

Code Organization

---

## Rule

Every custom middleware class must address exactly one cross-cutting concern. The class name must communicate the concern (e.g., `CheckRole`, `ForceJson`, `TrimStrings`), not the usage location (e.g., `AdminMiddleware`, `DashboardMiddleware`). Never combine multiple unrelated operations in a single middleware.

---

## Reason

Single-concern middleware can be independently enabled, disabled, reordered, and tested. Combined middleware forces all concerns to be applied together, making selective application impossible and obscuring the pipeline's behavior. Name-based clarity ensures the concern is immediately visible in route definitions and middleware configuration.

---

## Bad Example

```php
class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::check()) { return redirect('login'); }
        if (! $request->user()->isAdmin()) { abort(403); }
        App::setLocale($request->user()->locale);
        Log::info('Admin request', ['user' => $request->user()->id]);
        return $next($request);
    }
}
```

---

## Good Example

```php
class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! $request->user() || ! in_array($request->user()->role, $roles)) {
            abort(403);
        }
        return $next($request);
    }
}

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        App::setLocale($request->user()?->locale ?? config('app.locale'));
        return $next($request);
    }
}
```

---

## Exceptions

Middleware that handles both the inbound and outbound aspects of the same concern (e.g., `HandleCors` handling OPTIONS preflight and adding CORS headers) is acceptable — it is still a single concern.

---

## Consequences Of Violation

Maintenance risks: cannot modify one concern without risk of breaking others. Testing risks: tests must cover multiple concerns in a single test. Operational risks: cannot apply individual concerns to different route groups.

---

---

## Rule Name

Always Return the Result of $next($request)

---

## Category

Reliability

---

## Rule

Every code path in a middleware's `handle()` method must either `return $next($request)` to continue the pipeline, or `return response(...)` or `throw` to short-circuit. Never call `$next($request)` as a statement without returning it, and never omit a return value on any path.

---

## Reason

Forgetting the `return` keyword is the most common middleware bug. The pipeline returns `null` from `handle()`, and Laravel silently converts `null` to an empty 200 response. The response from the controller and all downstream middleware is discarded with no error or warning. This bug is invisible in development because the page still loads — it just returns an empty body.

---

## Bad Example

```php
class TimingMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);
        $next($request); // Missing return — response is discarded
        $response->headers->set('X-Duration', ...); // Undefined variable $response
        return $response; // This is a new empty 200 response
    }
}
```

---

## Good Example

```php
class TimingMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);
        $response = $next($request); // Captures the response
        $response->headers->set('X-Duration', (microtime(true) - $start) * 1000);
        return $response;
    }
}
```

---

## Exceptions

No common exceptions. Every middleware must return a `Response` on every path.

---

## Consequences Of Violation

Reliability risks: silent response loss with no error. Testing risks: tests may pass if they assert on status code (200) rather than content. Debugging difficulty: the issue appears as "missing content" with no error trace.

---

---

## Rule Name

Use $request->attributes->set() for Middleware-to-Controller Communication

---

## Category

Framework Usage

---

## Rule

When middleware resolves or generates data for downstream use (tenant, request ID, resolved user preferences), store it via `$request->attributes->set('key', $value)`. Controllers must access it via `$request->attributes->get('key')`. Never use `$request->merge()`, static properties, or facades to pass middleware data to controllers.

---

## Reason

`$request->merge()` adds data to user input — controllers using `$request->all()` or `$request->validated()` receive middleware data as if the client sent it, potentially bypassing validation and polluting form requests. Static properties and singleton state leak across requests in Octane. The attributes bag is the framework's designated channel for pipeline-enriched data: it is request-scoped, serialization-safe, and clearly distinguishes server-resolved data from client-provided input.

---

## Bad Example

```php
class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->merge(['tenant' => Tenant::findByDomain($request->getHost())]);
        return $next($request);
    }
}
```

---

## Good Example

```php
class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('tenant', Tenant::findByDomain($request->getHost()));
        return $next($request);
    }
}
```

---

## Exceptions

`$request->merge()` is acceptable only for input sanitization — trimming strings, converting empty strings to null, casting numeric types. It must never be used to add data that did not originate from the client.

---

## Consequences Of Violation

Security risks: middleware-added data bypasses validation rules. Reliability risks: Octane requests see stale data from previous requests. Maintenance risks: controllers cannot distinguish client data from system data.

---

---

## Rule Name

Prefer Class Middleware Over Closure Middleware When Dependencies Are Needed

---

## Category

Design

---

## Rule

Use class middleware for any middleware that requires constructor injection, external dependencies, or non-trivial logic. Use closure middleware only for trivial, single-route checks that need no dependencies. Never use closure middleware when facades or `app()` helper calls are the only alternative.

---

## Reason

Closure middleware is not resolved from the container — it cannot use constructor injection. Developers often fall back to facades or the `app()` helper inside closures, which bypasses explicit dependency declaration and makes the middleware's dependencies invisible to static analysis. Class middleware declares dependencies explicitly and is resolved via the container, enabling proper testability and dependency management.

---

## Bad Example

```php
Route::get('/admin', [AdminController::class, 'index'])
    ->middleware(function (Request $request, Closure $next) {
        if (! Auth::check() || ! $request->user()->isAdmin()) {
            abort(403);
        }
        return $next($request);
    });
```

---

## Good Example

```php
class CheckAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::check() || ! $request->user()->isAdmin()) {
            abort(403);
        }
        return $next($request);
    }
}

Route::get('/admin', [AdminController::class, 'index'])->middleware(CheckAdmin::class);
```

---

## Exceptions

Closure middleware is acceptable for temporary debugging middleware, A/B test checks that are short-lived, or when explicitly avoiding a class for a single-route concern. The closure must not use facades or `app()` calls.

---

## Consequences Of Violation

Testing risks: closure middleware cannot be tested in isolation. Maintenance risks: dependencies hidden inside closures via facades are invisible. Code quality: closure middleware on routes mixes pipeline configuration with route definition.

---

---

## Rule Name

Do Not Store Per-Request Data on Instance Properties

---

## Category

Reliability

---

## Rule

Never store per-request data on `$this->property` in middleware. Use `$request->attributes->set()` for data that must be shared with downstream middleware or controllers. Use local variables for data needed only within the `handle()` method.

---

## Reason

In Octane and other long-lived process servers, middleware instances persist across requests. Storing per-request data on an instance property leaks that data to the next request. A middleware that sets `$this->startTime = microtime(true)` in `handle()` will see the previous request's timestamp on the next request. Even outside Octane, instance state creates hidden coupling between middleware calls.

---

## Bad Example

```php
class TimingMiddleware
{
    private float $startTime;

    public function handle(Request $request, Closure $next): Response
    {
        $this->startTime = microtime(true); // Leaks across requests in Octane
        return $next($request);
    }
}
```

---

## Good Example

```php
class TimingMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true); // Local variable — safe
        $response = $next($request);
        $response->headers->set('X-Duration', (microtime(true) - $startTime) * 1000);
        return $response;
    }
}
```

---

## Exceptions

Singleton-registered terminable middleware that explicitly manages shared state (e.g., a request counter keyed by `spl_object_id()`) may store state on `$this`, but must clear per-request data after each `terminate()` call.

---

## Consequences Of Violation

Reliability risks: data leakage across requests in Octane causes incorrect behavior and potential data exposure. Debugging difficulty: intermittent, request-order-dependent bugs are extremely hard to reproduce.

---

---

## Rule Name

Test All Three Execution Paths of Every Middleware

---

## Category

Testing

---

## Rule

Every custom middleware must have tests for at least three execution paths: the pass-through path (conditions met, `$next` called and response returned), the short-circuit path (each condition that returns a response without calling `$next`), and the modification path (request or response is modified and the modification is visible downstream).

---

## Reason

Middleware is defined as much by what it blocks as by what it allows. A guard middleware (e.g., `CheckRole`) that is only tested with the correct role provides no confidence that the blocking behavior works. The short-circuit path is often the security-critical path. Testing only the pass-through path gives a false sense of coverage.

---

## Bad Example

```php
// Only tests the pass-through path
public function test_allows_admin_users(): void
{
    $middleware = new CheckRoleMiddleware();
    $request = Request::create('/admin', 'GET');
    $request->setUserResolver(fn () => User::factory()->make(['role' => 'admin']));

    $response = $middleware->handle($request, fn ($req) => response('OK'), 'admin');

    $this->assertEquals(200, $response->getStatusCode());
}
```

---

## Good Example

```php
public function test_allows_admin_users(): void
{
    $middleware = new CheckRoleMiddleware();
    $request = Request::create('/admin', 'GET');
    $request->setUserResolver(fn () => User::factory()->make(['role' => 'admin']));
    $response = $middleware->handle($request, fn ($req) => response('OK'), 'admin');
    $this->assertEquals(200, $response->getStatusCode());
}

public function test_blocks_non_admin_users(): void
{
    $middleware = new CheckRoleMiddleware();
    $request = Request::create('/admin', 'GET');
    $request->setUserResolver(fn () => User::factory()->make(['role' => 'user']));
    $response = $middleware->handle($request, fn ($req) => response('OK'), 'admin');
    $this->assertEquals(403, $response->getStatusCode());
}

public function test_blocks_unauthenticated_users(): void
{
    $middleware = new CheckRoleMiddleware();
    $request = Request::create('/admin', 'GET');
    $response = $middleware->handle($request, fn ($req) => response('OK'), 'admin');
    $this->assertEquals(403, $response->getStatusCode());
}
```

---

## Exceptions

Middleware with a single pass-through path (e.g., a middleware that only adds a request ID) has only two testable paths: pass-through and modification assertion.

---

## Consequences Of Violation

Security risks: guard middleware that silently allows unauthorized access due to a logic error is not detected. Reliability risks: short-circuit path exceptions are discovered in production. False confidence: test suite reports green despite missing critical coverage.

---

---

## Rule Name

Name Middleware Classes by Concern, Not Usage Location

---

## Category

Maintainability

---

## Rule

Middleware class names must describe the concern they handle (e.g., `CheckRole`, `TrimStrings`, `ForceJson`, `LogRequest`). Never name middleware by the routes they protect (e.g., `AdminMiddleware`, `DashboardMiddleware`, `ApiMiddleware`).

---

## Reason

Concern-based names communicate what the middleware does, making it immediately understandable in route definitions and middleware configuration. Location-based names become misleading — an `AdminMiddleware` placed on a non-admin route creates confusion about whether it should be renamed. When middleware is reused on different route groups, a location-based name is semantically incorrect for every group except the original.

---

## Bad Example

```php
class AdminMiddleware
{
    // Is this auth? Role check? Audit? The name doesn't say.
}
```

---

## Good Example

```php
class CheckRole
{
    // Name says exactly what it does
}

class AuditLog
{
    // Name says exactly what it does
}
```

---

## Exceptions

No common exceptions. If a middleware genuinely applies to a single route and there is no reasonable concern-based name, use an inline closure middleware instead of creating a class.

---

## Consequences Of Violation

Maintenance risks: developers must read the middleware source to understand what it does. Communication risks: route definitions using location-based names do not document what protection or transformation applies. Reuse risks: middleware cannot be confidently applied to new route groups.
