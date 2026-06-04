# Skill: Trace the HTTP Kernel Request Lifecycle

## Purpose
Walk through the complete HTTP kernel request flow from `handle()` entry through bootstrap, middleware pipeline, route dispatch, and terminate phase to understand execution order and interception points.

## When To Use
- Debugging a request that behaves unexpectedly — wrong middleware order, missing bootstrapper state, or broken terminate handlers
- Onboarding new team members to Laravel's request lifecycle
- Evaluating where to hook custom logic (bootstrapper, middleware, terminate, or handler)
- Investigating performance bottlenecks in the framework's entry path

## When NOT To Use
- Debugging a specific middleware's logic (use middleware-specific debugging)
- Tracing queue job execution (queue workers use a separate lifecycle)
- Analyzing Blade view rendering or response formatting (use view/template debugging)

## Prerequisites
- Access to the Laravel framework source: `Illuminate/Foundation/Http/Kernel.php`
- Understanding of the Pipeline pattern (`Illuminate\Pipeline\Pipeline`)
- A running Laravel application (local or development environment)

## Inputs
- The HTTP request object (incoming from server)
- The configured middleware stack (global, group, route)
- The registered bootstrapper array

## Workflow
1. Start at `Kernel::handle($request)` — the single entry point for all HTTP requests
2. Trace into `bootstrap()` — verify the six bootstrappers execute in order: `LoadEnvironmentVariables` → `LoadConfiguration` → `HandleExceptions` → `RegisterFacades` → `RegisterProviders` → `BootProviders`
3. Note the `$this->hasBeenBootstrapped` guard — bootstrappers run exactly once per kernel instance
4. Trace into `sendRequestThroughRouter($request)` — the core orchestration method
5. Observe the Pipeline construction: `(new Pipeline($this->app))->send($request)->through($this->middleware)->then($this->dispatchToRouter())`
6. Understand that global middleware runs first, then group middleware, then route-specific middleware, with `$middlewarePriority` reordering across these boundaries
7. Trace `dispatchToRouter()` — calls `$router->dispatch($request)`, entering the routing layer where route matching, controller resolution, and response generation occur
8. After the response is returned from the pipeline, trace back to `handle()` — the response is sent to the client (in `public/index.php`)
9. Trace `terminate($request, $response)` — runs terminable middleware in LIFO order and evaluates request duration lifecycle handlers
10. Confirm that `terminate()` runs after the response is already sent to the client

## Validation Checklist
- [ ] Identified the six bootstrappers in exact order
- [ ] Verified the middleware pipeline wraps request in global → group → route order
- [ ] Confirmed `$middlewarePriority` reordering across boundaries
- [ ] Traced `dispatchToRouter()` call into the Router
- [ ] Confirmed `terminate()` runs after response is sent
- [ ] Verified the guarded bootstrap flag per kernel instance

## Common Failures
- Missing return from middleware breaks the pipeline — `$next($request)` must be returned
- Terminable middleware not registered in global or group middleware — only listed middleware is terminable
- Priority overrides not applied — priority is in `$middlewarePriority`, not `$middleware`
- Bootstrap runs multiple times per request — the guard prevents this; only once per kernel instance

## Decision Points
- **Bootstrapper vs Middleware**: Use bootstrappers for framework initialization (before request processing); use middleware for request/response manipulation
- **Middleware vs Terminate**: Use middleware for pre/post request logic; use terminate for post-response work that shouldn't block the response
- **Pipeline vs Nested Calls**: The pipeline is fixed — customization goes into middleware or route handlers, not kernel overrides

## Performance Considerations
- Each bootstrapper adds latency to TTFB — RegisterProviders + BootProviders are the most expensive (60-70% of bootstrap time)
- Each global middleware adds ~2 method calls — with 10+ middleware, 1-3ms framework overhead per request
- Pipeline array is reconstructed every request (fixed list, but the array is built each time)
- Terminate handlers block the PHP worker — keep fast or defer to queues

## Security Considerations
- Middleware that short-circuits (returns response without calling `$next`) prevents downstream middleware from executing — ensure auth/security middleware runs first
- Exception in terminable middleware may crash the process silently (response already sent)
- Guarded bootstrap means a kernel instance cannot recover from a failed bootstrap mid-lifecycle

## Related Rules
- Keep global middleware minimal; prefer group or route middleware (Performance)
- Always return `$next($request)` from middleware handle methods (Reliability)
- Do not override `handle()` on the HTTP Kernel — use middleware or bootstrappers (Architecture)
- Understand the guarded bootstrap flag when testing sub-requests (Testing)

## Related Skills
- Configure and Verify Middleware Execution Order
- Implement and Register Terminable Middleware

## Success Criteria
- Able to describe the exact execution order for any request: bootstrap → global middleware → group middleware → route middleware → dispatch → response return → terminate
- Can identify where in the lifecycle a given piece of custom logic executes
- Can predict how changes to middleware, bootstrappers, or kernel configuration affect the lifecycle

---

# Skill: Configure and Verify Middleware Execution Order

## Purpose
Configure global, group, and route middleware with correct execution order, manage `$middlewarePriority` overrides, and verify the resolved order using `php artisan route:list -v`.

## When To Use
- Adding new middleware to any layer (global, group, route)
- Debugging order-dependent middleware bugs (e.g., auth running after route binding)
- Refactoring middleware configuration for performance or clarity
- Migrating between Laravel versions with different middleware configuration APIs

## When NOT To Use
- Writing middleware logic itself (use the middleware handle method for that)
- Configuring non-middleware bootstrap concerns (use bootstrappers)
- Debugging route matching or controller resolution (use routing tools)

## Prerequisites
- Understanding of the three middleware layers: global, group, route
- Access to the middleware configuration location:
  - Laravel 10: `app/Http/Kernel.php`
  - Laravel 11+: `bootstrap/app.php` via `->withMiddleware()`
- `php artisan route:list -v` command available

## Inputs
- List of global middleware classes
- List of middleware groups (e.g., 'web', 'api') with their middleware arrays
- Route-specific middleware assignments
- Priority overrides in `$middlewarePriority` (Laravel 10) or priority configuration

## Workflow
1. Identify the middleware layers:
   - **Global middleware**: Runs on every request via `$middleware` (Laravel 10) or `$middleware->append()` / `$middleware->prepend()` (Laravel 11+)
   - **Group middleware**: Runs on routes assigned to a group via `$middlewareGroups` (Laravel 10) or `$middleware->web(append: [...])` (Laravel 11+)
   - **Route middleware**: Runs on individual routes via `Route::get(...)->middleware('name')` and aliased via `$routeMiddleware` (Laravel 10) or `$middleware->alias()` (Laravel 11+)
2. Place middleware at the most specific level possible: route > group > global
3. Determine the execution order within each level — entries execute in the order they appear in the array
4. Configure `$middlewarePriority` only when middleware from different layers must be interleaved. Add inline comments explaining each override
5. Run `php artisan route:list -v` to display all routes with their resolved middleware in execution order
6. Verify that security middleware (auth, CSRF) runs before any middleware that accesses authenticated user data
7. Verify that `SubstituteBindings` runs before middleware that expects resolved route model bindings
8. If the resolved order is wrong, adjust group array order before adding priority overrides

## Validation Checklist
- [ ] `php artisan route:list -v` shows middleware in correct execution order for each route
- [ ] Global middleware entries are minimal — only middleware that truly needs every request
- [ ] Security-critical middleware (auth, throttle) appears before data-accessing middleware
- [ ] `$middlewarePriority` overrides are documented with inline comments explaining why
- [ ] Group middleware entries are ordered correctly within their groups
- [ ] Route middleware aliases resolve to the correct classes

## Common Failures
- Auth running after route binding: `SubstituteBindings` is in the web group before `Authenticate`. Fix: reorder group array or add priority override
- Middleware from different sources (global, group, route) execute in non-obvious order. Fix: always verify with `route:list -v`
- Priority affects all routes globally — a fix for one route breaks another. Fix: prefer group array ordering over priority
- Terminable middleware not registered in global or group stack — route middleware is NOT terminable. Fix: move terminable middleware to global or group

## Decision Points
- **Global vs Group vs Route**: Global for truly universal concerns (cors, trusted proxies); group for web/api-specific concerns; route for endpoint-specific concerns
- **Priority override vs Group reorder**: Prefer reordering within groups. Priority is a global override affecting all routes; use only when middleware from different groups/layers must interleave
- **Prepend vs Append (Laravel 11+)**: Prepend to add before framework defaults; append to add after

## Performance Considerations
- Each global middleware adds pipeline resolution cost on every request — keep the global stack lean
- Middleware priority adds no runtime cost — it's resolved at configuration time
- Route-level middleware does not affect other routes — completely isolated
- Use route caching in production: `php artisan route:cache` freezes middleware configuration for faster resolution

## Security Considerations
- If `RedirectIfAuthenticated` middleware (guest) runs before logging middleware, non-authenticated requests are never logged
- Trusted proxy configuration (global middleware) must run before any middleware that inspects client IPs — otherwise IPs resolve to proxy IPs
- CORS middleware must run early in the global stack to handle preflight OPTIONS requests before auth middleware

## Related Rules
- Keep global middleware minimal; prefer group or route middleware (Performance)
- Verify middleware execution order with `php artisan route:list -v` (Maintainability)
- Always return `$next($request)` from middleware handle methods (Reliability)

## Related Skills
- Trace the HTTP Kernel Request Lifecycle
- Implement and Register Terminable Middleware

## Success Criteria
- `php artisan route:list -v` output matches the intended execution order for every route
- No order-dependent middleware bugs (e.g., auth after binding, session after auth) occur in the application
- The global middleware stack contains only middleware that truly needs every request
- All `$middlewarePriority` overrides are documented with a rationale comment

---

# Skill: Implement and Register Terminable Middleware

## Purpose
Create middleware that executes post-response logic (logging, metrics, cleanup) in the terminate phase, and register it correctly so it runs after the response is sent to the client.

## When To Use
- Logging request metrics (response time, status code distribution) without blocking the response
- Cleaning up temporary resources after the response is sent
- Gathering diagnostic data that doesn't affect the user experience
- Implementing audit trails that must capture the final response state

## When NOT To Use
- Logic that must modify the response (use standard middleware with `return $next($request)`)
- Logic that must block the request (use standard pre-response middleware)
- Heavy post-response work like database writes or HTTP calls (use queues instead)
- Console commands — terminate behavior differs in Console Kernel

## Prerequisites
- Understanding of the HTTP Kernel's `terminate()` method
- Access to middleware configuration (Laravel 10: `app/Http/Kernel.php`; Laravel 11+: `bootstrap/app.php`)
- Familiarity with the middleware handle method pattern

## Inputs
- The terminable middleware class implementing `TerminableMiddleware`
- The middleware registration location (global or group stack)

## Workflow
1. Create a middleware class that implements the terminable interface or defines a `terminate` method:
   ```php
   namespace App\Http\Middleware;

   use Closure;
   use Illuminate\Http\Request;
   use Symfony\Component\HttpFoundation\Response;

   class LogRequestMetrics
   {
       public function handle(Request $request, Closure $next): Response
       {
           return $next($request);
       }

       public function terminate(Request $request, Response $response): void
       {
           // Post-response logic — response already sent to client
           // Keep this lightweight!
           if (config('logging.metrics.enabled')) {
               Log::channel('metrics')->info('Request completed', [
                   'url' => $request->fullUrl(),
                   'status' => $response->getStatusCode(),
                   'duration' => microtime(true) - LARAVEL_START,
               ]);
           }
       }
   }
   ```
2. Keep the `terminate()` method lightweight — no database writes, HTTP calls, or file operations
3. Register the middleware in the global middleware stack (not route middleware — only global and group middleware have terminable behavior):
   - Laravel 10: Add to `$middleware` array in `app/Http/Kernel.php`
   - Laravel 11+: Use `$middleware->append()` in `bootstrap/app.php`
4. Verify the middleware runs in the terminate phase by adding a temporary log statement in `terminate()` and checking that it appears after the response is sent
5. If heavy post-response work is needed, dispatch a queued job from `terminate()` instead of doing the work inline

## Validation Checklist
- [ ] Middleware's `terminate()` method executes after the response is sent to the client
- [ ] `terminate()` method is lightweight (no DB queries, HTTP calls, or file writes inline)
- [ ] Middleware is registered in the global or group middleware stack (not only as route middleware)
- [ ] Heavy work from `terminate()` is dispatched to a queue, not executed inline
- [ ] Exception in `terminate()` does not crash the process — wrapped in try-catch

## Common Failures
- Route middleware not terminable: Only middleware in the global stack (`$middleware`) or group stacks (`$middlewareGroups`) receives the `terminate()` call. Route-specific middleware does NOT run `terminate()`
- Heavy terminate blocks the next request: In PHP-FPM, the worker is occupied during `terminate()`. Heavy logic reduces throughput. Fix: use queues
- Exception in terminate crashes silently: An uncaught exception in `terminate()` may crash the process, and the user sees no error (response already sent). Fix: wrap in try-catch
- Forgetting to register the terminable middleware: Implementing `TerminableMiddleware` without adding it to a stack means it's never called

## Decision Points
- **Inline terminate vs Queued job**: Keep inline for fast operations (< 5ms) like metrics increments; dispatch to queue for any I/O, database writes, or HTTP calls
- **Global vs Group termination**: Use global for metrics that apply to all requests; use group for domain-specific logging (e.g., API-only audit trail)

## Performance Considerations
- Post-response handlers still consume the PHP worker process — in PHP-FPM, the worker cannot accept the next request until `terminate()` completes
- In Laravel Octane, heavy terminate logic delays the next sandbox creation, reducing request throughput
- Multiple terminable middleware runs in reverse order (LIFO) — the first middleware in the stack is the last to terminate
- Duration handlers (Laravel 11+) also run in terminate — their cumulative cost adds to terminate time

## Security Considerations
- Exception in terminate may crash the process — always wrap in try-catch
- The response is already sent — there is no way to report an error to the client
- Sensitive data in request/response objects must not be logged in terminate handlers — extract only needed fields
- Terminate handlers running after auth middleware have access to authenticated user data — ensure logging doesn't expose PII

## Related Rules
- Keep `terminate()` methods lightweight; defer heavy work to queues (Performance)
- Always return `$next($request)` from middleware handle methods (Reliability)
- Keep global middleware minimal; prefer group or route middleware (Performance)

## Related Skills
- Trace the HTTP Kernel Request Lifecycle
- Configure and Verify Middleware Execution Order

## Success Criteria
- Terminable middleware executes its `terminate()` method after the response is sent
- The terminate method completes in under 5ms for non-queued work
- Heavy post-response work is dispatched to a queue, not executed inline
- An exception in `terminate()` does not crash the PHP process or affect the sent response
