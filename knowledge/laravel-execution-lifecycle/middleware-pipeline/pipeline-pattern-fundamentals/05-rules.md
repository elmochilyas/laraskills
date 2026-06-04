# Pipeline Pattern Fundamentals — Rules

## Always Return `$next($request)` from `handle()`
---
## Category
Framework Usage
---
## Rule
Always return the result of `$next($request)` from every middleware `handle()` method.
---
## Reason
The pipeline chains closures via return values. A missing `return` drops the entire downstream response — the controller and all subsequent middleware never execute, and no response reaches the client.
---
## Bad Example
```php
public function handle($request, $next)
{
    $next($request); // Missing return — downstream response lost
}
```
---
## Good Example
```php
public function handle($request, $next)
{
    return $next($request);
}
```
---
## Exceptions
Middleware that intentionally short-circuits (auth failure, rate limit) may return its own response instead of calling `$next()`.
---
## Consequences Of Violation
No response sent to client; pipeline silently halts; debugging is difficult because no exception is thrown.

---

## Keep Each Pipe Focused on a Single Concern
---
## Category
Maintainability
---
## Rule
Separate cross-cutting concerns into distinct middleware classes — one pipe, one responsibility.
---
## Reason
Middleware with multiple concerns (e.g., auth + logging + CORS) is harder to test, compose, reorder, and reuse. Single-responsibility middleware can be mixed, matched, and prioritized independently.
---
## Bad Example
```php
public function handle($request, $next)
{
    // Authenticate, log, AND check CORS in one middleware
    if (!Auth::check()) { abort(401); }
    Log::info($request->path());
    if (!$request->header('Origin')) { abort(403); }
    return $next($request);
}
```
---
## Good Example
```php
// Three middleware, each with one responsibility
->through([Authenticate::class, LogRequest::class, HandleCors::class])
```
---
## Exceptions
Tightly coupled pre/post pairs (e.g., CORS checks origin inbound and sets headers outbound) may remain in one middleware for co-location.
---
## Consequences Of Violation
Reduced reusability; harder testing; ordering changes require modifying the combined middleware instead of rearranging the pipe array.

---

## Prefer Class-String Pipes Over Closures in `through()`
---
## Category
Performance
---
## Rule
Use fully-qualified class strings in `through()` instead of inline closures for production middleware.
---
## Reason
Class strings are resolved from the container, supporting dependency injection and route caching. Closures cannot be serialized by `php artisan route:cache`, bypassing a key performance optimization.
---
## Bad Example
```php
app(Pipeline::class)
    ->send($request)
    ->through([
        function ($request, $next) { return $next($request); }
    ])
    ->thenReturn();
```
---
## Good Example
```php
app(Pipeline::class)
    ->send($request)
    ->through([TrimStrings::class, EncryptCookies::class])
    ->thenReturn();
```
---
## Exceptions
Ad-hoc pipes in testing, REPL, or one-off scripts where route caching is irrelevant.
---
## Consequences Of Violation
Route caching disabled for affected routes; no dependency injection into closures; harder to test in isolation.

---

## Use `thenReturn()` When the Destination Is Trivial
---
## Category
Code Organization
---
## Rule
Use `thenReturn()` instead of a custom closure when the pipeline destination is simply returning the passable.
---
## Reason
`thenReturn()` eliminates unnecessary boilerplate for the common "pass through all pipes and return" pattern, improving readability.
---
## Bad Example
```php
app(Pipeline::class)
    ->send($request)
    ->through([TrimStrings::class])
    ->then(function ($request) { return $request; });
```
---
## Good Example
```php
app(Pipeline::class)
    ->send($request)
    ->through([TrimStrings::class])
    ->thenReturn();
```
---
## Exceptions
When the destination needs to transform the passable before returning (e.g., dispatch to router).
---
## Consequences Of Violation
Unnecessary boilerplate; reduced readability; no functional impact.

---

## Do Not Use the Pipeline Pattern for Single-Step Processing
---
## Category
Design
---
## Rule
Avoid wrapping a single function call in a Pipeline — use a direct function or method call instead.
---
## Reason
Pipeline adds abstraction overhead (container resolution, closure nesting) that is unjustified for a single processing step. The pattern provides value only when multiple stages are composed.
---
## Bad Example
```php
$result = app(Pipeline::class)
    ->send($data)
    ->through([SingleStepTransformer::class])
    ->thenReturn();
```
---
## Good Example
```php
$result = app(SingleStepTransformer::class)->handle($data, fn($d) => $d);
```
---
## Exceptions
When the single pipe must participate in a pipeline chain that may grow later, or when consistency with surrounding pipeline code is more important.
---
## Consequences Of Violation
Unnecessary abstraction; increased cognitive load; marginal performance cost (~0.1-0.5ms per pipeline resolution).

---

## Do Not Use Pipeline for Parallel or Branching Flows
---
## Category
Design
---
## Rule
Use Pipeline only for sequential, linear processing. For parallel or branching logic, use other patterns (queues, strategies, event system).
---
## Reason
Pipeline executes pipes sequentially — each pipe blocks until the previous completes. Parallel processing requires separate mechanisms; branching requires conditional logic outside the Pipeline.
---
## Bad Example
```php
// Attempting to process two data streams through one pipeline
app(Pipeline::class)
    ->send($data)
    ->through([TransformA::class, TransformB::class]) // Runs A then B, not in parallel
    ->thenReturn();
```
---
## Good Example
```php
// Parallel: dispatch two jobs
ProcessDataA::dispatch($data);
ProcessDataB::dispatch($data);
```
---
## Exceptions
When sequential-but-independent processing is acceptable (e.g., validation chains where each step depends on the previous output).
---
## Consequences Of Violation
False expectations about execution semantics; performance issues from unnecessary sequentialization.

---

## Always Handle Container Resolution Failure for Pipeline Pipes
---
## Category
Reliability
---
## Rule
Validate that class-string pipes exist and can be resolved by the container, or handle `BindingResolutionException` gracefully.
---
## Reason
An invalid or missing middleware class string throws an uncaught `BindingResolutionException`, returning a 500 error. The pipeline has no built-in validation at configuration time — failures surface only at runtime.
---
## Bad Example
```php
->through([NonExistentMiddleware::class]) // Typo — only fails at runtime
```
---
## Good Example
```php
// Register middleware with validation or test coverage
->through([app()->make(MiddlewareRegistry::class)->validated()])
```
---
## Exceptions
Development environments where immediate failure is desirable for fast feedback.
---
## Consequences Of Violation
Runtime 500 errors on affected routes; production outages from simple typographical errors.

---

## Document Modifications to the Passable Object
---
## Category
Maintainability
---
## Rule
Each pipe should document what it modifies on the passable (request) so downstream pipes understand the expected state.
---
## Reason
Pipes modify the passable as it travels through the pipeline. Undocumented mutations cause subtle bugs — downstream pipes make assumptions about state that may not hold.
---
## Bad Example
```php
public function handle($request, $next)
{
    $request->attributes->set('_secret', decrypt($request->input('token')));
    return $next($request);
    // No documentation that _secret was set
}
```
---
## Good Example
```php
/**
 * Decrypts the 'token' input and stores it as '_secret' on the request.
 * Downstream middleware can access via $request->attributes->get('_secret').
 */
public function handle($request, $next)
{
    $request->attributes->set('_secret', decrypt($request->input('token')));
    return $next($request);
}
```
---
## Exceptions
Trivial modifications that are obvious from the class name (e.g., `TrimStrings`).
---
## Consequences Of Violation
Hard-to-trace bugs; increased debugging time; fragile downstream code.

---

## Avoid Storing Request State in Static Properties Within Pipes
---
## Category
Architecture
---
## Rule
Do not store request-specific data in static properties or globals inside pipe logic.
---
## Reason
Static state persists across requests in long-running environments (Octane, Swoole) and cannot be relied upon for request-scoped data. Each request should have isolated state.
---
## Bad Example
```php
class RequestLogger
{
    public static array $logs = [];
    
    public function handle($request, $next)
    {
        static::$logs[] = $request->path(); // Bleeds across requests
        return $next($request);
    }
}
```
---
## Good Example
```php
class RequestLogger
{
    public function handle($request, $next)
    {
        $request->attributes->set('_log', $request->path());
        return $next($request);
    }
}
```
---
## Exceptions
Immutable configuration data that does not vary per request.
---
## Consequences Of Violation
Data leakage between requests in Octane/Swoole; non-deterministic bugs; memory leaks.

---

## Understand the Short-Circuit Impact on Downstream Pipes
---
## Category
Reliability
---
## Rule
When a pipe short-circuits by returning a response without calling `$next()`, verify that no downstream pipe was expected to run for correctness.
---
## Reason
Short-circuiting is intentional (auth failure returns 401) but can silently skip critical downstream logic such as logging, auditing, or response transformation.
---
## Bad Example
```php
// Auth middleware returns 401 — downstream logger never runs
app(Pipeline::class)
    ->send($request)
    ->through([Authenticate::class, LogRequest::class]) // Logger skipped on auth failure
    ->thenReturn();
```
---
## Good Example
```php
// Ensure logging middleware runs before auth, or use terminable middleware
app(Pipeline::class)
    ->send($request)
    ->through([LogRequest::class, Authenticate::class])
    ->thenReturn();
```
---
## Exceptions
When short-circuit behavior is the desired outcome (e.g., rejecting unauthorized requests before any processing).
---
## Consequences Of Violation
Missing audit trails on failed requests; response modification skipped; inconsistent application state.
