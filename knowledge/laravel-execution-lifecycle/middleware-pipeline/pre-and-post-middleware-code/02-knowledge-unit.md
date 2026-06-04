# Pre-and-Post-Middleware Code
## Metadata (Domain: Laravel Execution Lifecycle & Framework Internals, Subdomain: Middleware Pipeline, Last Updated: 2026-06-02)
## Executive Summary
Code in a middleware's `handle()` method can execute before and/or after the `$next($request)` call. Code before `$next()` runs during the inbound request journey (pre-middleware), processing the request before it reaches the controller. Code after `$next()` runs during the outbound response journey (post-middleware), processing the response before it's sent to the client. This dual-execution capability enables middleware to perform actions on both legs of the request-response cycle.

## Core Concepts
The `$next` closure represents the rest of the pipeline (remaining middleware + controller). When middleware calls `$next($request)`, it suspends execution and passes control to the next middleware. After all downstream middleware and the controller complete, execution resumes in the original middleware at the line after `$next($request)`. This creates a nested execution model where code before `$next()` is pre-middleware and code after `$next()` is post-middleware.

## Mental Models
**Onion Layers:** Each middleware is an onion layer. You peel layers on the way in (pre-code) until you reach the center (controller). Then you put layers back on the way out (post-code).

**Round Trip Flight:** Pre-middleware is the outbound flight to the destination. `$next($request)` is the layover (controller). Post-middleware is the return flight. The response is modified on both legs.

## Internal Mechanics
The Pipeline builds nested closures: each middleware wraps the next. When middleware calls `$next($request)`, it invokes the next closure in the chain. The return value of `$next($request)` is the response from downstream. The middleware can modify this response after `$next()` returns. This is implemented via `array_reduce` with reversed pipes — each pipe's closure wraps the previous one.

```php
public function handle($request, $next)
{
    // Pre-middleware code (inbound)
    // Modify request, log, authenticate, etc.
    $response = $next($request);

    // Post-middleware code (outbound)
    // Modify response, add headers, etc.
    return $response;
}
```

## Patterns
- **Pre-middleware:** Authentication checks, request validation, rate limiting, request logging, CSRF verification, locale setting.
- **Post-middleware:** Response header injection, response compression, response logging, ETag generation, cache headers.
- **Dual-purpose Middleware:** CORS middleware sets `Origin` header check on inbound, adds `Access-Control-Allow-Origin` on outbound.

## Architectural Decisions
The decision to use the `$next($request)` call as the boundary between pre and post code is a consequence of the nested closure architecture. This design was chosen over separate `before()` and `after()` methods because it keeps related pre/post logic together (e.g., CORS middleware checks the origin on the way in and sets headers on the way out), is simpler to implement, and avoids method proliferation.

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Related pre/post code stays in one place | Mixing responsibilities can reduce clarity | Hard to tell at a glance what runs when |
| Simple, single-method interface | No explicit distinction between pre and post | Developers must mentally trace through the code |
| Full access to response for post-processing | Post-code must wait for full downstream execution | Cannot stream responses if post-code modifies them |

## Performance Considerations
Post-middleware code blocks the response from being sent. If a middleware does heavy post-processing (e.g., response compression), it adds latency to every request. Pre-middleware that blocks early (e.g., auth failure) can short-circuit the pipeline and save downstream processing.

## Production Considerations
Post-middleware that modifies response content can interfere with content negotiation (e.g., adding headers after the response is built). Be aware of the order: post-code from early middleware runs last (outer post-code), so response modifications in early middleware wrap modifications in later middleware.

## Common Mistakes
**Why it happens:** Developers put the entire middleware logic after `$next($request)` thinking it always runs. **Why it's harmful:** If another middleware returns a response without calling `$next`, the post-code never executes — the pipeline short-circuits. **Better approach:** Understand short-circuiting: post-code only executes if all downstream middleware and the controller complete normally.

## Failure Modes
- **Short-circuit bypasses post-code:** Auth middleware returns 401 before reaching controller — outer middleware's post-code runs but inner middleware's post-code does not.
- **Exception skips post-code:** An exception in the controller or downstream middleware prevents post-code from executing (unless caught).
- **Response overwriting:** Post-code replaces the response from downstream without considering its content.

## Ecosystem Usage
- **Laravel Debugbar:** Uses post-middleware to inject debug toolbar HTML into responses.
- **Laravel CORS:** Fruitcake CORS middleware checks origin in pre-code, sets headers in post-code.
- **Laravel Telescope:** Records request data in pre-code, gathers query logs in post-code.

## Related Knowledge Units
### Prerequisites
- Pipeline Pattern Fundamentals (nested closure execution model)
- Route Middleware (middleware chaining and controller dispatch)

### Related Topics
- Terminable Middleware (post-response deferred execution)
- Middleware Priority (ordering effects on pre/post execution wrapping)

### Advanced Follow-up Topics
- Response Mutations (content negotiation with post-middleware)
- Pipeline Short-Circuit Analysis (early return behavior)
- Kernel Architecture (response lifecycle after pipeline completion)

## Research Notes
**Source Analysis:** The nested closure execution model in `Illuminate\Pipeline\Pipeline::carry()`.
**Key Insight:** Post-middleware code is the defining feature of the onion model. It enables response decoration without the controller knowing about it.
**Version-Specific Notes:** This behavior is inherent to the Pipeline pattern and has not changed across Laravel versions.
