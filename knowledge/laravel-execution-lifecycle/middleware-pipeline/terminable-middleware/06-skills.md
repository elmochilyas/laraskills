# Skill: Implement Terminable Middleware

## Purpose
Create middleware that executes logic after the response has been sent to the client, enabling post-response cleanup, logging, and deferred processing without blocking the HTTP response.

## When To Use
- Saving session data to persistent storage after response is sent
- Logging complete request/response data without delaying response
- Collecting metrics and analytics after the user sees the response
- Cleaning up resources (closing connections, releasing locks)
- Dispatching queue jobs for post-response processing

## When NOT To Use
- For modifying the response (response already sent -- modifications have no effect)
- For critical business logic that must complete before the client gets a response
- For heavy processing that blocks the PHP worker for more than ~10ms
- For user-facing error handling (errors in terminate cannot be communicated to client)

## Prerequisites
- Middleware class that implements `Illuminate\Contracts\Http\Kernel\TerminableMiddleware` or has `terminate($request, $response)` method
- Middleware registered in global stack or a middleware group (not route-level only)

## Inputs
- Request object (read-only context)
- Response object (read-only -- already sent)
- Any state set during `handle()`

## Workflow
1. Create a middleware class with both `handle()` and `terminate($request, $response)` methods
2. In `handle()`, process the request and pass to `$next($request)`:
   `public function handle($request, $next) { return $next($request); }`
3. In `terminate()`, implement the post-response logic:
   `public function terminate($request, $response): void { ... }`
4. Wrap all `terminate()` logic in a `try {} catch (\Throwable $e) {}` block
5. Keep `terminate()` lightweight -- offload heavy work to queue jobs
6. Register the middleware in a global or group stack (not route-level only)
7. Test that `handle()` runs during request and `terminate()` runs after response is sent
8. Test LIFO order by registering two terminable middleware and verifying reverse execution order

## Validation Checklist
- [ ] `terminate()` is wrapped in try-catch
- [ ] Heavy operations dispatched to queue, not run synchronously in `terminate()`
- [ ] Middleware registered in global or group stack (not route-level)
- [ ] Request and response are treated as read-only in `terminate()`
- [ ] LIFO execution order is understood and accounted for
- [ ] PHP-FPM vs Octane behavior difference understood
- [ ] No critical logic depends on `terminate()` completing before the next request

## Common Failures
- Heavy work in `terminate()` blocks the PHP worker (reduces throughput)
- No try-catch in `terminate()` causes silent worker crashes
- Registering middleware at route level only (terminate() never called)
- Modifying request/response in `terminate()` (no effect -- misleading code)
- Expecting async behavior from `terminate()` (it's synchronous, post-response)
- Assuming `terminate()` runs immediately after response in all SAPI environments

## Decision Points
- Post-middleware in `handle()` or `terminate()`? -> Post-middleware if response modification needed; terminate() if post-response cleanup
- Synchronous or queue? -> Queue if processing takes >10ms; synchronous in terminate() for fast operations
- Handle state stored for terminate()? -> Store in instance property during handle(); same instance reused for terminate()

## Performance Considerations
- Response is flushed before `terminate()` runs (client doesn't wait)
- PHP-FPM worker is blocked until all `terminate()` methods complete
- Total terminate time = sum of all `terminate()` durations
- In Octane, `terminate()` delays next request's sandbox creation

## Security Considerations
- Uncaught exception in `terminate()` crashes the process (response already sent)
- Memory used during request handling not freed until `terminate()` completes
- Errors in `terminate()` are invisible to users (response already sent)
- In Octane, `terminate()` may run before sandbox cleanup

## Related Rules
- Keep `terminate()` Lightweight for Minimal Process Blocking
- Always Wrap `terminate()` Logic in a Try-Catch Block
- Register Terminable Middleware in Global or Group Stacks -- Not Route Only
- Be Aware of LIFO Termination Order
- Do Not Expect `terminate()` Behavior Across All PHP SAPIs
- Use Queues Instead of Heavy `terminate()` for Asynchronous Work
- Do Not Modify Request or Response in `terminate()`

## Related Skills
- Implement Pre- and Post-Middleware Code
- Implement a Custom Pipeline
- Configure Global Middleware Stack

## Success Criteria
- `terminate()` runs after response is sent to the client
- All `terminate()` logic is wrapped in try-catch
- Heavy operations are dispatched to queues, not run synchronously
- Middleware is registered in global or group stack (terminate() is called)
- No request/response modifications occur in `terminate()`
- LIFO termination order is accounted for in middleware design
