# ECC Standardized Knowledge — Middleware Lifecycle

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Middleware System |
| **Knowledge Unit** | Middleware Lifecycle |
| **Difficulty** | Foundation |
| **Category** | HTTP Pipeline — Middleware |
| **Last Updated** | 2026-06-02 |

---

## Overview

The middleware lifecycle describes the complete path of an HTTP request from entry point to response delivery, including the two-pass execution through the global and route-specific pipelines. Understanding the lifecycle is critical because the order of execution determines whether middleware can modify the request before routing, whether it can modify the response after the controller, and when terminable middleware fires its post-response logic.

The engineering significance of the lifecycle is that it defines where different kinds of middleware must be registered. Infrastructure middleware (trusted proxies, CORS, maintenance mode) must run globally before routing. Application middleware (auth, throttle, bindings) runs after routing when the route context is known. Misplacing middleware in the wrong pipeline phase causes bugs that are difficult to diagnose because the execution order is not visible in the source code — it is determined by the registration file.

---

## Core Concepts

### The Complete Request Flow

The lifecycle proceeds through distinct phases: public/index.php → Kernel::handle() → bootstrap (load providers, config) → global middleware pipeline → Router::dispatch() → match route → gather middleware (controller + route + group) → resolve aliases → apply withoutMiddleware exclusions → sort by priority → route middleware pipeline → Route::run() → ControllerDispatcher::dispatch() → controller method. The response then travels back through the route pipeline (reverse), then the global pipeline (reverse), then `$response->send()`, then `Kernel::terminate()`.

### Two Distinct Pipelines

The global pipeline and route pipeline are independent. Global middleware cannot access route parameters. Route middleware cannot modify how the request is interpreted for routing. Exceptions in global middleware prevent routing entirely. Exceptions in route middleware prevent controller execution but are caught by the routing pipeline's exception handler.

### Pre-Middleware vs Post-Middleware

Within a single middleware's `handle()` method, code before `$next($request)` is pre-processing (inbound), code after `$next($request)` is post-processing (outbound). A middleware can be pre-only, post-only, both, or pass-through.

### Short-Circuit Behavior

When a middleware returns a response without calling `$next`, the response propagates back through already-executed middleware's post-processing code. Middleware that has NOT yet executed never runs. The controller never executes. Global middleware that already ran still gets its post-processing code executed.

### Controller Instantiation Timing

Controllers are instantiated BEFORE middleware runs. The controller's constructor executes for every matched route, even if middleware later short-circuits with a 401. Constructor dependencies are resolved regardless of authorization.

### Terminate Phase

After `$response->send()` completes, `Kernel::terminate()` iterates through middleware that were executed and calls `terminate()` on those that implement the method. A new instance of each terminable middleware is resolved for `terminate()` — NOT the same instance that handled the request (unless registered as a singleton).

---

## When To Use

- **Global middleware** for concerns that must run before routing: trusted proxies, CORS, maintenance mode, input sanitization.
- **Route middleware** for concerns that need the matched route context: authentication, authorization, rate limiting, model binding.
- **Terminable middleware** for concerns that should execute after the response is sent: logging, metrics, cleanup.

---

## When NOT To Use

- Do NOT register middleware that needs route data (matched route, parameters) as global middleware — it runs before routing and cannot access route context.
- Do NOT register middleware that modifies request interpretation (trusted proxies, CORS preflight) as route middleware — it runs after routing and cannot affect how the request is understood by the router.
- Do NOT assume the controller constructor is a safe place for expensive initialization — it executes even for unauthorized requests that middleware will short-circuit.

---

## Best Practices (WHY)

- **Register infrastructure middleware globally** because it modifies how the request is interpreted. TrustedProxies corrects the scheme and client IP, which affects route matching. HandleCors handles OPTIONS preflight before routing since CORS routes may not match the application's route table.
- **Register application middleware after routing** because it needs route context. Auth needs to know which guard to use. Rate limiting needs to know the named limiter. Model binding needs the route parameters.
- **Place pre-processing code before `$next` and post-processing after.** This ensures the pipeline executes in the correct order. Code after `$next` runs during response unwinding, not request inbound.
- **Register terminable middleware as a singleton if state sharing is needed.** Without singleton registration, `terminate()` receives a fresh instance with no access to data stored during `handle()`.
- **Do NOT rely on terminable middleware for critical operations.** If a server crashes before `terminate()` fires, the termination logic never runs. Use a queue with retries for operations that must execute.

---

## Architecture Guidelines

- **Request flow:** `Kernel::handle()` → bootstrap → global pipeline → router dispatch → route match → middleware gather → alias resolution → priority sort → route pipeline → controller → response unwinding → send → terminate.
- **Global pipeline construction:** `$this->app->shouldSkipMiddleware() ? [] : $this->middleware`. Runs before routing.
- **Route middleware gathering:** Merges controller middleware + route middleware + group middleware → resolves aliases → applies `withoutMiddleware` exclusions → sorts by priority.
- **Controller instantiation:** Happens before middleware runs. This is a known framework design constraint — the controller must be resolved to gather middleware.
- **Terminate phase:** Both global and route middleware are checked for `terminate()`. Route middleware fires first, then global middleware. Short-circuited middleware still has `terminate()` called.
- **Octane lifecycle:** Same per-request pipeline but (a) no re-bootstrap per request, (b) middleware instances may persist, (c) `terminate()` may not fire depending on server configuration.

---

## Performance

Each request constructs two pipelines (global + route) with ~18 closures for a typical route (10 global + 8 route middleware) — ~0.02-0.05ms construction cost. Container resolution adds ~0.03ms per middleware (~0.5ms total for 18 middleware). Short-circuit middleware saves the cost of all downstream middleware and controller dispatch — potentially 5-15ms per unauthorized request.

---

## Security

The middleware lifecycle provides multiple security checkpoints. Global middleware handles infrastructure security (trusted proxies prevent IP spoofing, CORS prevents cross-origin abuse). Route middleware handles application security (auth prevents unauthorized access, throttle prevents abuse, CSRF prevents forgery). The priority system ensures security-critical middleware runs in the correct order — session before CSRF, throttle before auth, auth before SubstituteBindings.

---

## Common Mistakes

- **Assuming controller instantiation order.** Developers assume the controller is instantiated AFTER middleware runs. In reality, the controller constructor executes before middleware. Expensive or security-sensitive constructor dependencies are resolved regardless of authorization.
- **Mixing pre and post logic without clarity.** Putting pre-processing code after `$next($request)` creates bugs that only manifest on the response path. Pre-processing belongs before `$next`; post-processing belongs after.
- **Forgetting terminable middleware needs singleton for state.** A middleware storing start time in `handle()` and reading it in `terminate()` finds the start time missing because `terminate()` receives a fresh instance.
- **Modifying request after global pipeline.** Modifications made by global middleware affect routing. Subsequent middleware must not revert those changes.

---

## Anti-Patterns

- **Global middleware that needs route data.** A middleware checking the authenticated user's role needs the matched route context. Registered globally, it cannot access route data. This causes a runtime error or incorrect behavior.
- **Route middleware that modifies request interpretation.** A middleware changing the request scheme or URI as route middleware — the router already matched the route using the original request. The modification has no effect on routing.
- **Controller constructor with expensive initialization.** A controller constructor that loads user billing data or queries external APIs executes for every matched route, including those that middleware will short-circuit.
- **Terminable middleware with heavy processing.** Sending API requests, writing to databases, or processing files in `terminate()` blocks the web process. Next request cannot start until termination completes.

---

## Examples

### Infrastructure-First Pipeline (Global)
```
TrustProxies → HandleCors → PreventRequestsDuringMaintenance
→ ValidatePostSize → TrimStrings → ConvertEmptyStringsToNull
```

### Application Gating Pipeline (Route)
```
Session → CSRF → Throttle → Auth → Authorize → SubstituteBindings
```

### Combined Pre/Post Middleware
```php
class TimingMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true); // Pre: capture start time
        $response = $next($request); // Controller executes
        // Post: calculate duration
        $response->headers->set('X-Duration', (microtime(true) - $start) * 1000);
        return $response;
    }
}
```

---

## Related Topics

- **Middleware Fundamentals** (prerequisite) — the Pipeline pattern and two-pass execution model.
- **Route Definition** (prerequisite) — how routes are matched and middleware assigned.
- **Global, Route Group, and Route Middleware** — the three registration tiers.
- **Middleware Ordering and Priority** — how SortedMiddleware determines execution order.
- **Controller Middleware** — the three controller-level registration mechanisms.
- **Terminable Middleware** — the post-response lifecycle phase.
- **Request Transformation** — modifying the request during the inbound pass.
- **Response Transformation** — modifying the response during the outbound pass.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Middleware Fundamentals (prerequisite). Serves as prerequisite for global-route-group-middleware, terminable-middleware.
- **Controller instantiation timing:** Controllers are instantiated BEFORE middleware runs. This is a commonly misunderstood behavior (GitHub issue laravel/framework#44177).
- **Two-pipeline architecture:** The global pipeline runs before routing. The route pipeline runs after routing. They are independent.
- **terminate() new instance:** `terminate()` receives a fresh middleware instance by default. Register as singleton for state sharing.
- **Octane considerations:** Middleware instances may persist. `terminate()` may not fire.

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| Complete request flow documented | ✓ |
| When to use / when NOT to use | ✓ |
| Best practices with rationale | ✓ |
| Two pipeline distinction clear | ✓ |
| Performance analysis | ✓ |
| Security considerations | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples | ✓ |
| Related topics mapped | ✓ |
