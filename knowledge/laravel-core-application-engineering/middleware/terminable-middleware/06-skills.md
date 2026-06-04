# Skill: Implement Terminable Middleware with Singleton Registration and Cleanup

## Purpose

Create a terminable middleware that shares state between `handle()` and `terminate()`, registered as a singleton with proper per-request data keying and cleanup to prevent memory leaks.

## When To Use

When middleware needs to execute post-response logic (logging, metrics, cleanup) that needs access to data captured during request handling, such as start times, resolved data, or accumulated metrics.

## When NOT To Use

For operations that must execute for correctness — use queue jobs with retries. For terminable middleware that reads all data from `$request` and `$response` parameters — singleton registration is not needed.

## Prerequisites

- Understanding of the terminate() contract and new-instance behavior
- Knowledge of singleton container binding
- Octane awareness for concurrent request safety

## Inputs

- Data to capture during `handle()` and use in `terminate()`
- Server environment (PHP-FPM, RoadRunner, Swoole, Octane)

## Workflow

1. Create a middleware class with `handle(Request $request, Closure $next): Response` and `terminate(Request $request, Response $response): void`
2. In `handle()`, store per-request data keyed by `spl_object_id($request)`:
   ```php
   $this->startTimes[spl_object_id($request)] = microtime(true);
   ```
3. In `terminate()`, read the data using the same key and clean up afterward:
   ```php
   $id = spl_object_id($request);
   $duration = microtime(true) - ($this->startTimes[$id] ?? microtime(true));
   Log::info('Timing', ['ms' => round($duration, 2)]);
   unset($this->startTimes[$id]);
   ```
4. Register the middleware as a singleton in a service provider:
   ```php
   $this->app->singleton(TimingLogger::class);
   ```
5. Keep `terminate()` lightweight — no synchronous I/O over 10ms
6. Delegate heavy processing to queue jobs
7. Document server environment compatibility (PHP-FPM fires terminate(), RoadRunner may not)

## Validation Checklist

- [ ] Singleton registration is configured in a service provider
- [ ] Per-request data is keyed by `spl_object_id($request)` — not a single property
- [ ] `terminate()` cleans up all per-request data (`unset`) — prevents memory leaks
- [ ] No synchronous I/O over 10ms in `terminate()`
- [ ] Heavy processing is dispatched to queue jobs
- [ ] Server environment compatibility is documented
- [ ] Critical operations use queue with retries, not terminable middleware

## Common Failures

- Not registering as singleton — `terminate()` receives a fresh instance with no access to `handle()` data
- Using `$this->startTime = microtime(true)` without `spl_object_id()` keying — race condition in concurrent requests
- No cleanup in `terminate()` — singleton array grows unboundedly, causing memory leaks in Octane
- Heavy synchronous I/O in `terminate()` — blocks web process from handling next request
- Assuming `terminate()` fires in all environments — does not fire in RoadRunner by default

## Decision Points

- If `terminate()` reads all data from `$request` and `$response` only, skip singleton registration
- If heavy processing is needed, use `dispatch()->afterResponse()` or a queue job instead
- In Octane, prefer event listeners over terminable middleware

## Performance Considerations

`terminate()` runs after the response is sent — the client does not wait. However, synchronous I/O in `terminate()` blocks the web process from accepting the next request. Keep under 10ms or delegate to queue.

## Security Considerations

Singleton middleware that accumulates data (start times, logs) must clean up per-request state in `terminate()`. Unbounded array growth in Octane leads to out-of-memory errors. Ensure no sensitive data is written to logs from `terminate()`.

## Related Rules

- Register Terminable Middleware as Singleton When State Sharing Is Needed (terminable-middleware:5)
- Keep terminate() Lightweight — Never Perform Synchronous I/O (terminable-middleware:5)
- Do Not Use Terminable Middleware for Critical Operations That Must Execute (terminable-middleware:5)
- Prevent Memory Leaks in Singleton Terminable Middleware (terminable-middleware:5)
- Use spl_object_id($request) as Key for Per-Request Data in Singleton Middleware (terminable-middleware:5)

## Related Skills

- Test Terminable Middleware by Calling terminate() Directly
- Verify terminate() Behavior in the Target Deployment Environment

## Success Criteria

Terminable middleware is registered as a singleton. Per-request data is keyed by `spl_object_id()` and cleaned up in `terminate()`. No synchronous I/O over 10ms. Critical operations use queue jobs.

---

# Skill: Verify terminate() Behavior in the Target Deployment Environment

## Purpose

Test and document whether `terminate()` fires in the target server environment (PHP-FPM, RoadRunner, Swoole, FrankenPHP), adjusting the middleware strategy based on environment capabilities.

## When To Use

When deploying terminable middleware to a new environment, when migrating between server environments, or when diagnosing missing logs or metrics that should be recorded by terminable middleware.

## When NOT To Use

Applications deployed exclusively to PHP-FPM with no plans to change server environments — `terminate()` fires reliably in PHP-FPM.

## Prerequisites

- Access to the target deployment environment
- Terminable middleware class deployed and registered

## Inputs

- Target server environment type
- Terminable middleware code

## Workflow

1. Identify the target server environment: PHP-FPM, RoadRunner, Swoole, FrankenPHP, Octane
2. Document the environment's `terminate()` behavior:
   - PHP-FPM: Always fires
   - RoadRunner: Does NOT fire by default
   - Swoole: Fires if configured (depends on configuration)
   - FrankenPHP: Similar to Swoole — depends on configuration
   - Octane: May not fire — event listeners recommended
3. If `terminate()` does NOT fire in the target environment:
   - Replace terminable middleware with `dispatch()->afterResponse()` or queue jobs
   - Or use event listeners (Octane)
4. If `terminate()` fires conditionally:
   - Add runtime detection: `if (PHP_SAPI === 'fpm-fcgi') { ... }`
   - Or dispatch to queue from the middleware's `handle()` method instead
5. Document the decision in the middleware class docblock and in deployment documentation
6. Test in the target environment before production deployment

## Validation Checklist

- [ ] Target environment's `terminate()` behavior is documented
- [ ] If `terminate()` does not fire, an alternative strategy is implemented
- [ ] Environment-specific code is guarded by `PHP_SAPI` or environment detection
- [ ] Documentation includes the decision rationale
- [ ] Tested in the target environment before production deployment

## Common Failures

- Developing and testing on PHP-FPM, deploying to RoadRunner — terminate() never fires in production
- Assuming terminate() fires in all environments — no alternative strategy for non-FPM environments
- No environment-specific documentation — next developer changes server without knowing about terminate() dependency

## Decision Points

- If migrating from PHP-FPM to RoadRunner, replace terminable middleware with queue jobs
- If using Octane, use event listeners instead of terminable middleware
- If the application serves multiple environments, use environment detection to switch strategies

## Performance Considerations

Environment verification itself has no performance cost. The cost comes from the backup strategy — queue jobs add infrastructure dependency, event listeners are typically in-process.

## Security Considerations

Logging, metrics, and cleanup that rely on `terminate()` silently stop working in environments where `terminate()` does not fire. This creates operational blind spots — monitoring gaps are not immediately noticed.

## Related Rules

- Verify terminate() Behavior in the Target Deployment Environment (terminable-middleware:5)
- Do Not Assume terminate() Fires in All Server Environments (middleware-lifecycle:5)

## Related Skills

- Implement Terminable Middleware with Singleton Registration and Cleanup
- Test Terminable Middleware by Calling terminate() Directly

## Success Criteria

The target environment's `terminate()` behavior is documented. An alternative strategy exists for environments where `terminate()` does not fire. Tested and verified before production deployment.
