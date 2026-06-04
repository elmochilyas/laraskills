# Pre-and-Post-Middleware Code

## Metadata
- **ID:** ku-10-request-lifecycle-middleware / ku-11-response-lifecycle-middleware
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **Last Updated:** 2026-06-02

## Overview
Code in a middleware's `handle()` method can execute before and/or after the `$next($request)` call. Code before `$next()` runs during the inbound request journey (pre-middleware), processing the request before it reaches the controller. Code after `$next()` runs during the outbound response journey (post-middleware), processing the response before it's sent to the client. This dual-execution capability enables middleware to perform actions on both legs of the request-response cycle — authentication on the way in, response headers on the way out.

## Core Concepts
- **Pre-middleware (Inbound)**: Code before `$next($request)` — runs as the request travels toward the controller. Used for authentication, validation, rate limiting, request logging.
- **Post-middleware (Outbound)**: Code after `$next($request)` — runs as the response travels back to the client. Used for response headers, compression, response logging, caching.
- **`$next($request)`**: The suspension point — calling it passes control downstream. Execution resumes at the line after `$next()` when the response returns.
- **Onion Model**: Each middleware layer wraps the core. The request peels layers on the way in; the response puts them back on the way out.
- **Short-Circuit**: If a middleware returns a response instead of calling `$next($request)`, its own post-code and all downstream middleware never execute.

## When To Use
- **Authentication checks**: Pre-middleware — check user credentials before reaching the controller.
- **Request validation**: Pre-middleware — validate input, rate limit.
- **Request logging**: Pre-middleware — log incoming request data.
- **Response headers**: Post-middleware — add CORS, cache-control, security headers.
- **Response transformation**: Post-middleware — compress, format, or decorate the response body.
- **CORS middleware**: Both — check Origin header inbound, set Access-Control headers outbound.

## When NOT To Use
- **Post-response cleanup**: Use terminable middleware for logic that runs after the response is sent to the client.
- **Business logic**: Pre/post middleware is for cross-cutting concerns, not business operations.
- **Asynchronous operations**: Pre/post middleware runs synchronously — use queues for async work.
- **Streaming responses**: Post-middleware that modifies the response body blocks streaming — cannot stream if post-code transforms the response.

## Best Practices (WHY)
- **Keep pre-middleware fast**: Pre-middleware blocks the entire request. Heavy pre-middleware increases TTFB. *Why: The request cannot proceed to the controller until all pre-middleware code completes.*
- **Understand short-circuit implications**: Post-middleware code only executes if all downstream middleware and the controller complete normally. *Why: A middleware that returns early (e.g., auth failure) prevents post-code in downstream middleware from running — important for logging middleware placement.*
- **Keep related pre/post logic in one middleware**: CORS checks origin inbound and sets headers outbound — keeping both in one middleware is clearer than splitting. *Why: Related cross-cutting concerns (check→modify) are easier to maintain when co-located.*
- **Avoid heavy post-processing on every response**: Post-middleware blocks the response from being sent. Heavy work (compression, transformation) adds latency. *Why: The response cannot be sent until all post-middleware code completes — affects Time to Last Byte (TTLB).*

## Architecture Guidelines
- **`$next($request)` as boundary**: The single call point separates pre from post code — keeps related logic together.
- **Nested closure execution**: Built by `array_reduce` with reversed pipes — each middleware wraps the next.
- **No separate before/after methods**: Laravel chose single-method over `before()`/`after()` to keep related pre/post logic co-located.
- **Response modification**: Post-middleware receives the full response object — can modify content, headers, status code.

## Performance
- **Pre-middleware blocking**: Heavy pre-middleware (DB queries, external API calls) increases TTFB.
- **Post-middleware blocking**: Heavy post-middleware (response compression, transformation) increases TTLB.
- **Short-circuit benefit**: Early-returning pre-middleware (auth failure, rate limit) saves all downstream processing.
- **Outermost post-code runs last**: Post-code from outer middleware wraps modifications from inner middleware — the outermost post-middleware's modifications are final.

## Security
- **Short-circuit bypasses post-code**: Auth middleware returns 401 — downstream middleware's post-code (e.g., logging) never runs. Plan middleware ordering accordingly.
- **Exception skips post-code**: Exception in controller or downstream middleware prevents post-code execution unless caught.
- **Response overwriting**: Post-middleware replaces entire response — downstream modifications are lost.
- **Pre-middleware order security**: Auth middleware must run before middleware that accesses authenticated user data.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Placing all logic after `$next()` | Assuming post-code always runs | Post-code bypassed by short-circuit | Understand only runs on successful completion |
| Modifying response in pre-middleware | Response not yet built | `$response` is null or the $next closure | Only modify response in post-middleware |
| Heavy work in pre-middleware | Not considering blocking | Increases TTFB | Move to post-middleware or queue |
| Forgetting short-circuit effect on logging | Logging middleware in wrong position | Failed requests not logged | Place logging middleware after auth if you want all requests logged |

## Anti-Patterns
- **Middleware that only modifies response in pre-code**: Response is not available before `$next()` — modifications in pre-code are lost.
- **Middleware that catches exceptions to ensure post-code runs**: Using try-catch around `$next($request)` to force post-code execution after exceptions — better to use error-handling middleware.
- **Multiple concerns in one middleware**: Pre does auth, post does logging — split into two middleware for clarity and reusability.
- **Pre-middleware that writes to the response buffer**: Writing output in pre-middleware sends partial response — breaks pipeline.

## Examples

```php
class CorsMiddleware
{
    public function handle($request, $next)
    {
        // Pre-middleware: Check origin
        $origin = $request->header('Origin');
        if (!in_array($origin, config('cors.allowed_origins'))) {
            return response('Forbidden', 403);
        }
        
        $response = $next($request);
        
        // Post-middleware: Add CORS headers
        $response->headers->set('Access-Control-Allow-Origin', $origin);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        
        return $response;
    }
}

class RequestTimer
{
    public function handle($request, $next)
    {
        // Pre-middleware: Record start time
        $start = microtime(true);
        
        $response = $next($request);
        
        // Post-middleware: Calculate and add duration header
        $duration = (microtime(true) - $start) * 1000;
        $response->headers->set('X-Response-Time', round($duration, 2) . 'ms');
        
        return $response;
    }
}
```

## Related Topics
- **Pipeline Pattern Fundamentals**: Nested closure execution model.
- **Terminable Middleware**: Post-response deferred execution (after post-middleware).
- **Middleware Priority**: Ordering effects on pre/post execution wrapping.
- **Response Mutations**: Content negotiation with post-middleware.
- **Pipeline Short-Circuit Analysis**: Early return behavior.

## AI Agent Notes
- The nested closure execution model in `Illuminate\Pipeline\Pipeline::carry()` creates the pre/post pattern.
- Post-middleware code is the defining feature of the onion model — it enables response decoration without the controller knowing about it.
- This behavior is inherent to the Pipeline pattern and has not changed across Laravel versions.
- The outermost middleware's post-code runs last, meaning its response modifications are the final ones the client sees.

## Verification
- [ ] Write a middleware with both pre and post code — verify execution order with logging
- [ ] Test short-circuit: return response from pre-code — verify post-code does NOT execute
- [ ] Place two middleware with pre/post code — verify the nesting order (outer pre → inner pre → controller → inner post → outer post)
- [ ] Modify response in post-code — verify changes reach the client
- [ ] Try to modify response in pre-code — observe it has no effect
- [ ] Test exception in controller — verify post-code doesn't execute
