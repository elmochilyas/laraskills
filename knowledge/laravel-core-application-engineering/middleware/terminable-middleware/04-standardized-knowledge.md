# ECC Standardized Knowledge — Terminable Middleware

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Middleware System |
| **Knowledge Unit** | Terminable Middleware |
| **Difficulty** | Advanced |
| **Category** | HTTP Pipeline — Middleware |
| **Last Updated** | 2026-06-02 |

---

## Overview

Terminable middleware extends the standard middleware lifecycle with a `terminate()` method that executes after the HTTP response has been sent to the client. This enables post-response processing — logging, metrics recording, cleanup tasks — without delaying the response delivery.

The engineering significance of terminable middleware is that it provides the only framework-native mechanism for deferred execution after the response is sent. Unlike queue jobs dispatched via `dispatch()->afterResponse()`, terminable middleware runs in the same process and can access the completed request and response objects. However, terminable middleware has critical constraints: a NEW instance is resolved for `terminate()` unless the middleware is registered as a singleton, and `terminate()` may not fire in all server configurations (RoadRunner, some Swoole setups).

---

## Core Concepts

### The terminate() Contract

A terminable middleware implements an additional method: `public function terminate(Request $request, Response $response): void`. It receives the request and the response after the response has been sent to the client.

### When terminate() Fires

The execution order is: `Kernel::handle()` returns the response → `$response->send()` sends the response to the client → `Kernel::terminate()` iterates through middleware and calls `terminate()` on those that implement it. The client receives the response before `terminate()` executes — the client cannot be affected by anything in `terminate()`.

### New Instance for terminate()

By default, `terminate()` is called on a NEW instance of the middleware, NOT the same instance that handled the request. `Kernel::terminate()` resolves fresh middleware instances from the container via `$this->app->call()`. Any state stored on `$this` during `handle()` is lost.

### Singleton Registration for State Sharing

To share state between `handle()` and `terminate()`, register the middleware as a singleton: `$this->app->singleton(LogMiddleware::class)`. With singleton binding, the same instance is reused for both methods. State set on `$this` in `handle()` is available in `terminate()`.

---

## When To Use

- **Request logging pattern** when request details should be logged after the response is sent, not delaying the response.
- **Performance metrics pattern** when response timing data should be sent to external monitoring without adding latency.
- **Cleanup task pattern** when temporary resources (files, sessions) should be cleaned up after the response is sent.
- **Audit trail pattern** when request metadata must be recorded without affecting response time.
- **Tasks that need the Response object** (status code, response size) for metrics or logging.

---

## When NOT To Use

- Do NOT use terminable middleware for operations that must execute — `terminate()` may not fire in all server configurations (RoadRunner, some Swoole setups). Use queue jobs for guaranteed execution.
- Do NOT use terminable middleware for heavy processing (API calls, database writes, file processing) that would block the web process — use `dispatch()->afterResponse()` or queue jobs instead.
- Do NOT use terminable middleware for operations that do not need the Response object — `dispatch()->afterResponse()` is more reliable for general post-response work.
- Do NOT rely on `terminate()` in the console kernel — the console kernel does not call `terminate()`.

---

## Best Practices (WHY)

- **Register as a singleton if state sharing is needed.** Without singleton registration, `terminate()` gets a fresh instance. Storing a start time in `handle()` and reading it in `terminate()` will fail. This is the most common bug in terminable middleware.
- **Keep terminate() lightweight.** If `terminate()` performs synchronous I/O, it blocks the web process from handling the next request. For heavy work, dispatch to a queue instead.
- **Do NOT rely on terminate() for critical operations.** If a server crashes before `terminate()` fires, the termination logic never runs. Use a queue with retries for operations that must execute.
- **Use `spl_object_id($request)` as key for per-request data in singleton middleware.** Avoid race conditions in concurrent request handling (Swoole) by keying per-request data by the request object's ID.
- **Test `terminate()` directly.** Call `$middleware->terminate($request, $response)` in tests to verify termination logic without a real HTTP response cycle.

---

## Architecture Guidelines

- **Execution timing:** After `$response->send()`. The client has received the response. Modifications in `terminate()` do not affect the client.
- **Instance separation:** `handle()` and `terminate()` are different instances by default. Register as singleton for state sharing.
- **Middleware gathering:** `Kernel::terminate()` checks both global AND route middleware for `terminate()`. Route middleware fires first, then global middleware. Short-circuited middleware still has `terminate()` called.
- **Server compatibility:** PHP-FPM always fires `terminate()`. RoadRunner does not by default. Swoole fires if configured. FrankenPHP similar to Swoole.
- **Octane:** `terminate()` may not fire or may behave differently. Event listeners or queue jobs are recommended instead.
- **Memory:** Request and response objects remain in memory during `terminate()`. Large file uploads or loaded models are not freed until `terminate()` completes.

---

## Performance

If `terminate()` performs synchronous I/O, it blocks the web process. In PHP-FPM, this delays the process from handling the next request. For heavy termination tasks, dispatch to a queue. Memory is not freed until `terminate()` completes — long-running termination increases peak memory usage. In Octane, blocking `terminate()` blocks the entire worker from handling concurrent requests.

---

## Security

Terminable middleware that logs request data must ensure sensitive information (passwords, tokens, personal data) is not written to logs. The `$response` object is fully accessible — ensure no sensitive response data is exposed through the termination path. Singleton terminable middleware that accumulates data (request counters, log arrays) can leak information across requests if not properly scoped or cleared.

---

## Common Mistakes

- **Not registering as singleton for shared state.** A terminable middleware stores a start time in `handle()` and reads it in `terminate()`. Without singleton registration, the start time is always null because `terminate()` runs on a fresh instance.
- **Heavy processing in terminate().** Sending API requests, writing to databases, or processing files in `terminate()` blocks the web process. The next request cannot start until termination finishes.
- **Relying on terminate() for critical operations.** If a server crashes before `terminate()` fires, the termination logic never runs. Log entries, cleanup tasks, and metrics are lost.
- **Using terminate() in console kernel.** The console kernel does not call `terminate()`. Middleware with termination logic only fires during HTTP requests.
- **Memory leak in singleton terminable middleware.** A singleton middleware that appends data to an array property on each request leaks memory across requests in Octane.

---

## Anti-Patterns

- **Singleton terminable middleware with unbounded data accumulation.** An array property that grows with every request (`$this->logs[] = [...]`) leaks memory until the worker restarts. In Octane, this causes out-of-memory errors.
- **Sync I/O in terminate() that blocks the process.** Making HTTP calls, running database queries, or writing files in `terminate()` blocks the PHP-FPM process from handling the next request.
- **Assuming terminate() fires in all environments.** Relying on `terminate()` for cleanup, logging, or metrics in RoadRunner or Swoole environments where `terminate()` may not fire.
- **Race condition in singleton terminable middleware with instance properties.** Singleton middleware using `$this->timer` for timing data without keying by request ID causes data corruption in concurrent request handling.

---

## Examples

### Request Logging Pattern
```php
class RequestLogMiddleware
{
    private array $startTimes = [];

    public function handle(Request $request, Closure $next): Response
    {
        $this->startTimes[spl_object_id($request)] = microtime(true);
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        $duration = (microtime(true) - ($this->startTimes[spl_object_id($request)] ?? microtime(true))) * 1000;
        Log::channel('request')->info('Request', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'status' => $response->getStatusCode(),
            'duration_ms' => round($duration, 2),
        ]);
    }
}
```

### Cleanup Task Pattern
```php
class CleanupTempFilesMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        if ($request->session()->has('temp_files')) {
            foreach ($request->session()->pull('temp_files') as $path) {
                @unlink(storage_path("app/temp/{$path}"));
            }
        }
    }
}
```

### Singleton Registration
```php
// AppServiceProvider::register()
$this->app->singleton(RequestLogMiddleware::class);
```

---

## Related Topics

- **Middleware Fundamentals** (prerequisite) — the Pipeline pattern and handle() contract.
- **Middleware Lifecycle** (prerequisite) — the complete request flow including the terminate phase.
- **Service Container** (prerequisite) — singleton vs non-singleton binding and its effect on middleware.
- **Custom Middleware** — creating middleware that implements terminate().
- **Cross-Cutting Concerns** — deciding whether a concern should use terminable middleware or queue.
- **Octane Architecture** — how terminable middleware behaves in long-lived processes.
- **Queue Workers** — `dispatch()->afterResponse()` as an alternative to terminable middleware.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Custom Middleware, Middleware Lifecycle (prerequisites). Serves as prerequisite for middleware-testing, cross-cutting-concerns.
- **Critical constraint:** `terminate()` receives a NEW instance by default. Register as singleton for state sharing.
- **Server compatibility:** PHP-FPM always fires `terminate()`. RoadRunner/Swoole may not.
- **Do NOT rely on terminate() for critical operations.** Use queue with retries for guaranteed execution.
- **Heavy processing in terminate() blocks the web process.** Delegate to queue for heavy work.
- **Octane:** Event listeners are recommended over terminable middleware.

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| terminate() contract documented | ✓ |
| New instance behavior explained | ✓ |
| Singleton registration guidance | ✓ |
| When to use / when NOT to use | ✓ |
| Best practices with rationale | ✓ |
| Performance analysis | ✓ |
| Security considerations | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples | ✓ |
| Related topics mapped | ✓ |
