# Response Sending and Termination

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Request Lifecycle |
| Knowledge Unit | Response Sending and Termination |
| Difficulty | Intermediate |
| Lifecycle Phase | Termination |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Response Sending and Termination covers the final phase of the request lifecycle: converting the Response object returned by the kernel into raw HTTP output sent to the client, then executing termination callbacks. The response `->send()` method originates from Symfony's `HttpFoundation\Response` component — the framework delegates HTTP output to Symfony's implementation. The critical engineering decision is the split between `$response->send()` and `$kernel->terminate()`. In FPM, `send()` calls `fastcgi_finish_request()` to close the connection before termination code runs, meaning the client receives the response while the server continues executing. This creates the illusion of zero-cost post-response processing, but the FPM process remains blocked until all termination handlers complete.

## Core Concepts
- **`$response->send()`** — Symfony method that outputs headers and content, then calls `fastcgi_finish_request()` in FPM.
- **`sendHeaders()`** — Iterates response header bag, calls `header()` PHP function for each, sends status line.
- **`sendContent()`** — Writes response body to stdout; binary responses use `fread()` in chunks.
- **`$kernel->terminate()`** — Runs terminable middleware, app terminate callbacks, dispatches `Terminating` event, evaluates duration handlers.
- **Terminable Middleware** — Middleware implementing the `TerminableMiddleware` contract receives both request and response after send.
- **Singleton Requirement** — Terminable middleware must be singleton to match pipeline instance with terminate instance.

## When To Use
- Implementing post-response logic (logging, analytics, cache invalidation)
- Debugging slow response times caused by termination handlers
- Configuring Octane workers where termination runs synchronously
- Building custom response types or streaming large files

## When NOT To Use
- Moving response modification logic to termination (response already sent)
- Adding heavy I/O in termination without understanding FPM process blocking
- Using closure-based middleware for terminable behavior (kernel can't resolve closures for termination)

## Best Practices
- **Move heavy work to a queue** — Any I/O in termination blocks the FPM worker. Use `dispatch()->afterResponse()`.
- **Keep termination under 5ms** — Heavy termination (DB queries, API calls) reduces concurrent request capacity.
- **Wrap `terminate()` body in try/catch** — Exceptions in termination are not caught by the kernel; always log and swallow.
- **Use `RequestHandled` event for response modification** — `Terminating` fires after send; modifications are silently ignored.
- WHY: Termination directly impacts process availability under load. In FPM, slow termination reduces worker capacity. In Octane, termination runs before the next request, directly reducing throughput.

## Architecture Guidelines
- `fastcgi_finish_request()` is called between send and terminate, converting termination from synchronous to background processing.
- Terminable middleware uses `method_exists()` rather than a contract — a typo in method name silently fails.
- Termination pipeline order is fixed (not configurable): terminable middleware → app callbacks → Terminating event → duration handlers.
- `RequestHandled` event dispatches before `send()`, allowing listeners to modify the response.

## Performance Considerations
- `fastcgi_finish_request()` is ~0.01ms but only works under FPM FastCGI protocol.
- Termination scales with middleware count: 5 terminable middleware each doing 50ms I/O = 250ms FPM blocking.
- Duration handlers add O(n) threshold iteration; with 10 handlers, negligible (<0.01ms).
- Binary response streaming via `fread()` in 8KB chunks keeps process busy during large file downloads.

## Security Considerations
- Terminable middleware has access to request and response after send; avoid logging sensitive response data.
- `fastcgi_finish_request()` may not flush output buffers; ensure sensitive data is not buffered.
- Duration handlers run after response send; avoid modifying response or session state in these handlers.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Assuming `terminate()` runs immediately after send | Misunderstanding `fastcgi_finish_request()` | Race conditions — browser may trigger follow-up request before termination finishes | Use `afterResponse()` or queue jobs for deferred work |
| Heavy logic in termination blocking FPM | Unaware of process blocking | Reduced concurrent request capacity | Offload to queue via `dispatch()->afterResponse()` |
| Closure middleware with terminate method | Using inline closures for middleware | Kernel can't resolve closures for termination — terminate never called | Use class-based terminable middleware registered via class-string |
| Modifying response in Terminating event listener | Unaware of execution timing | Modifications silently ignored | Use `RequestHandled` event for response modification |

## Anti-Patterns
- **Synchronous API calls in termination** — Blocks FPM worker for API round-trip time.
- **Modifying global state in termination** — Under Octane, affects subsequent requests on same worker.
- **Relying on `fastcgi_finish_request()` for all environments** — Not available in `php -S`, CGI mode, or phpdbg.

## Examples

### Post-response job dispatching via terminable middleware
```php
class DispatchAfterResponse
{
    public function handle($request, $next) { return $next($request); }
    public function terminate($request, $response): void
    {
        ProcessPodcast::dispatch($request->input('podcast_id'));
    }
}
```

### Response timing logging via duration handler
```php
$kernel->whenRequestLifecycleDurationExceeds(500, function ($request, $response) {
    Log::warning('Slow request detected', [
        'uri' => $request->getUri(),
        'duration' => $response->getStatusCode(),
    ]);
});
```

## Related Topics
- **Prerequisites:** HTTP Kernel Dispatch, Middleware Pipeline, Entry Point Mechanics
- **Closely Related:** Lifecycle Events and Hooks, Long-Running Process Architecture
- **Advanced:** FastCGI Protocol Internals, Response Caching Strategies
- **Cross-Domain:** Queue (afterResponse dispatching), HTTP Protocol

## AI Agent Notes
- When diagnosing "headers already sent" errors, check for echo/whitespace before `$response->send()`.
- For Octane memory growth, audit termination handlers for global state modification.
- Duration handlers are good places to add telemetry without affecting response time — use them for monitoring hooks.

## Verification
- [ ] Can trace `$response->send()` → `fastcgi_finish_request()` → `$kernel->terminate()` flow
- [ ] Understand why terminable middleware must be registered as singleton
- [ ] Know the fixed termination pipeline order
- [ ] Can explain the difference between `RequestHandled` and `Terminating` event timing
- [ ] Can diagnose common termination failures (exception in terminate, headers already sent)
