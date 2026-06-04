# Skill: Optimize Termination Phase for Throughput

## Purpose

Keep `$kernel->terminate()` execution under 5ms total across all terminable middleware, app callbacks, and event listeners to maximize FPM worker availability and Octane request throughput.

## When To Use

When adding new terminable middleware or Terminating listeners, when profiling high P99 latency under load, when migrating to Octane (termination blocks the next request), or when FPM worker pool is saturated under moderate traffic.

## When NOT To Use

Applications under very low traffic with generous worker pools may tolerate higher termination times. Octane deployments where termination handlers perform required synchronous reset must keep termination but should still optimize within the 5ms budget.

## Prerequisites

- Understanding of `fastcgi_finish_request()` and its effect on termination timing
- Knowledge of terminable middleware, app callbacks, and the Terminating event
- Access to production profiling data or load testing tools

## Inputs

- List of all terminable middleware classes and their terminate() methods
- List of all terminating callbacks and Terminating event listeners
- Deployment environment (FPM vs Octane vs RoadRunner)

## Workflow

1. Profile current termination duration by wrapping the entry point:
   ```php
   $response->send();
   $termStart = microtime(true);
   $kernel->terminate($request, $response);
   $termDuration = microtime(true) - $termStart;
   Log::debug("Termination took: " . round($termDuration * 1000, 2) . "ms");
   ```
2. Identify all code that runs in termination:
   - Terminable middleware: classes implementing `terminate($request, $response)` — listed in order of pipeline registration
   - App callbacks: registered via `$app->terminating()` — run after terminable middleware
   - `Terminating` event listeners — run after app callbacks
   - Duration handlers: registered via `whenRequestLifecycleDurationExceeds()` — run last
3. Categorize each termination operation:
   - **Sub-millisecond** (<1ms): log writes, counter increments, header reads — keep in termination
   - **Millisecond-range** (1-5ms): fast cache reads/writes, simple DB queries — optimize or queue
   - **Heavy** (>5ms): API calls, large DB queries, file writes — must move to queue
4. Move heavy operations to queue with `dispatch()->afterResponse()`:
   ```php
   public function terminate($request, $response): void
   {
       TrackPageView::dispatch($request->getUri())->afterResponse();
   }
   ```
5. For operations that must remain synchronous (Octane state reset, mutex release), optimize to stay under 5ms combined
6. Wrap all termination code in try/catch — uncaught exceptions crash the worker

## Validation Checklist

- [ ] Total termination duration is under 5ms in production (measured)
- [ ] No synchronous HTTP API calls in termination
- [ ] No database writes exceeding 1ms in termination
- [ ] All heavy I/O uses `dispatch()->afterResponse()` or queue jobs
- [ ] Every terminate() method and Terminating listener has try/catch
- [ ] Termination duration is monitored and alerted (alert if >10ms)
- [ ] Under Octane, termination includes only required state reset — no optional I/O

## Common Failures

- Assuming `fastcgi_finish_request()` makes termination free — HTTP connection closes but FPM process remains blocked
- Heavy I/O in termination under Octane — termination blocks the next request on the same worker
- Multiple terminable middleware each doing 3ms — 5 middleware × 3ms = 15ms cumulative, exceeding 5ms budget
- Not profiling termination — developers add "cheap" operations that accumulate over time
- Exceptions in termination crashing the worker — lost capacity and state corruption

## Decision Points

- If termination is under 5ms, further optimization is unnecessary — monitor to detect regressions
- If under Octane, termination is more critical (blocks next request) — target 2ms
- If under FPM with large worker pool (100+ workers), 10-20ms termination may be acceptable — but still optimize to reduce infrastructure costs

## Performance Considerations

5ms per termination request × 1000 requests/second = 5 seconds of worker time per second — requires 5+ extra workers just to cover termination overhead. Reducing to 1ms saves 4 workers per 1000 req/s. `fastcgi_finish_request()` is ~0.01ms but only works under FPM FastCGI.

## Security Considerations

Termination handlers run after response send — do not modify response, session, or auth state. In Octane, termination state modifications carry to the next request — only perform read-only or explicit reset operations. Log termination exceptions separately from request exceptions to enable targeted alerting.

## Related Rules

- Keep Termination Under 5ms Total (response-sending-and-termination:5)
- Offload Heavy I/O From Termination To Queue (response-sending-and-termination:5)
- Wrap Terminate Body In Try/Catch (response-sending-and-termination:5)
- Avoid Global State Modification In Termination Under Octane (response-sending-and-termination:5)
- Log Termination Exceptions Separately From Request Exceptions (response-sending-and-termination:5)

## Related Skills

- Implement Safe Terminable Middleware (response-sending-and-termination:6)
- Implement Octane State Flushing via Terminating Callbacks (lifecycle-events-and-hooks:6)
- Register Lifecycle Hooks at the Correct Phase (lifecycle-events-and-hooks:6)

## Success Criteria

Termination duration is measured and under 5ms. All heavy I/O is offloaded to queue jobs. Every termination handler has try/catch. Termination is monitored with an alert at 10ms. Under Octane, termination includes only required state reset.

---

# Skill: Implement Safe Terminable Middleware

## Purpose

Create middleware with `terminate()` behavior that correctly shares state between `handle()` and `terminate()`, uses singleton registration, handles exceptions safely, and prevents memory leaks in all deployment environments.

## When To Use

When middleware must execute post-response logic (logging, metrics tracking, cache invalidation, state flushing) that needs data captured during request handling. When migrating from closure-based middleware to class-based middleware for termination behavior.

## When NOT To Use

For critical operations that must execute for correctness — use queue jobs with retries instead. For middleware that reads all data from `$request` and `$response` parameters only — singleton registration is not required. In environments where `terminate()` does not fire (RoadRunner by default).

## Prerequisites

- Understanding of the terminate() contract and the singleton requirement
- Knowledge of `spl_object_id()` for per-request data keying
- Knowledge of the target deployment environment's terminate() behavior

## Inputs

- Data to capture during `handle()` and use in `terminate()`
- Server environment (PHP-FPM, Octane, RoadRunner, Swoole)
- Singleton registration mechanism

## Workflow

1. Create a middleware class with `handle()` and `terminate()` methods:
   ```php
   class RequestTimer
   {
       public function handle(Request $request, Closure $next): Response
       {
           $this->startTimes[spl_object_id($request)] = microtime(true);
           return $next($request);
       }

       public function terminate(Request $request, Response $response): void
       {
           try {
               $id = spl_object_id($request);
               $duration = microtime(true) - ($this->startTimes[$id] ?? microtime(true));
               Log::info('Request duration', ['ms' => round($duration, 2)]);
               unset($this->startTimes[$id]);
           } catch (\Throwable $e) {
               Log::channel('termination')->error('[TERMINATE] RequestTimer failed', [
                   'error' => $e->getMessage(),
               ]);
           }
       }
   }
   ```
2. Register the middleware as a singleton in a service provider:
   ```php
   $this->app->singleton(RequestTimer::class);
   ```
3. Register the middleware in the global middleware or middleware group (Laravel 11+):
   ```php
   ->withMiddleware(function (Middleware $middleware) {
       $middleware->append(RequestTimer::class);
   })
   ```
4. Key all per-request data by `spl_object_id($request)` — prevents race conditions in concurrent requests (Octane):
   - `$this->startTimes[spl_object_id($request)] = microtime(true);` — store in handle()
   - `unset($this->startTimes[spl_object_id($request)]);` — clean up in terminate()
5. Keep `terminate()` body under 5ms — no synchronous I/O over 10ms
6. Document the target environment's compatibility — does `terminate()` fire?

## Validation Checklist

- [ ] Middleware is registered as a singleton (not a transient binding)
- [ ] Per-request data is keyed by `spl_object_id($request)`
- [ ] `terminate()` cleans up all stored data with `unset()`
- [ ] `terminate()` body is wrapped in try/catch — exceptions logged and swallowed
- [ ] No synchronous I/O over 10ms in `terminate()`
- [ ] Heavy processing is dispatched to queue via `dispatch()->afterResponse()`
- [ ] Not using per-request state on `$this` that is assigned without spl_object_id keying
- [ ] Environment compatibility is documented in class docblock

## Common Failures

- Not registering as singleton — `terminate()` receives a fresh instance with no `handle()` state
- Using `$this->startTime = microtime(true)` without `spl_object_id()` keying — race condition in concurrent Octane requests overwrites the value
- No cleanup in `terminate()` — singleton array grows unboundedly, causing memory leaks in Octane
- No try/catch in `terminate()` — exception crashes the worker, leaving state uncleaned and potentially blocking future requests
- Heavy synchronous I/O in `terminate()` — blocks the FPM worker or next Octane request

## Decision Points

- If `terminate()` reads all data from `$request` and `$response` parameters only (no instance state), skip singleton registration — container can create a new instance for terminate()
- If the target environment does not fire `terminate()` (RoadRunner), use `dispatch()->afterResponse()` instead
- In Octane, consider using `Terminating` event listeners instead of terminable middleware — more explicit Octane lifecycle integration

## Performance Considerations

Terminable middleware adds ~0.05ms for method dispatch. Singleton registration adds no per-request overhead. `spl_object_id()` is ~0.001ms. Unbounded array growth (no cleanup) causes memory leaks in Octane — cleanup is mandatory for correctness.

## Security Considerations

Terminable middleware has access to `$request` and `$response` after send — avoid logging sensitive data (tokens, passwords, auth headers). Singleton middleware that accumulates data without cleanup causes memory leaks — under Octane, this can lead to out-of-memory errors and worker crashes.

## Related Rules

- Register Terminable Middleware As Singletons (response-sending-and-termination:5)
- Wrap Terminate Body In Try/Catch (response-sending-and-termination:5)
- Use Class-Based Middleware For Terminable Behavior (response-sending-and-termination:5)
- Keep Termination Under 5ms Total (response-sending-and-termination:5)
- Log Termination Exceptions Separately From Request Exceptions (response-sending-and-termination:5)

## Related Skills

- Optimize Termination Phase for Throughput (response-sending-and-termination:6)
- Diagnose Termination Failures (response-sending-and-termination:6)
- Implement Octane State Flushing via Terminating Callbacks (lifecycle-events-and-hooks:6)

## Success Criteria

Terminable middleware is registered as a singleton. Per-request data is keyed by `spl_object_id($request)` and cleaned up in `terminate()`. `terminate()` body is wrapped in try/catch. No synchronous I/O over 10ms. Environment compatibility is documented.

---

# Skill: Diagnose Termination Failures

## Purpose

Identify and fix the root cause of termination-phase failures: uncaught exceptions, headers already sent, missing terminable middleware execution, environment-specific termination issues, and silently ignored response modifications.

## When To Use

When FPM workers crash with no apparent request error, when post-response logging/metrics are missing, when Octane workers show memory growth, when "headers already sent" errors occur, or when response modifications are silently not applied.

## When NOT To Use

Request-phase failures (controller errors, middleware exceptions) — those are caught by the kernel's exception handler and shown in logs. Termination failures are often silent or logged to different channels.

## Prerequisites

- Understanding of the termination pipeline order: terminable middleware → app callbacks → Terminating event → duration handlers
- Knowledge of `fastcgi_finish_request()` and environment differences
- Access to application and PHP error logs

## Inputs

- Error logs (application, PHP, FPM/Octane)
- Deployment environment (FPM, Octane, RoadRunner)
- List of terminable middleware, terminating callbacks, and listeners

## Workflow

1. Check if the issue is an **uncaught exception in termination**:
   - Look for crashes that happen after `$response->send()` — logs may be missing because exception handlers in termination don't exist
   - Check FPM/Octane worker logs for unexplained crashes
   - Fix: wrap every `terminate()` method and `Terminating` listener in try/catch
2. Check if the issue is **headers already sent**:
   - Error: "Cannot modify header information - headers already sent"
   - Check for whitespace or `echo` output before `$response->send()` in `public/index.php`
   - Check for output buffering that is not flushed
   - Fix: ensure no output precedes `require __DIR__.'/../bootstrap/app.php'`
3. Check if the issue is **terminable middleware not executing**:
   - Verify the middleware uses a class-string, not a closure — closures cannot be resolved for terminate()
   - Verify the middleware is registered as a singleton — without singleton, terminate() gets a fresh instance
   - Add temporary logging to confirm `terminate()` is called
4. Check if the issue is **environment-specific**:
   - `terminate()` fires in FPM but not in RoadRunner — test in the actual deployment environment
   - `fastcgi_finish_request()` is FPM-only — not available in `php -S`, CGI, or phpdbg
   - Fix: document environment behavior, use `dispatch()->afterResponse()` as fallback
5. Check if the issue is **response modifications silently ignored**:
   - Response modifications in `Terminating` events are silently ignored (response already sent)
   - Fix: use `RequestHandled` event for response modification
6. Check for **memory leaks** (Octane):
   - Resident memory grows over time — termination handlers not cleaning up per-request state
   - Fix: audit termination handlers for `unset()` calls, `forgetInstance()`, and `clearResolvedInstance()`

## Validation Checklist

- [ ] All `terminate()` methods and `Terminating` listeners have try/catch
- [ ] No whitespace or output exists before `$response->send()` in `public/index.php`
- [ ] Terminable middleware uses class-string registration, not closures
- [ ] Terminable middleware with state is registered as singleton
- [ ] Actual deployment environment's `terminate()` behavior is documented and tested
- [ ] Response modifications use `RequestHandled`, not `Terminating`
- [ ] Memory is stable across 1000+ requests in Octane — no growth trend

## Common Failures

- Exception in termination causes silent crash — no error logged, worker restarts, no alert
- Response modification in `Terminating` — developer adds header in termination, header never appears, debugging time wasted
- Closure-based terminable middleware — terminate() never called, no error, just silently skipped
- Singleton not registered — terminate() gets fresh instance, data from handle() is lost, but no error
- Development on `php -S` — `fastcgi_finish_request()` not available, termination behavior differs from FPM production

## Decision Points

- If termination behaves differently across environments, standardize on `dispatch()->afterResponse()` which works the same everywhere
- If terminate() crashes are hard to reproduce, add structured logging to all termination handlers with distinct event type
- If memory growth is detected in Octane, isolate which termination handler is not cleaning up by temporarily disabling handlers one by one

## Performance Considerations

Diagnosis tools (logging, profiling) add no production cost when removed. Temporary logging during diagnosis should be removed or set to debug level after root cause is found. Each termination handler adds ~0.05-5ms — the cost of debugging a missing execution is far higher.

## Security Considerations

Termination failures often cause incomplete state cleanup — in Octane, dirty state from a crashed termination carries to the next request, potentially leaking session data or auth state. Treat termination failures as security-sensitive incidents. Never log sensitive data in termination debugging output.

## Related Rules

- Wrap Terminate Body In Try/Catch (response-sending-and-termination:5)
- Use Class-Based Middleware For Terminable Behavior (response-sending-and-termination:5)
- Register Terminable Middleware As Singletons (response-sending-and-termination:5)
- Use RequestHandled For Response Modification, Never Terminating (response-sending-and-termination:5)
- Do Not Assume fastcgi_finish_request() Availability (response-sending-and-termination:5)
- Log Termination Exceptions Separately From Request Exceptions (response-sending-and-termination:5)

## Related Skills

- Implement Safe Terminable Middleware (response-sending-and-termination:6)
- Optimize Termination Phase for Throughput (response-sending-and-termination:6)
- Register Lifecycle Hooks at the Correct Phase (lifecycle-events-and-hooks:6)
- Implement Octane State Flushing via Terminating Callbacks (lifecycle-events-and-hooks:6)

## Success Criteria

Root cause of termination failure is identified and fixed. All `terminate()` methods have try/catch. Terminable middleware uses class-string + singleton. Actual deployment environment behavior is documented. Response modifications use `RequestHandled`. Memory is stable in Octane under sustained load.
