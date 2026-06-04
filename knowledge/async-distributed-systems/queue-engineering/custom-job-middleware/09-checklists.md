# Custom Job Middleware Creation — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Middleware
- **Knowledge Unit:** K054 — Custom Job Middleware Creation
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand `MiddlewareInterface` contract (`handle(object $job, callable $next): void`)
- [ ] Familiar with Laravel queue pipeline execution model
- [ ] Know difference between `$next($job)`, `$job->release()`, and `$job->delete()`

## Implementation Checklist
- [ ] Middleware implements `Illuminate\Contracts\Queue\Middleware`
- [ ] `handle()` method receives `$job` and `$next` closure
- [ ] `$next($job)` called exactly once
- [ ] Middleware returned in array from job's `middleware()` method
- [ ] Order of middleware in array matches intended execution order (guards first)
- [ ] For global middleware, registered via `Queue::middleware()`

## Verification Checklist
- [ ] Job executes correctly with middleware applied
- [ ] Short-circuit path (no `$next` call) works as expected
- [ ] Exceptions are caught for logging/metrics and re-thrown
- [ ] Middleware pipeline order produces correct behavior
- [ ] Tests confirm middleware fires before and/or after job execution

## Security Checklist
- [ ] Middleware doesn't modify job data in unsafe ways
- [ ] No sensitive data logged by middleware
- [ ] Middleware doesn't leak state across job instances
- [ ] Authorization checks in middleware use proper gates

## Performance Checklist
- [ ] Middleware is fast — blocks the job pipeline while executing
- [ ] No heavy I/O or expensive operations in middleware
- [ ] Use `make:job-middleware` command for correct scaffolding

## Production Readiness Checklist
- [ ] Middleware has unit tests
- [ ] Middleware behavior documented in code comments
- [ ] Middleware added to relevant job classes
- [ ] Error handling in middleware doesn't swallow exceptions

## Common Mistakes to Avoid
- [ ] Not calling `$next($job)` — pipeline broken, job never executes
- [ ] Calling `$next($job)` twice — job runs twice, side effects double
- [ ] Swallowing exceptions in catch — job appears to succeed
- [ ] Returning single instance from `middleware()` instead of array
- [ ] Stateful middleware — state leaks across jobs in same worker
