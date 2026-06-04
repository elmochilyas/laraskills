# Terminable Middleware — Rules

## Keep `terminate()` Lightweight for Minimal Process Blocking
---
## Category
Performance
---
## Rule
Limit `terminate()` to fast operations (<10ms). Offload heavy work to queue jobs.
---
## Reason
Although the response is already sent, the PHP worker remains occupied until all `terminate()` methods complete. A 5-second `terminate()` blocks that worker for 5 seconds, reducing application throughput proportionally.
---
## Bad Example
```php
public function terminate($request, $response): void
{
    // Heavy: sends email synchronously — blocks worker for seconds
    Mail::send(new ReportMail($request->user()));
}
```
---
## Good Example
```php
public function terminate($request, $response): void
{
    // Light: dispatch queue job — returns immediately
    ProcessReport::dispatch($request->user()->id);
}
```
---
## Exceptions
Operations that must complete before the PHP process exits and that complete in <10ms (e.g., session storage write).
---
## Consequences Of Violation
Reduced request throughput; PHP-FPM worker pool exhaustion; increased response latency for subsequent requests.

---

## Always Wrap `terminate()` Logic in a Try-Catch Block
---
## Category
Reliability
---
## Rule
Wrap all `terminate()` code in `try {} catch (\Throwable $e) {}` and log any exceptions.
---
## Reason
Exceptions in `terminate()` cannot be communicated to the client — the response is already sent. An uncaught exception crashes the PHP process, causing a 500 error for the next request and making debugging extremely difficult.
---
## Bad Example
```php
public function terminate($request, $response): void
{
    // Uncaught exception crashes the worker
    $this->store->write($request->session()->getId(), $request->session()->all());
}
```
---
## Good Example
```php
public function terminate($request, $response): void
{
    try {
        $this->store->write($request->session()->getId(), $request->session()->all());
    } catch (\Throwable $e) {
        Log::error('Session persist failed in terminate', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
    }
}
```
---
## Exceptions
No common exceptions — try-catch is mandatory in `terminate()`.
---
## Consequences Of Violation
Silent worker crashes; 500 errors on subsequent requests; invisible data loss; hours debugging "random" production failures.

---

## Register Terminable Middleware in Global or Group Stacks — Not Route Only
---
## Category
Architecture
---
## Rule
Ensure terminable middleware is registered in `$middleware` (global) or `$middlewareGroups` (group), not exclusively as route-level middleware.
---
## Reason
Route-level middleware is not tracked for termination by the kernel. `terminate()` is only called on middleware collected during pipeline construction — and the kernel's `sendRequestThroughPipeline()` only tracks middleware from global and group sources.
---
## Bad Example
```php
// Route-level only — terminate() never called
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(\App\Http\Middleware\LogRequest::class);
// LogRequest has terminate() — but it never runs
```
---
## Good Example
```php
// Global or group registration — terminate() runs
$middleware->web(append: [
    \App\Http\Middleware\LogRequest::class,
]);

// Route inherits from group — terminate() is tracked
Route::get('/dashboard', [DashboardController::class, 'index']);
```
---
## Exceptions
When terminable middleware is explicitly registered via the kernel's `pushMiddleware()` in a service provider.
---
## Consequences Of Violation
`terminate()` silently never runs; session data not persisted; request logs missing; resource cleanup skipped.

---

## Be Aware of LIFO Termination Order
---
## Category
Reliability
---
## Rule
Design terminable middleware assuming LIFO (Last In, First Out) execution order — the last middleware to handle the request terminates first.
---
## Reason
LIFO order means outer middleware (first to handle inbound) terminates last. If one terminable middleware depends on state set by another, LIFO ordering may clean up dependencies before they are consumed.
---
## Bad Example
```php
// Middleware A (inner): handles request, terminate() releases DB lock
// Middleware B (outer): terminates first (LIFO), logs request data
// But B runs before A — B logs before A releases the lock
// If B needs the lock (e.g., reads from locked table), it deadlocks
```
---
## Good Example
```php
// Order terminable middleware so cleanup happens in reverse dependency order
// Lock-release middleware terminates first (was outermost)
// Logging middleware terminates last (was innermost)
// No deadlock because lock is still held during logging
```
---
## Exceptions
Middleware with no inter-dependencies — LIFO order is irrelevant.
---
## Consequences Of Violation
Deadlocks; resource cleanup before dependent middleware reads state; subtle timing bugs.

---

## Do Not Expect `terminate()` Behavior Across All PHP SAPIs
---
## Category
Reliability
---
## Rule
Do not rely on `terminate()` executing immediately after the response in all environments — behavior varies between PHP-FPM, Octane, and CLI.
---
## Reason
In PHP-FPM, `terminate()` runs after `fastcgi_finish_request()` flushes the response. In Laravel Octane, terminate runs before sandbox flush, potentially delaying the next request. In CLI (queues, tests), behavior differs further.
---
## Bad Example
```php
public function terminate($request, $response): void
{
    // Assumes response is fully sent to client
    // In Octane, terminate runs before sandbox cleanup — response may not be fully flushed
    Mail::raw('Response sent!', function ($message) { ... });
}
```
---
## Good Example
```php
public function terminate($request, $response): void
{
    // Decouple from assumption about response flush timing
    // Use for cleanup, not for "response sent" guarantees
    try {
        $this->saveSession($request);
    } catch (\Throwable $e) {
        Log::error(...);
    }
}
```
---
## Exceptions
Applications deployed exclusively on PHP-FPM where behavior is consistent and tested.
---
## Consequences Of Violation
Race conditions in Octane; premature cleanup; incorrect assumptions about response delivery confirmation.

---

## Use Queues Instead of Heavy `terminate()` for Asynchronous Work
---
## Category
Architecture
---
## Rule
Dispatch queue jobs from `terminate()` for any operation that takes longer than ~10ms.
---
## Reason
`terminate()` is synchronous, not asynchronous — it runs in the same PHP process and blocks it until complete. Truly asynchronous work (email sending, report generation, API calls) belongs in queues, which free the PHP worker immediately.
---
## Bad Example
```php
public function terminate($request, $response): void
{
    // Synchronous: blocks worker for seconds
    Http::post('https://analytics.example.com/collect', [
        'path' => $request->path(),
        'duration' => microtime(true) - LARAVEL_START,
    ]);
}
```
---
## Good Example
```php
public function terminate($request, $response): void
{
    // Asynchronous: queue job returns immediately
    CollectAnalytics::dispatch(
        path: $request->path(),
        duration: microtime(true) - LARAVEL_START,
    );
}
```
---
## Exceptions
Operations that must complete before the next request (e.g., session storage persistence in file-based sessions).
---
## Consequences Of Violation
Reduced throughput; worker pool exhaustion; application slowdown after traffic spikes.

---

## Do Not Modify Request or Response in `terminate()`
---
## Category
Reliability
---
## Rule
Treat `terminate($request, $response)` as read-only — do not modify the request or response objects.
---
## Reason
The response is already sent to the client by the time `terminate()` runs. Any modifications have no effect, making the code misleading. Modifying the request in `terminate()` has no purpose and confuses developers reading the code.
---
## Bad Example
```php
public function terminate($request, $response): void
{
    $response->headers->set('X-Custom', 'value'); // No effect — response already sent
    $request->attributes->set('_cleanup', true);  // No purpose
}
```
---
## Good Example
```php
public function terminate($request, $response): void
{
    // Read-only: use request/response for context in logging/cleanup
    try {
        Log::channel('analytics')->info('Request complete', [
            'method' => $request->method(),
            'path' => $request->path(),
            'status' => $response->status(),
        ]);
    } catch (\Throwable $e) {
        // Silent fail
    }
}
```
---
## Exceptions
No common exceptions — `terminate()` should never modify request or response.
---
## Consequences Of Violation
Misleading code; false understanding that response can be modified post-send; wasted debugging.
