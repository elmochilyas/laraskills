# Skill: Audit Services for Octane-Safe Stateless Architecture
## Purpose
Audit and refactor layered architecture services for Laravel Octane compatibility — ensuring all service classes are stateless (no request context stored on properties), binding as transient by default, passing context as method parameters or Context objects, and using immutable domain entities — to prevent cross-request data leaks and silent corruption.
## When To Use
- Any application running under Laravel Octane (Swoole/RoadRunner)
- Migrating an existing application to Octane
- Designing a new application that may use Octane in the future
## When NOT To Use
- Standard Laravel PHP-FPM (per-request model makes cross-request leaks impossible)
- Short-lived scripts or single-request contexts
## Prerequisites
- All service classes in Application and Infrastructure layers identified and inventoried
- Octane running in development environment for testing
- Understanding of service container binding modes (bind vs singleton)
- Request context object class defined (if using Context Object pattern)
## Inputs
- Full inventory of service classes across all layers
- Service provider registration code (binding mode for each class)
- Current state patterns: properties holding user/tenant/locale, static state, mutable caches
- Octane test environment for verifying stateless behavior
## Workflow
1. Audit every service class for mutable properties: `private $user`, `private $cachedResults`, `public static $currentTenant`, any property set after construction
2. Change all `$this->app->singleton()` to `$this->app->bind()` (transient) unless the class is provably stateless with zero mutable properties
3. Remove all request-scoped context from constructor/store properties — change `setUser(User $user)` methods to pass `User` as method parameter
4. Implement Context Object pattern: create `RequestContext` value object with `user`, `tenantId`, `locale`, `requestId` — pass as single parameter through call chain
5. Refactor Domain entities to prefer immutability: behavior methods return new instances instead of mutating existing ones (`markAsPaid()` returns new `Invoice` with updated status)
6. For services needing per-request configuration, use factory pattern with closure binding (transient) — not singleton with pre-configured state
7. Write Octane-specific test: dispatch multiple requests to same controller and verify no cross-request state leaks (assert user A data never visible to user B)
8. Add architecture tests to prevent mutable state in services (static analysis rule or custom arch test checking for mutable properties in service classes)
9. Document stateless service pattern in project conventions: all constructor dependencies must be infrastructure/stateless; all request context is method parameters
10. Load test under Octane: verify no intermittent failures under concurrent request load
## Validation Checklist
- [ ] All service classes audited for mutable state — categorized as safe/unsafe
- [ ] `$this->app->bind()` (transient) used by default; singleton only with documented audit
- [ ] Zero service classes store `Auth::user()`, tenant, locale as property
- [ ] Request context passed as method parameters (not via `setUser()`/`setTenant()`)
- [ ] Context Object pattern used for 3+ context values
- [ ] Domain entities prefer immutable behavior (returns new instance, not mutation)
- [ ] Per-request configuration uses factory pattern, not pre-configured singleton
- [ ] Octane-specific test verifies no cross-request data leaks
- [ ] Architecture test prevents mutable state in service classes
- [ ] Stateless pattern documented in project conventions
## Common Failures
- **Storing Auth::user() in constructor:** `__construct(User $user)` captures user from first request on that worker. Fix: pass user as method parameter.
- **Singletons for everything:** Habit from PHP-FPM where bind vs singleton didn't matter for state. Fix: default to transient; audit before making singleton.
- **Static state on services:** `public static $currentUser` for global access. Fix: remove static state; pass context explicitly through call chain.
- **Silent corruption:** Stateful service works in dev (single request) but fails intermittently under Octane load. Fix: audit and test under concurrent requests.
- **Multi-tenant leaks:** Tenant context on singleton leaks tenant A data to tenant B. Fix: transient binding + method parameter context.
## Decision Points
- **Context object vs individual parameters:** 3+ context values = Context Object. 1-2 values = individual parameters acceptable.
- **Transient vs singleton:** Transient is safe default (creates new instance per request). Singleton only after audit + documentation that class is provably stateless.
- **Immutable vs mutable entities:** Immutable entities (return new instance) are inherently Octane-safe. Mutable entities need careful auditing — prefer immutability.
## Performance Considerations
- Octane's performance benefit comes from avoiding framework bootstrap — stateless services support this
- Transient binding creates more objects per request (GC pressure) — but typically negligible difference vs singleton
- Immutable entities create new instances on mutation — acceptable for typical business volumes
- Profile before optimizing singleton vs transient — difference is usually <1% of request time
## Security Considerations
- Stateful services under Octane cause USER DATA LEAKS across requests — this is a security incident
- Multi-tenant applications are especially vulnerable: tenant context on singleton leaks all tenants' data
- Auth bypass: singleton service stores authorized user from request A; request B uses unauthorized but user object is populated
- Always test multi-tenant data isolation under Octane before production deployment
## Related Rules (from 05-rules.md)
- Default to Transient Service Binding
- Never Store Request Context on Service Instances
- Use Context Object Pattern
- Audit All Services for Mutable Properties Before Octane Migration
- Prefer Action Classes for Octane-Safe Operations
- Use Factory Pattern for Request-Scoped Services
- Keep Domain Entities Immutable
## Related Skills
- Application Layer Orchestration (LAP-06)
- Infrastructure Adapters (LAP-07)
- Service Container Binding Strategies (cross-domain)
- Octane Architecture Basics (cross-domain)
## Success Criteria
- Zero singleton-bound services with mutable state (verified by audit + arch tests)
- Zero service classes storing `User`, tenant, locale, or request ID as instance property
- Octane concurrency test passes: no cross-request data leak across 100 concurrent requests
- All request context passed as method parameters, never via `set*()` methods on services
- Immutable domain entities verified: behavior methods return new instances, not mutations
