# Skill: Migrate Singletons to Scoped for Octane

## Purpose
Convert incorrectly-classified `singleton()` bindings that hold mutable request-scoped state to `scoped()` bindings, preventing cross-user data leaks in Octane and long-running queue workers.

## When To Use
- Before deploying to Octane for the first time
- When investigating data leaks between users or requests
- After adding new services that hold request-state
- As part of Octane deployment checklist

## When NOT To Use
- For truly stateless, immutable singleton services (routers, loggers, config readers)
- FPM-only deployments (though future-proofing is still recommended)
- When the service must be fresh per-call (use `bind()` instead)

## Prerequisites
- Binding Types
- Scoped Instance Management basics
- Octane lifecycle awareness

## Inputs
- Full list of `singleton()` registrations
- Service classification: stateless vs request-state holder
- Dependency graph of each singleton

## Workflow
1. Collect all `singleton()` registrations: search `->singleton(` across all service providers
2. For each singleton, determine if it holds per-request state:
   - Does it resolve `Request`, `Auth::user()`, `Session`, or similar per-request data?
   - Does it have setter methods that change state per-request?
   - Is it configured differently per request via middleware?
3. For request-state singletons: change `$app->singleton(...)` to `$app->scoped(...)`
4. Check transitive dependencies — if the scoped service depends on another service, ensure that dependency is also scoped (or use factory pattern)
5. Verify Octane automatic flush: Octane calls `flushScoped()` after each request by default
6. Test concurrent request isolation under Octane — make concurrent requests and assert data isolation

## Validation Checklist
- [ ] All request-state services converted from `singleton()` to `scoped()`
- [ ] Process-scoped services confirmed stateless and immutable
- [ ] No singleton holds a direct reference to a scoped dependency
- [ ] Octane configured to flush scoped instances per request
- [ ] Concurrent request test passes with data isolation

## Common Failures
- Missing an obscure singleton that indirectly holds request-state through a mutable dependency
- Singleton factory closure captures request data at registration time instead of resolution time
- Third-party package registers a mutable singleton — requires overriding via `$app->extend()` or rebind
- Scoped service depends on a transient — works but transient is resolved once per scope

## Decision Points
- Full conversion vs selective conversion: convert all request-state singletons at once to avoid partial migration bugs
- `scoped()` vs factory pattern: if the dependency graph is deeply tangled, use factory pattern to lazily resolve request state

## Performance Considerations
- `scoped()` has identical performance to `singleton()` within a scope
- `flushScoped()` adds O(N) overhead per request — negligible for <100 scoped instances
- Converting 50 singletons adds ~2-5μs per request for flush

## Security Considerations
- This migration directly prevents cross-user data leakage — the #1 Octane production bug
- Services holding auth data, tenant context, locale, and PII must be scoped
- Document which services were converted for audit trail

## Related Rules
- Audit All singleton() Bindings Before Octane Deployment
- Never Cache Scoped Instances in Singletons
- Use scoped() for Any Service Holding Per-Request State

## Related Skills
- Audit Bindings for Octane Safety
- Select the Correct Binding Type
- Configure Scope Boundaries in Queue Workers

## Success Criteria
- Zero `singleton()` bindings holding mutable request-state
- All converted bindings work correctly under Octane
- Concurrent request test confirms data isolation
- No performance regression from conversion

---

# Skill: Configure Scope Boundaries in Queue Workers

## Purpose
Set up proper scoped instance flushing in queue workers (Horizon, `queue:work`) to prevent state leakage between jobs when using `scoped()` bindings.

## When To Use
- When deploying queue workers with scoped bindings
- When jobs share a worker process and must not leak state
- When migrating from FPM to long-running queue processes
- When using Octane with queue worker integration

## When NOT To Use
- FPM-only queue workers where each job is a separate process
- When no scoped bindings are used in the application

## Prerequisites
- Scoped Instance Management
- Queue worker lifecycle (Horizon/queue:work)

## Inputs
- Queue worker configuration (Horizon, queue:work, custom)
- List of scoped bindings used in jobs
- Job processing pipeline (middleware, base classes)

## Workflow
1. Identify all scoped bindings that jobs depend on
2. Choose flush strategy:
   - **After each job**: add middleware that calls `app()->flushScoped()` in job pipeline
   - **Before each job**: call `app()->flushScoped()` at the start of job `handle()`
   - **Per-scope boundary**: define explicit scope boundaries for specific job groups
3. Implement flush middleware for queue worker:
   ```php
   class FlushScopedInstances {
       public function handle(object $job, Closure $next): void {
           $next($job);
           app()->flushScoped();
       }
   }
   ```
4. Register middleware in `app/Http/Kernel.php` for queue jobs or apply per-job
5. Verify: run sequential jobs that use scoped services and assert isolation
6. Add logging to detect residual scoped instances between jobs

## Validation Checklist
- [ ] `flushScoped()` called between jobs (after or before each job)
- [ ] Queue worker middleware or base job handler implements flush
- [ ] Sequential job test confirms data isolation
- [ ] Horizon configuration documented with flush strategy
- [ ] Scoped instance count logged for monitoring

## Common Failures
- `flushScoped()` called at job start but not after — residual state from aborted jobs persists
- `flushScoped()` clears too much — selective flush may be needed for performance
- Job base class overrides flush middleware order — flush happens before job processes
- Developer assumes Octane-style auto-flush exists in queue workers (it doesn't)

## Decision Points
- Flush before vs after each job: flush after ensures cleanup even on job failure; flush before provides clean state at job start
- Selective flush vs full flush: use full flush by default; use selective flush only when performance profiling shows impact from re-resolving all scoped services

## Performance Considerations
- Full `flushScoped()` is O(N) — negligible for <100 scoped instances
- Selective flush is O(K) where K = specified abstracts — avoids re-resolving unrelated scoped services
- Each re-resolution after flush pays full `make()` cost — factor into job processing time

## Security Considerations
- Missing flush between jobs causes cross-job data leakage — same severity as cross-request leakage in Octane
- Jobs handling PII must have scoped instances flushed at scope boundaries
- Logging scoped instance state should not include sensitive data

## Related Rules
- Ensure flushScoped() Is Called at Scope Boundaries in Queue Workers
- Use Selective Flush for Mid-Request Scope Changes
- Verify scoped() Behavior Is Different from singleton() in Your Environment

## Related Skills
- Migrate Singletons to Scoped for Octane
- Audit Bindings for Octane Safety
- Select the Correct Binding Type

## Success Criteria
- No state leaks between consecutive queue jobs
- `flushScoped()` called reliably at each scope boundary
- Queue worker performance within acceptable bounds
- Monitoring detects anomalous scoped instance growth
