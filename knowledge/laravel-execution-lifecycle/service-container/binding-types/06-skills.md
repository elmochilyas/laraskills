# Skill: Select the Correct Binding Type

## Purpose
Choose the appropriate binding type (`bind()`, `singleton()`, `scoped()`, or `instance()`) based on service lifecycle requirements and deployment environment.

## When To Use
- Registering a new service in a service provider
- Converting between binding types during Octane migration
- Choosing between shared and per-resolution semantics

## When NOT To Use
- When the service needs contextual variation (use contextual binding instead)
- When adding cross-cutting behavior (use `extend()` instead)

## Prerequisites
- Container Fundamentals
- Understanding of FPM vs Octane lifecycle differences

## Inputs
- Service classification: stateless vs mutable, expensive vs cheap to construct
- Service dependencies lifecycle (are they shared or transient?)
- Deployment environment (FPM, Octane, queue workers)
- Resolution frequency (per-request, per-job, rarely)

## Workflow
1. Classify the service: is it stateless/immutable or does it hold per-request state?
2. If stateless and frequently resolved → consider `singleton()`
3. If stateless and infrequently resolved → default to `bind()` (transient)
4. If holds per-request state (auth user, tenant context) → use `scoped()`
5. If mutable request-state binding cannot be changed → use `scoped()` for future Octane migration
6. If service needs pre-constructed object (test mocks, boot-time setup) → use `instance()` sparingly
7. For expensive-to-construct stateless services → use `singleton()` or `scoped()`
8. Verify shared services do not depend on transient services unless using factory pattern

## Validation Checklist
- [ ] Stateless services use `singleton()` or `bind()` depending on construction cost
- [ ] Request-state services use `scoped()` not `singleton()`
- [ ] `instance()` only used in tests or boot-time setup, not production provider registration
- [ ] Transitive dependencies of singleton/scoped bindings are also shared, or use factory pattern
- [ ] No mutable singleton holding request-scoped state under Octane

## Common Failures
- `singleton()` for request-scoped state causes data leaks under Octane
- `bind()` for expensive services causes unnecessary allocation overhead
- `instance()` in `register()` — service cannot be decorated or intercepted
- Singleton depends on transient — stale dependency after first resolution

## Decision Points
- `bind()` vs `singleton()`: default to `bind()` unless profiling shows construction cost >5μs or service is resolved 10+ times per request
- `singleton()` vs `scoped()`: use `scoped()` if the service holds any mutable request-time data
- `instance()` vs `singleton()` with closure: always prefer closure for production — enables extending and callbacks

## Performance Considerations
- `bind()`: re-executes factory every `make()` — O(1) closure + construction
- `singleton()`: O(1) array lookup after first resolution — zero allocation overhead
- `scoped()`: same as singleton within scope; `flushScoped()` O(N)
- `instance()`: zero allocation, highest memory baseline

## Security Considerations
- Mutable `singleton()` under Octane = cross-user data leak vulnerability
- `instance()` bypasses security-related extenders and resolution callbacks
- Classify every shared binding correctly before Octane deployment

## Related Rules
- Use scoped() for Any Service Holding Per-Request State
- Default to bind() for Stateless Services
- Use instance() Only in Tests or Boot-Time Setup
- Do Not Mix Binding Types in a Singleton's Dependency Graph

## Related Skills
- Audit Bindings for Octane Safety
- Configure the Service Container
- Migrate Singletons to Scoped for Octane

## Success Criteria
- Every binding uses the correct type for its lifecycle requirements
- No data leaks under Octane from incorrect singleton usage
- Performance profile matches expectations (shared vs per-resolution)

---

# Skill: Audit Bindings for Octane Safety

## Purpose
Systematically review all container bindings to identify and fix `singleton()` bindings that hold mutable request-scoped state — preventing the #1 Octane production bug: cross-user data leakage.

## When To Use
- Before deploying a Laravel application to Octane
- When investigating data leaks between users in a long-running process
- As part of a regular deployment checklist for Octane applications
- After adding new service providers to an Octane-deployed application

## When NOT To Use
- FPM-only deployments (though still useful for future-proofing)
- When auditing stateless library packages that register only immutable singletons

## Prerequisites
- Binding Types
- Scoped Instance Management
- Octane lifecycle awareness

## Inputs
- Full list of registered bindings: `$app->getBindings()`
- Application's `config/app.php` service providers
- Manually registered bindings in `AppServiceProvider` and custom providers

## Workflow
1. Collect all registered bindings: iterate `$app->getBindings()` and `$app->getScopedInstances()`
2. For each `singleton()` binding, determine if the service holds mutable request-state:
   - Does it reference `Request`, `Auth`, `Session`, or `TenantContext`?
   - Does it have setter methods that change internal state per-request?
   - Is it configured differently per-request in middleware?
3. For each suspect singleton, evaluate: convert to `scoped()` if request-state is held
4. For singletons that depend on scoped services, inject a factory instead of the scoped dependency
5. Verify all scoped bindings are flushed at scope boundaries (Octane handles this automatically)
6. Test under Octane: run concurrent requests and verify data isolation

## Validation Checklist
- [ ] All request-scoped services use `scoped()` instead of `singleton()`
- [ ] Process-scoped services confirmed stateless and immutable
- [ ] No singleton holds a direct reference to a scoped dependency
- [ ] Integration test verifies data isolation under concurrent requests
- [ ] Audit documented in deployment notes

## Common Failures
- Missing `CurrentUser`, `TenantContext`, `LocaleManager` — common singletons that should be scoped
- Singleton factory closure captures request data at registration time instead of resolution time
- Third-party package registers a request-state singleton that cannot be easily overridden

## Decision Points
- If a third-party package registers a mutable singleton: override with `scoped()` using `$app->extend()` or rebind
- If a singleton truly needs process-level caching but depends on request data: inject a factory that resolves per-request data lazily

## Performance Considerations
- `scoped()` has identical performance to `singleton()` within a scope
- `flushScoped()` adds O(N) overhead per request for all scoped instances
- Converting 50 singletons to scoped adds ~2-5μs per request — negligible

## Security Considerations
- This audit directly prevents cross-user data leakage (GDPR/PII exposure)
- Document which services were converted and why
- Verify auth-related services are always scoped

## Related Rules
- Audit All singleton() Bindings Before Octane Deployment
- Use scoped() for Any Service Holding Per-Request State
- Never Cache Scoped Instances in Singletons

## Related Skills
- Select the Correct Binding Type
- Migrate Singletons to Scoped for Octane
- Configure the Service Container

## Success Criteria
- Zero `singleton()` bindings holding mutable request-scoped state
- All converted bindings use `scoped()` with proper scope flushing
- Data isolation verified under concurrent Octane request testing
