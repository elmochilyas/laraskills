# Skill: Create Custom Job Middleware

## Purpose
Implement custom job middleware to wrap cross-cutting concerns (logging, metrics, rate limiting, error handling) around job execution without modifying business logic.

## When To Use
Cross-cutting concerns that span multiple job types; encapsulating infrastructure logic separate from business logic; centralized error handling or monitoring.

## When NOT To Use
Business logic specific to one job (belongs in `handle()`); simple operations that don't need a separate class (use inline callbacks in `middleware()`); stateful middleware (state leaks across jobs in the same worker).

## Prerequisites
- Laravel 11+ (for `make:job-middleware` command) or manual implementation of `MiddlewareInterface`
- Understanding of pipeline execution order

## Inputs
- Middleware concern (logging, timing, rate limiting, etc.)
- Job class(es) to apply the middleware to

## Workflow
1. Scaffold: `php artisan make:job-middleware CustomMiddleware`
2. Implement `handle(object $job, Closure $next): void`
3. Add code before `$next($job)` for pre-execution (guards, setup)
4. Add code after `$next($job)` for post-execution (cleanup, metrics)
5. Call `$next($job)` exactly once (skip only for short-circuit)
6. Don't swallow exceptions — catch, log, re-throw
7. Apply to job: return instance from `middleware()` method
8. For global middleware: register via `Queue::middleware()` in service provider

## Validation Checklist
- [ ] `handle()` calls `$next($job)` exactly once (or skips intentionally for short-circuit)
- [ ] Exceptions are re-thrown after logging (not swallowed)
- [ ] Middleware fast — no heavy I/O or computation
- [ ] Order in `middleware()` array is correct (guards first, then measurement)
- [ ] Middleware is stateless (no shared mutable state across jobs)
- [ ] Returned as array: `return [new Middleware]` not single instance

## Common Failures
- Not calling `$next($job)` — pipeline breaks, job never runs
- Calling `$next($job)` twice — job runs twice
- Swallowing exceptions — job appears to succeed
- Returning single instance instead of array from `middleware()` — type error

## Decision Points
- Single-job concern: inline callback in `middleware()`
- Cross-cutting concern: dedicated middleware class
- Global: `Queue::middleware()` in `AppServiceProvider`

## Performance Considerations
- Middleware blocks the job pipeline synchronously
- Keep middleware fast — delays all jobs using it
- Order matters: guards before heavier middleware

## Security Considerations
- Don't log sensitive data from job payloads in middleware
- Authorization middleware should short-circuit (skip `$next`) on failure

## Related Rules
- Rule 1: order-middleware-by-execution-flow
- Rule 2: call-next-exactly-once
- Rule 3: never-swallow-exceptions-in-middleware
- Rule 4: keep-middleware-fast

## Related Skills
- Scaffold Job Middleware with make:job-middleware
- Build Custom Rate Limiting with the RateLimiter Facade

## Success Criteria
Custom middleware wraps job execution correctly, runs before/after as intended, doesn't alter job outcome unintentionally, and cleanly separates infrastructure concerns from business logic.
