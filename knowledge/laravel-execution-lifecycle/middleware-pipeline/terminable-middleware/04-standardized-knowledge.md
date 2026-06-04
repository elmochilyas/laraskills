# Terminable Middleware Flow

## Metadata
- **ID:** ku-09-terminable-middleware-flow / ku-12-pipe-dispatch-early-return
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **Last Updated:** 2026-06-02

## Overview
Terminable middleware implements the `terminate()` method, which runs after the response has been sent to the browser. This enables post-response cleanup, logging, and deferred processing without delaying the HTTP response. Laravel calls `terminate()` on all terminable middleware after sending the response, using the same middleware instance that handled the request. Unlike post-middleware code (which still blocks the response), terminable middleware runs entirely after the client has received the response.

## Core Concepts
- **`terminate($request, $response)`**: Method called after response is sent. Receives both request and response.
- **Instance Singleton**: Laravel preserves the same middleware instance from `handle()` for `terminate()` — ensures state consistency.
- **LIFO Execution**: Terminable middleware runs in reverse order of execution — last middleware to handle the request terminates first.
- **Response Flushing**: Runs after `fastcgi_finish_request()` (PHP-FPM) or output buffer flush — response is already sent to client.
- **Kernel Collection**: `sendRequestThroughPipeline()` collects middleware with `terminate()` method during pipeline execution.

## When To Use
- **Session persistence**: Save session data to storage after response is sent.
- **Request logging**: Log complete request/response data without delaying response.
- **Cookie queuing**: Add queued cookies to the response after main processing.
- **Metrics collection**: Record request metrics without affecting response time.
- **Resource cleanup**: Close connections, release locks, clean up temporary files.

## When NOT To Use
- **Response modifications**: Terminate runs after response sent — cannot modify response content or headers.
- **Critical business logic**: If the logic must complete before the client gets a response, use post-middleware inside `handle()`.
- **Heavy processing**: Heavy terminate tasks block the PHP process — use queues for truly asynchronous work.
- **User-facing errors**: Errors in terminate() cannot be communicated to the client — response already sent.

## Best Practices (WHY)
- **Keep terminate() lightweight**: The PHP process remains occupied until all terminate methods complete. Heavy tasks block the next request. *Why: In PHP-FPM, the worker is blocked during terminate; in Octane, it delays the next request's sandbox creation.*
- **Wrap terminate logic in try-catch**: Uncaught exceptions in terminate() can crash the process — and the response is already sent. *Why: Errors in terminate are invisible to users but can crash the worker — silent failures are hard to diagnose.*
- **Use queues for heavy post-response work**: If terminate takes >100ms consistently, offload to a queue job. *Why: A 5-second terminate blocks the PHP worker for 5 seconds — reducing throughput by 5 seconds per request.*
- **Register middleware in global stack or groups for terminable to work**: Route middleware is not terminable by default. Terminable only works on middleware in `$middleware` or `$middlewareGroups`. *Why: Terminable middleware collection happens in the kernel's pipeline building — route middleware is not tracked for termination.*

## Architecture Guidelines
- **Separate method over post-middleware**: Post-middleware in `handle()` still blocks response. Terminable middleware runs after response is sent — enabling zero-blocking operations.
- **LIFO termination order**: Mirrors the call stack — outer middleware that ran first should clean up last.
- **Pipeline-independent**: Terminable middleware is unique to Laravel's HTTP kernel — the generic Pipeline class only knows about `handle()`.
- **Instance persistence**: Middleware instance from `handle()` is reused for `terminate()` — ensures access to state set during request handling.

## Performance
- **Post-response execution**: Response flushed before terminate — client doesn't wait.
- **PHP process blocking**: PHP-FPM worker occupied until all terminate methods complete.
- **Terminate cascading**: Multiple terminable middleware execute sequentially — total time = sum of all terminate durations.
- **Octane behavior**: Terminate runs before sandbox flush — be aware that terminate delays next request's sandbox creation.

## Security
- **Exception visibility**: Uncaught exception in terminate crashes the process — response already sent, user sees success.
- **State mutation risk**: Middleware mutates internal state during `handle()`, then `terminate()` uses stale or corrupted state.
- **Memory pressure**: Memory used during request handling is not freed until terminate completes — can push worker over limit.
- **Silent failures**: Errors in terminate are invisible — no way to communicate failure to the client.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Heavy work in terminate() | Treating terminate as async handler | Blocks PHP process; reduces throughput | Use queues for heavy tasks |
| Not wrapping in try-catch | Assuming terminate always succeeds | Uncaught exception crashes process | Wrap in try-catch always |
| Route middleware not terminable | Route middleware not tracked for terminate | terminate() never called | Register in global or group |
| Expecting async behavior | Terminate runs synchronously in same process | Long terminate blocks next request | Use queues for async |

## Anti-Patterns
- **Terminate as catch-all async handler**: Putting all cleanup logic in terminate thinking it's truly asynchronous. It's synchronous but post-response.
- **State mutation without awareness**: Middleware mutates its own state during `handle()`, then `terminate()` depends on that state — fragile.
- **Forgetting terminable registration**: Implementing `terminate()` but not adding middleware to the correct array — terminate never runs.
- **Multiple terminable middleware with side effects**: Two middleware terminating in LIFO order — one may depend on state the other cleans up.

## Examples

```php
class StartSession implements TerminableMiddleware
{
    public function handle($request, $next)
    {
        // Session starts, request processes
        return $next($request);
    }

    public function terminate($request, $response): void
    {
        try {
            // Save session data to storage after response sent
            $this->store->write(
                $request->session()->getId(),
                $request->session()->all()
            );
        } catch (\Throwable $e) {
            Log::error('Session persist failed', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}

class LogRequest implements TerminableMiddleware
{
    public function handle($request, $next)
    {
        return $next($request);
    }

    public function terminate($request, $response): void
    {
        try {
            Log::channel('request')->info('Request completed', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'status' => $response->status(),
                'duration' => microtime(true) - LARAVEL_START,
            ]);
        } catch (\Throwable $e) {
            // Silent fail — response already sent
        }
    }
}
```

## Related Topics
- **Pipeline Pattern Fundamentals**: Middleware instance lifecycle.
- **Pre-and-Post-Middleware Code**: Request/response phase distinction vs post-response.
- **Service Container**: Instance persistence across handle/terminate.
- **Kernel Architecture**: terminateMiddleware dispatch in Http Kernel.
- **Laravel Octane Middleware**: Terminable behavior in long-running processes.

## AI Agent Notes
- `Illuminate\Foundation\Http\Kernel::terminateMiddleware()` collects and runs terminable middleware. It preserves middleware instances from the pipeline execution.
- Terminable middleware is unique to Laravel's HTTP kernel — it is not part of the generic Pipeline class. The Pipeline only knows about `handle()`.
- The `terminate()` contract has been stable since Laravel 5.x.
- Laravel Octane requires special handling for terminable middleware — the response may not be fully sent before terminate runs.

## Verification
- [ ] Create a terminable middleware with both `handle()` and `terminate()`
- [ ] Verify `terminate()` runs after response is sent
- [ ] Place a `sleep(2)` in terminate() — verify response arrives immediately followed by 2s delay
- [ ] Test terminate exception handling — wrap in try-catch, verify process doesn't crash
- [ ] Verify route middleware is NOT terminable — only global/group middleware
- [ ] Test LIFO order: two terminable middleware — verify reverse execution order
