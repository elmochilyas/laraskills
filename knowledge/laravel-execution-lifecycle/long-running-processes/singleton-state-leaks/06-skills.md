# Skill: Identify Singleton State Leaks Through Sequential Request Testing

## Purpose
Detect singleton state leaks by writing and running sequential request tests that send different authenticated users and assert full data isolation, then fix identified leaks by converting to scoped bindings or stateless design.

## When To Use
- During Octane readiness audit
- When debugging cross-request data leaks
- After adding new service providers or packages
- CI pipeline integration for regression prevention

## When NOT To Use
- Stateless singletons (config readers, HTTP clients, loggers)
- Transient bindings (inherently safe)
- PHP-FPM only apps (no persistent process)

## Prerequisites
- Octane installed in development/staging
- PHPUnit or Pest configured
- User factory for creating test users
- Service providers identified from binding audit

## Inputs
- List of `singleton()` bindings from binding inventory
- Target route that returns user-specific data
- User factory (e.g., `User::factory()`)

## Workflow
1. Identify a route that returns user-specific data (e.g., `/profile`, `/dashboard`, `/api/user`)
2. Write a test that creates two users (Alice and Bob), sends request A as Alice, then request B as Bob in the same PHP process — the first request warms singletons, the second request must not see Alice's data
3. Assert Bob's response contains Bob's data and explicitly does NOT contain Alice's data
4. If test fails, inspect the service(s) used by the route — start with auth guard, then session, then any custom service
5. Determine if the leaking binding holds mutable state: check for properties set during request, cached results, or computed values stored on `$this`
6. Fix by converting the leaky singleton to `scoped()` or redesigning the service to be stateless (load data in each method call, don't cache in properties)
7. Never use `app()->instance()` for per-request state — it overwrites the shared instance for all subsequent requests
8. Never use `Auth::onceUsingId()` in Octane workers — it mutates guard state that persists to the next request

## Validation Checklist
- [ ] Sequential test passes: Alice's data does NOT appear in Bob's response
- [ ] Leaking singleton identified and documented
- [ ] Fix applied: converted to `scoped()`, stateless redesign, or RequestTerminated cleanup
- [ ] No `app()->instance()` used for per-request state
- [ ] No `Auth::onceUsingId()` used in Octane context without explicit cleanup
- [ ] Eloquent model caches removed from singleton properties (use scoped instance cache instead)
- [ ] CI step flags new `singleton()` registrations for human review

## Common Failures
- Writing single-request test — misses cross-request leaks entirely (warm request hides the leak)
- Testing with same user identity in both requests — identical data doesn't reveal contamination
- Confusing singleton leak with view cache or HTTP cache — ensure middleware-level isolation is correct
- Manually calling `forgetInstance()` to simulate scoped — corrupts container's instance tracking
- Storing Eloquent models in singleton property cache — grows unbounded AND crosses request boundaries

## Decision Points
- `scoped()` conversion vs stateless redesign: scoped is simpler (no code changes to service); stateless is more performant (no per-request instantiation) but requires refactoring
- Per-route leak test vs general test: per-route tests are more precise; general auth isolation test covers most cases
- Fix vs safety valve: fix the leak vs lower `max_requests` to mask — always fix the root cause

## Performance Considerations
- Singleton resolution: O(1) (~0.001ms) — mutating state inside adds zero measurable overhead
- Scoped bindings: ~0.5-2ms per binding per request — only convert leaky ones
- Stateless design: zero per-request overhead — most performant option
- Performance of incorrect code is irrelevant — a leaking singleton produces wrong results regardless of speed

## Security Considerations
- Cross-user data leak: User A's profile data in User B's response — critical data isolation breach
- Auth spoofing: guest requests appearing authenticated from cached guard on a previous request
- Config drift: one request sets `config('app.locale', 'fr')` globally — all subsequent requests in French
- Stale credentials: singleton HTTP client caching auth tokens — after token expiry, all requests fail until worker recycle

## Related Rules
- Audit every singleton for mutable per-request state (05-rules.md)
- Convert request-aware singletons to `scoped()` (05-rules.md)
- Test with two sequential requests for different users (05-rules.md)
- Never use `app()->instance()` for per-request state (05-rules.md)
- Do not use `Auth::onceUsingId()` in Octane workers (05-rules.md)
- Keep Eloquent caches out of singleton properties (05-rules.md)

## Related Skills
- Audit Service Providers for Octane Singleton Safety (octane-architecture-overview)
- Convert Singletons to Scoped Bindings (scoped-bindings-for-octane)
- Generate Service Binding Inventory (service-binding-audit)
- Evaluate and Remediate Package Octane Compatibility (octane-package-compatibility)

## Success Criteria
- Sequential Alice/Bob test passes — zero cross-request data contamination
- All identified leaky singletons are fixed or have documented remediation plan
- CI blocks new `singleton()` registrations without human review
- No `app()->instance()` calls for per-request data in the codebase
- No `Auth::onceUsingId()` calls in Octane-served code paths without explicit cleanup
- Eloquent model caches use scoped bindings or per-instance arrays, not static/singleton properties
