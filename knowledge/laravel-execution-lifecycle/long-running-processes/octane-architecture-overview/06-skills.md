# Skill: Audit Service Providers for Octane Singleton Safety

## Purpose
Systematically audit every service container binding across application and vendor code to identify singletons with mutable per-request state before deploying Octane.

## When To Use
- Pre-Octane deployment mandatory step
- When adding new service providers to an Octane application
- After third-party package updates

## When NOT To Use
- PHP-FPM-only deployments (process isolation provides per-request freshness)
- Transient bindings (`bind()`) — inherently safe

## Prerequisites
- Access to all service provider files (`app/Providers/`, vendor providers)
- Understanding of `singleton()` vs `scoped()` vs `bind()` semantics
- Ability to run code or grep the codebase

## Inputs
- List of all registered service providers
- Codebase with service provider registrations
- Application dependency graph

## Workflow
1. Run `php artisan provide:list` or read `config/app.php` to enumerate all service providers
2. For each provider, inspect `register()` and `boot()` methods for `$this->app->singleton()` and `$this->app->instance()` calls
3. For each singleton found, determine if it stores any mutable per-request state (auth guard, session, current tenant, locale, cached Eloquent models, accumulators)
4. Trace constructor dependency graph of each singleton — a safe singleton depending on an unsafe singleton is itself unsafe
5. Classify each binding: Safe Singleton (stateless/immutable), Unsafe Singleton (mutable state), Safe Transient
6. Create remediation plan: convert Unsafe Singleton to `scoped()`, redesign stateful services to be stateless, or add `RequestTerminated` cleanup

## Validation Checklist
- [ ] Every `singleton()` call in application and vendor providers is identified
- [ ] Each singleton is classified as safe or unsafe with documented rationale
- [ ] Dependency graph traced for each singleton — no transitive contamination
- [ ] Remediation plan created with priority based on risk impact
- [ ] High-risk bindings (auth, session, tenant) converted to `scoped()` first
- [ ] CI step added to flag new `singleton()` registrations for human review

## Common Failures
- Auditing only application providers while missing vendor package singletons
- Assuming "no direct mutable state" means safe — missing transitive contamination through dependencies
- Over-correcting by converting connection pools and config readers to scoped
- Not re-auditing after package updates introduce new singletons

## Decision Points
- `scoped()` vs stateless redesign: scoped is simpler but adds per-request overhead; stateless is more performant but requires code changes
- Immediate fix vs scheduled: critical bindings (auth, tenant) must be fixed before deployment; low-risk may be scheduled
- Guard for `OctaneSandbox` contract: providers with scoped bindings may need to implement this interface

## Performance Considerations
- Converting singleton to scoped adds ~0.5-2ms per binding per request
- Stateless design (no per-request state) has zero per-request overhead
- `class-name` scoped registration is faster than closure-based
- Focus conversions on leaky bindings — don't blindly convert all singletons

## Security Considerations
- Silent data leaks from un-audited singleton: User A's data appears in User B's response
- Auth spoofing: guest requests appearing authenticated from cached guard
- Configuration drift: one request modifies `config()` globally and affects all subsequent requests
- Stale credentials: singleton HTTP client caching auth tokens that expire

## Related Rules
- Audit every singleton for mutable state before deploying Octane (05-rules.md)
- Use `scoped()` for all per-request stateful services (05-rules.md)
- Set `max_requests` based on memory profiling, never disable it (05-rules.md)
- Test Octane readiness with sequential request sequences (05-rules.md)
- Never share Octane workers with Horizon or queue workers (05-rules.md)
- Run each Octane runtime's adapter-specific tests (05-rules.md)

## Related Skills
- Convert Singletons to Scoped Bindings (scoped-bindings-for-octane)
- Generate Service Binding Inventory (service-binding-audit)
- Configure Octane Workers with max_requests (octane-configuration-and-workers)
- Register Octane Lifecycle Hooks (octane-lifecycle-hooks)

## Success Criteria
- All singletons with mutable per-request state are identified and remediated
- Dependency graph traced for every shared binding — no transitive contamination
- Remediation plan is documented with priority and owner for each fix
- CI pipeline rejects new `singleton()` registrations without human review
- Application passes sequential two-request data isolation test (Alice/Bob)
